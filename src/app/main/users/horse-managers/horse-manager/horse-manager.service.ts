import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { Router } from '@angular/router';
import { HLUserModel, HLBaseUserModel } from 'app/model/users';
import { COLLECTION_USERS } from 'app/utils/constants';

import { PaymentApproversService } from 'app/main/users/horse-managers/payment-approvers/payment-approvers.service';
import { ManagerProvidersService } from 'app/main/users/horse-managers/manager-providers/manager-providers.service';

@Injectable()
export class HorseManagerService implements Resolve<any>
{
    routeParams: any;
    horseManager: HLUserModel;
    allUsers: HLBaseUserModel[];
    onHorseManagerChanged: BehaviorSubject<any>;
    onHorseManagerUserListChanged: BehaviorSubject<any>;
    onRegistrationsChanged: BehaviorSubject<any>;
    
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {ManagerProvidersService}  _managerProvidersService
     * @param {PaymentApproversService}  _paymentApproversService
     */
    constructor(
        private _paymentApproversService: PaymentApproversService,
        private _managerProvidersService: ManagerProvidersService,
        private db: AngularFirestore,           
        private router: Router  
    ) {
        // Set the defaults
        this.allUsers = [];
        this.onHorseManagerChanged = new BehaviorSubject({});
        this.onHorseManagerUserListChanged = new BehaviorSubject({});
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
                            this.getHorseManager(this.routeParams.uid)
                        ]).then(
                            () => {
                                resolve();
                            },
                            reject
                        );
                    } else {
                        this.onHorseManagerChanged.next(false);
                        resolve(false);
                    }
                });
            

        });
    }

    /**
     * Get Horse Manager
     *
     * @returns {Promise<any>}
     */
    getHorseManager(userId): Promise<any> {
        
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_USERS).doc(userId).get();
            docRef.subscribe((doc) => {
                let user;
                user = {
                    ...doc.data()
                };
                if (!doc.data().horseManager) {
                    console.log('horse manager information not exists' + doc.data().email);
                    return;
                }
                this.horseManager = new HLUserModel(doc.id, user);
                this.onHorseManagerChanged.next(this.horseManager);                            
                
                this.setUserIdForProviderAndApprover(doc.id);
                resolve(this.horseManager);
            }, reject);
        });
    }

    setUserIdForProviderAndApprover(userId): void {
        // set user id for horse manager provider.
        this._managerProvidersService.userId = userId;
        this._managerProvidersService.allUsers = this.allUsers;
        // set user id for paymentApprover.
        this._paymentApproversService.userId = userId;
        this._paymentApproversService.allUsers = this.allUsers;
        console.log('set horse id');
    }

    /**
     * Update horse manager
     *
     * @param userForm
     * @returns {Promise<any>}
     */
    updateHorseManager(userForm): Promise<any> {
        const newHorseManager = {            
            uid: userForm.uid,
            email: userForm.email,
            platform: userForm.platform,
            status: userForm.status,
            token: userForm.token,            
            type: userForm.type,    
            // createdAt: Date.now(),
            horseManager: {
                uid: userForm.uid,
                name: userForm.name,
                barnName: userForm.barnName,
                avatarUrl: userForm.avatarUrl || '',
                phone: userForm.phone,
                location: userForm.location,    
                // createdAt : Date.now()
            }
        };
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_USERS).doc(newHorseManager.uid);
            docRef.update(newHorseManager)
            .then(() =>  {
                console.log('Document successfully updated!');
                this.horseManager = new HLUserModel(newHorseManager.uid, newHorseManager);                
                resolve(this.horseManager);
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    /**
     * Create Horse Manager
     *
     * @param userForm
     * @returns {Promise<any>}
     */
    createHorseManager(userForm): Promise<any> {           
        const newHorseManager = {            
            // uid: userForm.uid,
            email: userForm.email,
            platform: userForm.platform,
            status: userForm.status,
            token: userForm.token,            
            type: userForm.type,    
            createdAt: Date.now(),
            horseManager: {
                name: userForm.name,
                barnName: userForm.barnName,
                avatarUrl: userForm.avatarUrl || '',
                phone: userForm.phone,
                location: userForm.location,    
                createdAt : Date.now()
            }
        };
        console.log('new horse manager', newHorseManager);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS);
            collectionRef
                .add(newHorseManager)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    this.horseManager = new HLUserModel(docRef.id, newHorseManager); 
                    resolve(this.horseManager);
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete horse manager
     *
     * @param user
     */
    deleteHorseManager(user): Promise<any>
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
     * Get all user list (users) // current get only horse managers
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
                    if ( doc.data().type === HLUserType.manager && doc.data().horseManager ) {
                        user = {
                            userId: doc.data().uid,
                            name: doc.data().horseManager.name
                        };                         
                        
                    } else if (doc.data().type  === HLUserType.provider  && doc.data().serviceProvider ) {
                        user = {
                            userId: doc.data().uid,
                            name: doc.data().serviceProvider.name
                        };      
                    } */
                    let user: any;
                    if ( doc.data().horseManager ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().horseManager.name,
                                avatarUrl: doc.data().horseManager.avatarUrl,
                                phone: doc.data().horseManager.phone,
                                location: doc.data().horseManager.location
                        };                         
                        this.allUsers.push(new HLBaseUserModel(user));
                    }
                    
                });               
                // console.log(this.allUsers);
                this.onHorseManagerUserListChanged.next(this.allUsers);
                resolve(this.allUsers);
            }, reject);
        });
    }

    
}
