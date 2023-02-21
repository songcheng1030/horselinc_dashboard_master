
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { HLServiceProviderServiceModel } from 'app/model/users';
import { ServicesService } from 'app/main/requests/services/services.service';
import { ServiceFormDialogComponent } from 'app/main/requests/services/service-form/service-form.component';

@Component({
    selector     : 'services',
    templateUrl  : './services.component.html',
    styleUrls    : ['./services.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ServicesComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    services: HLServiceProviderServiceModel[];
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['service', 'quantity', 'rate', 'edit-buttons', 'delete-buttons']; /* 'name',  */
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ServicesService} _servicesService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _servicesService: ServicesService,
        private _matSnackBar: MatSnackBar,
        public _matDialog: MatDialog
    )
    {
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
        this.services = [];        
        this._servicesService.getServices();
        this.dataSource = new FilesDataSource(this._servicesService);
        this._servicesService.onServicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(services => {                
                this.services = services;
            });        
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
     * Edit Service
     *
     * @param service
     */
    editService(service): void
    {
        this.dialogRef = this._matDialog.open(ServiceFormDialogComponent, {
            panelClass: 'service-form-dialog',
            data      : {
                service: service,
                action : 'edit'
            }
        });

        this.dialogRef.afterClosed()
            .subscribe(response => {                
                if ( !response )
                {
                    return;
                }
                const actionType: string = response[0];
                const formData: FormGroup = response[1];
                switch ( actionType )
                {
                    /**
                     * Save
                     */
                    case 'save':                                
                        this.updateService('edit', formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':
                        // console.log(service);                        
                        this.deleteService(service);

                        break;
                }
            });
    }

    /**
     * Delete Service
     */
    deleteService(service): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this.updateService('delete', service);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New Service
     */
    newService(): void
    {
        this.dialogRef = this._matDialog.open(ServiceFormDialogComponent, {
            panelClass: 'service-form-dialog',
            data      : {
                action: 'new'
            }
        });

        this.dialogRef.afterClosed()
            .subscribe((form: FormGroup) => {
                if ( !form )
                {
                    return;
                }                
                this.updateService('add', form.getRawValue());
            });
    }

    /**
     * update services of request
    */
    updateService(action, service): void {
        // update service information by selected service id
        // console.log(this._servicesService.serviceProviderServices);
        /* let s, user;
        if (action !== 'delete') {
            if (s = this._servicesService.serviceProviderServices.find((se) => se.uid === service.uid)) {                                
                if (user = this._servicesService.allUsers.find((u) => u.userId === s.userId)) {
                    service.userId = s.userId;     
                    service.user = user;
                    service.rate = s.rate;
                    service.service = s.service;
                } else {
                   // Show the success message
                    this._matSnackBar.open('User of service does not exists. please select another service.', 'OK', {
                        verticalPosition: 'bottom',
                        duration        : 3000
                    });
            return;
                }
            }
        } */
        console.log(service);
        // update services array
        if (action === 'add') {

            if (this.services.length > 0) {
                service.index = this.services[this.services.length - 1].index + 1;
            } else {
                service.index = 0;
            }
            this.services.push(service);

        } else if (action === 'edit') {

            this.services.forEach((r, i) => {
                if (r.index === service.index) {
                    console.log('find record');
                    // remove old data and insert new data
                    this.services.splice(i, 1, service);
                }
            });

        } else if (action === 'delete') {
            console.log('deleted index: ', service.index);
            this.services.forEach((r, i) => {
                if (r.index === service.index) {
                    console.log('find record');
                    // remove old data
                    this.services.splice(i, 1);
                    return;
                }
            });
        }

        this._servicesService.updateService(this.services);
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {ServicesService} _servicesService
     */
    constructor(
        private _servicesService: ServicesService
    )
    {
        super();
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        return this._servicesService.onServicesChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
