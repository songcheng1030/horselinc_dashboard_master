import { InvoiceRequestsService } from './../invoice-requests/invoice-requests.service';

import { HLBaseUserModel } from './../../../model/users';
import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import * as moment from 'moment';
import { Router } from '@angular/router';
import { HLInvoiceModel } from 'app/model/invoices';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_INVOICES , COLLECTION_USERS} from 'app/utils/constants';
import { InvoicePaymentsService } from '../invoice-payments/invoice-payments.service';

@Injectable()
export class InvoiceService implements Resolve<any>
{
    routeParams: any;
    invoice: HLInvoiceModel;    
    onInvoiceChanged: BehaviorSubject<any>;    
    allUsers: any[] = []; // array list for listener users
    
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {InvoicePaymentsService}  _invoicePaymentService     
     */
    constructor(        
        private db: AngularFirestore,           
        private _invoicePaymentService: InvoicePaymentsService,           
        private _invoiceRequestService: InvoiceRequestsService,           
        private router: Router  
    ) {
        // Set the defaults        
        this.onInvoiceChanged = new BehaviorSubject({});             
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        this.routeParams = route.params;

        return new Promise((resolve, reject) => {
            Promise.all([                
                this.getUserList()
            ])
            .then(() => {
                if (this.routeParams.uid) {
                    Promise.all([                                 
                        this.getInvoice(this.routeParams.uid)
                    ]).then(
                        () => {
                            resolve();
                        },
                        reject
                    );
                } else {                    
                    this.onInvoiceChanged.next(false);
                    resolve(false);
                }
            });
        });
    }

    /**
     * Get invoice
     *
     * @returns {Promise<any>}
     */
    getInvoice(invoiceId): Promise<any> {
        
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_INVOICES).doc(invoiceId).get();
            docRef.subscribe((doc) => {
                
                let invoice: any;            
                invoice = {
                    ...doc.data()
                };

                this.invoice = new HLInvoiceModel(doc.id, invoice);
                // console.log('get invoice');
                // console.log(this.invoice);
                this.onInvoiceChanged.next(this.invoice);                            
                
                this.setInvoiceId(doc.id , this.invoice.requestIds);
                resolve(this.invoice);
            }, reject);
        });
    }

    setInvoiceId(invoiceId, requestIds): void {
        // set invoice id for payment
        this._invoicePaymentService.invoiceId = invoiceId;
        this._invoicePaymentService.allUsers = this.allUsers;
        // set invoice id for request
        this._invoiceRequestService.invoiceId = invoiceId;
        this._invoiceRequestService.requestIds = requestIds;
        console.log('set invoice id');
    }

    /**
     * Update invoice
     *
     * @param invoiceForm
     * @returns {Promise<any>}
     */
    updateInvoice(invoiceForm): Promise<any> {
        const newInvoice = {            
            uid: invoiceForm.uid,
            name:   invoiceForm.name,
            tip:    invoiceForm.tip,   
            status: invoiceForm.status,
            paidAt: new Date(invoiceForm.paidAt).getTime(),
            updatedAt: Date.now(),
            // createdAt : Date.now()
        };
        console.log(newInvoice);
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_INVOICES).doc(newInvoice.uid);
            docRef.update(newInvoice)
            .then(() =>  {
                console.log('Invoice successfully updated!');
                this.invoice = new HLInvoiceModel(newInvoice.uid, newInvoice);
                resolve(this.invoice);
            }).catch( error => {
                console.error('Error updating invoice: ', error);
                reject();
            });
        });
    }

    /**
     * Create invoice
     *
     * @param invoiceForm
     * @returns {Promise<any>}
     */
    createInvoice(invoiceForm): Promise<any> {        
        const newInvoice = {                    
            // uid: invoiceForm.uid,
            name:   invoiceForm.name,
            tip:    invoiceForm.tip,   
            status: invoiceForm.status,
            paidAt: new Date(invoiceForm.paidAt).getTime(),
            updatedAt: Date.now(),
            createdAt : Date.now()
        };
        console.log(newInvoice);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_INVOICES);
            collectionRef
                .add(newInvoice)
                .then(docRef => {
                    console.log('Invoice written with ID: ', docRef.id);
                    // added uid field
                    const invRef = this.db.collection(COLLECTION_INVOICES).doc(docRef.id);
                    invRef.update({uid: docRef.id})
                    .then(() =>  {
                        this.invoice = new HLInvoiceModel(docRef.id, newInvoice); 
                        resolve(this.invoice);
                    });
                })
                .catch( error => {
                    console.error('Error adding invoice: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete invoice
     *
     * @param invoice
     */
    deleteInvoice(invoice): Promise<any>
    {
        return new Promise((resolve, reject) => {
            // console.log(invoice);
            this.db.collection(COLLECTION_INVOICES)
                .doc(invoice.uid)
                .delete()
                .then(() => {
                    console.log('Invoice successfully deleted!');                
                    resolve();
            }).catch(error => {
                console.error('Error removing invoice: ', error);
                reject();
            });
        });
    }

    
    /**
    * Get request list data
    *
    * @returns {Promise<any>}
    */
    getRequestList(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).get();
            collectionRef.subscribe((snapshots) => {
                /* const serviceShowList = snapshots;
                // get service show information                
                serviceShowList.forEach(doc => {
                    let serviceShow: any;
                    if ( doc.data() && doc.data().name !== '' ) {
                        serviceShow = {
                                uid: doc.data().uid,
                                name: doc.data().name,                                
                                createdAt: doc.data().createdAt,
                        };                         
                        this.serviceShows.push(new HLServiceShowModel(serviceShow.uid, serviceShow));
                    }
                });               
                // console.log(this.serviceShows);    
                this.onServiceShowListChanged.next(this.serviceShows);               
                resolve(this.serviceShows); */
                resolve();
            }, reject);
        });
    }

    /**
     * Get user list data
     *
     * @returns {Promise<any>}
     */
    getUserList(): Promise<any>
    {
        this.allUsers = [];
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                // console.log('users collection', userList);                
                // get receiver user information                
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().horseManager ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().horseManager.name,
                                avatarUrl: doc.data().horseManager.avatarUrl,
                                phone: doc.data().horseManager.phone,
                                location: doc.data().horseManager.location,
                                createdAt: doc.data().createdAt,
                        }; 
                    }  else if (doc.data().serviceProvider) {
                        user = {
                            userId: doc.data().uid,
                            name: doc.data().serviceProvider.name,
                            avatarUrl: doc.data().serviceProvider.avatarUrl,
                            phone: doc.data().serviceProvider.phone,
                            location: doc.data().serviceProvider.location,
                            createdAt: doc.data().createdAt,
                        }; 
                    }
                    this.allUsers.push(new HLBaseUserModel(user));
                    
                });               
                // console.log(this.allUsers);
                // this.onUserListChanged.next(this.allUsers);
                resolve(this.allUsers);
            }, reject);
        });
    }

    
}
