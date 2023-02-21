import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { HorseManagerListService } from 'app/main/users/horse-managers/horse-manager-list/horse-manager-list.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class HorseManagerListSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedHorseManagerList: boolean;
    isIndeterminate: boolean;
    selectedHorseManagerList: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {HorseManagerListService} _horseManagerListService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _horseManagerListService: HorseManagerListService,
        private _matDialog: MatDialog
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
        // subscribe horse when clicking check box of notification list    
        this._horseManagerListService.onSelectedHorseManagerListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedHorseManagerList => {
                this.selectedHorseManagerList = selectedHorseManagerList;
                setTimeout(() => {
                    this.hasSelectedHorseManagerList = selectedHorseManagerList.length > 0;
                    this.isIndeterminate = (selectedHorseManagerList.length !== this._horseManagerListService.horseManagerList.length && selectedHorseManagerList.length > 0);
                }, 0);
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
     * Select all
     */
    selectAll(): void
    {
        this._horseManagerListService.selectHorseManagerList(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._horseManagerListService.selectHorseManagerList(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._horseManagerListService.deselectHorseManagerList();
    }

    /**
     * Delete selected horse
     */
    deleteSelectedHorseManagerList(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected horse?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._horseManagerListService.deleteSelectedHorseManagerList();
                }
                this.confirmDialogRef = null;
            });
    }
}
