import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { ServiceShowsService } from 'app/main/service-shows/service-shows.service';

@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class ServiceShowsSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedServiceShows: boolean;
    isIndeterminate: boolean;
    selectedServiceShows: string[];
    
    pageEvent: PageEvent;
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
        // subscribe serviceShows when clicking check box of serviceShow list    
        this._serviceShowsService.onSelectedServiceShowsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedServiceShows => {
                this.selectedServiceShows = selectedServiceShows;
                setTimeout(() => {
                    this.hasSelectedServiceShows = selectedServiceShows.length > 0;
                    this.isIndeterminate = (selectedServiceShows.length !== this._serviceShowsService.serviceShows.length && selectedServiceShows.length > 0);
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
        this._serviceShowsService.selectServiceShows(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._serviceShowsService.selectServiceShows(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._serviceShowsService.deselectServiceShows();
    }

    /**
     * Delete selected serviceShows
     */
    deleteSelectedServiceShows(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected ServiceShows?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._serviceShowsService.deleteSelectedServiceShows();
                }
                this.confirmDialogRef = null;
            });
    }
}
