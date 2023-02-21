import { RegistrationsComponent } from './registrations.component';
import { HLHorseRegistrationModel } from './../../../model/horses';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AuthService } from 'app/main/auth/auth.service';

import { COLLECTION_HORSES } from 'app/utils/constants';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable()
export class RegistrationsService {
    
    routeParams: any;    
    onRegistrationsChanged: BehaviorSubject<any>;    
    horseId: any; // selected horse id
    registrations: HLHorseRegistrationModel[];
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     */
    constructor(
        private db: AngularFirestore,           
        private _auth: AuthService,
    ) {
        // Set the defaults
        this.onRegistrationsChanged = new BehaviorSubject({});
        this.registrations = [];
    }


    /**
     * Get all Registration data
     * @returns {Promise<any>}
     */
    
    getRegistrations(): Promise<any> {         
        this.registrations = [];
        return new Promise((resolve, reject) => {
            if (this.horseId !== null && this.horseId !== '') {                
                const docRef = this.db.collection(COLLECTION_HORSES).doc(this.horseId).get();
                docRef.subscribe((doc) => {
                    if (doc.data().registrations) {
                        let index = 0;                   
                        doc.data().registrations.forEach(r => {
                            r.index = index;
                            this.registrations.push(r);
                            index++;
                        });                     
                    }
                    this.onRegistrationsChanged.next(this.registrations);
                    // console.log(this.registrations);
                    resolve(this.registrations);
                }, reject);

            } else {  // controller by "new" URL;                
                this.onRegistrationsChanged.next(false);
                resolve(false);
            }
        });
    }

    /**
     * Update Registration
     *
     * @param registrations
     * @returns {Promise<any>}
     */
    updateRegistration(registrations): Promise<any> {
        console.log('updated registrations');
        console.log(registrations);
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_HORSES).doc(this.horseId);
            docRef.update({
                registrations: registrations
            })
            .then(() =>  {
                console.log('Document successfully updated!');       
                this.registrations = registrations;
                this.onRegistrationsChanged.next(this.registrations);         
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });        
    }

}
