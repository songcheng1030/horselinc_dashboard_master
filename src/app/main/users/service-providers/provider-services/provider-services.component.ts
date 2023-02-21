import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { ProviderServicesService } from 'app/main/users/service-providers/provider-services/provider-services.service';
import { ProviderServiceFormDialogComponent } from 'app/main/users/service-providers/provider-services/provider-service-form/provider-service-form.component';

@Component({
    selector     : 'provider-services',
    templateUrl  : './provider-services.component.html',
    styleUrls    : ['./provider-services.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ProviderServicesComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    providerServices: any;
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['service', 'rate', 'quantity', 'edit-buttons', 'delete-buttons'];    
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ProviderServicesService} _providerServicesService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _providerServicesService: ProviderServicesService,
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
        this.providerServices = [];        
        this._providerServicesService.getProviderServices();
        this.dataSource = new FilesDataSource(this._providerServicesService);
        this._providerServicesService.onProviderServicesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(providerServices => {                
                this.providerServices = providerServices;
            });
        // }
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
     * Edit ProviderService
     *
     * @param providerService
     */
    editProviderService(providerService): void
    {
        this.dialogRef = this._matDialog.open(ProviderServiceFormDialogComponent, {
            panelClass: 'provider-service-form-dialog',
            data      : {
                providerService: providerService,
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
                        this._providerServicesService.updateProviderService(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteProviderService(providerService);

                        break;
                }
            });
    }

    /**
     * Delete ProviderService
     */
    deleteProviderService(providerService): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                //console.log(providerService);
                this._providerServicesService.deleteProviderService(providerService);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New ProviderService
     */
    newProviderService(): void
    {
        this.dialogRef = this._matDialog.open(ProviderServiceFormDialogComponent, {
            panelClass: 'provider-service-form-dialog',
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
                this._providerServicesService.createProviderService(form.getRawValue());
            });
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {ProviderServicesService} _providerServicesService
     */
    constructor(
        private _providerServicesService: ProviderServicesService
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
        return this._providerServicesService.onProviderServicesChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
