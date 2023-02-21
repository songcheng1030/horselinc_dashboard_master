import { MatSnackBar } from '@angular/material';

import { AngularFirestore } from '@angular/fire/firestore';

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { HLUserModel, HLBaseUserModel, HLHorseManagerPaymentApproverModel } from 'app/model/users';
import { COLLECTION_PAYMENT_APPROVERS } from 'app/utils/constants';
import { resolve } from 'url';

@Injectable()
export class PaymentApproversService {
    
    routeParams: any;    
    onPaymentApproversChanged: BehaviorSubject<any>;    
    userId: any; // selected user Id    
    allUsers: HLBaseUserModel[];
    paymentApprovers: HLHorseManagerPaymentApproverModel[];

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
        this.onPaymentApproversChanged = new BehaviorSubject({});
        this.paymentApprovers = [];
    }


    /**
     * Get PaymentApprover data of selected horse
     * @returns {Promise<any>}
     */
    async getPaymentApprovers(): Promise<any> {
        console.log('get payment approvers');
        this.paymentApprovers = [];
        return new Promise(async (resolve, reject) => {
            if (this.userId != null && this.userId !== '') {                
                const queryRef = await this.db.collection(COLLECTION_PAYMENT_APPROVERS, ref => ref.where('userId', '==', this.userId)).get();
                await queryRef.subscribe((snapshot) => {
                    snapshot.forEach((doc) => {
                        let approver;
                        let creator: any;

                        // Get Creator
                        if (doc.data().creatorId) {
                            if (creator = this.allUsers.find((u) => u.userId === doc.data().creatorId)) {
                                approver = {
                                    ...doc.data(),
                                    creator: creator
                                };                            
                            }
                        } else {
                            approver = {
                                ...doc.data(),
                                creator: new HLBaseUserModel({})
                            };
                        }                        
                        this.paymentApprovers.push(new HLHorseManagerPaymentApproverModel(doc.id, approver));
                    });    
                    // console.log(this.paymentApprovers);
                    this.onPaymentApproversChanged.next(this.paymentApprovers);
                    resolve();                    
                }, reject);                
            } else {  // controller by "new" URL;                
                this.onPaymentApproversChanged.next(false);
                resolve(false);
            }
        });

    }

    getHorseManagerPaymentApprover(paymentApproverForm): any {
        let paymentApprover;
        // find paymentApprover object from users
        if (paymentApprover = this.allUsers.find((u) => u.userId === paymentApproverForm.creatorId)) {
            paymentApprover = {
                amount: paymentApproverForm.amount !== 0 ?  paymentApproverForm.amount : null,
                userId: this.userId,
                creatorId: paymentApproverForm.creatorId,
                name: paymentApprover.name,
                location: paymentApprover.location,
                avatarUrl: paymentApprover.avatarUrl,
                phone: paymentApprover.phone,
                createdAt: Date.now()
            };
        }
        return paymentApprover;
    }
    
    /**
     * Update PaymentApprover
     *
     * @param paymentApproverForm
     * @returns {Promise<any>}
     */
    updatePaymentApprover(paymentApproverForm): Promise<any> {

        const paymentApprover = this.getHorseManagerPaymentApprover(paymentApproverForm);
        
        return new Promise((resolve, reject) => {
        
            // update Payment Approver
            const collectionRef = this.db.collection(COLLECTION_PAYMENT_APPROVERS).doc(paymentApproverForm.uid);
            collectionRef
                .update(paymentApprover)
                .then(() => {
                    console.log('HorseManager PaymentApprover successfully updated!');
                    this.getPaymentApprovers();
                    resolve();
                })
                .catch( error => {
                    console.error('Error updating horse paymentApprover: ', error);
                    reject();
                });
            
        });
    }

    /**
     * Create PaymentApprover
     *
     * @param paymentApprover
     * @returns {Promise<any>}
     */
    async createPaymentApprover(paymentApproverForm): Promise<any> {

        return new Promise(async (resolve, reject) => {
            // check duplicate
            const queryRef = await this.db.collection(COLLECTION_PAYMENT_APPROVERS, 
                ref => ref.where('userId', '==', this.userId).where('creatorId', '==', paymentApproverForm.creatorId)).get();
            await queryRef.subscribe((snapshot) => {
                if (snapshot.size) { // if duplicated
                    // Show the error message
                    this._matSnackBar.open('Payment approver is already exists. please input another Payment Approver.', 'OK', {
                        verticalPosition: 'bottom',
                        duration        : 3000
                    });
                    resolve();
                } else {
                    const paymentApprover = this.getHorseManagerPaymentApprover(paymentApproverForm);
                    console.log(paymentApprover);
                    // insert paymentApprover
                    const collectionRef = this.db.collection(COLLECTION_PAYMENT_APPROVERS);
                    collectionRef
                        .add(paymentApprover)
                        .then(docRef => {
                            console.log('Payment Approver written with ID: ', docRef.id);
                            // add uid to inserted horse paymentApprover
                            const ref = this.db.collection(COLLECTION_PAYMENT_APPROVERS).doc(docRef.id);
                            ref.update({
                                uid: docRef.id
                            }).then(() => {
                                this.getPaymentApprovers();
                                resolve();
                            });
                            
                        })
                        .catch( error => {
                            console.error('Error adding paymentApprover: ', error);
                            reject();
                        });
                }
            });        
            
        });

    }


    /**
     * Delete Payment Approver
     *
     * @param Payment Approver
     */
    deletePaymentApprover(paymentApprover): Promise<any> {        
        return new Promise((resolve, reject) => {
            // delete Payment Approver
            this.db.collection(COLLECTION_PAYMENT_APPROVERS)
            .doc(paymentApprover.uid)
            .delete()
            .then(() => {
                console.log('PaymentApprover successfully deleted!');                
                this.getPaymentApprovers();
                resolve();
            }).catch(error => {
                console.error('Error removing PaymentApprover: ', error);
                reject();
            });
        });
    }

}
