
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { HLUserModel } from 'app/model/users';
import { IncompleteUserListService } from 'app/main/users/incomplete-users/incomplete-user-list/incomplete-user-list.service';
import { takeUntil } from 'rxjs/internal/operators';
import { AuthService } from 'app/main/auth/auth.service';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';
@Component({
    selector     : 'incomplete-user-list',
    templateUrl  : './incomplete-user-list.component.html',
    styleUrls    : ['./incomplete-user-list.component.scss'],
    animations   : fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class IncompleteUserListComponent implements OnInit
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('filter')
    filter: ElementRef;
    
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'email', 'status', 'platform', 'createdAt', 'detailAction'];   

    hasSelectedIncompleteUserList: boolean;  
    incompleteUserList: HLUserModel[];
    // users: HLIncompleteUserManagerModel[];
    checkboxes: {};

    selectedIncompleteUserList: string[] = [];
    filteredIncompleteUserList: any[] = [];
    curPageIncompleteUserList: any[] = [];
    
    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _incompleteUserListService: IncompleteUserListService,
        private _auth: AuthService

    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.hasSelectedIncompleteUserList = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.dataSource = new FilesDataSource(this._incompleteUserListService, this.paginator, this.sort);        
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
                this._incompleteUserListService.setFilteredIncompleteUserList(this.dataSource.filteredData); 
            });

        this._incompleteUserListService.onIncompleteUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(incompleteUserList => {
                this.incompleteUserList = incompleteUserList;

                this.checkboxes = {};
                incompleteUserList.map(user => {
                    this.checkboxes[user.uid] = false;
                });
            });

        this._incompleteUserListService.onSelectedIncompleteUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedIncompleteUserList => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedIncompleteUserList.includes(uid);
                }
                // Show selected bar
                this.hasSelectedIncompleteUserList = selectedIncompleteUserList.length > 0;
            });
    }

    /**
     * On selected change when click check box
     *
     * @param incompleteUserListId
     */
    onSelectedChange(incompleteUserListId): void
    {
        this._incompleteUserListService.toggleSelectedNotification(incompleteUserListId);
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'IncompleteUser-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Incomplete User List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
         
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;
        this.incompleteUserList.forEach(data => {
            const new_data = {
                No: ++index,                
                Email: data.email,
                Status: data.status,
                Platform: data.platform,                
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
     * @param {IncompleteUserListService} _incompleteUserListService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _incompleteUserListService: IncompleteUserListService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._incompleteUserListService.incompleteUserList;
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        const displayDataChanges = [
            this._incompleteUserListService.onIncompleteUserListChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges)
            .pipe(
                map(() => {
                        let data = this._incompleteUserListService.incompleteUserList.slice();

                        data = this.filterData(data);

                        this.filteredData = [...data];

                        data = this.sortData(data);

                        // Grab the page's slice of data.
                        const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;

                        const curPageIncompleteUserList = data.splice(startIndex, this._matPaginator.pageSize);

                        // set filtered notification to Service
                        this._incompleteUserListService.setCurPageIncompleteUserList(curPageIncompleteUserList);        
                
                        return curPageIncompleteUserList;
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
                case 'email':
                    [propertyA, propertyB] = [a.email, b.email];
                    break;                
                case 'status':
                    [propertyA, propertyB] = [a.status, b.status];
                    break;
                case 'platform':
                    [propertyA, propertyB] = [a.platform, b.platform];
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
