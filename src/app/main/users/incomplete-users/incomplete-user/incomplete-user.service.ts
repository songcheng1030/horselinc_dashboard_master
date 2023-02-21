import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { Router } from '@angular/router';
import { HLUserModel } from 'app/model/users';
import { COLLECTION_USERS } from 'app/utils/constants';

@Injectable()
export class IncompleteUserService implements Resolve<any>
{
    routeParams: any;
    incompleteUser: HLUserModel;
    onIncompleteUserChanged: BehaviorSubject<any>;
    onIncompleteUserUserListChanged: BehaviorSubject<any>;
    onRegistrationsChanged: BehaviorSubject<any>;
    
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private db: AngularFirestore,           
        private router: Router  
    ) {
        // Set the defaults
        this.onIncompleteUserChanged = new BehaviorSubject({});
        this.onIncompleteUserUserListChanged = new BehaviorSubject({});
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
            if (this.routeParams.uid) {
                Promise.all([                                 
                    this.getIncompleteUser(this.routeParams.uid)
                ]).then(
                    () => {
                        resolve();
                    },
                    reject
                );
            } else {
                this.onIncompleteUserChanged.next(false);
                resolve(false);
            }
        });
    }

    /**
     * Get User
     *
     * @returns {Promise<any>}
     */
    getIncompleteUser(userId): Promise<any> {
        
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_USERS).doc(userId).get();
            docRef.subscribe((doc) => {
                let user;
                user = {
                    ...doc.data()
                };                
                this.incompleteUser = new HLUserModel(doc.id, user);
                this.onIncompleteUserChanged.next(this.incompleteUser);                            
                resolve(this.incompleteUser);
            }, reject);
        });
    }
    
    /**
     * Update incomplete user
     *
     * @param userForm
     * @returns {Promise<any>}
     */
    updateIncompleteUser(userForm): Promise<any> {
        const newIncompleteUser = {            
            uid: userForm.uid,
            email: userForm.email,
            platform: userForm.platform,
            status: userForm.status,
            token: userForm.token
            // createdAt: Date.now(),
        };
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_USERS).doc(newIncompleteUser.uid);
            docRef.update(newIncompleteUser)
            .then(() =>  {
                console.log('Document successfully updated!');
                this.incompleteUser = new HLUserModel(newIncompleteUser.uid, newIncompleteUser);                
                resolve(this.incompleteUser);
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    /**
     * Create User
     *
     * @param userForm
     * @returns {Promise<any>}
     */
    createIncompleteUser(userForm): Promise<any> {           
        const newIncompleteUser = {            
            // uid: userForm.uid,
            email: userForm.email,
            platform: userForm.platform,
            status: userForm.status,
            token: userForm.token,  
            createdAt: Date.now()
        };
        console.log('new incomplete user', newIncompleteUser);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS);
            collectionRef
                .add(newIncompleteUser)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    this.incompleteUser = new HLUserModel(docRef.id, newIncompleteUser); 
                    resolve(this.incompleteUser);
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete incomplete user
     *
     * @param user
     */
    deleteIncompleteUser(user): Promise<any>
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
    
}
