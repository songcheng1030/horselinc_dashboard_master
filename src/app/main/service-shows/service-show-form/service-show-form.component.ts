import { Component, Inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatSelect } from '@angular/material';

import { HLServiceShowModel } from 'app/model/service-requests';
import { Subject } from 'rxjs';

@Component({
    selector     : 'service-show-form-dialog',
    templateUrl  : './service-show-form.component.html',
    styleUrls    : ['./service-show-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class ServiceShowFormDialogComponent implements OnDestroy
{
    
    /** Subject that emits when the component has been destroyed. */
    private _onDestroy = new Subject<void>();
    
    action: string;
    serviceShow: HLServiceShowModel;
    serviceShowForm: FormGroup;
    dialogTitle: string;
    
    /**
     * Constructor
     *
     * @param {MatDialogRef<ServiceShowFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<ServiceShowFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder
    )
    {
        // Set the defaults
        this.action = _data.action;
        this.serviceShow = _data.serviceShow;
     
        if ( this.action === 'view') {
            this.dialogTitle = 'View Service Show';
        } 
        else if ( this.action === 'edit' ) 
        {
            this.dialogTitle = 'Edit Service Show';            
        }
        else
        {
            this.dialogTitle = 'New Service Show';
            this.serviceShow = new HLServiceShowModel('', {});
        }

        this.serviceShowForm = this.createServiceShowForm();
    }
    ngOnDestroy(): void {
        this._onDestroy.next();
        this._onDestroy.complete();
      }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create serviceShow form
     *
     * @returns {FormGroup}
     */
    createServiceShowForm(): FormGroup
    {
        return this._formBuilder.group({
            uid:        [this.serviceShow.uid],
            name:       [this.serviceShow.name],
            createdAt:  [this.serviceShow.createdAt]
        });
    }

    
}
