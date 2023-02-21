import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';

import { COLLECTION_INVOICES, COLLECTION_SERVICE_REQUESTS } from 'app/utils/constants';

import { HLInvoiceModel } from 'app/model/invoices';
import { reject } from 'q';

@Injectable()
export class InvoiceListService implements Resolve<any>
{
    onInvoiceListChanged: BehaviorSubject<any>;    
    onSelectedInvoiceListChanged: BehaviorSubject<any>;

    invoiceList: any[];        
    selectedInvoiceList: string[] = [];
    filteredInvoiceList: any[] = [];
    curPageInvoiceList: any[] = [];

    /**
     * Constructor
     *
     * @param {AngularFirestore} db
     */
    constructor(        
        private db: AngularFirestore,
        private router: Router
    )
    {
        // Set the defaults        
        this.onInvoiceListChanged = new BehaviorSubject([]);        
        this.onSelectedInvoiceListChanged = new BehaviorSubject([]);  
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        return new Promise((resolve, reject) => {

            Promise.all([                
                this.getInvoiceList()
                .catch((err) => {
                    console.log('bad invoice');
                    this.router.navigate(['errors/error-404']);
                })
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    /**
     * Toggle selected invoice by id when click check box of invoice item
     *
     * @param id
     */
    toggleSelectedNotification(uid): void
    {
        // First, check if we already have that invoice as selected...
        if ( this.selectedInvoiceList.length > 0 )
        {
            const index = this.selectedInvoiceList.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedInvoiceList.splice(index, 1);

                // Trigger the next event
                this.onSelectedInvoiceListChanged.next(this.selectedInvoiceList);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedInvoiceList.push(uid);
        // Trigger the next event
        this.onSelectedInvoiceListChanged.next(this.selectedInvoiceList);
    }

    /**
     * Select all invoices
     *
     * @param filterParameter
     * @param filterValue
     */
    selectInvoiceList(allPage?): void
    {
        this.selectedInvoiceList = [];
        if (allPage) {
            // select all filtered invoices
            this.filteredInvoiceList.map( (invoice) => {
                this.selectedInvoiceList.push(invoice.uid);                
            });
        } else {
            this.curPageInvoiceList.map( (invoice) => {
                // select invoices of current page
                this.selectedInvoiceList.push(invoice.uid);
            });
        }
        // console.log(this.selectedInvoiceList);
        // Trigger the next event
        this.onSelectedInvoiceListChanged.next(this.selectedInvoiceList);
    }

    // set filtered all invoiceList data.
    setFilteredInvoiceList(invoiceList): void {
        // console.log('Changed filtered invoiceList');
        this.filteredInvoiceList = invoiceList;
    }

    setCurPageInvoiceList(invoiceList): void {
        // console.log('Changed current page invoiceList');
        this.curPageInvoiceList = invoiceList;        
    }

    /**
     * Deselect invoice list
     */
    deselectInvoiceList(): void
    {
        this.selectedInvoiceList = [];
        // Trigger the next event
        this.onSelectedInvoiceListChanged.next(this.selectedInvoiceList);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Firebase Calls
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get Invoice List
     *
     * @returns {Promise<any>}
     */
    getInvoiceList(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.invoiceList = [];
            const collectionRef = this.db.collection(COLLECTION_INVOICES).get();
            collectionRef.subscribe((snapshots) => {
                const invoiceList = snapshots;
                // console.log('invoice collection', invoiceList);                                
                invoiceList.forEach(doc => {
                    
                    let invoice: any;
                    if (doc.data().requestIds && doc.data().requestIds.length > 0) {
                        // console.log(doc.data());
                        this.getAmountOfInvoice(doc.data().requestIds).then(amount => {                            
                            invoice = {
                                amount: amount,
                                ...doc.data()
                            };  
                            // console.log('push invoice=> total amount : ' + amount);
                            this.invoiceList.push(new HLInvoiceModel(doc.id, invoice));                    
                            this.onInvoiceListChanged.next(this.invoiceList);
                            this.setFilteredInvoiceList(this.invoiceList);
                        });
                    } else {
                        invoice = {
                            amount: 0,
                            ...doc.data()
                        };                         
                        // console.log('push invoice=> total amount : ' + 0); 
                        this.invoiceList.push(new HLInvoiceModel(doc.id, invoice));                    
                        this.onInvoiceListChanged.next(this.invoiceList);
                        this.setFilteredInvoiceList(this.invoiceList);
                    }
                    
                });

                // console.log(this.invoiceList);
                
                resolve(this.invoiceList);
            }, reject);
        });
    }

    /**
     * Return total amount of services
     */
    async getAmountOfInvoice(requestIds): Promise<any>
    {
        let totalAmount = 0;
        return new Promise((resolve, reject) => {       
            const func1 = async () => {
                for (const requestId of requestIds) {
                    totalAmount += await this.getAmountOfRequest(requestId);
                }                
                resolve(totalAmount);
            };
            func1();
        });
    }

    async getAmountOfRequest(requestId): Promise<any> {
        let amount = 0;
        return new Promise(async (resolve, reject) => {     
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(requestId).get();
            await collectionRef.subscribe((request) => {
                if (request.data() && request.data().services) {
                    const services = request.data().services;
                    const calc = async () => {
                        services.forEach(service => {
                            amount += service.quantity * service.rate;                            
                        });
                    };
                    calc();
                }
                resolve(amount);
            }, reject); 
        });
    }

    /**
     * Delete selected invoices
     */
    deleteSelectedInvoiceList(): void
    {
        const promises: any[] = [];

        for ( const invoiceId of this.selectedInvoiceList )
        {
            promises.push(this.db.collection(COLLECTION_INVOICES).doc(invoiceId).delete());
            const invoice = this.invoiceList.find(_invoice => {
                return _invoice.uid === invoiceId;
            });
            const invoiceIndex = this.invoiceList.indexOf(invoice);
            this.invoiceList.splice(invoiceIndex, 1);
        }
        Promise.all(promises);
        this.onInvoiceListChanged.next(this.invoiceList);
        this.deselectInvoiceList();
        console.log('Deleted all!');
    }
}
