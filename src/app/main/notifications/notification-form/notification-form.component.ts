import { HLBaseUserModel } from 'app/model/users';
import { Component, Inject, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelect } from '@angular/material';

import { HLNotificationModel } from 'app/model/notifications';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

@Component({
    selector     : 'notification-form-dialog',
    templateUrl  : './notification-form.component.html',
    styleUrls    : ['./notification-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class NotificationFormDialogComponent implements OnDestroy
{
     /** control for the MatSelect filter keyword */
    public receiverFilterCtrl: FormControl = new FormControl();
    public creatorFilterCtrl: FormControl = new FormControl();
    
    /** Subject that emits when the component has been destroyed. */
    private _onDestroy = new Subject<void>();
    
    /** list of users filtered by search keyword */
    public filteredReceivers: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);
    public filteredCreators: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);


    action: string;
    notification: HLNotificationModel;
    notificationForm: FormGroup;
    dialogTitle: string;
    users: HLBaseUserModel[];
    /**
     * Constructor
     *
     * @param {MatDialogRef<NotificationFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<NotificationFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder
    )
    {
        // Set the defaults
        this.action = _data.action;
        this.notification = _data.notification;
        this.users = _data.users;

        if ( this.action === 'view') {
            this.dialogTitle = 'View Notification';
        } 
        else if ( this.action === 'edit' ) 
        {
            this.dialogTitle = 'Edit Notification';            
        }
        else
        {
            this.dialogTitle = 'New Notification';
            this.notification = new HLNotificationModel('', {});
        }

        // load the initial user list
        this.filteredReceivers.next(this.users.slice());
        this.filteredCreators.next(this.users.slice());
        
        // listen for receiver select field value changes
        this.receiverFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterReceivers();
        });
        this.creatorFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterCreators();
        });
        
        this.notificationForm = this.createNotificationForm();
    }
    // instant search of receiver user combo box
    filterReceivers(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.receiverFilterCtrl.value;
        if (!search) {
          this.filteredReceivers.next(this.users.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the users
        this.filteredReceivers.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
    }

    // instant search of creator user combo box
    filterCreators(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.creatorFilterCtrl.value;
        if (!search) {
          this.filteredCreators.next(this.users.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the creator users
        this.filteredCreators.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    ngOnDestroy(): void {
        this._onDestroy.next();
        this._onDestroy.complete();
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create notification form
     *
     * @returns {FormGroup}
     */
    createNotificationForm(): FormGroup
    {
        return this._formBuilder.group({
            uid:        [this.notification.uid],
            receiverId: [this.notification.receiverId],
            message:    [this.notification.message],
            isRead:     [this.notification.isRead.toString()],
            creatorId:  [this.notification.creator.userId],
            createdAt:  [this.notification.createdAt],
            updatedAt:  [this.notification.updatedAt]
        });
    }

    
}
