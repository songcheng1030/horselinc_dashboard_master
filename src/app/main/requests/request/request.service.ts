import { ListenersService } from 'app/main/requests/listeners/listeners.service';
import { HLServiceProviderModel, HLServiceProviderServiceModel } from 'app/model/users';
import { HLHorseModel } from 'app/model/horses';
import { HLServiceShowModel } from 'app/model/service-requests';
import { HLHorseManagerModel } from 'app/model/users';
import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import * as moment from 'moment';
import { Router } from '@angular/router';
import { HLServiceRequestModel } from 'app/model/service-requests';
import { ServicesService } from '../services/services.service';
import { COLLECTION_SERVICE_REQUESTS, COLLECTION_USERS, COLLECTION_SERVICE_SHOWS, COLLECTION_SERVICE_PROVIDER_SERVICES, COLLECTION_HORSES, COLLECTION_INVOICES } from 'app/utils/constants';


@Injectable()
export class RequestService implements Resolve<any>
{
    routeParams: any;
    request: HLServiceRequestModel;
    
    onRequestChanged: BehaviorSubject<any>;
    onInvoiceIdChanged: BehaviorSubject<any>;
    onHorseManagerListChanged: BehaviorSubject<any>;
    onListenerUserListChanged: BehaviorSubject<any>;
    onServiceProviderListChanged: BehaviorSubject<any>;
    onServiceProviderServiceListChanged: BehaviorSubject<any>;
    onServiceShowListChanged: BehaviorSubject<any>;
    onHorseListChanged: BehaviorSubject<any>;

