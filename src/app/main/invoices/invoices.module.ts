import { MatSelectSearchModule } from 'app/utils/mat-select-search/mat-select-search.module';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    MatButtonModule, MatChipsModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatRippleModule, MatSelectModule, MatSnackBarModule,
    MatSortModule, MatRadioModule, MatSlideToggleModule, MatToolbarModule, MatDialogModule,
    MatTableModule, MatTabsModule, MatCheckboxModule, MatMenuModule, MatOptionModule, MatProgressBarModule 
} from '@angular/material';

import {MatDatepickerModule} from '@angular/material/datepicker';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseWidgetModule } from '@fuse/components/widget/widget.module';
import { FuseConfirmDialogModule } from '@fuse/components';

import { InvoiceListComponent } from 'app/main/invoices/invoice-list/invoice-list.component';
import { InvoiceListService } from 'app/main/invoices/invoice-list/invoice-list.service';
import { InvoiceComponent } from 'app/main/invoices/invoice/invoice.component';
import { InvoiceService } from 'app/main/invoices/invoice/invoice.service';
import { InvoiceListSelectedBarComponent } from './selected-bar/selected-bar.component';

import { InvoicePaymentsComponent } from 'app/main/invoices/invoice-payments/invoice-payments.component';
import { InvoicePaymentsService } from 'app/main/invoices/invoice-payments/invoice-payments.service';
import { InvoicePaymentFormDialogComponent } from 'app/main/invoices/invoice-payments/invoice-payment-form/invoice-payment-form.component';

import { InvoiceRequestsComponent } from 'app/main/invoices/invoice-requests/invoice-requests.component';
import { InvoiceRequestsService } from 'app/main/invoices/invoice-requests/invoice-requests.service';



import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [    
    {
        path     : 'list/:uid',
        component: InvoiceComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: InvoiceService
        }
    },
    {
        path     : 'new',
        component: InvoiceComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: InvoiceService
        }
    },
    {
        path     : 'list',
        component: InvoiceListComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: InvoiceListService
        }
    }
];

@NgModule({
    declarations: [
        InvoiceListComponent,
        InvoiceComponent,
        InvoiceListSelectedBarComponent,
        InvoicePaymentsComponent,
        InvoicePaymentFormDialogComponent,        
        InvoiceRequestsComponent
    ],
    imports     : [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatChipsModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatRippleModule,
        MatSelectModule,
        MatSortModule,
        MatSnackBarModule,
        MatTableModule,
        MatTabsModule,
        MatRadioModule,
        MatSlideToggleModule,
        MatToolbarModule,
        MatDialogModule,
        MatCheckboxModule,
        MatMenuModule,
        MatOptionModule,
        MatProgressBarModule,

        MatDatepickerModule,

        FuseSharedModule,
        FuseWidgetModule,
        FuseConfirmDialogModule,

        // Mat-select-search
        MatSelectSearchModule
    ],
    providers   : [
        InvoiceListService,
        InvoiceService,
        InvoicePaymentsService,
        InvoiceRequestsService,
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        InvoicePaymentFormDialogComponent
    ]
})
export class InvoicesModule
{
}
