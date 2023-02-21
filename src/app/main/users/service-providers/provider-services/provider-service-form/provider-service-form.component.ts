import { ServiceProviderService } from 'app/main/users/service-providers/service-provider/service-provider.service';
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLServiceProviderServiceModel, HLBaseUserModel } from 'app/model/users';

import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

@Component({
    selector     : 'provider-service-form-dialog',
    templateUrl  : './provider-service-form.component.html',
    styleUrls    : ['./provider-service-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ProviderServiceFormDialogComponent implements OnInit
{
    action: string;
    providerService: HLServiceProviderServiceModel;
    providerServiceForm: FormGroup;
    dialogTitle: string;    
    pageType: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {MatDialogRef<ProviderServiceFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<ProviderServiceFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _serviceProviderService: ServiceProviderService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Service Provider Service';            
            this.providerService = _data.providerService;
        }
        else
        {
            this.dialogTitle = 'New Service Provider Service';
            this.providerService = new HLServiceProviderServiceModel('', {});
        }

        this.providerServiceForm = this.createProviderServiceForm();
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
    createProviderServiceForm(): FormGroup
    {
        console.log(this.providerService);
        return this._formBuilder.group({
            uid      : [this.providerService.uid],                        
            service: [this.providerService.service],
            quantity: [this.providerService.quantity],
            rate: [this.providerService.rate]
        });
    }
}
