import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { PaymentsService } from 'app/main/payments/payments.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class PaymentsSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedPayments: boolean;
    isIndeterminate: boolean;
    selectedPayments: string[];
    
    pageEvent: PageEvent;
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
        // subscribe payments when clicking check box of payment list    
        this._paymentsService.onSelectedPaymentsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedPayments => {
                this.selectedPayments = selectedPayments;
                setTimeout(() => {
                    this.hasSelectedPayments = selectedPayments.length > 0;
                    this.isIndeterminate = (selectedPayments.length !== this._paymentsService.payments.length && selectedPayments.length > 0);
                }, 0);
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
     * Select all
     */
    selectAll(): void
    {
        this._paymentsService.selectPayments(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._paymentsService.selectPayments(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._paymentsService.deselectPayments();
    }

    /**
     * Delete selected payments
     */
    deleteSelectedPayments(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected payments?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._paymentsService.deleteSelectedPayments();
                }
                this.confirmDialogRef = null;
            });
    }
}
