import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HLServiceShowModel } from 'app/model/service-requests';
import { HLBaseUserModel } from 'app/model/users';

import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_SERVICE_SHOWS, COLLECTION_USERS } from 'app/utils/constants';

@Injectable()
export class ServiceShowsService implements Resolve<any>
{
    onServiceShowsChanged: BehaviorSubject<any>;
    onSelectedServiceShowsChanged: BehaviorSubject<any>;
    
    serviceShows: HLServiceShowModel[] = [];
    selectedServiceShows: string[] = [];
    filteredServiceShows: any[] = [];
    curPageServiceShows: any[] = [];
    /**
     * Constructor
     *
     * @param {AngularFirestore} db
     */
    constructor(        
        private db: AngularFirestore
    )
    {
        // Set the defaults
        this.onServiceShowsChanged = new BehaviorSubject([]);
        this.onSelectedServiceShowsChanged = new BehaviorSubject([]);            
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
                this.getServiceShows()
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    // set filtered all ServiceShows data.
    setFilteredServiceShows(serviceShows): void {
        // console.log('Changed filtered serviceShows');
        this.filteredServiceShows = serviceShows;
    }

    setCurPageServiceShows(serviceShows): void {
        // console.log('Changed current page serviceShows');
        this.curPageServiceShows = serviceShows;        
    }

    /**
     * Get ServiceShows
     *
     * @returns {Promise<any>}
     */
    getServiceShows(): Promise<any>
    {
        this.serviceShows = [];
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS).get();
            collectionRef.subscribe((snapshots) => {
                const serviceShowList = snapshots;
                // console.log('ServiceShow collection', serviceShowList);                                
                // get receiver user information
                serviceShowList.forEach(doc => {
                    this.serviceShows.push(new HLServiceShowModel(doc.id, doc.data()));                    
                });
                this.onServiceShowsChanged.next(this.serviceShows);
                resolve(this.serviceShows);
            }, reject);
        });
    }
    
    /**
     * Toggle selected serviceShow by id when click check box of serviceShow item
     *
     * @param id
     */
    toggleSelectedServiceShow(uid): void
    {
        // First, check if we already have that serviceShow as selected...
        if ( this.selectedServiceShows.length > 0 )
        {
            const index = this.selectedServiceShows.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedServiceShows.splice(index, 1);

                // Trigger the next event
                this.onSelectedServiceShowsChanged.next(this.selectedServiceShows);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedServiceShows.push(uid);
        // Trigger the next event
        this.onSelectedServiceShowsChanged.next(this.selectedServiceShows);
    }

    /**
     * Select all serviceShows
     *
     * @param filterParameter
     * @param filterValue
     */
    selectServiceShows(allPage?): void
    {
        this.selectedServiceShows = [];
        if (allPage) {
            // select all filtered serviceShows
            this.filteredServiceShows.map( (serviceShow) => {
                this.selectedServiceShows.push(serviceShow.uid);                
            });
        } else {
            this.curPageServiceShows.map( (serviceShow) => {
                // select serviceShows of current page
                this.selectedServiceShows.push(serviceShow.uid);
            });
        }
        // console.log(this.selectedServiceShows);
        // Trigger the next event
        this.onSelectedServiceShowsChanged.next(this.selectedServiceShows);
    }

    /**
     * Update serviceShow
     *
     * @param serviceShow
     * @returns {Promise<any>}
     */
    updateServiceShow(serviceShowForm): Promise<any>
    {
        const newServiceShow = {            
            'uid':        serviceShowForm.uid,                        
            'name':    serviceShowForm.name,            
            // 'createdAt' : serviceShowForm.createdAt,
            'updatedAt' : Date.now()
        };
        return new Promise((resolve, reject) => {
            console.log(newServiceShow);
            const docRef = this.db.collection(COLLECTION_SERVICE_SHOWS).doc(newServiceShow.uid);
            docRef.update(newServiceShow)
            .then(() =>  {
                console.log('Document successfully updated!');
                const index = this.serviceShows.findIndex((n) => n.uid === newServiceShow.uid);
                // remove old serviceShow and add updated serviceShow
                this.serviceShows.splice(index, 1, new HLServiceShowModel(newServiceShow.uid, {...newServiceShow}));
                this.onServiceShowsChanged.next(this.serviceShows);
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }
    /**
     * Create serviceShow
     *
     * @param serviceShow
     * @returns {Promise<any>}
     */
    createServiceShow(serviceShow): Promise<any>
    {
        const newServiceShow = {            
            // 'uid': serviceShow.uid,                     
            name: serviceShow.name,            
            createdAt : Date.now(),
            updatedAt : Date.now()
        };
        console.log(newServiceShow);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_SERVICE_SHOWS);
            collectionRef
                .add(newServiceShow)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    newServiceShow['uid'] = docRef.id;
                    this.serviceShows.push(new HLServiceShowModel(docRef.id, {...newServiceShow}));
                    console.log(newServiceShow);
                    this.onServiceShowsChanged.next(this.serviceShows);
                    resolve();
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Deselect serviceShows
     */
    deselectServiceShows(): void
    {
        this.selectedServiceShows = [];

        // Trigger the next event
        this.onSelectedServiceShowsChanged.next(this.selectedServiceShows);
    }

    /**
     * Delete serviceShow
     *
     * @param serviceShow
     */
    deleteServiceShow(serviceShow): void
    {
        console.log(serviceShow);
        this.db.collection(COLLECTION_SERVICE_SHOWS)
            .doc(serviceShow.uid)
            .delete()
            .then(() => {
                console.log('Document successfully deleted!');
                const serviceShowIndex = this.serviceShows.indexOf(serviceShow);
                this.serviceShows.splice(serviceShowIndex, 1);
                this.onServiceShowsChanged.next(this.serviceShows);
        }).catch(error => {
            console.error('Error removing document: ', error);
        });
    }

    /**
     * Delete selected serviceShows
     */
    deleteSelectedServiceShows(): void
    {
        const promises: any[] = [];

        for ( const serviceShowId of this.selectedServiceShows )
        {
            promises.push(this.db.collection(COLLECTION_SERVICE_SHOWS).doc(serviceShowId).delete());
            const serviceShow = this.serviceShows.find(_serviceShow => {
                return _serviceShow.uid === serviceShowId;
            });
            const serviceShowIndex = this.serviceShows.indexOf(serviceShow);
            this.serviceShows.splice(serviceShowIndex, 1);
        }
        Promise.all(promises);
        this.onServiceShowsChanged.next(this.serviceShows);
        this.deselectServiceShows();
    }

}
