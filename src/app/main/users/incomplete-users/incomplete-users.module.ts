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

import { IncompleteUserListComponent } from 'app/main/users/incomplete-users/incomplete-user-list/incomplete-user-list.component';
import { IncompleteUserListService } from 'app/main/users/incomplete-users/incomplete-user-list/incomplete-user-list.service';
import { IncompleteUserComponent } from 'app/main/users/incomplete-users/incomplete-user/incomplete-user.component';
import { IncompleteUserService } from 'app/main/users/incomplete-users/incomplete-user/incomplete-user.service';
import { IncompleteUserListSelectedBarComponent } from './selected-bar/selected-bar.component';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [    
    {
        path     : 'list/:uid',
        component: IncompleteUserComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: IncompleteUserService
        }
    },
    {
        path     : 'new',
        component: IncompleteUserComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: IncompleteUserService
        }
    },
    {
        path     : 'list',
        component: IncompleteUserListComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: IncompleteUserListService
        }
    }
];

@NgModule({
    declarations: [
        IncompleteUserListComponent,
        IncompleteUserComponent,
        IncompleteUserListSelectedBarComponent
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
        IncompleteUserListService,
        IncompleteUserService,
        AuthGuard,
        AuthService
    ]
})
export class IncompleteUsersModule
{
}
