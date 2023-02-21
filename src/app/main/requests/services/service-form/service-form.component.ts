import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLServiceProviderServiceModel } from 'app/model/users';
import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';
import { RequestService } from 'app/main/requests/request/request.service';

@Component({
    selector     : 'service-form-dialog',
    templateUrl  : './service-form.component.html',
    styleUrls    : ['./service-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ServiceFormDialogComponent implements OnInit
{
    action: string;
    service: HLServiceProviderServiceModel;
    serviceForm: FormGroup;
    dialogTitle: string;
    serviceProviderServices: HLServiceProviderServiceModel[];
    pageType: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /** control for the MatSelect filter keyword */        
    public serviceFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */        
    public filteredServices: ReplaySubject<HLServiceProviderServiceModel[]> = new ReplaySubject<HLServiceProviderServiceModel[]>(1);
    /**
     * Constructor
     *
     * @param {MatDialogRef<ServiceFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<ServiceFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _requestService: RequestService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Service';            
            this.service = _data.service;
        }
        else
        {
            this.dialogTitle = 'New Service';
            this.service = new HLServiceProviderServiceModel(null, {});
        }

        this.serviceForm = this.createServiceForm();
    }

        /**
     * On init
     */
    ngOnInit(): void
    {

        this._requestService.onServiceProviderServiceListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(services => {
                this.serviceProviderServices = services;
                // console.log('service provider services', this.serviceProviderServices);
            });
        // load the initial service list
        this.filteredServices.next(this.serviceProviderServices.slice());
        
        // listen for leaser select field value changes        
        this.serviceFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterServices();
        });
    }

    // instant search of service user combo box
    filterServices(): void {
        if (!this.serviceProviderServices) {
          return;
        }
        // get the search keyword
        let search = this.serviceFilterCtrl.value;
        if (!search) {
          this.filteredServices.next(this.serviceProviderServices.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the service users
        this.filteredServices.next(
          this.serviceProviderServices.filter(service => service.service.toLowerCase().indexOf(search) > -1)
        );
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create service form
     *
     * @returns {FormGroup}
     */
    createServiceForm(): FormGroup
    {
        return this._formBuilder.group({     
            index      : [this.service.index],
            service        : [this.service.service],            
            rate        : [this.service.rate],            
            quantity   : [this.service.quantity],
        });
    }
}
