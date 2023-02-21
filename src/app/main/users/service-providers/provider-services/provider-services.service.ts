import { MatSnackBar } from '@angular/material';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { HLServiceProviderServiceModel } from 'app/model/users';
import { COLLECTION_SERVICE_PROVIDER_SERVICES } from 'app/utils/constants';

@Injectable()
export class ProviderServicesService {
    
    routeParams: any;    
    onProviderServicesChanged: BehaviorSubject<any>;    
    userId: any; // selected user Id    
    providerServices: HLServiceProviderServiceModel[];

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
        this.onProviderServicesChanged = new BehaviorSubject({});
        this.providerServices = [];
    }


    /**
     * Get ProviderService data of selected horse
     * @returns {Promise<any>}
     */
    async getProviderServices(): Promise<any> {
        console.log('get provider services');
        this.providerServices = [];
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, ref => ref.where('userId', '==', this.userId)).get();
                await queryRef.subscribe((snapshot) => {
                    snapshot.forEach((doc) => {
                        const service = {
                            ...doc.data()
                        };                                 
                        this.providerServices.push(new HLServiceProviderServiceModel(doc.id, service));
                    });    
                    console.log(this.providerServices);
                    this.onProviderServicesChanged.next(this.providerServices);
                    resolve();                    
                }, reject);                
            } else {  // controller by "new" URL;                
                this.onProviderServicesChanged.next(false);
                resolve(false);
            }
        });

    }
    
    /**
     * Update ProviderService
     *
     * @param providerServiceForm
     * @returns {Promise<any>}
     */
    updateProviderService(providerServiceForm): Promise<any> {

        const providerService = {
            uid: providerServiceForm.uid,
            userId: this.userId,
            service: providerServiceForm.service,
            rate: providerServiceForm.rate,
            quantity: providerServiceForm.quantity
        };
        
        return new Promise((resolve, reject) => {
        
            // update Service Provider Service
            const collectionRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES).doc(providerServiceForm.uid);
            collectionRef
                .update(providerService)
                .then(() => {
                    console.log('Service successfully updated!');
                    this.getProviderServices();
                    resolve();
                })
                .catch( error => {
                    console.error('Error updating horse service: ', error);
                    reject();
                });
            
        });
    }

    /**
     * Create Provider Service
     *
     * @param providerServiceForm
     * @returns {Promise<any>}
     */
    async createProviderService(providerServiceForm): Promise<any> {

        return new Promise(async (resolve, reject) => {
            // check duplicate
            const queryRef = await this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES, 
                ref => ref.where('userId', '==', this.userId).where('service', '==', providerServiceForm.service)).get();
            await queryRef.subscribe((snapshot) => {
                if (snapshot.size) { // if duplicated
                    // Show the error message
                    this._matSnackBar.open('Service is already exists. please input another Service.', 'OK', {
                        verticalPosition: 'bottom',
                        duration        : 3000
                    });
                    resolve();
                } else {
                    const providerService = {
                        userId: this.userId,
                        service: providerServiceForm.service,
                        rate: providerServiceForm.rate,
                        quantity: providerServiceForm.quantity
                    };
                    console.log(providerService);
                    // insert providerService
                    const collectionRef = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES);
                    collectionRef
                        .add(providerService)
                        .then(docRef => {
                            console.log('Service written with ID: ', docRef.id);
                            // add uid to inserted horse providerService
                            const ref = this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES).doc(docRef.id);
                            ref.update({
                                uid: docRef.id
                            }).then(() => {
                                this.getProviderServices();
                                resolve();
                            });
                            
                        })
                        .catch( error => {
                            console.error('Error adding service: ', error);
                            reject();
                        });
                }
            });        
            
        });

    }


    /**
     * Delete Service Provider Service
     *
     * @param Service Provider Service
     */
    deleteProviderService(providerService): Promise<any> {        
        return new Promise((resolve, reject) => {
            // delete Service Provider Service
            this.db.collection(COLLECTION_SERVICE_PROVIDER_SERVICES)
            .doc(providerService.uid)
            .delete()
            .then(() => {
                console.log('ProviderService successfully deleted!');                
                this.getProviderServices();
                resolve();
            }).catch(error => {
                console.error('Error removing ProviderService: ', error);
                reject();
            });
        });
    }

}
