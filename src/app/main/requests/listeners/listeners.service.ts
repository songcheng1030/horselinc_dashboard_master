import { MatSnackBar } from '@angular/material';
import { HLHorseManagerModel } from './../../../model/users';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { HLListenerUserModel } from 'app/model/users';
import { COLLECTION_SERVICE_REQUESTS } from 'app/utils/constants';

@Injectable()
export class ListenersService {
    
    routeParams: any;    
    onListenersChanged: BehaviorSubject<any>;    
    requestId: any; // selected request Id
    allUsers: HLListenerUserModel[];  // all users
    listeners: HLListenerUserModel[]; // listener users of selected request id

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
        this.onListenersChanged = new BehaviorSubject({});
        this.listeners = [];
    }


    /**
     * Get Listener data of selected horse
     * @returns {Promise<any>}
     */
    async getListeners(): Promise<any> {
        console.log('get listeners');
        this.listeners = [];
        return new Promise((resolve, reject) => {
            if (this.requestId !== null && this.requestId !== '') {                
                const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(this.requestId).get();
                docRef.subscribe((doc) => {
                    if (doc.data().listenerUsers) {                        
                        let index = 0;
                        doc.data().listenerUsers.forEach(data => {     
                            let listener;
                            if (listener = this.allUsers.find((u) => u.userId === data.userId)) {
                                data = {
                                    ...data,
                                    index: index,
                                    user: listener
                                };                            
                            }        
                            this.listeners.push(data);    
                            index++;                        
                        });                     
                    }
                    this.onListenersChanged.next(this.listeners);
                    console.log(this.listeners);
                    resolve(this.listeners);
                }, reject);

            } else {  // controller by "new" URL;                
                this.onListenersChanged.next(false);
                resolve(false);
            }
        });
    }

    /**
     * Update Listener
     *
     * @param listeners
     * @returns {Promise<any>}
     */
    updateListener(listeners): Promise<any> {
        console.log('updated listeners');
        console.log(listeners);
        const newListeners = [];
        listeners.forEach(listener => {
            const new_listener = {
                userId: listener.userId,
                userType: listener.userType
            };
            newListeners.push(new_listener);
        });
        console.log(newListeners);
        return new Promise((resolve, reject) => {            
            const docRef = this.db.collection(COLLECTION_SERVICE_REQUESTS).doc(this.requestId);
            docRef.update({
                listenerUsers: newListeners
            })
            .then(() =>  {
                console.log('Listeners successfully updated!');       
                this.listeners = listeners;
                this.onListenersChanged.next(this.listeners);         
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });        
    }
}
