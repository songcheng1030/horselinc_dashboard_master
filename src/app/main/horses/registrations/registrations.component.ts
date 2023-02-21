import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { RegistrationsService } from 'app/main/horses/registrations/registrations.service';
import { RegistrationFormDialogComponent } from 'app/main/horses/registrations/registration-form/registration-form.component';

@Component({
    selector     : 'registrations',
    templateUrl  : './registrations.component.html',
    styleUrls    : ['./registrations.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class RegistrationsComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    registrations: any[];
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['name', 'number', 'edit-buttons', 'delete-buttons'];    
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {RegistrationsService} _registrationsService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _registrationsService: RegistrationsService,
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
        this.registrations = [];
        // if Horse data exists.
        // if (this._registrationsService.horseId != null){
            this._registrationsService.getRegistrations();
            this.dataSource = new FilesDataSource(this._registrationsService);
            this._registrationsService.onRegistrationsChanged
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(registrations => {                
                    this.registrations = registrations;
                });
        // }
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
     * Edit Registration
     *
     * @param registration
     */
    editRegistration(registration): void
    {
        this.dialogRef = this._matDialog.open(RegistrationFormDialogComponent, {
            panelClass: 'registration-form-dialog',
            data      : {
                registration: registration,
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
                        this.updateRegistration('edit', formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteRegistration(registration);

                        break;
                }
            });
    }

    /**
     * Delete Registration
     */
    deleteRegistration(registration): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                //  console.log(regIndex);
                this.updateRegistration('delete', registration);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New Registration
     */
    newRegistration(): void
    {
        this.dialogRef = this._matDialog.open(RegistrationFormDialogComponent, {
            panelClass: 'registration-form-dialog',
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
                this.updateRegistration('add', form.getRawValue());
            });
    }

    /**
     * update registration of horse with registration list
     */
    updateRegistration(action, registration): void {
        console.log(this.registrations);
        // update registrations array
        if (action === 'add') {

            if (this.registrations.length > 0) {
                registration.index = this.registrations[this.registrations.length - 1].index + 1;
            } else {
                registration.index = 0;
            }
            this.registrations.push(registration);

        } else if (action === 'edit') {

            this.registrations.forEach((r, i) => {
                if (r.index === registration.index) {
                    console.log('find record');
                    // remove old data and insert new data
                    this.registrations.splice(i, 1, registration);
                }
            });

        } else if (action === 'delete') {

            this.registrations.forEach((r, i) => {
                if (r.index === registration.index) {
                    console.log('find record');
                    // remove old data
                    this.registrations.splice(i, 1);
                }
            });
        }

        this._registrationsService.updateRegistration(this.registrations);
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {RegistrationsService} _registrationsService
     */
    constructor(
        private _registrationsService: RegistrationsService
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
        return this._registrationsService.onRegistrationsChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
