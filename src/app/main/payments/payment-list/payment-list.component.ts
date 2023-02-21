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

import { PaymentsService } from 'app/main/payments/payments.service';
import { PaymentsComponent } from 'app/main/payments/payments.component';
import { PaymentFormDialogComponent } from 'app/main/payments/payment-form/payment-form.component';

import { HLBaseUserModel } from 'app/model/users';
import { HLPaymentModel } from 'app/model/payments';

@Component({
    selector     : 'payment-list',
    templateUrl  : './payment-list.component.html',
    styleUrls    : ['./payment-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class PaymentListComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('dialogContent')    
    dialogContent: TemplateRef<any>;

    payments: HLPaymentModel[];
    users: HLBaseUserModel[];
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'serviceProviderId', 'paymentApproverId', 'payerId', 'amount', 'tip', 'isPaidOutsideApp', 'invoiceId', 'createdAt', 'detailAction'];
    // selectedPayments: any[];
    checkboxes: {};
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    

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
        private _matDialog: MatDialog,
        private _paymentsComponent: PaymentsComponent
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
        this.dataSource = new FilesDataSource(this._paymentsService, this.paginator, this.sort);

        this._paymentsService.onPaymentsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(payments => {
                this.payments = payments;

                this.checkboxes = {};
                payments.map(payment => {
                    this.checkboxes[payment.uid] = false;
                });
            });

        this._paymentsService.onSelectedPaymentsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedPayments => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedPayments.includes(uid);
                }
                // this.selectedPayments = selectedPayments;
            });

        this._paymentsService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
            });

        // subscribe from search text control of payments component
        this._paymentsComponent.onSearchTextChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((searchText) => {                
                console.log('Input search text!');   
                if ( !this.dataSource )
                {
                    return;
                }                
                // navigate first page
                if ( searchText.length === 1 || searchText.length === 2) {
                    this.paginator.pageIndex = 0;
                }
                // filter payment
                this.dataSource.filter = searchText;    

                // set filtered data to Service
                this._paymentsService.setFilteredPayments(this.dataSource.filteredData); 
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

    viewPayment(payment): void
    {
        this.dialogRef = this._matDialog.open(PaymentFormDialogComponent, {
            panelClass: 'payment-form-dialog',
            data      : {
                payment: payment,
                users: this.users,
                action : 'view'
            }
        });
    }
    /**
     * Edit payment
     *
     * @param payment
     */
    editPayment(payment): void
    {
        this.dialogRef = this._matDialog.open(PaymentFormDialogComponent, {
            panelClass: 'payment-form-dialog',
            data      : {
                payment: payment,
                users: this.users,
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

                        this._paymentsService.updatePayment(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deletePayment(payment);

                        break;
                }
            });
    }

    /**
     * Delete Payment
     */
    deletePayment(payment): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._paymentsService.deletePayment(payment);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * On selected change when click check box
     *
     * @param paymentId
     */
    onSelectedChange(paymentId): void
    {
        this._paymentsService.toggleSelectedPayment(paymentId);
    }
}

export class FilesDataSource extends DataSource<any>
{
    // Private
    private _filterChange = new BehaviorSubject('');
    private _filteredDataChange = new BehaviorSubject('');

    /**
     * Constructor
     *
     * @param {PaymentService} _PaymentService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _paymentsService: PaymentsService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._paymentsService.payments;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // Filtered data
    get filteredData(): any
    {
        return this._filteredDataChange.value;
    }

    set filteredData(value: any)
    {
        this._filteredDataChange.next(value);
    }

    // Filter
    get filter(): string
    {
        return this._filterChange.value;
    }

    set filter(filter: string)
    {
        this._filterChange.next(filter);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        const displayDataChanges = [
            this._paymentsService.onPaymentsChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges).pipe(map(() => {

                let data = this._paymentsService.payments.slice();

                data = this.filterData(data);

                this.filteredData = [...data];

                data = this.sortData(data);

                // Grab the page's slice of data.
                const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;       
                const curPagePayments = data.splice(startIndex, this._matPaginator.pageSize);

                // set filtered payment to Service
                this._paymentsService.setCurPagePayments(curPagePayments);        
                
                return curPagePayments;
            })
        );

    }

    /**
     * Filter data
     *
     * @param data
     * @returns {any}
     */
    filterData(data): any
    {
        if ( !this.filter || this.filter.length === 0 )
        {
            return data;
        }        
        return FuseUtils.filterArrayByString(data, this.filter);
    }

    /**
     * Sort data
     *
     * @param data
     * @returns {any[]}
     */
    sortData(data): any[]
    {
        if ( !this._matSort.active || this._matSort.direction === '' )
        {
            return data;
        }

        return data.sort((a, b) => {
            let propertyA: number | string = '';
            let propertyB: number | string = '';

            switch ( this._matSort.active )
            {
                /* case 'uid':
                    [propertyA, propertyB] = [a.uid, b.uid];
                    break; */
                case 'serviceProviderId':
                    [propertyA, propertyB] = [a.serviceProviderId, b.serviceProviderId];
                    break;
                case 'paymentApproverId':
                    [propertyA, propertyB] = [a.paymentApproverId, b.paymentApproverId];
                    break;
                case 'payerId':
                    [propertyA, propertyB] = [a.payerId, b.payerId];
                    break;
                case 'amount':
                    [propertyA, propertyB] = [a.amount, b.amount];
                    break;
                case 'tip':
                    [propertyA, propertyB] = [a.tip, b.tip];
                    break;
                case 'isPaidOutsideApp':
                    [propertyA, propertyB] = [a.isPaidOutsideApp, b.isPaidOutsideApp];
                    break;
                case 'invoiceId':
                    [propertyA, propertyB] = [a.invoiceId, b.invoiceId];
                    break;
                case 'createdAt':
                    [propertyA, propertyB] = [new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime()];
                    break;
            }

            const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
            const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

            return (valueA < valueB ? -1 : 1) * (this._matSort.direction === 'asc' ? 1 : -1);
        });
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
