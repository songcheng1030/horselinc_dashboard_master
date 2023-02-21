import { HorseService } from 'app/main/horses/horse/horse.service';
import { HorseListService } from 'app/main/horses/horse-list/horse-list.service';
import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLHorseManagerModel } from 'app/model/users';
import { HLHorseOwnerModel } from 'app/model/horses';
import { takeUntil } from 'rxjs/operators';
import { Subject, ReplaySubject } from 'rxjs';

@Component({
    selector     : 'owner-form-dialog',
    templateUrl  : './owner-form.component.html',
    styleUrls    : ['./owner-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class OwnerFormDialogComponent implements OnInit
{
    action: string;
    owner: HLHorseOwnerModel;
    ownerForm: FormGroup;
    dialogTitle: string;
    users: HLHorseManagerModel[];
    pageType: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    /** control for the MatSelect filter keyword */        
    public ownerFilterCtrl: FormControl = new FormControl();
    /** list of users filtered by search keyword */        
    public filteredOwners: ReplaySubject<HLHorseManagerModel[]> = new ReplaySubject<HLHorseManagerModel[]>(1);
    /**
     * Constructor
     *
     * @param {MatDialogRef<OwnerFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<OwnerFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder,
        private _horseService: HorseService
    )
    {
        // Set the defaults
        this.action = _data.action;
        this._unsubscribeAll = new Subject();

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Owner';            
            this.owner = _data.owner;
        }
        else
        {
            this.dialogTitle = 'New Owner';
            this.owner = new HLHorseOwnerModel('', {});
        }

        this.ownerForm = this.createOwnerForm();
    }

        /**
     * On init
     */
    ngOnInit(): void
    {

        this._horseService.onHorseUserListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(users => {
                this.users = users;
                // console.log('Horse Manager list', this.users);
            });
        // load the initial user list
        this.filteredOwners.next(this.users.slice());
        
        // listen for leaser select field value changes        
        this.ownerFilterCtrl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                this.filterOwners();
        });
    }

    // instant search of owner user combo box
    filterOwners(): void {
        if (!this.users) {
          return;
        }
        // get the search keyword
        let search = this.ownerFilterCtrl.value;
        if (!search) {
          this.filteredOwners.next(this.users.slice());
          return;
        } else {
          search = search.toLowerCase();
        }
        // filter the owner users
        this.filteredOwners.next(
          this.users.filter(user => user.name.toLowerCase().indexOf(search) > -1)
        );
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create owner form
     *
     * @returns {FormGroup}
     */
    createOwnerForm(): FormGroup
    {
        console.log(this.owner);
        return this._formBuilder.group({
            uid      : [this.owner.uid],
            ownerId    : new FormControl({value: this.owner.userId !== '' ? this.owner.userId : null, disabled: this.action === 'edit'}),
            horseId    : [this.owner.horseId],
            percentage: [this.owner.percentage]
        });
    }
}
