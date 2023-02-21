import { MatSelectSearchModule } from 'app/utils/mat-select-search/mat-select-search.module';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    MatButtonModule, MatChipsModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatRippleModule, MatSelectModule, MatSnackBarModule,
    MatSortModule, MatRadioModule, MatSlideToggleModule, MatToolbarModule, MatDialogModule,
    MatTableModule, MatTabsModule, MatCheckboxModule, MatMenuModule, MatOptionModule, MatProgressBarModule 
} from '@angular/material';

import { ImageCropperModule } from 'ngx-image-cropper';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseWidgetModule } from '@fuse/components/widget/widget.module';
import { FuseConfirmDialogModule } from '@fuse/components';

import { HorseManagerListComponent } from 'app/main/users/horse-managers/horse-manager-list/horse-manager-list.component';
import { HorseManagerListService } from 'app/main/users/horse-managers/horse-manager-list/horse-manager-list.service';
import { HorseManagerComponent } from 'app/main/users/horse-managers/horse-manager/horse-manager.component';
import { HorseManagerService } from 'app/main/users/horse-managers/horse-manager/horse-manager.service';
import { HorseManagerListSelectedBarComponent } from './selected-bar/selected-bar.component';

import { PaymentApproversComponent } from 'app/main/users/horse-managers/payment-approvers/payment-approvers.component';
import { PaymentApproversService } from 'app/main/users/horse-managers/payment-approvers/payment-approvers.service';
import { PaymentApproverFormDialogComponent } from 'app/main/users/horse-managers/payment-approvers/payment-approver-form/payment-approver-form.component';

import { ManagerProvidersComponent } from 'app/main/users/horse-managers/manager-providers/manager-providers.component';
import { ManagerProvidersService } from 'app/main/users/horse-managers/manager-providers/manager-providers.service';
import { ManagerProviderFormDialogComponent } from 'app/main/users/horse-managers/manager-providers/manager-provider-form/manager-provider-form.component';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [    
    {
        path     : 'new',
        component: HorseManagerComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: HorseManagerService
        }
    },
    {
        path     : 'list/:uid',        
        component: HorseManagerComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: HorseManagerService
        }
    },
    {
        path     : 'list',
        component: HorseManagerListComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: HorseManagerListService
        }
    }
];

@NgModule({
    declarations: [
        HorseManagerListComponent,
        HorseManagerComponent,
        HorseManagerListSelectedBarComponent,
        ManagerProvidersComponent,
        ManagerProviderFormDialogComponent,
        PaymentApproversComponent,
        PaymentApproverFormDialogComponent
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

        ImageCropperModule,

        FuseSharedModule,
        FuseWidgetModule,
        FuseConfirmDialogModule,

        // Mat-select-search
        MatSelectSearchModule
    ],
    providers   : [
        HorseManagerListService,
        HorseManagerService,
        ManagerProvidersService,
        PaymentApproversService,
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        ManagerProviderFormDialogComponent,
        PaymentApproverFormDialogComponent
    ]
})
export class HorseManagersModule
{
}
