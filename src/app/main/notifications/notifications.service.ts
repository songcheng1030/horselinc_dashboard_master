import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HLNotificationModel } from 'app/model/notifications';
import { HLBaseUserModel } from 'app/model/users';

import { AngularFirestore } from '@angular/fire/firestore';
import { COLLECTION_NOTIFICATIONS, COLLECTION_USERS } from 'app/utils/constants';

@Injectable()
export class NotificationsService implements Resolve<any>
{
    onNotificationsChanged: BehaviorSubject<any>;
    onSelectedNotificationsChanged: BehaviorSubject<any>;
    onUserListChanged: BehaviorSubject<any>;
    
    notifications: HLNotificationModel[] = [];
    users: HLBaseUserModel[] = [];
    selectedNotifications: string[] = [];
    filteredNotifications: any[] = [];
    curPageNotifications: any[] = [];
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
        this.onNotificationsChanged = new BehaviorSubject([]);
        this.onSelectedNotificationsChanged = new BehaviorSubject([]);        
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
                this.getNotifications()
            ]).then(
                () => {
                    resolve();
                },
                reject
            );
        });
    }

    // set filtered all notifications data.
    setFilteredNotifications(notifications): void {
        // console.log('Changed filtered notifications');
        this.filteredNotifications = notifications;
    }

    setCurPageNotifications(notifications): void {
        // console.log('Changed current page notifications');
        this.curPageNotifications = notifications;        
    }

    /**
     * Get notifications
     *
     * @returns {Promise<any>}
     */
    getNotifications(): Promise<any>
    {
        this.notifications = [];
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_NOTIFICATIONS).get();
            collectionRef.subscribe((snapshots) => {
                const notificationList = snapshots;
                // console.log('notification collection', notificationList);                                
                // get receiver user information
                notificationList.forEach(doc => {
                    let recipient: any;
                    if (recipient = this.users.find((u) => u.userId === doc.data().receiverId)) {
                        const notification = {
                            ...doc.data(),
                            recipient: recipient
                        };
                        this.notifications.push(new HLNotificationModel(doc.id, notification));
                    }
                });
                this.onNotificationsChanged.next(this.notifications);
                resolve(this.notifications);
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
     * Toggle selected notification by id when click check box of notification item
     *
     * @param id
     */
    toggleSelectedNotification(uid): void
    {
        // First, check if we already have that notification as selected...
        if ( this.selectedNotifications.length > 0 )
        {
            const index = this.selectedNotifications.indexOf(uid);
            if ( index !== -1 )
            {
                this.selectedNotifications.splice(index, 1);

                // Trigger the next event
                this.onSelectedNotificationsChanged.next(this.selectedNotifications);

                // Return
                return;
            }
        }

        // If we don't have it, push as selected
        this.selectedNotifications.push(uid);
        // Trigger the next event
        this.onSelectedNotificationsChanged.next(this.selectedNotifications);
    }

    /**
     * Select all notifications
     *
     * @param filterParameter
     * @param filterValue
     */
    selectNotifications(allPage?): void
    {
        this.selectedNotifications = [];
        if (allPage) {
            // select all filtered notifications
            this.filteredNotifications.map( (notification) => {
                this.selectedNotifications.push(notification.uid);                
            });
        } else {
            this.curPageNotifications.map( (notification) => {
                // select notifications of current page
                this.selectedNotifications.push(notification.uid);
            });
        }
        console.log(this.selectedNotifications);
        // Trigger the next event
        this.onSelectedNotificationsChanged.next(this.selectedNotifications);
    }

    /**
     * Update notification
     *
     * @param notification
     * @returns {Promise<any>}
     */
    updateNotification(notificationForm): Promise<any>
    {
        const creator = this.users.find(value => value.userId === notificationForm.creatorId);
        const newNotification = {            
            uid:        notificationForm.uid,                        
            message:    notificationForm.message,
            receiverId: notificationForm.receiverId,
            isRead :    notificationForm.isRead === 'true' ? true : false,
            creator :   creator.toJSON(),
            // createdAt : notificationForm.createdAt,
            updatedAt : Date.now()
        };
        return new Promise((resolve, reject) => {
            console.log(newNotification);
            const docRef = this.db.collection(COLLECTION_NOTIFICATIONS).doc(newNotification.uid);
            docRef.update(newNotification)
            .then(() =>  {
                console.log('Document successfully updated!');
                const index = this.notifications.findIndex((n) => n.uid === newNotification.uid);
                // get receiver user information                    
                const recipient = this.users.find((u) => u.userId === newNotification.receiverId);
                // remove old notification and add updated notification
                this.notifications.splice(index, 1, new HLNotificationModel(newNotification.uid, {...newNotification, recipient}));
                this.onNotificationsChanged.next(this.notifications);
                resolve();
            }).catch( error => {
                console.error('Error updating document: ', error);
                reject();
            });
        });
    }
    /**
     * Create notification
     *
     * @param notification
     * @returns {Promise<any>}
     */
    createNotification(notification): Promise<any>
    {
        const creator = this.users.find(value => value.userId === notification.creatorId);     
        console.log(creator.toJSON());   
        const newNotification = {            
            // 'uid': notification.uid,                     
            message: notification.message,
            receiverId: notification.receiverId,
            isRead :    notification.isRead === 'true' ? true : false,
            creator :   creator.toJSON(),
            createdAt : Date.now(),
            updatedAt : Date.now()
        };
        console.log(newNotification);
        return new Promise((resolve, reject) => {
            const collectionRef = this.db.collection(COLLECTION_NOTIFICATIONS);
            collectionRef
                .add(newNotification)
                .then(docRef => {
                    console.log('Document written with ID: ', docRef.id);
                    newNotification['uid'] = docRef.id;
                    const recipient = this.users.find((u) => u.userId === newNotification.receiverId);
                    this.notifications.push(new HLNotificationModel(docRef.id, {...newNotification, recipient}));
                    console.log(newNotification);
                    this.onNotificationsChanged.next(this.notifications);
                    resolve();
                })
                .catch( error => {
                    console.error('Error adding document: ', error);
                    reject();
                });
        });
    }

    /**
     * Deselect notifications
     */
    deselectNotifications(): void
    {
        this.selectedNotifications = [];

        // Trigger the next event
        this.onSelectedNotificationsChanged.next(this.selectedNotifications);
    }

    /**
     * Delete notification
     *
     * @param notification
     */
    deleteNotification(notification): void
    {
        console.log(notification);
        this.db.collection(COLLECTION_NOTIFICATIONS)
            .doc(notification.uid)
            .delete()
            .then(() => {
                console.log('Document successfully deleted!');
                const notificationIndex = this.notifications.indexOf(notification);
                this.notifications.splice(notificationIndex, 1);
                this.onNotificationsChanged.next(this.notifications);
        }).catch(error => {
            console.error('Error removing document: ', error);
        });
    }

    /**
     * Delete selected notifications
     */
    deleteSelectedNotifications(): void
    {
        const promises: any[] = [];

        for ( const notificationId of this.selectedNotifications )
        {
            promises.push(this.db.collection(COLLECTION_NOTIFICATIONS).doc(notificationId).delete());
            const notification = this.notifications.find(_notification => {
                return _notification.uid === notificationId;
            });
            const notificationIndex = this.notifications.indexOf(notification);
            this.notifications.splice(notificationIndex, 1);
        }
        Promise.all(promises);
        this.onNotificationsChanged.next(this.notifications);
        this.deselectNotifications();
    }

}
