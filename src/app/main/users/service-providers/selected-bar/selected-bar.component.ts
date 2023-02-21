import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, PageEvent } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';

import { ServiceProviderListService } from 'app/main/users/service-providers/service-provider-list/service-provider-list.service';


@Component({
    selector   : 'selected-bar',
    templateUrl: './selected-bar.component.html',
    styleUrls  : ['./selected-bar.component.scss']
})
export class ServiceProviderListSelectedBarComponent implements OnInit, OnDestroy
{
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    hasSelectedServiceProviderList: boolean;
    isIndeterminate: boolean;
    selectedServiceProviderList: string[];
    
    pageEvent: PageEvent;
    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {ServiceProviderListService} _serviceProviderListService
     * @param {MatDialog} _matDialog
     */
    constructor(
        private _serviceProviderListService: ServiceProviderListService,
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
        this._serviceProviderListService.onSelectedServiceProviderListChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(selectedServiceProviderList => {
                this.selectedServiceProviderList = selectedServiceProviderList;
                setTimeout(() => {
                    this.hasSelectedServiceProviderList = selectedServiceProviderList.length > 0;
                    this.isIndeterminate = (selectedServiceProviderList.length !== this._serviceProviderListService.serviceProviderList.length && selectedServiceProviderList.length > 0);
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
        this._serviceProviderListService.selectServiceProviderList(true);
    }

    /**
     * Select all of current page
     */
    selectPage(): void
    {
        this._serviceProviderListService.selectServiceProviderList(false);
    }

    /**
     * Deselect all
     */
    deselectAll(): void
    {
        this._serviceProviderListService.deselectServiceProviderList();
    }

    /**
     * Delete selected horse
     */
    deleteSelectedServiceProviderList(): void
    {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete all selected horse?';

        this.confirmDialogRef.afterClosed()
            .subscribe(result => {
                if ( result )
                {
                    this._serviceProviderListService.deleteSelectedServiceProviderList();
                }
                this.confirmDialogRef = null;
            });
    }
}
