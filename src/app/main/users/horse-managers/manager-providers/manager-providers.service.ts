import { MatSnackBar } from '@angular/material';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { HLBaseUserModel, HLHorseManagerProviderModel } from 'app/model/users';
import { COLLECTION_HORSE_MANAGER_PROVIDERS } from 'app/utils/constants';

@Injectable()
export class ManagerProvidersService {
    
    routeParams: any;    
    onManagerProvidersChanged: BehaviorSubject<any>;    
    userId: any; // selected user Id    
    allUsers: HLBaseUserModel[];
    managerProviders: HLHorseManagerProviderModel[];

    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(                
        private db: AngularFirestore,         
        private _matSnackBar: MatSnackBar,   
    ) {
        // Set the defaults
        this.onManagerProvidersChanged = new BehaviorSubject({});
        this.managerProviders = [];
    }


    /**
     * Get ManagerProvider data of selected horse
     * @returns {Promise<any>}
     */
    async getManagerProviders(): Promise<any> {
        console.log('get manager providers');
        this.managerProviders = [];
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS, ref => ref.where('userId', '==', this.userId)).get();
                await queryRef.subscribe((snapshot) => {
                    snapshot.forEach((doc) => {
                        let approver;
                        let creator: any;

                        // Get Creator
                        if (doc.data().creatorId) {
                            if (creator = this.allUsers.find((u) => u.userId === doc.data().creatorId)) {
                                approver = {
                                    ...doc.data(),
                                    creator: creator
                                };                            
                            }
                        } else {
                            approver = {
                                ...doc.data(),
                                creator: new HLBaseUserModel({})
                            };
                        }                        
                        this.managerProviders.push(new HLHorseManagerProviderModel(doc.id, approver));
                    });    
                    // console.log(this.managerProviders);
                    this.onManagerProvidersChanged.next(this.managerProviders);
                    resolve();                    
                }, reject);                
            } else {  // controller by "new" URL;                
                this.onManagerProvidersChanged.next(false);
                resolve(false);
            }
        });

    }

    getHorseManagerProvider(managerProviderForm): any {
        let managerProvider;
        // find managerProvider object from users
        if (managerProvider = this.allUsers.find((u) => u.userId === managerProviderForm.creatorId)) {
            managerProvider = {
                serviceType: managerProviderForm.serviceType,
                userId: this.userId,
                creatorId: managerProviderForm.creatorId,
                name: managerProvider.name,
                location: managerProvider.location,
                avatarUrl: managerProvider.avatarUrl,
                phone: managerProvider.phone,
                createdAt: Date.now()
            };
        }
        return managerProvider;
    }
    
    /**
     * Update ManagerProvider
     *
     * @param managerProviderForm
     * @returns {Promise<any>}
     */
    updateManagerProvider(managerProviderForm): Promise<any> {

        const managerProvider = this.getHorseManagerProvider(managerProviderForm);
        
        return new Promise((resolve, reject) => {
        
            // update Horse Manager Provider
            const collectionRef = this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS).doc(managerProviderForm.uid);
            collectionRef
                .update(managerProvider)
                .then(() => {
                    console.log('Horse Manager Provider successfully updated!');
                    this.getManagerProviders();
                    resolve();
                })
                .catch( error => {
                    console.error('Error updating horse manager provider: ', error);
                    reject();
                });
            
        });
    }

    /**
     * Create ManagerProvider
     *
     * @param managerProviderForm
     * @returns {Promise<any>}
     */
    createManagerProvider(managerProviderForm): Promise<any> {
        return new Promise(async (resolve, reject) => {
            // check duplicate
            const queryRef = await this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS, 
                ref => ref.where('userId', '==', this.userId).where('creatorId', '==', managerProviderForm.creatorId)).get();
            await queryRef.subscribe((snapshot) => {
                if (snapshot.size) { // if duplicated
                    // Show the error message
                    this._matSnackBar.open('Horse manager provider is already exists. please input another provider.', 'OK', {
                        verticalPosition: 'bottom',
                        duration        : 3000
                    });
                    resolve();
                } else {
                    const provider = this.getHorseManagerProvider(managerProviderForm);
                    console.log(provider);
                    // insert manager provider
                    const collectionRef = this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS);
                    collectionRef
                        .add(provider)
                        .then(docRef => {
                            console.log('Horse Manager Provider written with ID: ', docRef.id);
                            // add uid to inserted Horse Manager Provider
                            const ref = this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS).doc(docRef.id);
                            ref.update({
                                uid: docRef.id
                            }).then(() => {
                                this.getManagerProviders();
                                resolve();
                            });
                            
                        })
                        .catch( error => {
                            console.error('Error adding Horse Manager Provider: ', error);
                            reject();
                        });
                }
            });        
            
        });
    }


    /**
     * Delete Horse Manager Provider
     *
     * @param Horse Manager Provider
     */
    deleteManagerProvider(managerProvider): Promise<any> {        
        return new Promise((resolve, reject) => {
            // delete Horse Manager Provider
            this.db.collection(COLLECTION_HORSE_MANAGER_PROVIDERS)
            .doc(managerProvider.uid)
            .delete()
            .then(() => {
                console.log('ManagerProvider successfully deleted!');                
                this.getManagerProviders();
                resolve();
            }).catch(error => {
                console.error('Error removing ManagerProvider: ', error);
                reject();
            });
        });
    }

}
