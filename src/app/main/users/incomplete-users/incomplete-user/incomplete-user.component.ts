import { AngularFirestore } from '@angular/fire/firestore';
import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Location } from '@angular/common';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Subject, ReplaySubject, Observable } from 'rxjs';
import { takeUntil, map, finalize } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { HLUserModel } from 'app/model/users';
import { IncompleteUserListService } from 'app/main/users/incomplete-users/incomplete-user-list/incomplete-user-list.service';
import { IncompleteUserService } from 'app/main/users/incomplete-users/incomplete-user/incomplete-user.service';
import { Router } from '@angular/router';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { FuseUtils } from '@fuse/utils';
import { AngularFireStorage } from '@angular/fire/storage';

@Component({
    selector     : 'incomplete-user',
    templateUrl  : './incomplete-user.component.html',
    styleUrls    : ['./incomplete-user.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class IncompleteUserComponent implements OnInit, OnDestroy
{
    user: HLUserModel;    // incomplete users
    userForm: FormGroup;
    pageType: string;

    // Private
    private _unsubscribeAll: Subject<any>;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    /**
     * Constructor
     *
     * @param {IncompleteUserService} _incompleteUserService
     * @param {FormBuilder} _formBuilder
     * @param {Location} _location
     * @param {MatSnackBar} _matSnackBar     
     */
    constructor(
        private _incompleteUserService: IncompleteUserService,
        private _formBuilder: FormBuilder,
        private _location: Location,
        private _matSnackBar: MatSnackBar,        
        private _matDialog: MatDialog,
        private router: Router,
        private afStorage: AngularFireStorage  
        
    )
    {
        // Set the default
        this.user = new HLUserModel('', {});

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
        
        // Subscribe to update incompleteUser on changes
        this._incompleteUserService.onIncompleteUserChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                if ( user )
                {
                    this.user = user;
                    this.pageType = 'edit';     
                }
                else
                {
                    this.pageType = 'new';                    
                    this.user = new HLUserModel('', {});
                }                
                this.userForm = this.createIncompleteUserForm();
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
     * Create user form
     *
     * @returns {FormGroup}
     */
    createIncompleteUserForm(): FormGroup
    {
        return this._formBuilder.group({
            uid                 : [this.user.uid],
            email               : [this.user.email],                        
            platform            : [this.user.platform],
            status              : [this.user.status],
            token               : [this.user.token],         
            createdAt           : [this.user.createdAt]
        });
    }

    /**
     * Save user
     */
    saveIncompleteUser(): void
    {
        const data = this.userForm.getRawValue();        
        this._incompleteUserService.updateIncompleteUser(data)
            .then((user) => {
                this._incompleteUserService.onIncompleteUserChanged.next(user);
                // Show the success message
                this._matSnackBar.open('User saved successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });
            });
    }

    /**
     * Add user
     */
    addIncompleteUser(): void
    {
        const data = this.userForm.getRawValue();               
        this._incompleteUserService.createIncompleteUser(data)
            .then((user) => {
                // Show the success message
                this._matSnackBar.open('User added successfully', 'OK', {
                    verticalPosition: 'bottom',
                    duration        : 2500
                });                
                this._incompleteUserService.onIncompleteUserChanged.next(user);
            });
    }
    
    /**
     * Delete user
     */
    deleteIncompleteUser(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
          disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {
                this._incompleteUserService.deleteIncompleteUser(this.user)
                  .then(() => {
                    // Show the success message
                    this._matSnackBar.open('User data deleted successfully', 'OK', {
                      verticalPosition: 'bottom',
                      duration        : 2500
                    });   
                    this._incompleteUserService.onIncompleteUserChanged.next(null);
                    this.router.navigate(['/users/incomplete-users/list']);  
                  });
            }
            this.confirmDialogRef = null;
        });
    }

    /**
     * navigation to previous page.
     */
    returnPreviousPage(): void
    {
        this._location.back();
    }
}
