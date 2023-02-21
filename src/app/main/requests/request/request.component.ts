
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { HLHorseManagerModel } from 'app/model/users';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { HLServiceRequestModel, HLServiceShowModel } from 'app/model/service-requests';
import { HLServiceProviderModel } from 'app/model/users';
import { HLHorseModel } from 'app/model/horses';
import { RequestService } from 'app/main/requests/request/request.service';
import { Router } from '@angular/router';

import * as _moment from 'moment';

@Component({
    selector     : 'request',
    templateUrl  : './request.component.html',
    styleUrls    : ['./request.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class RequestComponent implements OnInit, OnDestroy
{
    request: HLServiceRequestModel;
    horseManagers: HLHorseManagerModel[];
    serviceProviders: HLServiceProviderModel[];
    horses: HLHorseModel[];
    shows: HLServiceShowModel[];

    pageType: string;
    requestForm: FormGroup;
    invoiceId: string; // invoice id of selected service request

    /** control for the MatSelect filter keyword */
    public horseFilterCtrl: FormControl = new FormControl();
    public showFilterCtrl: FormControl = new FormControl();
    public creatorFilterCtrl: FormControl = new FormControl();
    public serviceProviderFilterCtrl: FormControl = new FormControl();
    public assignerFilterCtrl: FormControl = new FormControl();
    public dismissedByFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */
    public filteredHorses: ReplaySubject<HLHorseModel[]> = new ReplaySubject<HLHorseModel[]>(1);
    public filteredShows: ReplaySubject<HLServiceShowModel[]> = new ReplaySubject<HLServiceShowModel[]>(1);
    public filteredCreators: ReplaySubject<HLHorseManagerModel[]> = new ReplaySubject<HLHorseManagerModel[]>(1);
    public filteredServiceProviders: ReplaySubject<HLServiceProviderModel[]> = new ReplaySubject<HLServiceProviderModel[]>(1);
    public filteredAssigners: ReplaySubject<HLServiceProviderModel[]> = new ReplaySubject<HLServiceProviderModel[]>(1);
    public filteredDismiss: ReplaySubject<HLServiceProviderModel[]> = new ReplaySubject<HLServiceProviderModel[]>(1);

    // Private
    private _unsubscribeAll: Subject<any>;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    /**
     * Constructor
     *
     * @param {RequestService} _requestService
     * @param {FormBuilder} _formBuilder
     * @param {Location} _location
     * @param {MatSnackBar} _matSnackBar
     * @param {RegistrationsComponent} _owners
     */
    constructor(
        private _requestService: RequestService,
        private _formBuilder: FormBuilder,
        private _location: Location,
        private _matSnackBar: MatSnackBar,        
        private _matDialog: MatDialog,
        private router: Router
    )
    {
        // Set the default
        this.request = null;

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        this.invoiceId = '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        
        this._requestService.onInvoiceIdChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoiceId => {
                if (invoiceId !== null && invoiceId.length)  {
                  this.invoiceId = invoiceId;
                  console.log('Selected InvoiceId', this.invoiceId);
                }
                
            });
        this._requestService.onHorseManagerListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horseManagers => {
                this.horseManagers = horseManagers;
                // console.log('horseManagers list', this.horseManagers);
            });
        this._requestService.onServiceProviderListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceProviders => {
                this.serviceProviders = serviceProviders;
                // console.log('serviceProviders list', this.serviceProviders);
            });
        this._requestService.onHorseListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horses => {
                this.horses = horses;
                // console.log('horses list', this.horses);
            });
        this._requestService.onServiceShowListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(shows => {
                this.shows = shows;
                // console.log('Service shows list', this.shows);
            });
        

        // Subscribe to update request on changes
        this._requestService.onRequestChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(request => {
                if ( request )
                {
                    this.request = request;
                    this.pageType = 'edit';     
                    this._requestService.setRequestId(this.request.uid);
                }
                else
                {
                    this.pageType = 'new';                    
                    this.request = new HLServiceRequestModel('', {});
                    this._requestService.setRequestId(null);
                }
                this.requestForm = this.createRequestForm();
            });
        
        // load the initial user list
        this.filteredHorses.next(this.horses.slice());
        this.filteredShows.next(this.shows.slice());
        this.filteredServiceProviders.next(this.serviceProviders.slice());
        this.filteredAssigners.next(this.serviceProviders.slice());
        this.filteredCreators.next(this.horseManagers.slice());
        this.filteredDismiss.next(this.serviceProviders.slice());
        
        // listen for service provider select field value changes
        this.serviceProviderFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterServiceProviders();
        });
        this.assignerFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterAssigners();
        });
        this.creatorFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterCreators();
        });
        this.horseFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterHorses();
        });
        this.showFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterShows();
        });
        this.dismissedByFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterDismiss();
        });
    }
    
    // instant search of service provider user combo box
    filterServiceProviders(): void {
        if (!this.serviceProviders) {
          return;
        }
        // get the search keyword
        let search = this.serviceProviderFilterCtrl.value;
        if (!search) {
          this.filteredServiceProviders.next(this.serviceProviders.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the users
        this.filteredServiceProviders.next(
          this.serviceProviders.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
    }
    // instant search of assginer user combo box
    filterAssigners(): void {
        if (!this.serviceProviders) {
          return;
        }
        // get the search keyword
        let search = this.assignerFilterCtrl.value;
        if (!search) {
          this.filteredAssigners.next(this.serviceProviders.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the users
        this.filteredAssigners.next(
          this.serviceProviders.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
    }

    // instant search of dismiss user combo box
    filterDismiss(): void {
      if (!this.serviceProviders) {
        return;
      }
      // get the search keyword
      let search = this.dismissedByFilterCtrl.value;
      if (!search) {
        this.filteredDismiss.next(this.serviceProviders.slice());
        return;
      } else {
        search = search.toLowerCase();
      }
      // filter the users
      this.filteredDismiss.next(
        this.serviceProviders.filter(user => user.name.toLowerCase().indexOf(search) > -1)
      );
    }

    // instant search of creator user combo box
    filterCreators(): void {
        if (!this.horseManagers) {
          return;
        }
        // get the search keyword
        let search = this.creatorFilterCtrl.value;
        if (!search) {
          this.filteredCreators.next(this.horseManagers.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the creator users
        this.filteredCreators.next(
          this.horseManagers.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    // instant search of horse combo box
    filterHorses(): void {
      if (!this.horses) {
        return;
      }
      // get the search keyword
      let search = this.horseFilterCtrl.value;
      if (!search) {
        this.filteredHorses.next(this.horses.slice());
        return;
      } else {
        search = search.toLowerCase();
      }
      // filter the horse
      this.filteredHorses.next(
        this.horses.filter(horse => horse.displayName.toLowerCase().indexOf(search) > -1)
      );
    }

    // instant search of show combo box
    filterShows(): void {
      if (!this.shows) {
        return;
      }
      // get the search keyword
      let search = this.showFilterCtrl.value;
      if (!search) {
        this.filteredShows.next(this.shows.slice());
        return;
      } else {
        search = search.toLowerCase();
      }
      // filter the show
      this.filteredShows.next(
        this.shows.filter(show => show.name.toLowerCase().indexOf(search) > -1)
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
     * Create request form
     *
     * @returns {FormGroup}
     */
    createRequestForm(): FormGroup
    {
        return this._formBuilder.group({
            uid:                [this.request.uid],
            invoiceId:          [this.invoiceId],
            requestDate:        _moment(this.request.requestDate, 'MM/DD/YYYY'), // [this.request.requestDate],
            competitionClass:   [this.request.competitionClass],
            horseBarnName:      [this.request.horseBarnName],       // hidden field
            horseDisplayName:   [this.request.horseDisplayName], // hidden field
            horseId:            [this.request.horseId],
            showId:             [this.request.showId],            
            instruction:        [this.request.instruction],            
            providerNote:       [this.request.providerNote],            
            isCustomRequest:    [this.request.isCustomRequest.toString()],
            // isDeletedFromInvoice:  [this.request.isDeletedFromInvoice.toString()],
            dismissedBy:        [this.request.dismissedBy],
            status:             [this.request.status],
            creatorId:          [this.request.creatorId],
            serviceProviderId:  [this.request.serviceProviderId],            
            assignerId:         [this.request.assignerId],
            updatedAt:          [this.request.updatedAt],
            createdAt:          [this.request.createdAt]
        });
    }

    /**
     * Save request
     */
    saveRequest(): void
    {
        const data = this.requestForm.getRawValue();
        this._requestService.updateRequest(this.addHorseInfo(data))
            .then((request) => {
                this._requestService.onRequestChanged.next(request);
                // Show the success message
                this._matSnackBar.open('Service Request data saved successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });
            });
    }
    
    /**
     * Add request
     */
    addRequest(): void
    {
        const data = this.requestForm.getRawValue();            
        this._requestService.createRequest(this.addHorseInfo(data))
            .then((request) => {
                // Show the success message
                this._matSnackBar.open('Request data added successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });                
                // this.pageType = 'edit';                                
                this._requestService.onRequestChanged.next(request);
                // Change the location with new one
                // this.router.navigate(['requests/list/' + request.uid]);                
            });
    }
    
    addHorseInfo(data): any {
      // get horse information
      const horseId = data.horseId;
      let horse;
      if (horse = this.horses.find((h) => h.uid === horseId)) {
        data.horseBarnName = horse.barnName;
        data.horseDisplayName = horse.displayName;                          
      }
      return data;
    }

    /**
     * Delete request
     */
    deleteRequest(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
          disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._requestService.deleteRequest(this.request)
                  .then(() => {
                    // Show the success message
                    this._matSnackBar.open('Request data deleted successfully', 'OK', {
                      verticalPosition: 'bottom',
                      duration        : 2500
                    });   
                    this._requestService.onRequestChanged.next(null);
                    // this.router.navigate(['requests/list']);  
                    this.returnPreviousPage();
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
