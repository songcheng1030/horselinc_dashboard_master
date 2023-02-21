import {HLServiceRequestModel} from './service-requests';
import {HLInvoiceStatus} from './enumerations';
import {HLHorseManagerModel, HLHorseManagerPaymentApproverModel, HLListenerUserModel} from './users';
import * as moment from 'moment';

export class HLInvoiceModel {
    uid: string;
    name: string;
    requestIds: string[];
    requests?: HLServiceRequestModel[]; // no need to upload
    payers?: HLHorseManagerModel[]; // no need to upload
    paymentApprovers?: HLHorseManagerPaymentApproverModel[]; // no need to upload
    amount: number; // no need to upload
    tip: number;
    status: HLInvoiceStatus;

    listenerUsers?: HLListenerUserModel[];

    paidAt?: string;
    createdAt: string;
    updatedAt: string;

    constructor(uid: string, data: any) {
        this.uid = uid || '';
        this.name = data.name || '';
        this.requestIds = data.requestIds || [];
        this.amount = data.amount || 0;
        this.tip = data.tip || 0;
        this.status = data.status || null;

        this.listenerUsers = data.listenerUsers;
        if (data.updatedAt) {
            this.updatedAt = moment(new Date(data.updatedAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.updatedAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
        if (data.createdAt) {
            this.createdAt = moment(new Date(data.createdAt)).format('MM/DD/YYYY h:mm A');
        } else {
            this.createdAt = moment(new Date()).format('MM/DD/YYYY h:mm A');
        }
        if (data.paidAt) {
            this.paidAt = moment(new Date(data.paidAt)).format('MM/DD/YYYY');
        } else {
            this.paidAt = moment(new Date()).format('MM/DD/YYYY');
        }
        
    }

    toJSON() {
        const dicObject = Object.assign({}, this, {
            requests: this.requests ? this.requests.map(value => value.toJSON()) : undefined,
            payers: this.payers ? this.payers.map(value => value.toJSON()) : undefined,
            paymentApprovers: this.paymentApprovers ? this.paymentApprovers.map(value => value.toJSON()) : undefined,
            paidAt: this.paidAt ? moment(this.paidAt).get('second') : undefined,
            createdAt: moment(this.createdAt).get('second')
        });
        return JSON.parse(JSON.stringify(dicObject));
    }
}