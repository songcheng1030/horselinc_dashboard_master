import { MatSnackBar } from '@angular/material';
import { HLHorseManagerModel } from './../../../model/users';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { HLHorseOwnerModel } from 'app/model/horses';
import { COLLECTION_HORSES, COLLECTION_HORSE_OWNERS } from 'app/utils/constants';

@Injectable()
export class OwnersService {
    
    routeParams: any;    
    onOwnersChanged: BehaviorSubject<any>;    
    horseId: any; // selected horse Id
    ownerIds: any[]; // owner ids of selected horse id
    horseManagers: HLHorseManagerModel[];
    owners: HLHorseOwnerModel[];

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
        this.onOwnersChanged = new BehaviorSubject({});
        this.owners = [];
    }


    /**
     * Get Owner data of selected horse
     * @returns {Promise<any>}
     */
    async getOwners(): Promise<any> {
        console.log('get owners');
        this.owners = [];
        return new Promise((resolve, reject) => {
            if (this.horseId != null && this.ownerIds.length > 0) {
                this.ownerIds.forEach(async ownerId => {
                    const queryRef = await this.db.collection(COLLECTION_HORSE_OWNERS, ref => ref.where('userId', '==', ownerId).where('horseId', '==', this.horseId)).get();
                    await queryRef.subscribe((snapshot) => {
                        snapshot.forEach((doc) => {
                            const owner = new HLHorseOwnerModel(doc.id, doc.data()); 
                            // console.log(owner);
                            this.owners.push(owner);
                            this.onOwnersChanged.next(this.owners);
                        });    
                        resolve();                    
                    }, reject);
                });
                
                resolve();
            } else {  // controller by "new" URL;                
                this.onOwnersChanged.next(false);
                resolve(false);
            }
        });

    }

    getHorseOwner(ownerForm): any {
        let owner;
        // find owner object from users
        if (owner = this.horseManagers.find((u) => u.userId === ownerForm.ownerId)) {
            owner = {
                ...owner,
                percentage: ownerForm.percentage,
                horseId: this.horseId,
                createdAt: Date.now()
            };
        }
        return owner;
    }
    
    /**
     * Update Owner
     *
     * @param ownerForm
     * @returns {Promise<any>}
     */
    updateOwner(ownerForm): Promise<any> {

        /* // update ownerIds
        let oldOwnerId;
        if (this.ownerIds.length === 0) {
            return;
        }        
        // find old owner id
        this.owners.forEach((o) => {
            if (o.uid === ownerForm.uid) {
                oldOwnerId = o.userId;
                return;                
            }
        });    
        this.ownerIds.forEach((oId, index) => {
            if (oId === oldOwnerId) {
                this.ownerIds.splice(index, 1, ownerForm.ownerId);
            }
        });        
        console.log(this.ownerIds); */

        const horseOwner = this.getHorseOwner(ownerForm);
        
        return new Promise((resolve, reject) => {
            /* const docRef = this.db.collection(COLLECTION_HORSES).doc(this.horseId);
            docRef.update({
                ownerIds: this.ownerIds
            })
            .then(() =>  {
                console.log('OwnerIds successfully updated!');  */    

                // update horse owner
                const collectionRef = this.db.collection(COLLECTION_HORSE_OWNERS).doc(ownerForm.uid);
                collectionRef
                    .update(horseOwner)
                    .then(() => {
                        console.log('Horse Owner successfully updated!');
                        this.getOwners();
                        resolve();
                    })
                    .catch( error => {
                        console.error('Error updating horse owner: ', error);
                        reject();
                    });
                
            /* }).catch( error => {
                console.error('Error updating ownerIds: ', error);
                reject();
            }); */
        });
    }

    /**
     * Create Owner
     *
     * @param owner
     * @returns {Promise<any>}
     */
    createOwner(ownerForm): Promise<any> {

        // update ownerIds
        let ownerDuplicate = false;        
        this.ownerIds.forEach((oId) => {
            if (oId === ownerForm.ownerId) {
                console.log('duplicate ownerId record');                
                ownerDuplicate = true;
                return;
            }
        });
        if (ownerDuplicate) {
            // Show the success message
            this._matSnackBar.open('Owner data is duplicated. please input another owner.', 'OK', {
                verticalPosition: 'bottom',
                duration        : 3000
            });
            return;
        }
        this.ownerIds.push(ownerForm.ownerId);
        console.log(this.ownerIds);

        const horseOwner = this.getHorseOwner(ownerForm);
        console.log(horseOwner);
        
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_HORSES).doc(this.horseId);
            docRef.update({
                ownerIds: this.ownerIds
            })
            .then(() =>  {
                console.log('OwnerIds successfully updated!');       
                resolve();
                // insert horse owner
                const collectionRef = this.db.collection(COLLECTION_HORSE_OWNERS);
                collectionRef
                    .add(horseOwner)
                    .then(docRef => {
                        console.log('Horse Owner written with ID: ', docRef.id);
                        // add uid to inserted horse owner
                        const ref = this.db.collection(COLLECTION_HORSE_OWNERS).doc(docRef.id);
                        ref.update({
                            uid: docRef.id
                        }).then(() => {
                            this.getOwners();
                            resolve();
                        });
                        
                    })
                    .catch( error => {
                        console.error('Error adding horse owner: ', error);
                        reject();
                    });
                
            }).catch( error => {
                console.error('Error updating ownerIds: ', error);
                reject();
            });
        });

    }


    /**
     * Delete Owner
     *
     * @param owner
     */
    deleteOwner(owner): Promise<any> {
        // update ownerIds
        this.ownerIds.forEach((oId, index) => {
            if (oId === owner.userId) {
                console.log('find ownerId record');                
                this.ownerIds.splice(index, 1);
            }
        });
        return new Promise((resolve, reject) => {
            const docRef = this.db.collection(COLLECTION_HORSES).doc(this.horseId);
            docRef.update({
                ownerIds: this.ownerIds
            })
            .then(() =>  {
                console.log('OwnerIds successfully updated!');       

                // delete horse owner
                this.db.collection(COLLECTION_HORSE_OWNERS)
                    .doc(owner.uid)
                    .delete()
                    .then(() => {
                        console.log('Horse owner successfully deleted!');                
                        this.getOwners();
                        resolve();
                }).catch(error => {
                    console.error('Error removing horse owner: ', error);
                    reject();
                });
                
            }).catch( error => {
                console.error('Error updating ownerIds: ', error);
                reject();
            });
        });
    }

}
