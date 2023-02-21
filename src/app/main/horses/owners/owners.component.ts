import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { OwnersService } from 'app/main/horses/owners/owners.service';
import { OwnerFormDialogComponent } from 'app/main/horses/owners/owner-form/owner-form.component';

@Component({
    selector     : 'owners',
    templateUrl  : './owners.component.html',
    styleUrls    : ['./owners.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class OwnersComponent implements OnInit, OnDestroy
{
    @ViewChild('dialogContent')
    dialogContent: TemplateRef<any>;

    owners: any;
    user: any;    
    dataSource: FilesDataSource | null;
    displayedColumns = ['name', 'percentage', 'edit-buttons', 'delete-buttons'];    
    dialogRef: any;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {OwnersService} _ownersService
     * @param {MatDialog} _matDialog
     */
    constructor(        
        private _ownersService: OwnersService,
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
        this.owners = [];
        // if horse and owner data exists.
        // if (this._ownersService.horseId != null && this._ownersService.ownerIds.length > 0){
        this._ownersService.getOwners();
        this.dataSource = new FilesDataSource(this._ownersService);
        this._ownersService.onOwnersChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(owners => {                
                this.owners = owners;
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
     * Edit Owner
     *
     * @param owner
     */
    editOwner(owner): void
    {
        this.dialogRef = this._matDialog.open(OwnerFormDialogComponent, {
            panelClass: 'owner-form-dialog',
            data      : {
                owner: owner,
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
                        this._ownersService.updateOwner(formData.getRawValue());

                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteOwner(owner);

                        break;
                }
            });
    }

    /**
     * Delete Owner
     */
    deleteOwner(owner): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                //console.log(owner);
                this._ownersService.deleteOwner(owner);
            }
            this.confirmDialogRef = null;
        });

    }

    /**
     * New Owner
     */
    newOwner(): void
    {
        this.dialogRef = this._matDialog.open(OwnerFormDialogComponent, {
            panelClass: 'owner-form-dialog',
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
                this._ownersService.createOwner(form.getRawValue());
            });
    }

    
}

export class FilesDataSource extends DataSource<any>
{
    /**
     * Constructor
     *
     * @param {OwnersService} _ownersService
     */
    constructor(
        private _ownersService: OwnersService
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
        return this._ownersService.onOwnersChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