    horseManagers: HLHorseManagerModel[] = [];
    serviceProviders: HLServiceProviderModel[] = [];
    horses: HLHorseModel[] = [];
    serviceShows: HLServiceShowModel[] = [];
    allUsers: any[] = []; // array list for listener users
    serviceProviderServices: HLServiceProviderServiceModel[] = []; // array list for service provider services
    invoiceId: any;
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {RegistrationsService}  _listenersService
     * @param {ServicesService}  _servicesService
     */
    constructor(
        private _listenersService: ListenersService,
        private _servicesService: ServicesService,
        private db: AngularFirestore,           
        private router: Router  
    ) {
        // Set the defaults
        this.horseManagers = [];
        this.onRequestChanged = new BehaviorSubject({});
        this.onInvoiceIdChanged = new BehaviorSubject({});
        this.onHorseManagerListChanged = new BehaviorSubject({});
        this.onServiceProviderListChanged = new BehaviorSubject({});
        this.onServiceProviderServiceListChanged = new BehaviorSubject({});
        this.onListenerUserListChanged = new BehaviorSubject({});
        this.onServiceShowListChanged = new BehaviorSubject({});
        this.onHorseListChanged = new BehaviorSubject({});        
        this.invoiceId = '';
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
                this.getHorseManagerList(),
                this.getServiceProviderList(),
                this.getHorseList(),
                this.getServiceShowList(),
                this.getServiceProviderServiceList()
            ])
            .then(() => {
                if (this.routeParams.uid) {
                    Promise.all([                                 
                        this.getRequest(this.routeParams.uid)
                    ]).then(
                        () => {                            
                            resolve();
                        },
                        reject
                    );
                } else {   // if add service request
                    if (this.routeParams.invoiceId) {
                        console.log('invoiceId: ' + this.routeParams.invoiceId);                    
                        this.invoiceId = this.routeParams.invoiceId;
                        this.onInvoiceIdChanged.next(this.routeParams.invoiceId);
                    }
                    
                    this.onRequestChanged.next(false);
                    resolve(false);
                }
            });
        });
    }

    /**
     * Get request
     *
     * @returns {Promise<any>}
     */
    async getRequest(requestId): Promise<any> {
        // get invoice of selected request
        // initialize invoice id
        this.invoiceId = '';
        this.onInvoiceIdChanged.next(this.invoiceId);
        const queryRef = await this.db.collection(COLLECTION_INVOICES, ref => ref.where('requestIds', 'array-contains', requestId)).get();
        await queryRef.subscribe((snapshot) => {                        
            snapshot.forEach(doc => {       
                console.log('get invoice');
                console.log(doc.data().uid);
                this.invoiceId = doc.data().uid;
                this.onInvoiceIdChanged.next(this.invoiceId);
            });
        });
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(requestId).get();
            docRef.subscribe((doc) => {
                if (!doc.data().creatorId || doc.data().creatorId === undefined) {
                    console.log('creator no' + doc.data().creatorId);
                    return;
                }
                
                let request: any;
                let serviceProvider: any;
                let assigner: any;
                let creator: any;
                let horse: any;
                let serviceShow: any;

                request = {
                    ...doc.data(),
                    invoiceId: this.invoiceId
                };
                // Get Creator
                if (doc.data().creatorId) {
                    if (creator = this.horseManagers.find((u) => u.userId === doc.data().creatorId)) {
                        request = {
                            ...request,
                            creator: creator
                        };                            
                    }                    
                } else {
                    request = {
                        ...request,
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
                
                this.request = new HLServiceRequestModel(doc.id, request);
                // console.log(this.request);
                this.onRequestChanged.next(this.request);                            
                
                this.setRequestId(doc.id);
                resolve(this.request);
            }, reject);
        });
    }

    setRequestId(requestId): void {
        // set request id for listener
        this._listenersService.requestId = requestId;
        this._listenersService.allUsers = this.allUsers;
        // set request id for service
        this._servicesService.requestId = requestId;
        // this._servicesService.allUsers = this.allUsers;
        this._servicesService.serviceProviderServices = this.serviceProviderServices;
        console.log('set request id');
    }

    /**
     * Update request
     *
     * @param requestForm
     * @returns {Promise<any>}
     */
    updateRequest(requestForm): Promise<any> {
        const newRequest = {            
            uid: requestForm.uid,
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass,
            horseBarnName: requestForm.horseBarnName,  
            horseDisplayName: requestForm.horseDisplayName,
            horseId: requestForm.horseId,
            showId: requestForm.showId,            
            instruction: requestForm.instruction,            
            providerNote: requestForm.providerNote,            
            isCustomRequest: requestForm.isCustomRequest === 'true' ? true : false,
            // isDeletedFromInvoice: requestForm.isDeletedFromInvoice === 'true' ? true : false,
            dismissedBy: requestForm.dismissedBy,
            status: requestForm.status,
            creatorId: requestForm.creatorId,
            serviceProviderId: requestForm.serviceProviderId,            
            assignerId: requestForm.assignerId,
            updatedAt: Date.now()
        };
        console.log(newRequest);
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(newRequest.uid);
            docRef.update(newRequest)
            .then(() =>  {
                console.log('Document successfully updated!');
                this.request = new HLServiceRequestModel(newRequest.uid, newRequest);
                // this.onRequestChanged.next(this.request);
                resolve(this.request);
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    /**
     * Create request
     *
     * @param requestForm
     * @returns {Promise<any>}
     */
    createRequest(requestForm): Promise<any> {        
        const newRequest = {            
            // uid: requestForm.uid,
            requestDate: new Date(requestForm.requestDate).getTime(),
            competitionClass: requestForm.competitionClass,
            horseBarnName: requestForm.horseBarnName,   // hidden field
            horseDisplayName: requestForm.horseDisplayName, // hidden field
            horseId: requestForm.horseId,
            showId: requestForm.showId,            
            instruction: requestForm.instruction,            
            providerNote: requestForm.providerNote,            
            isCustomRequest: requestForm.isCustomRequest === 'true' ? true : false,
            // isDeletedFromInvoice: requestForm.isDeletedFromInvoice === 'true' ? true : false,
            dismissedBy: requestForm.dismissedBy,
            status: requestForm.status,
            creatorId: requestForm.creatorId,
            serviceProviderId: requestForm.serviceProviderId,            
            assignerId: requestForm.assignerId,
            updatedAt: Date.now(),
            createdAt : Date.now()
        };
        console.log(newRequest);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_REQUESTS);
            collectionRef
                .add(newRequest)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    this.request = new HLServiceRequestModel(docRef.id, newRequest); 
                    // this.onRequestChanged.next(this.request);
                    
                    // insert request id to invoice 
                    let requestIds = [];
                    const invRef = this.db.collection(COLLECTION_INVOICES).doc(this.invoiceId).get();
                    invRef.subscribe(inv => {
                        if (inv.data().requestIds !== undefined) {
                           requestIds = inv.data().requestIds;
                        }
                        requestIds.push(docRef.id);
                        console.log('changed request ids');
                        console.log(requestIds);
                        // update requestIds
                        const invUpdateRef = this.db.collection(COLLECTION_INVOICES).doc(this.invoiceId);
                            invUpdateRef.update({requestIds: requestIds})
                            .then(() =>  {
                                resolve(this.request);
                            });
                        
                    });
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete request
     *
     * @param request
     */
    deleteRequest(request): Promise<any>
    {
        return new Promise((resolve, reject) => {
            // console.log(request);
            this.db.collection(COLLECTION_SERVICE_REQUESTS)
                .doc(request.uid)
                .delete()
                .then(() => {
                    console.log('Document successfully deleted!');  
                    if ( this.invoiceId !== '' ) {
                        // delete request id in invoice 
                        let requestIds = [];
                        const invRef = this.db.collection(COLLECTION_INVOICES).doc(this.invoiceId).get();
                        invRef.subscribe(inv => {
                            if (inv.data().requestIds !== undefined) {
                            requestIds = inv.data().requestIds;
                            }
                            const idx = requestIds.indexOf(request.uid);
                            if (idx > -1) {
                                requestIds.splice(idx, 1);
                            }                        
                            console.log('changed request ids');
                            console.log(requestIds);
                            // update requestIds
                            const invUpdateRef = this.db.collection(COLLECTION_INVOICES).doc(this.invoiceId);
                                invUpdateRef.update({requestIds: requestIds})
                                .then(() =>  {
                                    resolve(this.request);
                                });
                            });     
                    } else {
                        resolve(this.request);
                    }
                                                 
            }).catch(error => {
                console.error('Error removing document: ', error);
                reject();
            });
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
                       const listenerUser = {
                            userId: doc.data().uid,
                            name: doc.data().horseManager.name,
                            userType: 'Horse Manager'
                       };
                       this.allUsers.push(listenerUser);
                   }
               });               
               
               // console.log(this.horseManagers);    
               this.onHorseManagerListChanged.next(this.horseManagers);  
               this.onListenerUserListChanged.next(this.allUsers);          
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
                        const listenerUser = {
                            userId: doc.data().uid,
                            name: doc.data().serviceProvider.name,
                            userType: 'Service Provider'
                       };
                       this.allUsers.push(listenerUser);
                    }
                });                               
                // console.log(this.serviceProviders);     
                this.onServiceProviderListChanged.next(this.serviceProviders);              
                this.onListenerUserListChanged.next(this.allUsers);              
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
                this.onServiceShowListChanged.next(this.serviceShows);               
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
                                displayName: doc.data().displayName,
                                barnName: doc.data().barnName
                        };                         
                        this.horses.push(new HLHorseModel(horse.uid, horse));
                    }
                });               
                
                // console.log(this.horses);    
                this.onHorseListChanged.next(this.horses);            
                resolve(this.horses);
            }, reject);
        });
    }
    /**
    * Get service provider services list data
    *
    * @returns {Promise<any>}
    */
    getServiceProviderServiceList(): Promise<any>
    {
        if (this.serviceProviderServices.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES).get();
            collectionRef.subscribe((snapshots) => {
                const serviceList = snapshots;
                // get services information                
                serviceList.forEach(doc => {
                    let service: any;
                    if (doc.data().service !== '') {
                        service = {
                            quantity: doc.data().quantity,
                            rate: doc.data().rate,
                            service: doc.data().service,
                            uid: doc.data().uid,
                            userId: doc.data().userId
                        };
                        
                        this.serviceProviderServices.push(new HLServiceProviderServiceModel(service.uid, service));
                    }
                    
                });               
                
                // console.log(this.horses);    
                this.onServiceProviderServiceListChanged.next(this.serviceProviderServices);            
                resolve(this.horses);
            }, reject);
        });
    }

    
}
