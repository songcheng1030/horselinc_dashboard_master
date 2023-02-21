import { HLHorseModel } from 'app/model/horses';
import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { HorseListService } from 'app/main/horses/horse-list/horse-list.service';
import { takeUntil } from 'rxjs/internal/operators';
import { AuthService } from 'app/main/auth/auth.service';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'horse-list',
    templateUrl  : './horse-list.component.html',
    styleUrls    : ['./horse-list.component.scss'],
    animations   : fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class HorseListComponent implements OnInit
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('filter')
    filter: ElementRef;
    
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'barnName', 'displayName', 'gender', 'birthYear', 'avatar', 'leaserId', 'trainerId', 'creatorId', 'active', 'createdAt', 'detailAction'];   

    hasSelectedHorseList: boolean;  
    horseList: HLHorseModel[];
    // users: HLHorseManagerModel[];
    checkboxes: {};

    selectedHorseList: string[] = [];
    filteredHorseList: any[] = [];
    curPageHorseList: any[] = [];
    
    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _horseListService: HorseListService,
        private _auth: AuthService

    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
        this.hasSelectedHorseList = true;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        this.dataSource = new FilesDataSource(this._horseListService, this.paginator, this.sort);        
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
                this._horseListService.setFilteredHorseList(this.dataSource.filteredData); 
            });

        this._horseListService.onHorseListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(horseList => {
                this.horseList = horseList;

                this.checkboxes = {};
                horseList.map(horse => {
                    this.checkboxes[horse.uid] = false;
                });
            });

        this._horseListService.onSelectedHorseListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedHorseList => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedHorseList.includes(uid);
                }
                // Show selected bar
                this.hasSelectedHorseList = selectedHorseList.length > 0;
            });

            /*this._horseListService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
            }); */
    }

    /**
     * On selected change when click check box
     *
     * @param horseListId
     */
    onSelectedChange(horseListId): void
    {
        this._horseListService.toggleSelectedNotification(horseListId);
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'Horse-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Horse List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
         
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;
        
        this.horseList.forEach(data => {
            const new_data = {
                No: ++index,
                BarnName: data.barnName,
                DisplayName: data.displayName,
                Gender: data.gender,
                BirthYear: data.birthYear,
                Avatar: data.avatarUrl,
                Leaser: data.leaser.name,
                Trainer: data.trainer.name,
                Creator: data.creator.name,
                IsDeleted: data.isDeleted,
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
     * @param {HorseListService} _horseListService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _horseListService: HorseListService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._horseListService.horseList;
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        const displayDataChanges = [
            this._horseListService.onHorseListChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges)
            .pipe(
                map(() => {
                        let data = this._horseListService.horseList.slice();

                        data = this.filterData(data);

                        this.filteredData = [...data];

                        data = this.sortData(data);

                        // Grab the page's slice of data.
                        const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;

                        const curPageHorseList = data.splice(startIndex, this._matPaginator.pageSize);

                        // set filtered notification to Service
                        this._horseListService.setCurPageHorseList(curPageHorseList);        
                
                        return curPageHorseList;
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
                case 'barnName':
                    [propertyA, propertyB] = [a.barnName, b.barnName];
                    break;
                case 'displayName':
                    [propertyA, propertyB] = [a.displayName, b.displayName];
                    break;
                case 'gender':
                    [propertyA, propertyB] = [a.gender, b.gender];
                    break;
                case 'birthYear':
                    [propertyA, propertyB] = [a.birthYear, b.birthYear];
                    break;
                case 'color':
                    [propertyA, propertyB] = [a.color, b.color];
                    break;
                case 'height':
                    [propertyA, propertyB] = [a.height, b.height];
                    break;
                case 'leaserId':
                    [propertyA, propertyB] = [a.leaser.name, b.leaser.name];
                    break;
                case 'trainerId':
                    [propertyA, propertyB] = [a.trainer.name, b.trainer.name];
                    break;
                case 'creatorId':
                    [propertyA, propertyB] = [a.creator.name, b.creator.name];
                    break;
                case 'active':
                    [propertyA, propertyB] = [a.isDeleted, b.isDeleted];
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
