import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { NotificationsService } from 'app/main/notifications/notifications.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class NotificationsSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedNotifications: boolean;
    isIndeterminate: boolean;
    selectedNotifications: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {NotificationsService} _notificationsService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _notificationsService: NotificationsService,
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
        // subscribe notifications when clicking check box of notification list    
        this._notificationsService.onSelectedNotificationsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedNotifications => {
                this.selectedNotifications = selectedNotifications;
                setTimeout(() => {
                    this.hasSelectedNotifications = selectedNotifications.length > 0;
                    this.isIndeterminate = (selectedNotifications.length !== this._notificationsService.notifications.length && selectedNotifications.length > 0);
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
        this._notificationsService.selectNotifications(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._notificationsService.selectNotifications(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._notificationsService.deselectNotifications();
    }

    /**
     * Delete selected notifications
     */
    deleteSelectedNotifications(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected notifications?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._notificationsService.deleteSelectedNotifications();
                }
                this.confirmDialogRef = null;
            });
    }
}
