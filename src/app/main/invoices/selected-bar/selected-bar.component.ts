import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { InvoiceListService } from 'app/main/invoices/invoice-list/invoice-list.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class InvoiceListSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedInvoiceList: boolean;
    isIndeterminate: boolean;
    selectedInvoiceList: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {InvoiceListService} _invoiceListService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _invoiceListService: InvoiceListService,
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
        // subscribe invoice when clicking check box of notification list    
        this._invoiceListService.onSelectedInvoiceListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedInvoiceList => {
                this.selectedInvoiceList = selectedInvoiceList;
                setTimeout(() => {
                    this.hasSelectedInvoiceList = selectedInvoiceList.length > 0;
                    this.isIndeterminate = (selectedInvoiceList.length !== this._invoiceListService.invoiceList.length && selectedInvoiceList.length > 0);
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
        this._invoiceListService.selectInvoiceList(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._invoiceListService.selectInvoiceList(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._invoiceListService.deselectInvoiceList();
    }

    /**
     * Delete selected invoice
     */
    deleteSelectedInvoiceList(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected invoice?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._invoiceListService.deleteSelectedInvoiceList();
                }
                this.confirmDialogRef = null;
            });
    }
}
