import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    MatButtonModule, MatCheckboxModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatRippleModule, MatTableModule, MatToolbarModule,
    MatPaginatorModule, MatSortModule, MatOptionModule, MatSelectModule, MatRadioModule, MatSnackBarModule
} from '@angular/material';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseConfirmDialogModule, FuseSidebarModule } from '@fuse/components';

import { PaymentsComponent } from 'app/main/payments/payments.component';
import { PaymentsService } from 'app/main/payments/payments.service';
import { PaymentListComponent } from 'app/main/payments/payment-list/payment-list.component';
import { PaymentsSelectedBarComponent } from 'app/main/payments/selected-bar/selected-bar.component';
import { PaymentFormDialogComponent } from 'app/main/payments/payment-form/payment-form.component';

import { MatSelectSearchModule } from 'app/utils/mat-select-search/mat-select-search.module';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [
    {
        path     : '**',
        component: PaymentsComponent,
        canActivate: [AuthGuard],
        resolve  : {
            payments: PaymentsService
        }
    }
];

@NgModule({
    declarations   : [
        PaymentsComponent,
        PaymentListComponent,
        PaymentsSelectedBarComponent,
        PaymentFormDialogComponent
    ],
    imports        : [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatRippleModule,
        MatTableModule,
        MatToolbarModule,
        MatPaginatorModule,
        MatSortModule,
        MatOptionModule,
        MatSelectModule,
        MatRadioModule,
        MatSnackBarModule,

        FuseSharedModule,
        FuseConfirmDialogModule,

        // Mat-select-search
        MatSelectSearchModule
        
    ],
    providers      : [
        PaymentsService,      
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        PaymentFormDialogComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PaymentsModule
{
}
