import { HLPaymentModel } from './../../model/payments';
import { HLBaseUserModel } from './../../model/users';
import { Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';

import { PaymentsService } from 'app/main/payments/payments.service';
import { PaymentFormDialogComponent } from 'app/main/payments/payment-form/payment-form.component';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'payments',
    templateUrl  : './payments.component.html',
    styleUrls    : ['./payments.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class PaymentsComponent implements OnInit, OnDestroy
{
    dialogRef: any;
    hasSelectedPayments: boolean;    
    users: HLBaseUserModel[];
    payments: HLPaymentModel[];

    @ViewChild('searchFilter')
    searchFilter: ElementRef;
    onSearchTextChanged: BehaviorSubject<any>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {PaymentsService} _paymentsService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _paymentsService: PaymentsService,
        private _matDialog: MatDialog
    )
    {
        // Set the private defaults
        this.onSearchTextChanged = new BehaviorSubject([]);

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
        fromEvent(this.searchFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                this.onSearchTextChanged.next(this.searchFilter.nativeElement.value);                
            });

        this._paymentsService.onSelectedPaymentsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedPayments => {
                this.hasSelectedPayments = selectedPayments.length > 0;
            });

        this._paymentsService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
            });

        this._paymentsService.onPaymentsChanged
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
     * New payment
     */
    newPayment(): void
    {
        this.dialogRef = this._matDialog.open(PaymentFormDialogComponent, {
            panelClass: 'payment-form-dialog',
            data      : {
                action: 'new',
                users: this.users
            }
        });

        // create payment
        this.dialogRef.afterClosed()
            .subscribe((response: FormGroup) => {
                if ( !response )
                {
                    return;
                }
                
                this._paymentsService.createPayment(response.getRawValue());
            });
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'Payment-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Payment List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
        
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;        
        this.payments.forEach(data => {
            
            const new_data = {
                No: ++index,
                ServiceProvider: data.serviceProvider.name,
                PaymentApprover: data.paymentApprover.name,
                Payer: data.payer.name,
                Amount: data.amount,
                Tip: data.tip,
                IsPaidOutsideApp: data.isPaidOutsideApp,
                InvoiceId: data.invoiceId,                
                CreatedAt: data.createdAt
            };
            exportList.push(new_data);
        }); 
        csvExporter.generateCsv(exportList);
    }

}
