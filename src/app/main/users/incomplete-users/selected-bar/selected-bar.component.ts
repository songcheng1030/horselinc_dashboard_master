import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { IncompleteUserListService } from 'app/main/users/incomplete-users/incomplete-user-list/incomplete-user-list.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class IncompleteUserListSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedIncompleteUserList: boolean;
    isIndeterminate: boolean;
    selectedIncompleteUserList: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {IncompleteUserListService} _incompleteUserListService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _incompleteUserListService: IncompleteUserListService,
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
        // subscribe user when clicking check box of notification list    
        this._incompleteUserListService.onSelectedIncompleteUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedIncompleteUserList => {
                this.selectedIncompleteUserList = selectedIncompleteUserList;
                setTimeout(() => {
                    this.hasSelectedIncompleteUserList = selectedIncompleteUserList.length > 0;
                    this.isIndeterminate = (selectedIncompleteUserList.length !== this._incompleteUserListService.incompleteUserList.length && selectedIncompleteUserList.length > 0);
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
        this._incompleteUserListService.selectIncompleteUserList(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._incompleteUserListService.selectIncompleteUserList(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._incompleteUserListService.deselectIncompleteUserList();
    }

    /**
     * Delete selected user
     */
    deleteSelectedIncompleteUserList(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected user?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._incompleteUserListService.deleteSelectedIncompleteUserList();
                }
                this.confirmDialogRef = null;
            });
    }
}
