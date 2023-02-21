import { HLBaseUserModel } from 'app/model/users';
import { Component, Inject, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelect } from '@angular/material';

import { HLPaymentModel } from 'app/model/payments';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

@Component({
    selector     : 'payment-form-dialog',
    templateUrl  : './payment-form.component.html',
    styleUrls    : ['./payment-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class PaymentFormDialogComponent implements OnDestroy
{
     /** control for the MatSelect filter keyword */
    public serviceProviderFilterCtrl: FormControl = new FormControl();
    public payerFilterCtrl: FormControl = new FormControl();
    public paymentApproverFilterCtrl: FormControl = new FormControl();
    
    /** Subject that emits when the component has been destroyed. */
    private _onDestroy = new Subject<void>();
    
    /** list of users filtered by search keyword */
    public filteredServiceProviders: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);
    public filteredPayers: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);
    public filteredPaymentApprovers: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);


    action: string;
    payment: HLPaymentModel;
    paymentForm: FormGroup;
    dialogTitle: string;
    users: HLBaseUserModel[];
    /**
     * Constructor
     *
     * @param {MatDialogRef<PaymentFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<PaymentFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder
    )
    {
        // Set the defaults
        this.action = _data.action;
        this.payment = _data.payment;
        this.users = _data.users;

        if ( this.action === 'view') {
            this.dialogTitle = 'View Payment';
        } 
        else if ( this.action === 'edit' ) 
        {
            this.dialogTitle = 'Edit Payment';            
        }
        else
        {
            this.dialogTitle = 'New Payment';
            this.payment = new HLPaymentModel('', {});
        }

        // load the initial user list
        this.filteredServiceProviders.next(this.users.slice());
        this.filteredPayers.next(this.users.slice());
        this.filteredPaymentApprovers.next(this.users.slice());
        
        // listen for ServiceProvider select field value changes
        this.serviceProviderFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterServiceProviders();
        });
        this.payerFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterPayers();
        });
        this.paymentApproverFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterPaymentApprovers();
        });
        
        this.paymentForm = this.createPaymentForm();
    }

    // instant search of service provider user combo box
    filterServiceProviders(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.serviceProviderFilterCtrl.value;
        if (!search) {
          this.filteredServiceProviders.next(this.users.slice());
          return;
        }
        
        search = search.toLowerCase();        
        // filter the users
        this.filteredServiceProviders.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
    }

    // instant search of payer user combo box
    filterPayers(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.payerFilterCtrl.value;
        if (!search) {
          this.filteredPayers.next(this.users.slice());
          return;
        }
        search = search.toLowerCase();
        // filter the payer users
        this.filteredPayers.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
    }

    // instant search of payment approvers user combo box
    filterPaymentApprovers(): void {
      if (!this.users) {
        return;
      }
      // get the search keyword
      let search = this.paymentApproverFilterCtrl.value;
      if (!search) {
        this.filteredPaymentApprovers.next(this.users.slice());
        return;
      }
      search = search.toLowerCase();
      // filter the payer users
      this.filteredPaymentApprovers.next(
        this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
      );
    }

    ngOnDestroy(): void {
        this._onDestroy.next();
        this._onDestroy.complete();
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create payment form
     *
     * @returns {FormGroup}
     */
    createPaymentForm(): FormGroup
    {
        return this._formBuilder.group({
          uid:                [this.payment.uid],
          serviceProviderId:  [this.payment.serviceProviderId],          
          paymentApproverId:  [this.payment.paymentApproverId],          
          payerId:            [this.payment.payerId],          
          invoiceId:          [this.payment.invoiceId],
          amount:             [this.payment.amount],
          tip:                [this.payment.tip],
          isPaidOutsideApp:   [this.payment.isPaidOutsideApp.toString()],
          createdAt:          [this.payment.createdAt]
        });
    }

    
}
