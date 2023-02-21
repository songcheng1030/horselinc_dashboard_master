import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_SETTINGS } from './../../utils/constants';

@Injectable()
export class SettingsService implements Resolve<any>
{
    onSettingsChanged: BehaviorSubject<any>;
    onSettingsServiceTypesChanged: BehaviorSubject<any>;
    
    /**
     * Constructor
     *
     * @param {AngularFirestore} db
     */
    constructor(        
        private db: AngularFirestore
    )
    {
        this.onSettingsChanged = new BehaviorSubject({});
        this.onSettingsServiceTypesChanged = new BehaviorSubject({});
    }
    
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        return new Promise((resolve, reject) => {

            Promise.all([
                this.getSettings()
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    /**
     * Get Settings
     *
     * @returns {Promise<any>}
     */
    getSettings(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SETTINGS).doc('data').get();
            collectionRef.subscribe((settings) => {                   
                // console.log(settings.data());
                this.onSettingsChanged.next(settings.data());           
                // this.onSettingsServiceTypesChanged.next(settings.data()['service-types']);
                resolve(settings.data());
                
            }, reject);
        });
    }

    /**
     * Update Settings
     *
     * @param settings
     * @returns {Promise<any>}
     */
    updateSettings(settingsForm): Promise<any>
    {
        const settings = {            
            'application-fee': settingsForm.application_fee,                        
            'emails':    {
                'contact': settingsForm.email
            },
            'phones':    {
                'contact': settingsForm.phone
            },
            'urls':    {
                'privacy': settingsForm.privacy,
                'terms': settingsForm.terms
            },
            'service-types': settingsForm.serviceTypes
        };
        return new Promise((resolve, reject) => {
            console.log(settings);
            const docRef = this.db.collection(COLLECTION_SETTINGS).doc('data');
            docRef.update(settings)
            .then(() =>  {
                console.log('Document successfully updated!');
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    
}
