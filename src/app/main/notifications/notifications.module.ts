import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    MatButtonModule, MatCheckboxModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatRippleModule, MatTableModule, MatToolbarModule,
    MatPaginatorModule, MatSortModule, MatOptionModule, MatSelectModule, MatRadioModule, MatSnackBarModule
} from '@angular/material';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseConfirmDialogModule, FuseSidebarModule } from '@fuse/components';

import { NotificationsComponent } from 'app/main/notifications/notifications.component';
import { NotificationsService } from 'app/main/notifications/notifications.service';
import { NotificationListComponent } from 'app/main/notifications/notification-list/notification-list.component';
import { NotificationsSelectedBarComponent } from 'app/main/notifications/selected-bar/selected-bar.component';
import { NotificationFormDialogComponent } from 'app/main/notifications/notification-form/notification-form.component';

import { MatSelectSearchModule } from 'app/utils/mat-select-search/mat-select-search.module';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [
    {
        path     : '**',
        component: NotificationsComponent,
        canActivate: [AuthGuard],
        resolve  : {
            notifications: NotificationsService
        }
    }
];

@NgModule({
    declarations   : [
        NotificationsComponent,
        NotificationListComponent,
        NotificationsSelectedBarComponent,
        NotificationFormDialogComponent
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
        NotificationsService,      
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        NotificationFormDialogComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NotificationsModule
{
}
