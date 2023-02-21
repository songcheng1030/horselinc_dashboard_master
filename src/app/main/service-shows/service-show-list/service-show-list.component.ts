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

import { ServiceShowsService } from 'app/main/service-shows/service-shows.service';
import { ServiceShowsComponent } from 'app/main/service-shows/service-shows.component';
import { ServiceShowFormDialogComponent } from 'app/main/service-shows/service-show-form/service-show-form.component';

import { HLBaseUserModel } from 'app/model/users';
import { HLServiceShowModel } from 'app/model/service-requests';

@Component({
    selector     : 'service-show-list',
    templateUrl  : './service-show-list.component.html',
    styleUrls    : ['./service-show-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ServiceShowListComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('dialogContent')    
    dialogContent: TemplateRef<any>;

    serviceShows: HLServiceShowModel[];
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'uid', 'name', 'createdAt', 'detailAction'];
    checkboxes: {};
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ServiceShowsService} _serviceShowsService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _serviceShowsService: ServiceShowsService,
        private _matDialog: MatDialog,
        private _serviceShowsComponent: ServiceShowsComponent
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
        this.dataSource = new FilesDataSource(this._serviceShowsService, this.paginator, this.sort);

        this._serviceShowsService.onServiceShowsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceShows => {
                this.serviceShows = serviceShows;

                this.checkboxes = {};
                serviceShows.map(serviceShow => {
                    this.checkboxes[serviceShow.uid] = false;
                });
            });

        this._serviceShowsService.onSelectedServiceShowsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedServiceShows => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedServiceShows.includes(uid);
                }
                
            });

        // subscribe from search text control of serviceShows component
        this._serviceShowsComponent.onSearchTextChanged
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
                // filter serviceShow
                this.dataSource.filter = searchText;    

                // set filtered data to Service
                this._serviceShowsService.setFilteredServiceShows(this.dataSource.filteredData); 
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
     * View ServiceShow
     *
     * @param serviceShow
     */

    viewServiceShow(serviceShow): void
    {
        this.dialogRef = this._matDialog.open(ServiceShowFormDialogComponent, {
            panelClass: 'service-show-form-dialog',
            data      : {
                serviceShow: serviceShow,
                action : 'view'
            }
        });
    }
    /**
     * Edit serviceShow
     *
     * @param serviceShow
     */
    editServiceShow(serviceShow): void
    {
        this.dialogRef = this._matDialog.open(ServiceShowFormDialogComponent, {
            panelClass: 'service-show-form-dialog',
            data      : {
                serviceShow: serviceShow,
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

                        this._serviceShowsService.updateServiceShow(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteServiceShow(serviceShow);

                        break;
                }
            });
    }

    /**
     * Delete ServiceShow
     */
    deleteServiceShow(serviceShow): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._serviceShowsService.deleteServiceShow(serviceShow);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * On selected change when click check box
     *
     * @param serviceShowId
     */
    onSelectedChange(serviceShowId): void
    {
        this._serviceShowsService.toggleSelectedServiceShow(serviceShowId);
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
     * @param {ServiceShowService} _ServiceShowService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _serviceShowsService: ServiceShowsService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._serviceShowsService.serviceShows;
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
            this._serviceShowsService.onServiceShowsChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges).pipe(map(() => {

                let data = this._serviceShowsService.serviceShows.slice();

                data = this.filterData(data);

                this.filteredData = [...data];

                data = this.sortData(data);

                // Grab the page's slice of data.
                const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;       
                const curPageServiceShows = data.splice(startIndex, this._matPaginator.pageSize);

                // set filtered serviceShow to Service
                this._serviceShowsService.setCurPageServiceShows(curPageServiceShows);        
                
                return curPageServiceShows;
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
                case 'uid':
                    [propertyA, propertyB] = [a.uid, b.uid];
                    break;                
                case 'name':
                    [propertyA, propertyB] = [a.name, b.name];
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
