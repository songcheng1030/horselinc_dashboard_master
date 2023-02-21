import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation, ElementRef } from '@angular/core';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject, BehaviorSubject, merge } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { NotificationsService } from 'app/main/notifications/notifications.service';
import { NotificationsComponent } from 'app/main/notifications/notifications.component';
import { NotificationFormDialogComponent } from 'app/main/notifications/notification-form/notification-form.component';

import { HLBaseUserModel } from 'app/model/users';
import { HLNotificationModel } from 'app/model/notifications';

@Component({
    selector     : 'notification-list',
    templateUrl  : './notification-list.component.html',
    styleUrls    : ['./notification-list.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class NotificationListComponent implements OnInit, OnDestroy
{
    @ViewChild(MatPaginator)
    paginator: MatPaginator;

    @ViewChild(MatSort)
    sort: MatSort;

    @ViewChild('dialogContent')    
    dialogContent: TemplateRef<any>;

    notifications: HLNotificationModel[];
    users: HLBaseUserModel[];
    dataSource: FilesDataSource | null;
    displayedColumns = ['checkbox', 'receiverId', 'message', 'creator', 'createdAt', 'detailAction']; /* 'isRead',  */
    // selectedNotifications: any[];
    checkboxes: {};
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    

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
        private _matDialog: MatDialog,
        private _notificationsComponent: NotificationsComponent,
        private _matSnackBar: MatSnackBar
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
        this.dataSource = new FilesDataSource(this._notificationsService, this.paginator, this.sort);

        this._notificationsService.onNotificationsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(notifications => {
                this.notifications = notifications;

                this.checkboxes = {};
                notifications.map(notification => {
                    this.checkboxes[notification.uid] = false;
                });
            });

        this._notificationsService.onSelectedNotificationsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedNotifications => {                
                for ( const uid in this.checkboxes )
                {
                    if ( !this.checkboxes.hasOwnProperty(uid) )
                    {
                        continue;
                    }

                    this.checkboxes[uid] = selectedNotifications.includes(uid);
                }
                // this.selectedNotifications = selectedNotifications;
            });

        this._notificationsService.onUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
            });

        // subscribe from search text control of notifications component
        this._notificationsComponent.onSearchTextChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((searchText) => {                
                console.log('Input search text!');   
                if ( !this.dataSource )
                {
                    return;
                }                
                // navigate first page
                if ( searchText.length > 1) {
                    this.paginator.pageIndex = 0;
                }
                // filter notification
                this.dataSource.filter = searchText;    

                // set filtered data to Service
                this._notificationsService.setFilteredNotifications(this.dataSource.filteredData); 
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

    /* changedPage(pageEvent: PageEvent): void {
        console.log('Current Page', pageEvent.pageIndex);        
        // console.log(this._notificationsService.pageInformation);
    } */

    /**
     * View notification
     *
     * @param notification
     */

    viewNotification(notification): void
    {
        this.dialogRef = this._matDialog.open(NotificationFormDialogComponent, {
            panelClass: 'notification-form-dialog',
            data      : {
                notification: notification,
                users: this.users,
                action : 'view'
            }
        });
    }
    /**
     * Edit notification
     *
     * @param notification
     */
    editNotification(notification): void
    {
        this.dialogRef = this._matDialog.open(NotificationFormDialogComponent, {
            panelClass: 'notification-form-dialog',
            data      : {
                notification: notification,
                users: this.users,
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

                        this._notificationsService.updateNotification(formData.getRawValue())
                        .then(() => {
                            // Show the success message
                            this._matSnackBar.open('Notification data saved successfully', 'OK', {
                                verticalPosition: 'bottom',
                                duration        : 2500
                            });
                        });

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteNotification(notification);

                        break;
                }
            });
    }

    /**
     * Delete Notification
     */
    deleteNotification(notification): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._notificationsService.deleteNotification(notification);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * On selected change when click check box
     *
     * @param notificationId
     */
    onSelectedChange(notificationId): void
    {
        this._notificationsService.toggleSelectedNotification(notificationId);
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
     * @param {NotificationService} _NotificationService
     * @param {MatPaginator} _matPaginator
     * @param {MatSort} _matSort
     */
    constructor(
        private _notificationsService: NotificationsService,
        private _matPaginator: MatPaginator,
        private _matSort: MatSort
    )
    {
        super();

        this.filteredData = this._notificationsService.notifications;
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
            this._notificationsService.onNotificationsChanged,
            this._matPaginator.page,
            this._filterChange,
            this._matSort.sortChange
        ];

        return merge(...displayDataChanges).pipe(map(() => {

                let data = this._notificationsService.notifications.slice();

                data = this.filterData(data);

                this.filteredData = [...data];

                data = this.sortData(data);

                // Grab the page's slice of data.
                const startIndex = this._matPaginator.pageIndex * this._matPaginator.pageSize;       
                const curPageNotifications = data.splice(startIndex, this._matPaginator.pageSize);

                // set filtered notification to Service
                this._notificationsService.setCurPageNotifications(curPageNotifications);        
                
                return curPageNotifications;
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
                /* case 'uid':
                    [propertyA, propertyB] = [a.uid, b.uid];
                    break; */
                case 'receiverId':
                    [propertyA, propertyB] = [a.receiverId, b.receiverId];
                    break;
                case 'message':
                    [propertyA, propertyB] = [a.message, b.message];
                    break;
                case 'isRead':
                    [propertyA, propertyB] = [a.isRead, b.isRead];
                    break;
                case 'creator':
                    [propertyA, propertyB] = [a.creator.name, b.creator.name];
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
