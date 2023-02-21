import { HLUserType } from './../../../../model/enumerations';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_USERS } from 'app/utils/constants';

import { HLUserModel} from 'app/model/users';


@Injectable()
export class HorseManagerListService implements Resolve<any>
{
    onHorseManagerListChanged: BehaviorSubject<any>;
    onSelectedHorseManagerListChanged: BehaviorSubject<any>;
    onUserCompleteTypeChanged: BehaviorSubject<any>;

    horseManagerList: HLUserModel[];    
    selectedHorseManagerList: string[] = [];
    filteredHorseManagerList: any[] = [];
    curPageHorseManagerList: any[] = [];

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
        this.onHorseManagerListChanged = new BehaviorSubject([]);
        this.onSelectedHorseManagerListChanged = new BehaviorSubject([]);  
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
                this.getHorseManagerList(userCompleteType)
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
        if ( this.selectedHorseManagerList.length > 0 )
        {
            const index = this.selectedHorseManagerList.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedHorseManagerList.splice(index, 1);

                // Trigger the next event
                this.onSelectedHorseManagerListChanged.next(this.selectedHorseManagerList);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedHorseManagerList.push(uid);
        // Trigger the next event
        this.onSelectedHorseManagerListChanged.next(this.selectedHorseManagerList);
    }

    /**
     * Select all horses
     *
     * @param filterParameter
     * @param filterValue
     */
    selectHorseManagerList(allPage?): void
    {
        this.selectedHorseManagerList = [];
        if (allPage) {
            // select all filtered horses
            this.filteredHorseManagerList.map( (horse) => {
                this.selectedHorseManagerList.push(horse.uid);                
            });
        } else {
            this.curPageHorseManagerList.map( (horse) => {
                // select horses of current page
                this.selectedHorseManagerList.push(horse.uid);
            });
        }
        // console.log(this.selectedHorseManagerList);
        // Trigger the next event
        this.onSelectedHorseManagerListChanged.next(this.selectedHorseManagerList);
    }

    // set filtered all horseManagerList data.
    setFilteredHorseManagerList(horseManagerList): void {
        // console.log('Changed filtered horseManagerList');
        this.filteredHorseManagerList = horseManagerList;
    }

    setCurPageHorseManagerList(horseManagerList): void {
        // console.log('Changed current page horseManagerList');
        this.curPageHorseManagerList = horseManagerList;        
    }

    /**
     * Deselect horse list
     */
    deselectHorseManagerList(): void
    {
        this.selectedHorseManagerList = [];
        // Trigger the next event
        this.onSelectedHorseManagerListChanged.next(this.selectedHorseManagerList);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Firebase Calls
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get HorseManager List for table data
     *
     * @returns {Promise<any>}
     */
    getHorseManagerList(userCompleteType): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.horseManagerList = [];
            const collectionRef = this.db.collection(COLLECTION_USERS, ref => ref.where('type', '==', HLUserType.manager)).get();
            collectionRef.subscribe((snapshots) => {
                const horseManagerList = snapshots;
                // console.log('horse collection', horseManagerList);                                
                horseManagerList.forEach(doc => {
                    let user;
                    user = {
                        ...doc.data()
                    };
                    if (!doc.data().horseManager) {
                        console.log('horse manager information not exists: ' + doc.data().email);
                        return;
                    }
                    if (userCompleteType === 'complete') {
                        if (user.email && user.email !== ''
                            && user.horseManager.barnName && user.horseManager.barnName !== ''
                            && user.horseManager.phone && user.horseManager.phone !== ''
                            && user.horseManager.location && user.horseManager.location !== '')  
                        {                        
                            this.horseManagerList.push(new HLUserModel(doc.id, user));                            
                        }
                    } else {  // incomplete user
                        if (!user.email || user.email === ''
                            || !user.horseManager.barnName || user.horseManager.barnName === ''
                            || !user.horseManager.phone || user.horseManager.phone === ''
                            || !user.horseManager.location || user.horseManager.location === '')  
                        {                        
                            this.horseManagerList.push(new HLUserModel(doc.id, user));                            
                        }
                    }
                    
                // console.log(this.horseManagerList);
                this.onHorseManagerListChanged.next(this.horseManagerList);
                this.setFilteredHorseManagerList(this.horseManagerList);
                resolve(this.horseManagerList);
                }, reject);
            });
        });
    }

    /**
     * Delete selected horse manager
     */
    deleteSelectedHorseManagerList(): void
    {
        const promises: any[] = [];

        for ( const userId of this.selectedHorseManagerList )
        {
            promises.push(this.db.collection(COLLECTION_USERS).doc(userId).delete());
            const horse = this.horseManagerList.find(_horse => {
                return _horse.uid === userId;
            });
            const horseIndex = this.horseManagerList.indexOf(horse);
            this.horseManagerList.splice(horseIndex, 1);
        }
        Promise.all(promises);
        this.onHorseManagerListChanged.next(this.horseManagerList);
        this.deselectHorseManagerList();
        console.log('Deleted all!');
    }
}
