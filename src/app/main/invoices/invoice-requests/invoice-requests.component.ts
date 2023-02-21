import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatPaginator, MatSort } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { fuseAnimations } from '@fuse/animations';
import { FuseUtils } from '@fuse/utils';

import { HLServiceRequestModel } from 'app/model/service-requests';

import { InvoiceRequestsService } from 'app/main/invoices/invoice-requests/invoice-requests.service';
import { takeUntil } from 'rxjs/internal/operators';
import { AuthService } from 'app/main/auth/auth.service';

@Component({
    selector     : 'invoice-requests',
    templateUrl  : './invoice-requests.component.html',
    styleUrls    : ['./invoice-requests.component.scss'],
    animations   : fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class InvoiceRequestsComponent implements OnInit
{
    dataSource: FilesDataSource | null;
    displayedColumns = ['requestDate', 'competitionClass', 'horse', 'show', 'status', 'serviceProvider', 'assigner', 'creator', 'createdAt', 'detailAction']; /* 'isCustomRequest', */

    invoiceRequests: HLServiceRequestModel[];    
    invoiceId: string;
    // Private
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _invoiceRequestsService: InvoiceRequestsService,
        private _auth: AuthService

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
        this.dataSource = new FilesDataSource(this._invoiceRequestsService);        

        this._invoiceRequestsService.getInvoiceRequestsData();
        this.invoiceId = this._invoiceRequestsService.invoiceId;
        
        this._invoiceRequestsService.onInvoiceRequestsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(invoiceRequests => {
                this.invoiceRequests = invoiceRequests;
                // console.log('===== changed invoice request ==== ' , this.invoiceRequests);
            });
    }
    
}

export class FilesDataSource extends DataSource<any>
{
    private _filterChange = new BehaviorSubject('');
    private _filteredDataChange = new BehaviorSubject('');

    /**
     * Constructor
     *
     * @param {InvoiceRequestsService} _invoiceRequestsService
     */
    constructor(
        private _invoiceRequestsService: InvoiceRequestsService
    )
    {
        super();
    }

    /**
     * Connect function called by the table to retrieve one stream containing the data to render.
     *
     * @returns {Observable<any[]>}
     */
    connect(): Observable<any[]>
    {
        return this._invoiceRequestsService.onInvoiceRequestsChanged;
    }

    /**
     * Disconnect
     */
    disconnect(): void
    {
    }
}
