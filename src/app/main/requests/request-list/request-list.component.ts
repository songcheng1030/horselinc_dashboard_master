import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { HLServiceRequestModel } from 'app/model/service-requests';

import { RequestListService } from 'app/main/requests/request-list/request-list.service';
import { takeUntil } from 'rxjs/internal/operators';
import { AuthService } from 'app/main/auth/auth.service';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'request-list',
    templateUrl  : './request-list.component.html',
    styleUrls    : ['./request-list.component.scss'],
    animations   : fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class RequestListComponent implements OnInit
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('filter')
    filter: ElementRef;
    
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'requestDate', 'horse', 'show', 'status', 'serviceProvider', 'assigner',  'creator', 'createdAt', 'detailAction']; 

    hasSelectedRequestList: boolean;  
    requestList: HLServiceRequestModel[];    
    checkboxes: {};

    selectedRequestList: string[] = [];
    filteredRequestList: any[] = [];
    curPageRequestList: any[] = [];
    
    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _requestListService: RequestListService,
        private _auth: AuthService

    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.hasSelectedRequestList = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.dataSource = new FilesDataSource(this._requestListService, this.paginator, this.sort);        
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
                this._requestListService.setFilteredRequestList(this.dataSource.filteredData); 
            });

        this._requestListService.onRequestListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(requestList => {
                this.requestList = requestList;

                this.checkboxes = {};
                requestList.map(request => {
                    this.checkboxes[request.uid] = false;
                });
            });

        this._requestListService.onSelectedRequestListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedRequestList => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedRequestList.includes(uid);
                }
                // Show selected bar
                this.hasSelectedRequestList = selectedRequestList.length > 0;
            });

    }

    /**
     * On selected change when click check box
     *
     * @param requestListId
     */
    onSelectedChange(requestListId): void
    {
        this._requestListService.toggleSelectedNotification(requestListId);
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'Service-Request-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Service Request List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
        
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;        
        this.requestList.forEach(data => {
            let show = '';
            if (data.show && data.show.name !== undefined) {
                show = data.show.name;
                console.log(show);
            }
            const new_data = {
                No: ++index,
                RequestDate: data.requestDate,
                Horse: data.horse.displayName,
                Show: show,
                Status: data.status,
                ServiceProvider: data.serviceProvider.name,
                Assigner: data.assigner.name,
                Creator: data.creator.name,                
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
     * @param {RequestListService} _requestListService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _requestListService: RequestListService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._requestListService.requestList;
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        const displayDataChanges = [
            this._requestListService.onRequestListChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges)
            .pipe(
                map(() => {
                        let data = this._requestListService.requestList.slice();

                        data = this.filterData(data);

                        this.filteredData = [...data];

                        data = this.sortData(data);

                        // Grab the page's slice of data.
                        const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;

                        const curPageRequestList = data.splice(startIndex, this._matPaginator.pageSize);

                        // set filtered notification to Service
                        this._requestListService.setCurPageRequestList(curPageRequestList);        
                
                        return curPageRequestList;
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
                case 'requestDate':
                    [propertyA, propertyB] = [a.requestDate, b.requestDate];
                    break;
                case 'competitionClass':
                    [propertyA, propertyB] = [a.competitionClass, b.competitionClass];
                    break;
                case 'horse':
                    [propertyA, propertyB] = [a.horse.displayName, b.horse.displayName];
                    break;
                case 'show':
                    [propertyA, propertyB] = [a.show.name, b.show.name];
                    break;
                case 'status':
                    [propertyA, propertyB] = [a.status, b.status];
                    break;
                case 'serviceProvider':
                    [propertyA, propertyB] = [a.serviceProvider.name, b.serviceProvider.name];
                    break;
                case 'assigner':
                    [propertyA, propertyB] = [a.assigner.name, b.assigner.name];
                    break;
                /* case 'isDeletedFromInvoice':
                    [propertyA, propertyB] = [a.isDeletedFromInvoice, b.isDeletedFromInvoice];
                    break; */
                case 'isCustomRequest':
                    [propertyA, propertyB] = [a.isCustomRequest, b.isCustomRequest];
                    break;
                case 'creator':
                    [propertyA, propertyB] = [a.creator.name, b.creator.name];
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
