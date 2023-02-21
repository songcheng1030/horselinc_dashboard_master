
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { HLUserModel } from 'app/model/users';
import { ServiceProviderListService } from 'app/main/users/service-providers/service-provider-list/service-provider-list.service';
import { takeUntil } from 'rxjs/internal/operators';
import { AuthService } from 'app/main/auth/auth.service';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'service-provider-list',
    templateUrl  : './service-provider-list.component.html',
    styleUrls    : ['./service-provider-list.component.scss'],
    animations   : fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class ServiceProviderListComponent implements OnInit
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('filter')
    filter: ElementRef;
    
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'name', 'avatar', 'email', 'status', 'platform', 'phone', 'location', 'createdAt', 'detailAction'];   

    hasSelectedServiceProviderList: boolean;  
    serviceProviderList: HLUserModel[];
    // users: HLServiceProviderManagerModel[];
    checkboxes: {};

    selectedServiceProviderList: string[] = [];
    filteredServiceProviderList: any[] = [];
    curPageServiceProviderList: any[] = [];
    
    userCompleteType: string;
    
    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _serviceProviderListService: ServiceProviderListService,
        private _auth: AuthService

    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.hasSelectedServiceProviderList = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.dataSource = new FilesDataSource(this._serviceProviderListService, this.paginator, this.sort);        
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
                this._serviceProviderListService.setFilteredServiceProviderList(this.dataSource.filteredData); 
            });

        this._serviceProviderListService.onServiceProviderListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceProviderList => {
                this.serviceProviderList = serviceProviderList;

                this.checkboxes = {};
                serviceProviderList.map(horse => {
                    this.checkboxes[horse.uid] = false;
                });
            });

        this._serviceProviderListService.onUserCompleteTypeChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(userCompleteType => {
                this.userCompleteType = userCompleteType;
            });

        this._serviceProviderListService.onSelectedServiceProviderListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedServiceProviderList => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedServiceProviderList.includes(uid);
                }
                // Show selected bar
                this.hasSelectedServiceProviderList = selectedServiceProviderList.length > 0;
            });

            /*this._serviceProviderListService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
            }); */
    }

    /**
     * On selected change when click check box
     *
     * @param serviceProviderListId
     */
    onSelectedChange(serviceProviderListId): void
    {
        this._serviceProviderListService.toggleSelectedNotification(serviceProviderListId);
    }
    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'ServiceProvider-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Service Provider List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
         
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;
        this.serviceProviderList.forEach(data => {
            const new_data = {
                No: ++index,
                Name: data.serviceProvider.name,
                Avatar: data.serviceProvider.avatarUrl,
                Email: data.email,
                Status: data.status,
                Platform: data.platform,
                Phone: data.serviceProvider.phone,
                Location: data.serviceProvider.location,
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
     * @param {ServiceProviderListService} _serviceProviderListService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _serviceProviderListService: ServiceProviderListService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._serviceProviderListService.serviceProviderList;
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        const displayDataChanges = [
            this._serviceProviderListService.onServiceProviderListChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges)
            .pipe(
                map(() => {
                        let data = this._serviceProviderListService.serviceProviderList.slice();

                        data = this.filterData(data);

                        this.filteredData = [...data];

                        data = this.sortData(data);

                        // Grab the page's slice of data.
                        const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;

                        const curPageServiceProviderList = data.splice(startIndex, this._matPaginator.pageSize);

                        // set filtered notification to Service
                        this._serviceProviderListService.setCurPageServiceProviderList(curPageServiceProviderList);        
                
                        return curPageServiceProviderList;
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
                case 'name':
                    [propertyA, propertyB] = [a.serviceProvider.name, b.serviceProvider.name];
                    break;
                case 'status':
                    [propertyA, propertyB] = [a.status, b.status];
                    break;
                case 'platform':
                    [propertyA, propertyB] = [a.platform, b.platform];
                    break;
                case 'barnName':
                    [propertyA, propertyB] = [a.serviceProvider.barnName, b.serviceProvider.barnName];
                    break;
                case 'phone':
                    [propertyA, propertyB] = [a.serviceProvider.phone, b.serviceProvider.phone];
                    break;
                case 'location':
                    [propertyA, propertyB] = [a.serviceProvider.location, b.serviceProvider.location];
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
