import { ServiceProviderService } from 'app/main/users/service-providers/service-provider/service-provider.service';
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLServiceProviderServiceModel, HLBaseUserModel } from 'app/model/users';

import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

@Component({
    selector     : 'service-type-form-dialog',
    templateUrl  : './service-type-form.component.html',
    styleUrls    : ['./service-type-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ServiceTypeFormDialogComponent implements OnInit
{
    action: string;
    // providerService: HLServiceProviderServiceModel;

    ServiceTypeForm: FormGroup;
    dialogTitle: string;    
    pageType: string;
    serviceTypeAddUid: any;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {MatDialogRef<ServiceTypeFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<ServiceTypeFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        // private _serviceProviderService: ServiceProviderService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            
            this.dialogTitle = 'Edit Service Provider Service';            
            this.serviceTypeAddUid = _data.serviceTypeAddUid;
            console.log('this is dialog', this.serviceTypeAddUid);
        }
        else
        {
            this.dialogTitle = 'New Service Provider Service';
            this.serviceTypeAddUid = _data.serviceTypeAddUid;
        }

        this.ServiceTypeForm = this.createServiceTypeForm();
    }
        /**
     * On init
     */
    ngOnInit(): void
    {

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create providerService form
     *
     * @returns {FormGroup}
     */
    createServiceTypeForm(): FormGroup
    {
        console.log(this.serviceTypeAddUid);
        return this._formBuilder.group({
            uid: [this.serviceTypeAddUid.uid],
            key : [this.serviceTypeAddUid.serviceType.key],
            value: [this.serviceTypeAddUid.serviceType.value]
        });
    }
}
