
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { HLHorseManagerModel } from 'app/model/users';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { HLInvoiceModel } from 'app/model/invoices';
import { HLHorseModel } from 'app/model/horses';
import { InvoiceService } from 'app/main/invoices/invoice/invoice.service';
import { Router } from '@angular/router';

import * as _moment from 'moment';

@Component({
    selector     : 'invoice',
    templateUrl  : './invoice.component.html',
    styleUrls    : ['./invoice.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class InvoiceComponent implements OnInit, OnDestroy
{
    invoice: HLInvoiceModel;
    horseManagers: HLHorseManagerModel[];
    
    pageType: string;
    invoiceForm: FormGroup;
    
    // Private
    private _unsubscribeAll: Subject<any>;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    /**
     * Constructor
     *
     * @param {InvoiceService} _invoiceService
     * @param {FormBuilder} _formBuilder
     * @param {Location} _location
     * @param {MatSnackBar} _matSnackBar
     * @param {RegistrationsComponent} _owners
     */
    constructor(
        private _invoiceService: InvoiceService,
        private _formBuilder: FormBuilder,
        private _location: Location,
        private _matSnackBar: MatSnackBar,        
        private _matDialog: MatDialog,
        private router: Router
    )
    {
        // Set the default
        this.invoice = null;

        // Set the private defaults
        this._unsubscribeAll = new Subject();

        // this.uploadedUrlOb = new Observable
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to update invoice on changes
        this._invoiceService.onInvoiceChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoice => {
                if ( invoice )
                {
                    this.invoice = invoice;
                    this.pageType = 'edit';     
                    this._invoiceService.setInvoiceId(this.invoice.uid, this.invoice.requestIds);
                }
                else
                {
                    this.pageType = 'new';                    
                    this.invoice = new HLInvoiceModel('', {});
                    this._invoiceService.setInvoiceId(null, []);
                }
                this.invoiceForm = this.createInvoiceForm();
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
     * Create invoice form
     *
     * @returns {FormGroup}
     */
    createInvoiceForm(): FormGroup
    {
        return this._formBuilder.group({
            uid:                [this.invoice.uid],            
            name:               [this.invoice.name],
            tip:                [this.invoice.tip],
            status:             new FormControl({value: this.invoice.status, disabled: this.pageType === 'edit'}),           
            paidAt:             _moment(this.invoice.paidAt, 'MM/DD/YYYY'),
            updatedAt:          [this.invoice.updatedAt],
            createdAt:          [this.invoice.createdAt]
        });
    }

    /**
     * Save invoice
     */
    saveInvoice(): void
    {
        const data = this.invoiceForm.getRawValue();
        this._invoiceService.updateInvoice(data)
            .then((invoice) => {
                this._invoiceService.onInvoiceChanged.next(invoice);
                // Show the success message
                this._matSnackBar.open('Service Invoice data saved successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });
            });
    }
    
    /**
     * Add invoice
     */
    addInvoice(): void
    {
        const data = this.invoiceForm.getRawValue();            
        this._invoiceService.createInvoice(data)
            .then((invoice) => {
                // Show the success message
                this._matSnackBar.open('Invoice data added successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });                
                // this.pageType = 'edit';                                
                this._invoiceService.onInvoiceChanged.next(invoice);
                // Change the location with new one
                // this.router.navigate(['invoices/list/' + invoice.uid]);                
            });
    }

    /**
     * Delete invoice
     */
    deleteInvoice(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
          disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._invoiceService.deleteInvoice(this.invoice)
                  .then(() => {
                    // Show the success message
                    this._matSnackBar.open('Invoice deleted successfully', 'OK', {
                      verticalPosition: 'bottom',
                      duration        : 2500
                    });   
                    this._invoiceService.onInvoiceChanged.next(null);
                    this.router.navigate(['/invoices/list/' + this.invoice.uid]);  
                  });
            }
            this.confirmDialogRef = null;
        });
    }

    /**
     * navigation to previous page.
     */
    returnPreviousPage(): void
    {
        this._location.back();
    }
}
