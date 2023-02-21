import { HLHorseModel } from './../../../model/horses';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_USERS, COLLECTION_SERVICE_SHOWS, COLLECTION_HORSES } from 'app/utils/constants';

import { HLServiceRequestModel, HLServiceShowModel } from 'app/model/service-requests';
import { HLHorseManagerModel, HLServiceProviderModel } from 'app/model/users';
import { reject } from 'q';

@Injectable()
export class InvoiceRequestsService
{
    onInvoiceRequestsChanged: BehaviorSubject<any>;    
    onSelectedInvoiceRequestsChanged: BehaviorSubject<any>;

    invoiceRequests: any[];        
    
    horseManagers: HLHorseManagerModel[] = [];
    serviceProviders: HLServiceProviderModel[] = [];
    horses: HLHorseModel[] = [];
    serviceShows: HLServiceShowModel[] = [];
    
    invoiceId: any;
    requestIds: any[];   // request id list of selected invoice
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
        this.onInvoiceRequestsChanged = new BehaviorSubject([]);        
        this.onSelectedInvoiceRequestsChanged = new BehaviorSubject([]);  
        this.invoiceRequests = [];
    }

    
    getInvoiceRequestsData(): Observable<any> | Promise<any> | any
    {
        return new Promise((resolve, reject) => {

            Promise.all([
                this.getHorseManagerList(),
                this.getServiceProviderList(),
                this.getHorseList(),
                this.getServiceShowList(),
                this.getInvoiceRequests()
                .catch((err) => {
                    console.log('bad request');
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

    
    // -----------------------------------------------------------------------------------------------------
    // @ Firebase Calls
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get Request List of selected invoice
     *
     * @returns {Promise<any>}
     */
    getInvoiceRequests(): Promise<any>        
    {
        this.invoiceRequests = [];
        console.log('get service request of invoice');
        return new Promise((resolve, reject) => {
            if ( this.invoiceId !== null && this.invoiceId !== '' && this.requestIds.length > 0) {
                this.requestIds.forEach(requestId => {
                    const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(requestId).get();
                        collectionRef.subscribe((doc) => {  
                            
                            if (!doc.data()) {                                
                                return;
                            }
                            
                            let request: any;
                            let serviceProvider: any;
                            let assigner: any;
                            let creator: any;
                            let horse: any;
                            let serviceShow: any;

                            // Get Creator
                            if (doc.data().creatorId) {
                                if (creator = this.horseManagers.find((u) => u.userId === doc.data().creatorId)) {
                                    request = {
                                        ...doc.data(),
                                        creator: creator
                                    };                            
                                }                        
                            } else {
                                request = {
                                    ...doc.data(),
                                    creator: new HLHorseManagerModel({})
                                };
                            }

                            // Get ServiceProvider
                            if (doc.data().serviceProviderId) {
                                if (serviceProvider = this.serviceProviders.find((u) => u.userId === doc.data().serviceProviderId)) {
                                    request = {
                                        ...request,
                                        serviceProvider: serviceProvider
                                    };                            
                                }                        
                            } else {
                                request = {
                                    ...request,
                                    serviceProvider: new HLServiceProviderModel({})
                                };
                            }

                            // Get Assigner
                            if (doc.data().assignerId) {
                                if (assigner = this.serviceProviders.find((u) => u.userId === doc.data().assignerId)) {
                                    request = {
                                        ...request,
                                        assigner: assigner
                                    };                            
                                }
                            } else {
                                request = {
                                    ...request,
                                    assigner: new HLServiceProviderModel({})
                                };
                            }

                            // Get Horse
                            if (doc.data().horseId) {
                                if (horse = this.horses.find((h) => h.uid === doc.data().horseId)) {
                                    request = {
                                        ...request,
                                        horse: horse
                                    };                            
                                }
                            } else {
                                request = {
                                    ...request,
                                    horse: new HLHorseModel(null, {})
                                };
                            }

                            // Get Service Show
                            if (doc.data().showId) {
                                if (serviceShow = this.serviceShows.find((s) => s.uid === doc.data().showId)) {
                                    request = {
                                        ...request,
                                        show: serviceShow
                                    };                            
                                }
                            } else {
                                request = {
                                    ...request,
                                    show: new HLServiceShowModel(null, {})
                                };
                            }
                            
                            if (request.creatorId) {
                                this.invoiceRequests.push(new HLServiceRequestModel(doc.id, request));                                
                                // console.log(this.invoiceRequests);
                                this.onInvoiceRequestsChanged.next(this.invoiceRequests);                
                                resolve(this.invoiceRequests);
                            }
                        });

                    }, reject);
                
            }else {               
                this.onInvoiceRequestsChanged.next(false);
                resolve(false);
            }
                
        });
        
    }

    /**
     * Get horse manager list data (users)
     *
     * @returns {Promise<any>}
    */
    getHorseManagerList(): Promise<any>
    {
        if (this.horseManagers.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                // console.log('users collection', userList);                
                // get horse manager information                
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().horseManager ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().horseManager.name,
                                avatarUrl: doc.data().horseManager.avatarUrl,
                                phone: doc.data().horseManager.phone,
                                location: doc.data().horseManager.location,
                                barnName: doc.data().horseManager.barnName,
                                percentage: doc.data().horseManager.percentage,
                                createdAt: doc.data().createdAt,
                        };                         
                        this.horseManagers.push(new HLHorseManagerModel(user));
                    }
                });               
                
                // console.log(this.horseManagers);                
                resolve(this.horseManagers);
            }, reject);
        });
    }
     /**
     * Get service provider list data (users)
     *
     * @returns {Promise<any>}
     */
    getServiceProviderList(): Promise<any>
    {
        if (this.serviceProviders.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                // console.log('users collection', userList);                
                // get service provider information                
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().serviceProvider ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().serviceProvider.name,
                                avatarUrl: doc.data().serviceProvider.avatarUrl,
                                phone: doc.data().serviceProvider.phone,
                                location: doc.data().serviceProvider.location,                                
                                createdAt: doc.data().createdAt,
                        };                         
                        this.serviceProviders.push(new HLHorseManagerModel(user));
                    }
                });                               
                // console.log(this.serviceProviders);                
                resolve(this.serviceProviders);
            }, reject);
        });
    }

    /**
     * Get service shows list data
     *
     * @returns {Promise<any>}
    */
    getServiceShowList(): Promise<any>
    {
        if (this.serviceShows.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS).get();
            collectionRef.subscribe((snapshots) => {
                const serviceShowList = snapshots;
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
                resolve(this.serviceShows);
            }, reject);
        });
    }

    /**
     * Get horse list data
     *
     * @returns {Promise<any>}
    */
    getHorseList(): Promise<any>
    {
        if (this.horses.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const queryRef = this.db.collection(COLLECTION_HORSES, ref => ref.where('isDeleted', '==', false)).get();
            queryRef.subscribe((snapshots) => {
                const horseList = snapshots;
                // get service show information                
                horseList.forEach(doc => {
                    let horse: any;
                    if ( doc.data() && doc.data().displayName !== '' ) {
                        horse = {
                                uid: doc.data().uid,
                                displayName: doc.data().displayName
                        };                         
                        this.horses.push(new HLHorseModel(horse.uid, horse));
                    }
                });               
                
                // console.log(this.horses);                
                resolve(this.horses);
            }, reject);
        });
    }
    
}
