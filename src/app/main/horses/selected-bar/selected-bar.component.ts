import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { HorseListService } from 'app/main/horses/horse-list/horse-list.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class HorseListSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedHorseList: boolean;
    isIndeterminate: boolean;
    selectedHorseList: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {HorseListService} _horseListService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _horseListService: HorseListService,
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
        this._horseListService.onSelectedHorseListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedHorseList => {
                this.selectedHorseList = selectedHorseList;
                setTimeout(() => {
                    this.hasSelectedHorseList = selectedHorseList.length > 0;
                    this.isIndeterminate = (selectedHorseList.length !== this._horseListService.horseList.length && selectedHorseList.length > 0);
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
        this._horseListService.selectHorseList(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._horseListService.selectHorseList(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._horseListService.deselectHorseList();
    }

    /**
     * Delete selected horse
     */
    deleteSelectedHorseList(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected horse?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._horseListService.deleteSelectedHorseList();
                }
                this.confirmDialogRef = null;
            });
    }
}
