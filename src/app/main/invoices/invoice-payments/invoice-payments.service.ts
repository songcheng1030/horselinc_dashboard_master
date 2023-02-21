import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HLPaymentModel } from 'app/model/payments';
import { HLBaseUserModel } from 'app/model/users';

import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_PAYMENTS, COLLECTION_USERS } from 'app/utils/constants';

@Injectable()
export class InvoicePaymentsService
{
    onInvoicePaymentsChanged: BehaviorSubject<any>;
    onUserListChanged: BehaviorSubject<any>;
    
    payments: HLPaymentModel[] = [];
    allUsers: HLBaseUserModel[] = [];    
    invoiceId: any;
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
        this.onInvoicePaymentsChanged = new BehaviorSubject([]);        
        this.onUserListChanged = new BehaviorSubject([]);
    }
    
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    /**
     * Get payments
     *
     * @returns {Promise<any>}
     */
    getInvoicePayments(): Promise<any>
    {
        console.log(this.invoiceId);
        this.payments = [];
        return new Promise((resolve, reject) => {
            if ( this.invoiceId !== null && this.invoiceId !== '') {
                const collectionRef = this.db.collection(COLLECTION_PAYMENTS, ref => ref.where('invoiceId', '==', this.invoiceId)).get();
                collectionRef.subscribe((snapshots) => {
                    const paymentList = snapshots;
                    // console.log('payment collection', paymentList);                                
                    // get receiver user information
                    paymentList.forEach(doc => {
                        let payment: any;
                        let payer: any;
                        let paymentApprover: any;
                        let serviceProvider: any;

                        // Get Payer
                        if (doc.data().payerId) {
                            if (payer = this.allUsers.find((u) => u.userId === doc.data().payerId)) {
                                payment = {
                                    ...doc.data(),
                                    payer: payer
                                };
                            }
                        } else {
                            payment = {
                                ...doc.data(),
                                payer: new HLBaseUserModel({})
                            };
                        }

                        // Get InvoicePaymentApprover
                        if (doc.data().paymentApproverId) {
                            if (paymentApprover = this.allUsers.find((u) => u.userId === doc.data().paymentApproverId)) {
                                payment = {
                                    ...payment,
                                    paymentApprover: paymentApprover
                                };                            
                            }
                        } else {
                            payment = {
                                ...payment,
                                paymentApprover: new HLBaseUserModel({})
                            };
                        }
                        
                        // Get ServiceProvider
                        if (doc.data().serviceProviderId) {
                            if (serviceProvider = this.allUsers.find((u) => u.userId === doc.data().serviceProviderId)) {
                                payment = {
                                    ...payment,
                                    serviceProvider: serviceProvider
                                };
                            }
                        } else {
                            payment = {
                                ...payment,
                                serviceProvider: new HLBaseUserModel({})
                            };
                        }
                        

                        this.payments.push(new HLPaymentModel(doc.id, payment));
                    });

                    // console.log('Returned payment list => ', this.payments);

                    this.onInvoicePaymentsChanged.next(this.payments);
                    resolve(this.payments);
            
                }, reject);
            }
        });
    }
    
    /**
     * Update payment
     *
     * @param payment
     * @returns {Promise<any>}
     */
    updateInvoicePayment(paymentForm): Promise<any>
    {
        const newInvoicePayment = {            
            uid:                  paymentForm.uid,                        
            invoiceId:            paymentForm.invoiceId,
            payerId:              paymentForm.payerId,
            serviceProviderId:    paymentForm.serviceProviderId,
            paymentApproverId:    paymentForm.paymentApproverId,
            isPaidOutsideApp:     paymentForm.isPaidOutsideApp === 'true' ? true : false,
            tip:                  paymentForm.tip,            
            amount:               paymentForm.amount
            // 'createdAt' : Date.now()
        };
        return new Promise((resolve, reject) => {
            console.log(newInvoicePayment);
            const docRef = this.db.collection(COLLECTION_PAYMENTS).doc(newInvoicePayment.uid);
            docRef.update(newInvoicePayment)
            .then(() =>  {
                console.log('Document successfully updated!');
                const index = this.payments.findIndex((n) => n.uid === newInvoicePayment.uid);
                // get payer, service provider, payment approver user information
                let payer = new HLBaseUserModel({}),
                    serviceProvider = new HLBaseUserModel({}),
                    paymentApprover  = new HLBaseUserModel({});

                if (newInvoicePayment.payerId) {
                    payer = this.allUsers.find((u) => u.userId === newInvoicePayment.payerId);
                }

                if (newInvoicePayment.serviceProviderId) {
                    serviceProvider = this.allUsers.find((u) => u.userId === newInvoicePayment.serviceProviderId);
                }

                if (newInvoicePayment.paymentApproverId) {
                    paymentApprover = this.allUsers.find((u) => u.userId === newInvoicePayment.paymentApproverId);
                }
                
                // remove old payment and add updated payment
                this.payments.splice(index, 1, new HLPaymentModel(newInvoicePayment.uid, {...newInvoicePayment, payer, serviceProvider, paymentApprover}));
                this.onInvoicePaymentsChanged.next(this.payments);
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }
    /**
     * Create payment
     *
     * @param payment
     * @returns {Promise<any>}
     */
    createInvoicePayment(payment): Promise<any>
    {
        const newInvoicePayment = {            
            // uid:                  paymentForm.uid,                        
            invoiceId:            payment.invoiceId,
            payerId:              payment.payerId,
            serviceProviderId:    payment.serviceProviderId,
            paymentApproverId:    payment.paymentApproverId,
            isPaidOutsideApp:     payment.isPaidOutsideApp === 'true' ? true : false,
            tip:                  payment.tip,            
            amount:               payment.amount,
            createdAt: Date.now()
        };
        console.log(newInvoicePayment);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_PAYMENTS);
            collectionRef
                .add(newInvoicePayment)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    newInvoicePayment['uid'] = docRef.id;
                    // get payer, service provider, payment approver user information
                    let payer = new HLBaseUserModel({}),
                        serviceProvider = new HLBaseUserModel({}),
                        paymentApprover  = new HLBaseUserModel({});

                    if (newInvoicePayment.payerId) {
                        payer = this.allUsers.find((u) => u.userId === newInvoicePayment.payerId);
                    }

                    if (newInvoicePayment.serviceProviderId) {
                        serviceProvider = this.allUsers.find((u) => u.userId === newInvoicePayment.serviceProviderId);
                    }

                    if (newInvoicePayment.paymentApproverId) {
                        paymentApprover = this.allUsers.find((u) => u.userId === newInvoicePayment.paymentApproverId);
                    }  
                    
                    this.payments.push(new HLPaymentModel(docRef.id, {...newInvoicePayment, payer, serviceProvider, paymentApprover}));                    
                    console.log(newInvoicePayment);
                    this.onInvoicePaymentsChanged.next(this.payments);
                    resolve();
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Delete payment
     *
     * @param payment
     */
    deleteInvoicePayment(payment): void
    {
        console.log(payment);
        this.db.collection(COLLECTION_PAYMENTS)
            .doc(payment.uid)
            .delete()
            .then(() => {
                console.log('Document successfully deleted!');
                const paymentIndex = this.payments.indexOf(payment);
                this.payments.splice(paymentIndex, 1);
                this.onInvoicePaymentsChanged.next(this.payments);
        }).catch(error => {
            console.error('Error removing document: ', error);
        });
    }

}
