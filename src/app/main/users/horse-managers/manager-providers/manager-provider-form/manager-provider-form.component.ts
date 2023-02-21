import { HorseManagerService } from 'app/main/users/horse-managers/horse-manager/horse-manager.service';
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLHorseManagerProviderModel, HLBaseUserModel } from 'app/model/users';

import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

@Component({
    selector     : 'manager-provider-form-dialog',
    templateUrl  : './manager-provider-form.component.html',
    styleUrls    : ['./manager-provider-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ManagerProviderFormDialogComponent implements OnInit
{
    action: string;
    managerProvider: HLHorseManagerProviderModel;
    managerProviderForm: FormGroup;
    dialogTitle: string;
    allUsers: HLBaseUserModel[];
    pageType: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /** control for the MatSelect filter keyword */        
    public managerProviderFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */        
    public filteredManagerProviders: ReplaySubject<HLBaseUserModel[]> = new ReplaySubject<HLBaseUserModel[]>(1);
    /**
     * Constructor
     *
     * @param {MatDialogRef<ManagerProviderFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<ManagerProviderFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _horseManagerService: HorseManagerService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Horse Manager Provider';            
            this.managerProvider = _data.managerProvider;
        }
        else
        {
            this.dialogTitle = 'New Horse Manager Provider';
            this.managerProvider = new HLHorseManagerProviderModel('', {});
        }

        this.managerProviderForm = this.createManagerProviderForm();
    }

        /**
     * On init
     */
    ngOnInit(): void
    {

        this._horseManagerService.onHorseManagerUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.allUsers = users;
                // console.log('users list', this.users);
            });
        // load the initial user list
        this.filteredManagerProviders.next(this.allUsers.slice());
        
        // listen for leaser select field value changes        
        this.managerProviderFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterManagerProviders();
        });
    }

    // instant search of managerProvider user combo box
    filterManagerProviders(): void {
        if (!this.allUsers) {
          return;
        }
        // get the search keyword
        let search = this.managerProviderFilterCtrl.value;
        if (!search) {
          this.filteredManagerProviders.next(this.allUsers.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the managerProvider users
        this.filteredManagerProviders.next(
          this.allUsers.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create managerProvider form
     *
     * @returns {FormGroup}
     */
    createManagerProviderForm(): FormGroup
    {
        console.log(this.managerProvider);
        return this._formBuilder.group({
            uid      : [this.managerProvider.uid],            
            creatorId    : new FormControl({value: this.managerProvider.creatorId !== '' ? this.managerProvider.creatorId : null, disabled: this.action === 'edit'}),
            serviceType: [this.managerProvider.serviceType]
        });
    }
}
