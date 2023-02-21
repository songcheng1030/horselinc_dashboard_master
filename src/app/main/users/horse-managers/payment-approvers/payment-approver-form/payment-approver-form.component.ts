import { HorseManagerService } from 'app/main/users/horse-managers/horse-manager/horse-manager.service';
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLHorseManagerPaymentApproverModel, HLBaseUserModel } from 'app/model/users';

import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

@Component({
    selector     : 'payment-approver-form-dialog',
    templateUrl  : './payment-approver-form.component.html',
    styleUrls    : ['./payment-approver-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class PaymentApproverFormDialogComponent implements OnInit
{
    action: string;
    paymentApprover: HLHorseManagerPaymentApproverModel;
    paymentApproverForm: FormGroup;
    dialogTitle: string;
    allUsers: HLBaseUserModel[];
    pageType: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /** control for the MatSelect filter keyword */        
    public paymentApproverFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */        
    public filteredPaymentApprovers: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);
    /**
     * Constructor
     *
     * @param {MatDialogRef<PaymentApproverFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<PaymentApproverFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _horseManagerService: HorseManagerService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Payment Approver';            
            this.paymentApprover = _data.paymentApprover;
        }
        else
        {
            this.dialogTitle = 'New Payment Approver';
            this.paymentApprover = new HLHorseManagerPaymentApproverModel('', {});
        }

        this.paymentApproverForm = this.createPaymentApproverForm();
    }

        /**
     * On init
     */
    ngOnInit(): void
    {

        this._horseManagerService.onHorseManagerUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.allUsers = users;
                // console.log('users list', this.users);
            });
        // load the initial user list
        this.filteredPaymentApprovers.next(this.allUsers.slice());
        
        // listen for leaser select field value changes        
        this.paymentApproverFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterPaymentApprovers();
        });
    }

    // instant search of paymentApprover user combo box
    filterPaymentApprovers(): void {
        if (!this.allUsers) {
          return;
        }
        // get the search keyword
        let search = this.paymentApproverFilterCtrl.value;
        if (!search) {
          this.filteredPaymentApprovers.next(this.allUsers.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the payment approver users
        this.filteredPaymentApprovers.next(
          this.allUsers.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create paymentApprover form
     *
     * @returns {FormGroup}
     */
    createPaymentApproverForm(): FormGroup
    {
        console.log(this.paymentApprover);
        return this._formBuilder.group({
            uid      : [this.paymentApprover.uid],            
            creatorId    : new FormControl({value: this.paymentApprover.creatorId !== '' ? this.paymentApprover.creatorId : null, disabled: this.action === 'edit'}),
            amount: [this.paymentApprover.amount]
        });
    }
}
