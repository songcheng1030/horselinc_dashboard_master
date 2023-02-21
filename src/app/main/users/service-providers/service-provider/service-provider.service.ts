import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { Router } from '@angular/router';
import { HLUserModel, HLBaseUserModel } from 'app/model/users';
import { COLLECTION_USERS } from 'app/utils/constants';

import { ProviderServicesService } from 'app/main/users/service-providers/provider-services/provider-services.service';

@Injectable()
export class ServiceProviderService implements Resolve<any>
{
    routeParams: any;
    serviceProvider: HLUserModel;
    allUsers: HLBaseUserModel[];
    onServiceProviderChanged: BehaviorSubject<any>;
    onServiceProviderUserListChanged: BehaviorSubject<any>;
    onRegistrationsChanged: BehaviorSubject<any>;
    
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {ManagerProvidersService}  _managerProvidersService
     * @param {ProviderServicesService}  _ProviderServicesService
     */
    constructor(
        private _providerServicesService: ProviderServicesService,
        private db: AngularFirestore,           
        private router: Router  
    ) {
        // Set the defaults
        this.allUsers = [];
        this.onServiceProviderChanged = new BehaviorSubject({});
        this.onServiceProviderUserListChanged = new BehaviorSubject({});
        this.onRegistrationsChanged = new BehaviorSubject({});        
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
            Promise.all([this.getAllUsers()])
                .then(() => {
                    if (this.routeParams.uid) {
                        Promise.all([                                 
                            this.getServiceProvider(this.routeParams.uid)
                        ]).then(
                            () => {
                                resolve();
                            },
                            reject
                        );
                    } else {
                        this.onServiceProviderChanged.next(false);
                        resolve(false);
                    }
                });
            

        });
    }

    /**
     * Get Service Provider
     *
     * @returns {Promise<any>}
     */
    getServiceProvider(userId): Promise<any> {
        
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_USERS).doc(userId).get();
            docRef.subscribe((doc) => {
                let user;
                user = {
                    ...doc.data()
                };
                if (!doc.data().serviceProvider) {
                    console.log('Error: service provider information not exists: => ' + doc.data().email);
                    reject();
                    return;
                }
                this.serviceProvider = new HLUserModel(doc.id, user);
                this.onServiceProviderChanged.next(this.serviceProvider);                            
                
                this.setUserIdForProviderAndApprover(doc.id);
                resolve(this.serviceProvider);
            }, reject);
        });
    }

    setUserIdForProviderAndApprover(userId): void {
        // set user id for ProviderService.
        this._providerServicesService.userId = userId;
        console.log('set user id');
    }

    /**
     * Update service provider
     *
     * @param userForm
     * @returns {Promise<any>}
     */
    updateServiceProvider(userForm): Promise<any> {
        const newServiceProvider = {            
            uid: userForm.uid,
            email: userForm.email,
            platform: userForm.platform,
            status: userForm.status,
            token: userForm.token,            
            type: userForm.type,    
            // createdAt: Date.now(),
            serviceProvider: {
                uid: userForm.uid,
                name: userForm.name,
                avatarUrl: userForm.avatarUrl || '',
                phone: userForm.phone,
                location: userForm.location
                // createdAt : Date.now()
            }
        };
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_USERS).doc(newServiceProvider.uid);
            docRef.update(newServiceProvider)
            .then(() =>  {
                console.log('Document successfully updated!');
                this.serviceProvider = new HLUserModel(newServiceProvider.uid, newServiceProvider);                
                resolve(this.serviceProvider);
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    /**
     * Create Service Provider
     *
     * @param userForm
     * @returns {Promise<any>}
     */
    createServiceProvider(userForm): Promise<any> {           
        const newServiceProvider = {            
            // uid: userForm.uid,
            email: userForm.email,
            platform: userForm.platform,
            status: userForm.status,
            token: userForm.token,            
            type: userForm.type,    
            createdAt: Date.now(),
            serviceProvider: {
                name: userForm.name,
                avatarUrl: userForm.avatarUrl || '',
                phone: userForm.phone,
                location: userForm.location,    
                createdAt : Date.now()
            }
        };
        console.log('new service provider', newServiceProvider);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS);
            collectionRef
                .add(newServiceProvider)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    this.serviceProvider = new HLUserModel(docRef.id, newServiceProvider); 
                    resolve(this.serviceProvider);
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete service provider
     *
     * @param user
     */
    deleteServiceProvider(user): Promise<any>
    {
        console.log(user);
        return new Promise((resolve, reject) => {
            // console.log(user);
            this.db.collection(COLLECTION_USERS)
                .doc(user.uid)
                .delete()
                .then(() => {
                    console.log('Document successfully deleted!');                
                    resolve();
            }).catch(error => {
                console.error('Error removing document: ', error);
                reject();
            });
        });
    }

    /**
     * Get all user list (users) // current get only service providers
     *
     * @returns {Promise<any>}
     */
    getAllUsers(): Promise<any>
    {
        if (this.allUsers.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                // console.log('users collection', userList);                
                // get all user information for combo box
                userList.forEach(doc => {
                    /* let user: any;
                    if ( doc.data().type === HLUserType.manager && doc.data().serviceProvider ) {
                        user = {
                            userId: doc.data().uid,
                            name: doc.data().serviceProvider.name
                        };                         
                        
                    } else if (doc.data().type  === HLUserType.provider  && doc.data().serviceProvider ) {
                        user = {
                            userId: doc.data().uid,
                            name: doc.data().serviceProvider.name
                        };      
                    } */
                    let user: any;
                    if ( doc.data().serviceProvider ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().serviceProvider.name,
                                avatarUrl: doc.data().serviceProvider.avatarUrl,
                                phone: doc.data().serviceProvider.phone,
                                location: doc.data().serviceProvider.location
                        };                         
                        this.allUsers.push(new HLBaseUserModel(user));
                    }
                    
                });               
                // console.log(this.allUsers);
                this.onServiceProviderUserListChanged.next(this.allUsers);
                resolve(this.allUsers);
            }, reject);
        });
    }

    
}
