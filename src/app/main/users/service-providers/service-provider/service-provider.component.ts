import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { HLServiceProviderModel, HLUserModel } from 'app/model/users';
import { ServiceProviderService } from 'app/main/users/service-providers/service-provider/service-provider.service';
import { Router } from '@angular/router';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FuseUtils } from '@fuse/utils';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
    selector     : 'service-provider',
    templateUrl  : './service-provider.component.html',
    styleUrls    : ['./service-provider.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ServiceProviderComponent implements OnInit, OnDestroy
{
    user: HLUserModel;    // service provider
    allUsers: HLUserModel[];
    userForm: FormGroup;
    pageType: string;

    imageChangedEvent: any = '';
    croppedImage: any = '';
    uploadPercentOb: Observable<number>;
    uploadedUrlOb: Observable<string>;
    uploadedAvatarUrl: any = '';

    
    // Private
    private _unsubscribeAll: Subject<any>;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    /**
     * Constructor
     *
     * @param {ServiceProviderService} _serviceProviderService
     * @param {FormBuilder} _formBuilder
     * @param {Location} _location
     * @param {MatSnackBar} _matSnackBar
     * @param {RegistrationsComponent} _paymentApprovers
     */
    constructor(
        private _serviceProviderService: ServiceProviderService,
        private _formBuilder: FormBuilder,
        private _location: Location,
        private _matSnackBar: MatSnackBar,        
        private _matDialog: MatDialog,
        private router: Router,
        private afStorage: AngularFireStorage  
        
    )
    {
        // Set the default
        this.user = new HLUserModel('', {});

        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        this._serviceProviderService.onServiceProviderUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(allUsers => {
                this.allUsers = allUsers;
                // console.log('ServiceProvider Manager list', this.allUsers);
            });

        // Subscribe to update serviceProvider on changes
        this._serviceProviderService.onServiceProviderChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                if ( user )
                {
                    this.user = user;
                    this.pageType = 'edit';     
                    this._serviceProviderService.setUserIdForProviderAndApprover(this.user.uid);
                }
                else
                {
                    this.pageType = 'new';                    
                    this.user = new HLUserModel('', {});
                    this._serviceProviderService.setUserIdForProviderAndApprover(null);
                }                
                this.userForm = this.createServiceProviderForm();
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
      const avatarPath = `users/dashboard/${avatarName}`;
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
    createServiceProviderForm(): FormGroup
    {
        return this._formBuilder.group({
            uid                 : [this.user.uid],
            email               : [this.user.email],
            name                : [this.user.serviceProvider.name],
            phone               : [this.user.serviceProvider.phone],
            platform            : [this.user.platform],
            status              : [this.user.status],
            location            : [this.user.serviceProvider.location],
            token               : [this.user.token],
            type                : [this.user.type],
            createdAt           : [this.user.createdAt]
        });
    }

    /**
     * Save user
     */
    saveServiceProvider(): void
    {
        const data = this.userForm.getRawValue();
        if (this.uploadedUrlOb && this.uploadedAvatarUrl !== '') {
          data.avatarUrl = this.uploadedAvatarUrl;
        }
        this._serviceProviderService.updateServiceProvider(data)
            .then((user) => {
                this._serviceProviderService.onServiceProviderChanged.next(user);
                // Show the success message
                this._matSnackBar.open('Service Provider saved successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });
            });
    }

    /**
     * Add user
     */
    addServiceProvider(): void
    {
        const data = this.userForm.getRawValue();
        if (this.uploadedUrlOb && this.uploadedAvatarUrl !== '') {
          data.avatarUrl = this.uploadedAvatarUrl;
        }        
        this._serviceProviderService.createServiceProvider(data)
            .then((user) => {
                // Show the success message
                this._matSnackBar.open('Service Provider added successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });                
                this._serviceProviderService.onServiceProviderChanged.next(user);
            });
    }
    
    /**
     * Delete user
     */
    deleteServiceProvider(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
          disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._serviceProviderService.deleteServiceProvider(this.user)
                  .then(() => {
                    // Show the success message
                    this._matSnackBar.open('ServiceProvider data deleted successfully', 'OK', {
                      verticalPosition: 'bottom',
                      duration        : 2500
                    });   
                    this._serviceProviderService.onServiceProviderChanged.next(null);
                    this.router.navigate(['/users/service-providers/list']);  
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
