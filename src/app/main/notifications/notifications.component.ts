import { HLNotificationModel } from './../../model/notifications';
import { HLBaseUserModel } from './../../model/users';
import { Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';

import { NotificationsService } from 'app/main/notifications/notifications.service';
import { NotificationFormDialogComponent } from 'app/main/notifications/notification-form/notification-form.component';

import { ExportToCsv } from 'export-to-csv';
import * as moment from 'moment';

@Component({
    selector     : 'notifications',
    templateUrl  : './notifications.component.html',
    styleUrls    : ['./notifications.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class NotificationsComponent implements OnInit, OnDestroy
{
    dialogRef: any;
    hasSelectedNotifications: boolean;    
    users: HLBaseUserModel[];

    @ViewChild('searchFilter')
    searchFilter: ElementRef;
    onSearchTextChanged: BehaviorSubject<any>;
    notifications: HLNotificationModel[];

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

        this._notificationsService.onSelectedNotificationsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedNotifications => {
                this.hasSelectedNotifications = selectedNotifications.length > 0;
            });

        this._notificationsService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
            });

        this._notificationsService.onNotificationsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(notifications => {
                this.notifications = notifications;
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
     * New notification
     */
    newNotification(): void
    {
        this.dialogRef = this._matDialog.open(NotificationFormDialogComponent, {
            panelClass: 'notification-form-dialog',
            data      : {
                action: 'new',
                users: this.users
            }
        });

        // create notification
        this.dialogRef.afterClosed()
            .subscribe((response: FormGroup) => {
                if ( !response )
                {
                    return;
                }
                
                this._notificationsService.createNotification(response.getRawValue());
            });
    }

    /**
     * Export to CSV file
     */
    exportCSV(): void {
        
        const filename_str = 'Notifications-export-' + moment(new Date()).format('YYYY-MM-DD');        
        const options = { 
            fieldSeparator: ',',
            filename: filename_str,
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: true,
            title: 'Notification List',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true            
          };
        
        const csvExporter = new ExportToCsv(options);
        const exportList = [];
        let index = 0;                
        this.notifications.forEach(data => {
            
            const new_data = {
                No: ++index,
                Receiver: data.recipient.name,
                Message: data.message,                              
                Creator: data.creator.name,                              
                CreatedAt: data.createdAt
            };
            exportList.push(new_data);
        }); 
        csvExporter.generateCsv(exportList);
    }

}
