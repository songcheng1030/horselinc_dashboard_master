import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { ManagerProvidersService } from 'app/main/users/horse-managers/manager-providers/manager-providers.service';
import { ManagerProviderFormDialogComponent } from 'app/main/users/horse-managers/manager-providers/manager-provider-form/manager-provider-form.component';

@Component({
    selector     : 'manager-providers',
    templateUrl  : './manager-providers.component.html',
    styleUrls    : ['./manager-providers.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ManagerProvidersComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    managerProviders: any;
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['name', 'serviceType', 'edit-buttons', 'delete-buttons'];    
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ManagerProvidersService} _managerProvidersService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _managerProvidersService: ManagerProvidersService,
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
        this.managerProviders = [];
        // if horse and managerProvider data exists.
        // if (this._managerProvidersService.horseId != null && this._managerProvidersService.managerProviderIds.length > 0){
        this._managerProvidersService.getManagerProviders();
        this.dataSource = new FilesDataSource(this._managerProvidersService);
        this._managerProvidersService.onManagerProvidersChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(managerProviders => {                
                this.managerProviders = managerProviders;
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
     * Edit ManagerProvider
     *
     * @param managerProvider
     */
    editManagerProvider(managerProvider): void
    {
        this.dialogRef = this._matDialog.open(ManagerProviderFormDialogComponent, {
            panelClass: 'manager-provider-form-dialog',
            data      : {
                managerProvider: managerProvider,
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
                        this._managerProvidersService.updateManagerProvider(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteManagerProvider(managerProvider);

                        break;
                }
            });
    }

    /**
     * Delete ManagerProvider
     */
    deleteManagerProvider(managerProvider): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                //console.log(managerProvider);
                this._managerProvidersService.deleteManagerProvider(managerProvider);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New ManagerProvider
     */
    newManagerProvider(): void
    {
        this.dialogRef = this._matDialog.open(ManagerProviderFormDialogComponent, {
            panelClass: 'manager-provider-form-dialog',
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
                this._managerProvidersService.createManagerProvider(form.getRawValue());
            });
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {ManagerProvidersService} _managerProvidersService
     */
    constructor(
        private _managerProvidersService: ManagerProvidersService
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
        return this._managerProvidersService.onManagerProvidersChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
