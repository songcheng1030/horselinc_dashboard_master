import { HLServiceShowModel } from 'app/model/service-requests';
import { HLBaseUserModel } from './../../model/users';
import { Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';

import { ServiceShowsService } from 'app/main/service-shows/service-shows.service';
import { ServiceShowFormDialogComponent } from 'app/main/service-shows/service-show-form/service-show-form.component';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'service-shows',
    templateUrl  : './service-shows.component.html',
    styleUrls    : ['./service-shows.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ServiceShowsComponent implements OnInit, OnDestroy
{
    dialogRef: any;
    hasSelectedServiceShows: boolean;    
    
    @ViewChild('searchFilter')
    searchFilter: ElementRef;
    onSearchTextChanged: BehaviorSubject<any>;

    serviceShows: HLServiceShowModel[];
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
        private _matDialog: MatDialog
    )
    {
        // Set the private defaults
        this.onSearchTextChanged = new BehaviorSubject([]);
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
        fromEvent(this.searchFilter.nativeElement, 'keyup')
            .pipe(
                takeUntil(this._unsubscribeAll),
                debounceTime(150),
                distinctUntilChanged()
            )
            .subscribe(() => {
                this.onSearchTextChanged.next(this.searchFilter.nativeElement.value);                
            });

        this._serviceShowsService.onSelectedServiceShowsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedServiceShows => {
                this.hasSelectedServiceShows = selectedServiceShows.length > 0;
            });

        this._serviceShowsService.onServiceShowsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceShows => {
                this.serviceShows = serviceShows;
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
     * New ServiceShow
     */
    newServiceShow(): void
    {
        this.dialogRef = this._matDialog.open(ServiceShowFormDialogComponent, {
            panelClass: 'service-show-form-dialog',
            data      : {
                action: 'new'
            }
        });

        // create serviceShow
        this.dialogRef.afterClosed()
            .subscribe((response: FormGroup) => {
                if ( !response )
                {
                    return;
                }
                
                this._serviceShowsService.createServiceShow(response.getRawValue());
            });
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'Service-Shows-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Service Show List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
        
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;        
        this.serviceShows.forEach(data => {
            
            const new_data = {
                No: ++index,
                Id: data.uid,
                Name: data.name,                              
                CreatedAt: data.createdAt
            };
            exportList.push(new_data);
        }); 
        csvExporter.generateCsv(exportList);
    }

}
