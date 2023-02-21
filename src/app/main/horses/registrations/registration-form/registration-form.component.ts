import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { HLHorseRegistrationModel } from 'app/model/horses';

@Component({
    selector     : 'registration-form-dialog',
    templateUrl  : './registration-form.component.html',
    styleUrls    : ['./registration-form.component.scss'],
    encapsulation: ViewEncapsulation.None
})

export class RegistrationFormDialogComponent
{
    action: string;
    registration: HLHorseRegistrationModel;
    registrationForm: FormGroup;
    dialogTitle: string;

    /**
     * Constructor
     *
     * @param {MatDialogRef<RegistrationFormDialogComponent>} matDialogRef
     * @param _data
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        public matDialogRef: MatDialogRef<RegistrationFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any,
        private _formBuilder: FormBuilder
    )
    {
        // Set the defaults
        this.action = _data.action;

        if ( this.action === 'edit' )
        {
            this.dialogTitle = 'Edit Registration';            
            this.registration = _data.registration;
        }
        else
        {
            this.dialogTitle = 'New Registration';
            this.registration = new HLHorseRegistrationModel();
        }

        this.registrationForm = this.createRegistrationForm();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Create registration form
     *
     * @returns {FormGroup}
     */
    createRegistrationForm(): FormGroup
    {
        return this._formBuilder.group({
            index      : [this.registration.index],
            name      : [this.registration.name],
            number    : [this.registration.number]
        });
    }
}
