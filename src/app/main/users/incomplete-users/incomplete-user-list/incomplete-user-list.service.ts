import { HLUserType } from './../../../../model/enumerations';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';

import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_USERS } from 'app/utils/constants';

import { HLUserModel} from 'app/model/users';


@Injectable()
export class IncompleteUserListService implements Resolve<any>
{
    onIncompleteUserListChanged: BehaviorSubject<any>;
    onSelectedIncompleteUserListChanged: BehaviorSubject<any>;

    incompleteUserList: HLUserModel[];    
    selectedIncompleteUserList: string[] = [];
    filteredIncompleteUserList: any[] = [];
    curPageIncompleteUserList: any[] = [];

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
        this.onIncompleteUserListChanged = new BehaviorSubject([]);
        this.onSelectedIncompleteUserListChanged = new BehaviorSubject([]);  
        
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
        console.log('incomplete user');
        return new Promise((resolve, reject) => {

            Promise.all([
                this.getIncompleteUserList()
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
     * Toggle selected user by id when click check box of user item
     *
     * @param id
     */
    toggleSelectedNotification(uid): void
    {
        // First, check if we already have that user as selected...
        if ( this.selectedIncompleteUserList.length > 0 )
        {
            const index = this.selectedIncompleteUserList.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedIncompleteUserList.splice(index, 1);

                // Trigger the next event
                this.onSelectedIncompleteUserListChanged.next(this.selectedIncompleteUserList);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedIncompleteUserList.push(uid);
        // Trigger the next event
        this.onSelectedIncompleteUserListChanged.next(this.selectedIncompleteUserList);
    }

    /**
     * Select all users
     *
     * @param filterParameter
     * @param filterValue
     */
    selectIncompleteUserList(allPage?): void
    {
        this.selectedIncompleteUserList = [];
        if (allPage) {
            // select all filtered users
            this.filteredIncompleteUserList.map( (user) => {
                this.selectedIncompleteUserList.push(user.uid);                
            });
        } else {
            this.curPageIncompleteUserList.map( (user) => {
                // select users of current page
                this.selectedIncompleteUserList.push(user.uid);
            });
        }
        // console.log(this.selectedIncompleteUserList);
        // Trigger the next event
        this.onSelectedIncompleteUserListChanged.next(this.selectedIncompleteUserList);
    }

    // set filtered all incompleteUserList data.
    setFilteredIncompleteUserList(incompleteUserList): void {
        // console.log('Changed filtered incompleteUserList');
        this.filteredIncompleteUserList = incompleteUserList;
    }

    setCurPageIncompleteUserList(incompleteUserList): void {
        // console.log('Changed current page incompleteUserList');
        this.curPageIncompleteUserList = incompleteUserList;        
    }

    /**
     * Deselect user list
     */
    deselectIncompleteUserList(): void
    {
        this.selectedIncompleteUserList = [];
        // Trigger the next event
        this.onSelectedIncompleteUserListChanged.next(this.selectedIncompleteUserList);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Firebase Calls
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get IncompleteUser List for table data
     *
     * @returns {Promise<any>}
     */
    getIncompleteUserList(): Promise<any>
    {
        return new Promise((resolve, reject) => {
            this.incompleteUserList = [];
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const incompleteUserList = snapshots;
                // console.log('user collection', incompleteUserList);                                
                incompleteUserList.forEach(doc => {                    
                    let user;
                    user = {
                        ...doc.data()
                    };                    
                    if (!doc.data().type) {
                        this.incompleteUserList.push(new HLUserModel(doc.id, user));
                    }
                    // console.log(this.incompleteUserList);
                    this.onIncompleteUserListChanged.next(this.incompleteUserList);
                    this.setFilteredIncompleteUserList(this.incompleteUserList);
                    resolve(this.incompleteUserList);
                }, reject);
            });
        });
    }

    /**
     * Delete selected incomplete user
     */
    deleteSelectedIncompleteUserList(): void
    {
        const promises: any[] = [];

        for ( const userId of this.selectedIncompleteUserList )
        {
            promises.push(this.db.collection(COLLECTION_USERS).doc(userId).delete());
            const user = this.incompleteUserList.find(_user => {
                return _user.uid === userId;
            });
            const userIndex = this.incompleteUserList.indexOf(user);
            this.incompleteUserList.splice(userIndex, 1);
        }
        Promise.all(promises);
        this.onIncompleteUserListChanged.next(this.incompleteUserList);
        this.deselectIncompleteUserList();
        console.log('Deleted all!');
    }
}
