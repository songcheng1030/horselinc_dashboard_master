import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { PaymentApproversService } from 'app/main/users/horse-managers/payment-approvers/payment-approvers.service';
import { PaymentApproverFormDialogComponent } from 'app/main/users/horse-managers/payment-approvers/payment-approver-form/payment-approver-form.component';

@Component({
    selector     : 'payment-approvers',
    templateUrl  : './payment-approvers.component.html',
    styleUrls    : ['./payment-approvers.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class PaymentApproversComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    paymentApprovers: any;
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['name', 'amount', 'edit-buttons', 'delete-buttons'];    
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {PaymentApproversService} _paymentApproversService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _paymentApproversService: PaymentApproversService,
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
        this.paymentApprovers = [];
        // if horse and paymentApprover data exists.
        // if (this._paymentApproversService.horseId != null && this._paymentApproversService.paymentApproverIds.length > 0){
        this._paymentApproversService.getPaymentApprovers();
        this.dataSource = new FilesDataSource(this._paymentApproversService);
        this._paymentApproversService.onPaymentApproversChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(paymentApprovers => {                
                this.paymentApprovers = paymentApprovers;
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
     * Edit PaymentApprover
     *
     * @param paymentApprover
     */
    editPaymentApprover(paymentApprover): void
    {
        this.dialogRef = this._matDialog.open(PaymentApproverFormDialogComponent, {
            panelClass: 'payment-approver-form-dialog',
            data      : {
                paymentApprover: paymentApprover,
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
                        this._paymentApproversService.updatePaymentApprover(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deletePaymentApprover(paymentApprover);

                        break;
                }
            });
    }

    /**
     * Delete PaymentApprover
     */
    deletePaymentApprover(paymentApprover): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                //console.log(paymentApprover);
                this._paymentApproversService.deletePaymentApprover(paymentApprover);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New PaymentApprover
     */
    newPaymentApprover(): void
    {
        this.dialogRef = this._matDialog.open(PaymentApproverFormDialogComponent, {
            panelClass: 'payment-approver-form-dialog',
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
                this._paymentApproversService.createPaymentApprover(form.getRawValue());
            });
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {PaymentApproversService} _paymentApproversService
     */
    constructor(
        private _paymentApproversService: PaymentApproversService
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
        return this._paymentApproversService.onPaymentApproversChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
