import { HLHorseManagerModel } from 'app/model/users';
import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { Router } from '@angular/router';
import { HorseListService } from 'app/main/horses/horse-list/horse-list.service';
import { HLHorseModel } from 'app/model/horses';
import { COLLECTION_HORSES, COLLECTION_USERS } from 'app/utils/constants';
import { RegistrationsService } from 'app/main/horses/registrations/registrations.service';
import { OwnersService } from 'app/main/horses/owners/owners.service';

@Injectable()
export class HorseService implements Resolve<any>
{
    routeParams: any;
    horse: HLHorseModel;
    horseManagers: HLHorseManagerModel[];
    onHorseChanged: BehaviorSubject<any>;
    onHorseUserListChanged: BehaviorSubject<any>;
    onRegistrationsChanged: BehaviorSubject<any>;
    
    /**
     * Constructor
     *
     * @param {HttpClient} _httpClient
     * @param {RegistrationsService}  _registrationsService
     * @param {OwnersService}  _ownersService
     */
    constructor(
        private _registrationsService: RegistrationsService,
        private _ownersService: OwnersService,
        private _horseServiceList: HorseListService,  
        private db: AngularFirestore,           
        private router: Router  
    ) {
        // Set the defaults
        this.horseManagers = [];
        this.onHorseChanged = new BehaviorSubject({});
        this.onHorseUserListChanged = new BehaviorSubject({});
        this.onRegistrationsChanged = new BehaviorSubject({});        
    }

    /**
     * Resolver
     *
     * @param {ActivatedRouteSnapshot} route
     * @param {RouterStateSnapshot} state
     * @returns {Observable<any> | Promise<any> | any}
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
        this.routeParams = route.params;

        return new Promise((resolve, reject) => {
            Promise.all([this.getHorseManagerList()])
                .then(() => {
                    if (this.routeParams.uid) {
                        Promise.all([                                 
                            this.getHorse(this.routeParams.uid)
                        ]).then(
                            () => {
                                resolve();
                            },
                            reject
                        );
                    } else {
                        this.onHorseChanged.next(false);
                        resolve(false);
                    }
                });
            

        });
    }

    /**
     * Get horse
     *
     * @returns {Promise<any>}
     */
    getHorse(horseId): Promise<any> {
        
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_HORSES).doc(horseId).get();
            docRef.subscribe((doc) => {
                if (!doc.data().creatorId || doc.data().creatorId === undefined) {
                    console.log('creator no' + doc.data().creatorId);
                    return;
                }                
                let horseDoc = {
                    ...doc.data()
                };
                let trainer: any;
                let leaser: any;
                let creator: any;

                // Get Creator
                if (doc.data().creatorId) {
                    if (creator = this.horseManagers.find((u) => u.userId === doc.data().creatorId)) {
                        horseDoc = {
                            ...horseDoc,
                            creator: creator
                        };                            
                    }
                } else {
                    horseDoc = {
                        ...horseDoc,
                        creator: new HLHorseManagerModel({})
                    };
                }

                // Get Trainer
                if (doc.data().trainerId) {
                    if (trainer = this.horseManagers.find((u) => u.userId === doc.data().trainerId)) {
                        horseDoc = {
                            ...horseDoc,
                            trainer: trainer
                        };                            
                    }                        
                } else {
                    horseDoc = {
                        ...horseDoc,
                        trainer: new HLHorseManagerModel({})
                    };
                }

                // Get Leaser
                if (doc.data().leaserId) {
                    if (leaser = this.horseManagers.find((u) => u.userId === doc.data().leaserId)) {
                        horseDoc = {
                            ...horseDoc,
                            leaser: leaser
                        };                            
                    }
                } else {
                    horseDoc = {
                        ...horseDoc,
                        leaser: new HLHorseManagerModel({})
                    };
                }
                this.horse = new HLHorseModel(doc.id, horseDoc);
                // console.log(this.horse);
                this.onHorseChanged.next(this.horse);                            
                
                this.setHorseIdForRegAndOwner(doc.id, this.horse.ownerIds);
                resolve(this.horse);
            }, reject);
        });
    }

    setHorseIdForRegAndOwner(horseId, ownerIds): void {
        // set horse id for registration.
        this._registrationsService.horseId = horseId;
        // set horse id for owner.
        this._ownersService.horseId = horseId;
        this._ownersService.ownerIds = ownerIds;
        this._ownersService.horseManagers = this.horseManagers;
        console.log('set horse id');
    }

    /**
     * Update horse
     *
     * @param horseForm
     * @returns {Promise<any>}
     */
    updateHorse(horseForm): Promise<any> {
        const newHorse = {            
            uid: horseForm.uid,
            avatarUrl: horseForm.avatarUrl,
            barnName: horseForm.barnName,
            displayName: horseForm.displayName,
            gender: horseForm.gender,
            birthYear: horseForm.birthYear,
            trainerId: horseForm.trainerId,            
            creatorId: horseForm.creatorId,
            leaserId: horseForm.leaserId,            
            description: horseForm.description,
            privateNote: horseForm.privateNote,
            color: horseForm.color,
            sire: horseForm.sire,
            dam: horseForm.dam,
            height: horseForm.height,
            // ownerIds: horseForm.ownerIds,
            // registrations: horseForm.registrations,
            isDeleted: horseForm.isDeleted === 'true' ? true : false,
            // createdAt: Date.now()
        };
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_HORSES).doc(newHorse.uid);
            docRef.update(newHorse)
            .then(() =>  {
                console.log('Document successfully updated!');
                this.horse = new HLHorseModel(newHorse.uid, newHorse);
                // this.onHorseChanged.next(this.horse);
                resolve(this.horse);
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }

    /**
     * Create horse
     *
     * @param horseForm
     * @returns {Promise<any>}
     */
    createHorse(horseForm): Promise<any> {        
        const newHorse = {            
            // uid: horseForm.uid,
            avatarUrl: horseForm.avatarUrl,
            barnName: horseForm.barnName,
            displayName: horseForm.displayName,
            gender: horseForm.gender,
            birthYear: horseForm.birthYear,
            trainerId: horseForm.trainerId,            
            creatorId: horseForm.creatorId,
            leaserId: horseForm.leaserId,            
            description: horseForm.description,
            privateNote: horseForm.privateNote,
            color: horseForm.color,
            sire: horseForm.sire,
            dam: horseForm.dam,
            height: horseForm.height,
            // ownerIds: horseForm.ownerIds,
            // registrations: horseForm.registrations,
            isDeleted: horseForm.isDeleted === 'true' ? true : false,
            createdAt : Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_HORSES);
            collectionRef
                .add(newHorse)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    this.horse = new HLHorseModel(docRef.id, newHorse); 
                    // this.onHorseChanged.next(this.horse);
                    resolve(this.horse);
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete horse
     *
     * @param horse
     */
    deleteHorse(horse): Promise<any>
    {
        return new Promise((resolve, reject) => {
            // console.log(horse);
            this.db.collection(COLLECTION_HORSES)
                .doc(horse.uid)
                .delete()
                .then(() => {
                    console.log('Document successfully deleted!');                
                    resolve();
            }).catch(error => {
                console.error('Error removing document: ', error);
                reject();
            });
        });
    }

    /**
     * Get horse manager list data (users) // duplicate with horse-list
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
                this.onHorseUserListChanged.next(this.horseManagers);
                resolve(this.horseManagers);
            }, reject);
        });
    }

    
}
