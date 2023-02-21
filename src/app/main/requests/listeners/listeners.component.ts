
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { HLListenerUserModel } from 'app/model/users';
import { ListenersService } from 'app/main/requests/listeners/listeners.service';
import { ListenerFormDialogComponent } from 'app/main/requests/listeners/listener-form/listener-form.component';

@Component({
    selector     : 'listeners',
    templateUrl  : './listeners.component.html',
    styleUrls    : ['./listeners.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class ListenersComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    listeners: HLListenerUserModel[];
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['userId', 'name', 'userType'];     /* , 'edit-buttons', 'delete-buttons' */
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ListenersService} _listenersService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _listenersService: ListenersService,
        public _matDialog: MatDialog
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
        this.listeners = [];        
        this._listenersService.getListeners();
        this.dataSource = new FilesDataSource(this._listenersService);
        this._listenersService.onListenersChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(listeners => {                
                this.listeners = listeners;
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
     * Edit Listener
     *
     * @param listener
     */
    editListener(listener): void
    {
        this.dialogRef = this._matDialog.open(ListenerFormDialogComponent, {
            panelClass: 'listener-form-dialog',
            data      : {
                listener: listener,
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
                        this.updateListener('edit', formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteListener(listener.index);

                        break;
                }
            });
    }

    /**
     * Delete Listener
     */
    deleteListener(listenerIndex): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                // console.log(listenerIndex);
                this.updateListener('delete', listenerIndex);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New Listener
     */
    newListener(): void
    {
        this.dialogRef = this._matDialog.open(ListenerFormDialogComponent, {
            panelClass: 'listener-form-dialog',
            data      : {
                action: 'new'
            }
        });

        this.dialogRef.afterClosed()
            .subscribe((form: FormGroup) => {
                if ( !form )
                {
                    return;
                }                
                this.updateListener('add', form.getRawValue());
            });
    }

    /**
     * update listenerUsers of request with listener list
    */
    updateListener(action, listener): void {
        // added userType
        let user;
        if (action !== 'delete') {
            if (user = this._listenersService.allUsers.find((u) => u.userId === listener.userId)) {
                listener.userType = user.userType;     
                listener.user = user;                  
            }        
        }
        console.log(this.listeners);
        // update registrations array
        if (action === 'add') {

            if (this.listeners.length > 0) {
                listener.index = this.listeners[this.listeners.length - 1].index + 1;
            } else {
                listener.index = 0;
            }
            this.listeners.push(listener);

        } else if (action === 'edit') {

            this.listeners.forEach((r, i) => {
                if (r.index === listener.index) {
                    console.log('find record');
                    // remove old data and insert new data
                    this.listeners.splice(i, 1, listener);
                }
            });

        } else if (action === 'delete') {

            this.listeners.splice(listener, 1);

        }

        this._listenersService.updateListener(this.listeners);
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {ListenersService} _listenersService
     */
    constructor(
        private _listenersService: ListenersService
    )
    {
        super();
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        return this._listenersService.onListenersChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
