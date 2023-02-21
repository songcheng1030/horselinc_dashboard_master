import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLListenerUserModel } from 'app/model/users';
import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';
import { RequestService } from 'app/main/requests/request/request.service';

@Component({
    selector     : 'listener-form-dialog',
    templateUrl  : './listener-form.component.html',
    styleUrls    : ['./listener-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ListenerFormDialogComponent implements OnInit
{
    action: string;
    listener: HLListenerUserModel;
    listenerForm: FormGroup;
    dialogTitle: string;
    allUsers: HLListenerUserModel[];
    pageType: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /** control for the MatSelect filter keyword */        
    public listenerFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */        
    public filteredListeners: ReplaySubject<HLListenerUserModel[]> = new ReplaySubject<HLListenerUserModel[]>(1);
    /**
     * Constructor
     *
     * @param {MatDialogRef<ListenerFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<ListenerFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _requestService: RequestService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Listener';            
            this.listener = _data.listener;
        }
        else
        {
            this.dialogTitle = 'New Listener';
            this.listener = new HLListenerUserModel({});
        }

        this.listenerForm = this.createListenerForm();
    }

        /**
     * On init
     */
    ngOnInit(): void
    {

        this._requestService.onListenerUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.allUsers = users;
                // console.log('Horse Manager list', this.users);
            });
        // load the initial user list
        this.filteredListeners.next(this.allUsers.slice());
        
        // listen for leaser select field value changes        
        this.listenerFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterListeners();
        });
    }

    // instant search of listener user combo box
    filterListeners(): void {
        if (!this.allUsers) {
          return;
        }
        // get the search keyword
        let search = this.listenerFilterCtrl.value;
        if (!search) {
          this.filteredListeners.next(this.allUsers.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the listener users
        this.filteredListeners.next(
          this.allUsers.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create listener form
     *
     * @returns {FormGroup}
     */
    createListenerForm(): FormGroup
    {
        console.log(this.listener);
        return this._formBuilder.group({     
            index      : [this.listener.index],
            userId      : [this.listener.userId]            
        });
    }
}
