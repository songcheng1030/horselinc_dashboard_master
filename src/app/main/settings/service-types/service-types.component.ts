import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { SettingsService } from 'app/main/settings/settings.service';
import { ServiceTypeFormDialogComponent } from 'app/main/settings/service-types/service-type-form/service-type-form.component';

interface NewServiceTypeArray {
    uid: number;
    serviceType: any;
}

@Component({
    selector     : 'service-types',
    templateUrl  : './service-types.component.html',
    styleUrls    : ['./service-types.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})


export class ServiceTypesComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    serviceTypes: any[];
    serviceType: any;
    newServiceTypesArray: NewServiceTypeArray[] = [];
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['key', 'value', 'edit-buttons', 'delete-buttons'];    
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    uid: number;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ServiceTypesService} _serviceTypesService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _settingsService: SettingsService,
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
        this.dataSource = new FilesDataSource(this._settingsService);
        this.uid = 0;
        this._settingsService.onSettingsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(data => {                
                this.serviceTypes = data['service-types'];
              
                this.serviceTypes.map(service => {
                    const tempNewServiceType: NewServiceTypeArray = {uid: 0, serviceType: { key: '', value: ''}};
                    tempNewServiceType.uid = this.uid;
                    tempNewServiceType.serviceType = service;
                    this.newServiceTypesArray.push(tempNewServiceType);
                    this.uid++;
                });
                this._settingsService.onSettingsServiceTypesChanged.next(this.newServiceTypesArray);
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
     * Edit ProviderService
     *
     * @param providerService
     */
    editServiceTypes(serviceTypeAddUid): void
    {
        this.dialogRef = this._matDialog.open(ServiceTypeFormDialogComponent, {
            panelClass: 'service-type-form-dialog',
            data      : {
                serviceTypeAddUid: serviceTypeAddUid,
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
                const editServiceType = formData.getRawValue();
                switch ( actionType )
                {
                    /**
                     * Save
                     */
                    case 'save':                              
                     
                        this.newServiceTypesArray.map(servicetype => {
                            if (servicetype.uid === editServiceType.uid){
                                servicetype.serviceType.key = editServiceType.key;
                                servicetype.serviceType.value = editServiceType.value;
                            }
                        });
                        this._settingsService.onSettingsServiceTypesChanged.next(this.newServiceTypesArray);
                        break;
                    /**.
                     * 
                     * Delete
                     */
                    case 'delete':

                        this.deleteServiceTypes(serviceTypeAddUid);

                        break;
                }
            });
    }
    /**
     * Delete ProviderService
     */
    deleteServiceTypes(serviceTypeAdduid): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                let index: number;
                index = 0;
                this.newServiceTypesArray.map(serviceType => {
                    if (serviceType.uid === serviceTypeAdduid.uid){
                        this.newServiceTypesArray.splice(index, 1);
                        index = 0;
                    }else{
                        index = index + 1;
                    }
                });
                this._settingsService.onSettingsServiceTypesChanged.next(this.newServiceTypesArray);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New ProviderService
     */
    newServiceTypes(): void
    {
        const serviceTypeAddUid: NewServiceTypeArray = {uid: 0, serviceType: { key: '', value: ''}};
        this.dialogRef = this._matDialog.open(ServiceTypeFormDialogComponent, {
            panelClass: 'service-type-form-dialog',
            data      : {
                serviceTypeAddUid: serviceTypeAddUid,
                action: 'new'
            }
        });

        this.dialogRef.afterClosed()
            .subscribe((formData: FormGroup) => {
                if ( !formData )
                {
                    return;
                }                
                const newServiceType = formData.getRawValue();
                const tempNewServiceType: NewServiceTypeArray = {uid: 0, serviceType: { key: '', value: ''}};
                tempNewServiceType.uid = this.uid;
                tempNewServiceType.serviceType.key = newServiceType.key;
                tempNewServiceType.serviceType.value = newServiceType.value;
                this.newServiceTypesArray.push(tempNewServiceType);
                this._settingsService.onSettingsServiceTypesChanged.next(this.newServiceTypesArray);
            });
    }
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {ServiceTypesService} _serviceTypesService
     */
    constructor(
        private _settingsService: SettingsService
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
        return this._settingsService.onSettingsServiceTypesChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
