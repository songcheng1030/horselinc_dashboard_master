import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_HORSES, COLLECTION_USERS } from 'app/utils/constants';

import { HLHorseModel } from 'app/model/horses';
import { HLHorseManagerModel } from 'app/model/users';

@Injectable()
export class HorseListService implements Resolve<any>
{
    onHorseListChanged: BehaviorSubject<any>;
    // onUserListChanged: BehaviorSubject<any>;
    onSelectedHorseListChanged: BehaviorSubject<any>;

    horseList: any[];    
    horseManagers: HLHorseManagerModel[] = [];
    selectedHorseList: string[] = [];
    filteredHorseList: any[] = [];
    curPageHorseList: any[] = [];

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
        this.onHorseListChanged = new BehaviorSubject([]);
        this.onSelectedHorseListChanged = new BehaviorSubject([]);  
        // this.onUserListChanged = new BehaviorSubject([]);
        
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
        return new Promise((resolve, reject) => {

            Promise.all([
                this.getHorseManagerList(),
                this.getHorseList()
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
        if ( this.selectedHorseList.length > 0 )
        {
            const index = this.selectedHorseList.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedHorseList.splice(index, 1);

                // Trigger the next event
                this.onSelectedHorseListChanged.next(this.selectedHorseList);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedHorseList.push(uid);
        // Trigger the next event
        this.onSelectedHorseListChanged.next(this.selectedHorseList);
    }

    /**
     * Select all horses
     *
     * @param filterParameter
     * @param filterValue
     */
    selectHorseList(allPage?): void
    {
        this.selectedHorseList = [];
        if (allPage) {
            // select all filtered horses
            this.filteredHorseList.map( (horse) => {
                this.selectedHorseList.push(horse.uid);                
            });
        } else {
            this.curPageHorseList.map( (horse) => {
                // select horses of current page
                this.selectedHorseList.push(horse.uid);
            });
        }
        // console.log(this.selectedHorseList);
        // Trigger the next event
        this.onSelectedHorseListChanged.next(this.selectedHorseList);
    }

    // set filtered all horseList data.
    setFilteredHorseList(horseList): void {
        // console.log('Changed filtered horseList');
        this.filteredHorseList = horseList;
    }

    setCurPageHorseList(horseList): void {
        // console.log('Changed current page horseList');
        this.curPageHorseList = horseList;        
    }

    /**
     * Deselect horse list
     */
    deselectHorseList(): void
    {
        this.selectedHorseList = [];
        // Trigger the next event
        this.onSelectedHorseListChanged.next(this.selectedHorseList);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Firebase Calls
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get Horse List
     *
     * @returns {Promise<any>}
     */
    getHorseList(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.horseList = [];
            const collectionRef = this.db.collection(COLLECTION_HORSES).get();
            collectionRef.subscribe((snapshots) => {
                const horseList = snapshots;
                // console.log('horse collection', horseList);                                
                horseList.forEach(doc => {
                    if (!doc.data().creatorId || typeof(doc.data().creatorId) === 'undefined') {
                        console.log('creator undefined, ' + doc.id);
                        return;
                    }
                    
                    let horse: any;
                    let trainer: any;
                    let leaser: any;
                    let creator: any;

                    // Get Creator
                    if (creator = this.horseManagers.find((u) => u.userId === doc.data().creatorId)) {
                        horse = {
                            ...doc.data(),
                            creator: creator
                        };                        
                    } else {                        
                        return;
                    }

                    // Get Trainer
                    if (doc.data().trainerId) {
                        if (trainer = this.horseManagers.find((u) => u.userId === doc.data().trainerId)) {
                            horse = {
                                ...horse,
                                trainer: trainer
                            };                            
                        }                        
                    } else {
                        horse = {
                            ...horse,
                            trainer: new HLHorseManagerModel({})
                        };
                    }

                    // Get Leaser
                    if (doc.data().leaserId) {
                        if (leaser = this.horseManagers.find((u) => u.userId === doc.data().leaserId)) {
                            horse = {
                                ...horse,
                                leaser: leaser
                            };                            
                        }
                    } else {
                        horse = {
                            ...horse,
                            leaser: new HLHorseManagerModel({})
                        };
                    }                    
                    if (horse.creatorId) {
                        this.horseList.push(new HLHorseModel(doc.id, horse));
                    }
                });

                // console.log(this.horseList);
                this.onHorseListChanged.next(this.horseList);
                this.setFilteredHorseList(this.horseList);
                resolve(this.horseList);
            }, reject);
        });
    }

     /**
     * Get horse manager list data (users)
     *
     * @returns {Promise<any>}
     */
    getHorseManagerList(): Promise<any>
    {
        if (this.horseManagers.length > 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                // console.log('users collection', userList);                
                // get horse manager information                
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().horseManager ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().horseManager.name,
                                avatarUrl: doc.data().horseManager.avatarUrl,
                                phone: doc.data().horseManager.phone,
                                location: doc.data().horseManager.location,
                                barnName: doc.data().horseManager.barnName,
                                percentage: doc.data().horseManager.percentage,
                                createdAt: doc.data().createdAt,
                        };                         
                        this.horseManagers.push(new HLHorseManagerModel(user));
                    }
                });               
                // console.log(this.horseManagers);
                // this.onUserListChanged.next(this.horseManagers);
                resolve(this.horseManagers);
            }, reject);
        });
    }

    /**
     * Delete selected horses
     */
    deleteSelectedHorseList(): void
    {
        const promises: any[] = [];

        for ( const horseId of this.selectedHorseList )
        {
            promises.push(this.db.collection(COLLECTION_HORSES).doc(horseId).delete());
            const horse = this.horseList.find(_horse => {
                return _horse.uid === horseId;
            });
            const horseIndex = this.horseList.indexOf(horse);
            this.horseList.splice(horseIndex, 1);
        }
        Promise.all(promises);
        this.onHorseListChanged.next(this.horseList);
        this.deselectHorseList();
        console.log('Deleted all!');
    }
}
