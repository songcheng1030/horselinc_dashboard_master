import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { RequestListService } from 'app/main/requests/request-list/request-list.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class RequestListSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedRequestList: boolean;
    isIndeterminate: boolean;
    selectedRequestList: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {RequestListService} _requestListService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _requestListService: RequestListService,
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
        // subscribe request when clicking check box of notification list    
        this._requestListService.onSelectedRequestListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedRequestList => {
                this.selectedRequestList = selectedRequestList;
                setTimeout(() => {
                    this.hasSelectedRequestList = selectedRequestList.length > 0;
                    this.isIndeterminate = (selectedRequestList.length !== this._requestListService.requestList.length && selectedRequestList.length > 0);
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
        this._requestListService.selectRequestList(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._requestListService.selectRequestList(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._requestListService.deselectRequestList();
    }

    /**
     * Delete selected request
     */
    deleteSelectedRequestList(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected request?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._requestListService.deleteSelectedRequestList();
                }
                this.confirmDialogRef = null;
            });
    }
}
