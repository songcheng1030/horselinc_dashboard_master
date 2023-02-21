import { AngularFirestore } from '@angular/fire/firestore';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { HLHorseManagerModel } from 'app/model/users';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { HLHorseModel } from 'app/model/horses';
import { HorseListService } from 'app/main/horses/horse-list/horse-list.service';
import { HorseService } from 'app/main/horses/horse/horse.service';
import { Router } from '@angular/router';
import { AuthService } from 'app/main/auth/auth.service';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FuseUtils } from '@fuse/utils';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
    selector     : 'horse',
    templateUrl  : './horse.component.html',
    styleUrls    : ['./horse.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class HorseComponent implements OnInit, OnDestroy
{
    horse: HLHorseModel;
    users: HLHorseManagerModel[];
    pageType: string;
    horseForm: FormGroup;

    imageChangedEvent: any = '';
    croppedImage: any = '';
    uploadPercentOb: Observable<number>;
    uploadedUrlOb: Observable<string>;
    uploadedAvatarUrl: any = '';

    /** control for the MatSelect filter keyword */
    public leaserFilterCtrl: FormControl = new FormControl();
    public trainerFilterCtrl: FormControl = new FormControl();
    public creatorFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */
    public filteredLeasers: ReplaySubject<HLHorseManagerModel[]> = new ReplaySubject<HLHorseManagerModel[]>(1);
    public filteredTrainers: ReplaySubject<HLHorseManagerModel[]> = new ReplaySubject<HLHorseManagerModel[]>(1);
    public filteredCreators: ReplaySubject<HLHorseManagerModel[]> = new ReplaySubject<HLHorseManagerModel[]>(1);

    // Private
    private _unsubscribeAll: Subject<any>;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    /**
     * Constructor
     *
     * @param {HorseService} _horseService
     * @param {FormBuilder} _formBuilder
     * @param {Location} _location
     * @param {MatSnackBar} _matSnackBar
     * @param {RegistrationsComponent} _owners
     */
    constructor(
        private _horseService: HorseService,
        private _formBuilder: FormBuilder,
        private _location: Location,
        private _matSnackBar: MatSnackBar,        
        private _matDialog: MatDialog,
        private router: Router,
        private afStorage: AngularFireStorage  
        
    )
    {
        // Set the default
        this.horse = new HLHorseModel('', {});

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // this.uploadedUrlOb = new Observable
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        this._horseService.onHorseUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
                // console.log('Horse Manager list', this.users);
            });

        // Subscribe to update horse on changes
        this._horseService.onHorseChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horse => {
                if ( horse )
                {
                    this.horse = horse;
                    this.pageType = 'edit';     
                    this._horseService.setHorseIdForRegAndOwner(this.horse.uid, this.horse.ownerIds);
                }
                else
                {
                    this.pageType = 'new';                    
                    this.horse = new HLHorseModel(null, {});
                    this._horseService.setHorseIdForRegAndOwner(null, []);
                }

                this.horseForm = this.createHorseForm();
            });
        
        // load the initial user list
        this.filteredLeasers.next(this.users.slice());
        this.filteredTrainers.next(this.users.slice());
        this.filteredCreators.next(this.users.slice());
        
        // listen for leaser select field value changes
        this.leaserFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterLeasers();
        });
        this.trainerFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterTrainers();
        });
        this.creatorFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterCreators();
        });
    }
    /**
     * Firebase avatar upload
     * @param event 
     */
    fileChangeEvent(event: any): void {
      this.imageChangedEvent = event;
      this.uploadPercentOb = null;
      this.uploadedUrlOb = null;
    }
    imageCropped(event: ImageCroppedEvent): void {
      // get avatar image for upload
      // this.croppedImage = event.base64;
      this.croppedImage = event.file;
    }
    imageLoaded(): void {
        // show cropper
    }
    cropperReady(): void {
        // cropper ready
    }
    loadImageFailed(): void {
        // show message
    }

    // Firebase avatar upload to storage
    uploadAvatar(): void {
      const avatarName = FuseUtils.generateUID(30);      
      const avatarPath = `horses/dashboard/${avatarName}`;
      const storageRef = this.afStorage.ref(avatarPath);      
      const task = this.afStorage.upload(avatarPath, this.croppedImage);
      // observe percentage changes
      this.uploadPercentOb = task.percentageChanges();
      // get notified when the download URL is available
      task.snapshotChanges().pipe(
          finalize(() => {
            this.uploadedUrlOb = storageRef.getDownloadURL();
            this.uploadedUrlOb.subscribe(url => {
              this.uploadedAvatarUrl = url;
              console.log('uploaded avatar url' + this.uploadedAvatarUrl); 
            });
          })
      )
      .subscribe();
    }


    // instant search of leaser user combo box
    filterLeasers(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.leaserFilterCtrl.value;
        if (!search) {
          this.filteredLeasers.next(this.users.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the users
        this.filteredLeasers.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
    }

    // instant search of trainer user combo box
    filterTrainers(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.trainerFilterCtrl.value;
        if (!search) {
          this.filteredTrainers.next(this.users.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the trainer users
        this.filteredTrainers.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    // instant search of creator user combo box
    filterCreators(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.creatorFilterCtrl.value;
        if (!search) {
          this.filteredCreators.next(this.users.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the creator users
        this.filteredCreators.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create horse form
     *
     * @returns {FormGroup}
     */
    createHorseForm(): FormGroup
    {
        return this._formBuilder.group({
            uid                 : [this.horse.uid],
            avatarUrl           : [this.horse.avatarUrl],
            barnName            : [this.horse.barnName],
            displayName         : [this.horse.displayName],
            gender              : [this.horse.gender],
            birthYear           : [this.horse.birthYear],
            sire                : [this.horse.sire],
            dam                 : [this.horse.dam],
            color               : [this.horse.color],
            height              : [this.horse.height],
            description         : [this.horse.description],
            privateNote         : [this.horse.privateNote],
            isDeleted           : [this.horse.isDeleted.toString()],
            leaserId            : [this.horse.leaserId],
            trainerId           : [this.horse.trainerId],
            creatorId           : [this.horse.creatorId],
            createdAt           : [this.horse.createdAt],
            registrations       : [this.horse.registrations],
            ownerIds            : [this.horse.ownerIds]
        });
    }

    /**
     * Save horse
     */
    saveHorse(): void
    {
        const data = this.horseForm.getRawValue();
        if (this.uploadedUrlOb && this.uploadedAvatarUrl !== '') {
          data.avatarUrl = this.uploadedAvatarUrl;
        }
        this._horseService.updateHorse(data)
            .then((horse) => {
                this._horseService.onHorseChanged.next(horse);
                // Show the success message
                this._matSnackBar.open('Horse data saved successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });
            });
    }

    /**
     * Add horse
     */
    addHorse(): void
    {
        const data = this.horseForm.getRawValue();
        if (this.uploadedUrlOb && this.uploadedAvatarUrl !== '') {
          data.avatarUrl = this.uploadedAvatarUrl;
        }
        console.log(data.avatarUrl);
        this._horseService.createHorse(data)
            .then((horse) => {
                // Show the success message
                this._matSnackBar.open('Horse data added successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });                
                // this.pageType = 'edit';                                
                this._horseService.onHorseChanged.next(horse);
                // Change the location with new one
                // this.router.navigate(['horses/list/' + horse.uid]);                
            });
    }
    
    /**
     * Delete horse
     */
    deleteHorse(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
          disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._horseService.deleteHorse(this.horse)
                  .then(() => {
                    // Show the success message
                    this._matSnackBar.open('Horse data deleted successfully', 'OK', {
                      verticalPosition: 'bottom',
                      duration        : 2500
                    });   
                    this._horseService.onHorseChanged.next(null);
                    this.router.navigate(['horses/list']);  
                  });
            }
            this.confirmDialogRef = null;
        });
    }

    /**
     * navigation to previous page.
     */
    returnPreviousPage(): void
    {
        this._location.back();
    }
}
