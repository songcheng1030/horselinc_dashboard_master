import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HLPaymentModel } from 'app/model/payments';
import { HLBaseUserModel } from 'app/model/users';

import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_PAYMENTS, COLLECTION_USERS } from 'app/utils/constants';

@Injectable()
export class PaymentsService implements Resolve<any>
{
    onPaymentsChanged: BehaviorSubject<any>;
    onSelectedPaymentsChanged: BehaviorSubject<any>;
    onUserListChanged: BehaviorSubject<any>;
    
    payments: HLPaymentModel[] = [];
    users: HLBaseUserModel[] = [];
    selectedPayments: string[] = [];
    filteredPayments: any[] = [];
    curPagePayments: any[] = [];
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
        this.onPaymentsChanged = new BehaviorSubject([]);
        this.onSelectedPaymentsChanged = new BehaviorSubject([]);        
        this.onUserListChanged = new BehaviorSubject([]);
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
                this.getUserList(),
                this.getPayments()
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    // set filtered all payments data.
    setFilteredPayments(payments): void {
        // console.log('Changed filtered payments');
        this.filteredPayments = payments;
    }

    setCurPagePayments(payments): void {
        // console.log('Changed current page payments');
        this.curPagePayments = payments;        
    }

    /**
     * Get payments
     *
     * @returns {Promise<any>}
     */
    getPayments(): Promise<any>
    {
        this.payments = [];
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_PAYMENTS).get();
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
                        if (payer = this.users.find((u) => u.userId === doc.data().payerId)) {
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

                    // Get PaymentApprover
                    if (doc.data().paymentApproverId) {
                        if (paymentApprover = this.users.find((u) => u.userId === doc.data().paymentApproverId)) {
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
                        if (serviceProvider = this.users.find((u) => u.userId === doc.data().serviceProviderId)) {
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
                    
                    if (payment) this.payments.push(new HLPaymentModel(doc.id, payment));
                        
                });

                // console.log('Returned payment list => ', this.payments);

                this.onPaymentsChanged.next(this.payments);
                resolve(this.payments);
            }, reject);
        });
    }
    
    /**
     * Get user list data
     *
     * @returns {Promise<any>}
     */
    getUserList(): Promise<any>
    {
        this.users = [];
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_USERS).get();
            collectionRef.subscribe((snapshots) => {
                const userList = snapshots;
                // console.log('users collection', userList);                
                // get receiver user information                
                userList.forEach(doc => {
                    let user: any;
                    if ( doc.data().horseManager ) {
                        user = {
                                userId: doc.data().uid,
                                name: doc.data().horseManager.name,
                                avatarUrl: doc.data().horseManager.avatarUrl,
                                phone: doc.data().horseManager.phone,
                                location: doc.data().horseManager.location,
                                createdAt: doc.data().createdAt,
                        }; 
                    }  else if (doc.data().serviceProvider) {
                        user = {
                            userId: doc.data().uid,
                            name: doc.data().serviceProvider.name,
                            avatarUrl: doc.data().serviceProvider.avatarUrl,
                            phone: doc.data().serviceProvider.phone,
                            location: doc.data().serviceProvider.location,
                            createdAt: doc.data().createdAt,
                        }; 
                    }
                    this.users.push(new HLBaseUserModel(user));
                    
                });               
                // console.log(this.users);
                this.onUserListChanged.next(this.users);
                resolve(this.users);
            }, reject);
        });
    }

    /**
     * Toggle selected payment by id when click check box of payment item
     *
     * @param id
     */
    toggleSelectedPayment(uid): void
    {
        // First, check if we already have that payment as selected...
        if ( this.selectedPayments.length > 0 )
        {
            const index = this.selectedPayments.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedPayments.splice(index, 1);

                // Trigger the next event
                this.onSelectedPaymentsChanged.next(this.selectedPayments);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedPayments.push(uid);
        // Trigger the next event
        this.onSelectedPaymentsChanged.next(this.selectedPayments);
    }

    /**
     * Select all payments on payment list
     *
     * @param filterParameter
     * @param filterValue
     */
    selectPayments(allPage?): void
    {
        this.selectedPayments = [];
        if (allPage) {
            // select all filtered payments
            this.filteredPayments.map( (payment) => {
                this.selectedPayments.push(payment.uid);                
            });
        } else {
            this.curPagePayments.map( (payment) => {
                // select payments of current page
                this.selectedPayments.push(payment.uid);
            });
        }
        console.log(this.selectedPayments);
        // Trigger the next event
        this.onSelectedPaymentsChanged.next(this.selectedPayments);
    }

    /**
     * Update payment
     *
     * @param payment
     * @returns {Promise<any>}
     */
    updatePayment(paymentForm): Promise<any>
    {
        const newPayment = {            
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
            console.log(newPayment);
            const docRef = this.db.collection(COLLECTION_PAYMENTS).doc(newPayment.uid);
            docRef.update(newPayment)
            .then(() =>  {
                console.log('Document successfully updated!');
                const index = this.payments.findIndex((n) => n.uid === newPayment.uid);
                // get payer, service provider, payment approver user information
                let payer = new HLBaseUserModel({}),
                    serviceProvider = new HLBaseUserModel({}),
                    paymentApprover  = new HLBaseUserModel({});

                if (newPayment.payerId) {
                    payer = this.users.find((u) => u.userId === newPayment.payerId);
                }

                if (newPayment.serviceProviderId) {
                    serviceProvider = this.users.find((u) => u.userId === newPayment.serviceProviderId);
                }

                if (newPayment.paymentApproverId) {
                    paymentApprover = this.users.find((u) => u.userId === newPayment.paymentApproverId);
                }
                
                // remove old payment and add updated payment
                this.payments.splice(index, 1, new HLPaymentModel(newPayment.uid, {...newPayment, payer, serviceProvider, paymentApprover}));
                this.onPaymentsChanged.next(this.payments);
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
    createPayment(payment): Promise<any>
    {
        const newPayment = {            
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
        console.log(newPayment);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_PAYMENTS);
            collectionRef
                .add(newPayment)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    newPayment['uid'] = docRef.id;
                    // get payer, service provider, payment approver user information
                    let payer = new HLBaseUserModel({}),
                        serviceProvider = new HLBaseUserModel({}),
                        paymentApprover  = new HLBaseUserModel({});

                    if (newPayment.payerId) {
                        payer = this.users.find((u) => u.userId === newPayment.payerId);
                    }

                    if (newPayment.serviceProviderId) {
                        serviceProvider = this.users.find((u) => u.userId === newPayment.serviceProviderId);
                    }

                    if (newPayment.paymentApproverId) {
                        paymentApprover = this.users.find((u) => u.userId === newPayment.paymentApproverId);
                    }  
                    
                    this.payments.push(new HLPaymentModel(docRef.id, {...newPayment, payer, serviceProvider, paymentApprover}));                    
                    console.log(newPayment);
                    this.onPaymentsChanged.next(this.payments);
                    resolve();
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Deselect payments
     */
    deselectPayments(): void
    {
        this.selectedPayments = [];

        // Trigger the next event
        this.onSelectedPaymentsChanged.next(this.selectedPayments);
    }

    /**
     * Delete payment
     *
     * @param payment
     */
    deletePayment(payment): void
    {
        console.log(payment);
        this.db.collection(COLLECTION_PAYMENTS)
            .doc(payment.uid)
            .delete()
            .then(() => {
                console.log('Document successfully deleted!');
                const paymentIndex = this.payments.indexOf(payment);
                this.payments.splice(paymentIndex, 1);
                this.onPaymentsChanged.next(this.payments);
        }).catch(error => {
            console.error('Error removing document: ', error);
        });
    }

    /**
     * Delete selected payments
     */
    deleteSelectedPayments(): void
    {
        const promises: any[] = [];

        for ( const paymentId of this.selectedPayments )
        {
            promises.push(this.db.collection(COLLECTION_PAYMENTS).doc(paymentId).delete());
            const payment = this.payments.find(_payment => {
                return _payment.uid === paymentId;
            });
            const paymentIndex = this.payments.indexOf(payment);
            this.payments.splice(paymentIndex, 1);
        }
        Promise.all(promises);
        this.onPaymentsChanged.next(this.payments);
        this.deselectPayments();
    }

}
