import { HLUserType } from './../../../../model/enumerations';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_USERS } from 'app/utils/constants';

import { HLUserModel} from 'app/model/users';


@Injectable()
export class ServiceProviderListService implements Resolve<any>
{
    onServiceProviderListChanged: BehaviorSubject<any>;
    onSelectedServiceProviderListChanged: BehaviorSubject<any>;
    onUserCompleteTypeChanged: BehaviorSubject<any>;

    serviceProviderList: HLUserModel[];    
    selectedServiceProviderList: string[] = [];
    filteredServiceProviderList: any[] = [];
    curPageServiceProviderList: any[] = [];

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
        this.onServiceProviderListChanged = new BehaviorSubject([]);
        this.onSelectedServiceProviderListChanged = new BehaviorSubject([]);  
        this.onUserCompleteTypeChanged = new BehaviorSubject([]);  
        
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any
    {
        const userCompleteType = 'complete';        
        this.onUserCompleteTypeChanged.next(userCompleteType);

        return new Promise((resolve, reject) => {

            Promise.all([
                this.getServiceProviderList(userCompleteType)
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

    /**
     * Toggle selected horse by id when click check box of horse item
     *
     * @param id
     */
    toggleSelectedNotification(uid): void
    {
        // First, check if we already have that horse as selected...
        if ( this.selectedServiceProviderList.length > 0 )
        {
            const index = this.selectedServiceProviderList.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedServiceProviderList.splice(index, 1);

                // Trigger the next event
                this.onSelectedServiceProviderListChanged.next(this.selectedServiceProviderList);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedServiceProviderList.push(uid);
        // Trigger the next event
        this.onSelectedServiceProviderListChanged.next(this.selectedServiceProviderList);
    }

    /**
     * Select all horses
     *
     * @param filterParameter
     * @param filterValue
     */
    selectServiceProviderList(allPage?): void
    {
        this.selectedServiceProviderList = [];
        if (allPage) {
            // select all filtered horses
            this.filteredServiceProviderList.map( (horse) => {
                this.selectedServiceProviderList.push(horse.uid);                
            });
        } else {
            this.curPageServiceProviderList.map( (horse) => {
                // select horses of current page
                this.selectedServiceProviderList.push(horse.uid);
            });
        }
        // console.log(this.selectedServiceProviderList);
        // Trigger the next event
        this.onSelectedServiceProviderListChanged.next(this.selectedServiceProviderList);
    }

    // set filtered all serviceProviderList data.
    setFilteredServiceProviderList(serviceProviderList): void {
        // console.log('Changed filtered serviceProviderList');
        this.filteredServiceProviderList = serviceProviderList;
    }

    setCurPageServiceProviderList(serviceProviderList): void {
        // console.log('Changed current page serviceProviderList');
        this.curPageServiceProviderList = serviceProviderList;        
    }

    /**
     * Deselect horse list
     */
    deselectServiceProviderList(): void
    {
        this.selectedServiceProviderList = [];
        // Trigger the next event
        this.onSelectedServiceProviderListChanged.next(this.selectedServiceProviderList);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Firebase Calls
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get ServiceProvider List for table data
     *
     * @returns {Promise<any>}
     */
    getServiceProviderList(userCompleteType): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.serviceProviderList = [];
            const collectionRef = this.db.collection(COLLECTION_USERS, ref => ref.where('type', '==', HLUserType.provider)).get();
            collectionRef.subscribe((snapshots) => {
                const serviceProviderList = snapshots;
                // console.log('horse collection', serviceProviderList);                                
                serviceProviderList.forEach(doc => {
                    let user;
                    user = {
                        ...doc.data()
                    };
                    if (!doc.data().serviceProvider) {
                        console.log('service provider information not exists: ' + doc.data().email);
                        return;
                    }                    
                    if (userCompleteType === 'complete') {
                        if (user.email && user.email !== ''
                            && user.serviceProvider.phone && user.serviceProvider.phone !== ''
                            && user.serviceProvider.location && user.serviceProvider.location !== '')  
                        {                        
                            this.serviceProviderList.push(new HLUserModel(doc.id, user));                            
                        }
                    } else {  // incomplete user
                        if (!user.email || user.email === ''
                            || !user.serviceProvider.phone || user.serviceProvider.phone === ''
                            || !user.serviceProvider.location || user.serviceProvider.location === '')  
                        {                        
                            this.serviceProviderList.push(new HLUserModel(doc.id, user));                            
                        }
                    }
                    // console.log(this.serviceProviderList);
                    this.onServiceProviderListChanged.next(this.serviceProviderList);
                    this.setFilteredServiceProviderList(this.serviceProviderList);
                    resolve(this.serviceProviderList);
                }, reject);
            });
        });
    }

    /**
     * Delete selected service provider
     */
    deleteSelectedServiceProviderList(): void
    {
        const promises: any[] = [];

        for ( const userId of this.selectedServiceProviderList )
        {
            promises.push(this.db.collection(COLLECTION_USERS).doc(userId).delete());
            const horse = this.serviceProviderList.find(_horse => {
                return _horse.uid === userId;
            });
            const horseIndex = this.serviceProviderList.indexOf(horse);
            this.serviceProviderList.splice(horseIndex, 1);
        }
        Promise.all(promises);
        this.onServiceProviderListChanged.next(this.serviceProviderList);
        this.deselectServiceProviderList();
        console.log('Deleted all!');
    }
}
