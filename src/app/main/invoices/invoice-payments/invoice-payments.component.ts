import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation, ElementRef } from '@angular/core';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject, BehaviorSubject, merge } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { InvoicePaymentsService } from 'app/main/invoices/invoice-payments/invoice-payments.service';
import { InvoicePaymentFormDialogComponent } from 'app/main/invoices/invoice-payments/invoice-payment-form/invoice-payment-form.component';

import { HLBaseUserModel } from 'app/model/users';
import { HLPaymentModel } from 'app/model/payments';

@Component({
    selector     : 'invoice-payments',
    templateUrl  : './invoice-payments.component.html',
    styleUrls    : ['./invoice-payments.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class InvoicePaymentsComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')    
    dialogContent: TemplateRef<any>;

    payments: HLPaymentModel[];
    users: HLBaseUserModel[];
    dataSource: FilesDataSource | null;
    displayedColumns = ['serviceProviderId', 'paymentApproverId', 'payerId', 'amount', 'tip', 'isPaidOutsideApp', 'createdAt', 'edit-buttons', 'delete-buttons'];
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {InvoicePaymentsService} _invoicePaymentsService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _invoicePaymentsService: InvoicePaymentsService,
        private _matDialog: MatDialog        
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.payments = [];
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.dataSource = new FilesDataSource(this._invoicePaymentsService);
        this.users = this._invoicePaymentsService.allUsers;

        this._invoicePaymentsService.getInvoicePayments();

        this._invoicePaymentsService.onInvoicePaymentsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(payments => {
                this.payments = payments;
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
     * View payment
     *
     * @param payment
     */

    viewInvoicePayment(payment): void
    {
        this.dialogRef = this._matDialog.open(InvoicePaymentFormDialogComponent, {
            panelClass: 'invoice-payment-form-dialog',
            data      : {
                payment: payment,
                users: this.users,
                invoiceId: this._invoicePaymentsService.invoiceId,
                action : 'view'
            }
        });
    }

    /**
     * New payment
     */
    newPayment(): void
    {
        this.dialogRef = this._matDialog.open(InvoicePaymentFormDialogComponent, {
            panelClass: 'invoice-payment-form-dialog',
            data      : {
                action: 'new',
                users: this.users,
                invoiceId: this._invoicePaymentsService.invoiceId
            }
        });

        // create payment
        this.dialogRef.afterClosed()
            .subscribe((form: FormGroup) => {
                if ( !form )
                {
                    return;
                }
                
                this._invoicePaymentsService.createInvoicePayment(form.getRawValue());
            });
    }

    /**
     * Edit payment
     *
     * @param payment
     */
    editInvoicePayment(payment): void
    {
        this.dialogRef = this._matDialog.open(InvoicePaymentFormDialogComponent, {
            panelClass: 'invoice-payment-form-dialog',
            data      : {
                payment: payment,
                users: this.users,
                invoiceId: this._invoicePaymentsService.invoiceId,
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

                        this._invoicePaymentsService.updateInvoicePayment(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteInvoicePayment(payment);

                        break;
                }
            });
    }

    /**
     * Delete InvoicePayment
     */
    deleteInvoicePayment(payment): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._invoicePaymentsService.deleteInvoicePayment(payment);
            }
            this.confirmDialogRef = null;
        });

    }
    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {OwnersService} _ownersService
     */
    constructor(
        private _invoicePaymentsService: InvoicePaymentsService
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
        return this._invoicePaymentsService.onInvoicePaymentsChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}


