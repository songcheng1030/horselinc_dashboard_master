import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { HLInvoiceModel } from 'app/model/invoices';

import { InvoiceListService } from 'app/main/invoices/invoice-list/invoice-list.service';
import { takeUntil } from 'rxjs/internal/operators';
import { AuthService } from 'app/main/auth/auth.service';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'invoice-list',
    templateUrl  : './invoice-list.component.html',
    styleUrls    : ['./invoice-list.component.scss'],
    animations   : fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class InvoiceListComponent implements OnInit
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('filter')
    filter: ElementRef;
    
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'amount', 'tip', 'status', 'paidAt', 'createdAt', 'detailAction']; /* 'uid', */

    hasSelectedInvoiceList: boolean;  
    invoiceList: HLInvoiceModel[];    
    checkboxes: {};

    selectedInvoiceList: string[] = [];
    filteredInvoiceList: any[] = [];
    curPageInvoiceList: any[] = [];
    
    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _invoiceListService: InvoiceListService,
        private _auth: AuthService

    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.hasSelectedInvoiceList = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.dataSource = new FilesDataSource(this._invoiceListService, this.paginator, this.sort);        
        fromEvent(this.filter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe((key) => {
                if ( !this.dataSource )
                {
                    return;
                }
                // navigate first page
                if ( this.filter.nativeElement.value.length > 1 ) {
                    this.paginator.pageIndex = 0;                
                }
                   
                this.dataSource.filter = this.filter.nativeElement.value;

                // set filtered data to Service
                this._invoiceListService.setFilteredInvoiceList(this.dataSource.filteredData); 
            });

        this._invoiceListService.onInvoiceListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoiceList => {
                this.invoiceList = invoiceList;

                this.checkboxes = {};
                invoiceList.map(invoice => {
                    this.checkboxes[invoice.uid] = false;
                });
            });

        this._invoiceListService.onSelectedInvoiceListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedInvoiceList => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedInvoiceList.includes(uid);
                }
                // Show selected bar
                this.hasSelectedInvoiceList = selectedInvoiceList.length > 0;
            });

    }

    /**
     * On selected change when click check box
     *
     * @param invoiceListId
     */
    onSelectedChange(invoiceListId): void
    {
        this._invoiceListService.toggleSelectedNotification(invoiceListId);
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'Invoice-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Invoice List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
         
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;        
        this.invoiceList.forEach(data => {
            const new_data = {
                No: ++index,
                InvoiceID: data.uid,
                Amount: data.amount,
                Tip: data.tip,
                Status: data.status,
                PaidAt: data.paidAt,
                CreatedAt: data.createdAt
            };
            exportList.push(new_data);
        }); 
        csvExporter.generateCsv(exportList);
    }
}

export class FilesDataSource extends DataSource<any>
{
    private _filterChange = new BehaviorSubject('');
    private _filteredDataChange = new BehaviorSubject('');

    /**
     * Constructor
     *
     * @param {InvoiceListService} _invoiceListService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _invoiceListService: InvoiceListService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._invoiceListService.invoiceList;
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        const displayDataChanges = [
            this._invoiceListService.onInvoiceListChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges)
            .pipe(
                map(() => {
                        let data = this._invoiceListService.invoiceList.slice();

                        data = this.filterData(data);

                        this.filteredData = [...data];

                        data = this.sortData(data);

                        // Grab the page's slice of data.
                        const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;

                        const curPageInvoiceList = data.splice(startIndex, this._matPaginator.pageSize);

                        // set filtered notification to Service
                        this._invoiceListService.setCurPageInvoiceList(curPageInvoiceList);        
                
                        return curPageInvoiceList;
                    }
                ));
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
     * Filter data
     *
     * @param data
     * @returns {any}
     */
    filterData(data): any
    {
        if ( !this.filter )
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
                case 'amount':
                    [propertyA, propertyB] = [a.amount, b.amount];
                    break;
                case 'tip':
                    [propertyA, propertyB] = [a.tip, b.tip];
                    break;
                case 'status':
                    [propertyA, propertyB] = [a.status, b.status];
                    break;
                case 'paidAt':
                    [propertyA, propertyB] = [a.paidAt, b.paidAt];
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
