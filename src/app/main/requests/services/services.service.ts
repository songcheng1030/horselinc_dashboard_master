import { MatSnackBar } from '@angular/material';
import { HLHorseManagerModel } from './../../../model/users';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { HLServiceProviderServiceModel } from 'app/model/users';
import { COLLECTION_SERVICE_REQUESTS } from 'app/utils/constants';

@Injectable()
export class ServicesService {
    
    routeParams: any;    
    onServicesChanged: BehaviorSubject<any>;    
    requestId: any; // selected request Id
    serviceProviderServices: HLServiceProviderServiceModel[];  // all service provider services
    allUsers: any[];  // all users    // do not use
    services: HLServiceProviderServiceModel[]; // service provider services of selected request id

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
        this.onServicesChanged = new BehaviorSubject({});
        this.services = [];
    }


    /**
     * Get Service data of selected horse
     * @returns {Promise<any>}
     */
    async getServices(): Promise<any> {
        console.log('get services');
        this.services = [];
        return new Promise((resolve, reject) => {
            if (this.requestId !== null && this.requestId !== '') {                
                const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(this.requestId).get();
                docRef.subscribe((doc) => {
                    if (doc.data().services) {   
                        // console.log(doc.data().services);
                        let index = 0;
                        doc.data().services.forEach(data => {  
                            data = {
                                ...data,
                                index: index
                            };                            
                            this.services.push(data);    
                            index++;                                                 
                        });                     
                    }
                    this.onServicesChanged.next(this.services);                    
                    resolve(this.services);
                }, reject);

            } else {  // controller by "new" URL;                
                this.onServicesChanged.next(false);
                resolve(false);
            }
        });
    }

    /**
     * Update Service
     *
     * @param services
     * @returns {Promise<any>}
     */
    updateService(services): Promise<any> {
        console.log('updated services');
        const newServices = [];
        services.forEach(service => {
            const new_service = {
                quantity: service.quantity,
                rate: service.rate,
                service: service.service
            };
            newServices.push(new_service);
        });
        console.log(services);
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(this.requestId);
            docRef.update({
                services: newServices
            })
            .then(() =>  {
                console.log('Services successfully updated!');       
                this.services = services;
                this.onServicesChanged.next(this.services);         
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });        
    }
}
