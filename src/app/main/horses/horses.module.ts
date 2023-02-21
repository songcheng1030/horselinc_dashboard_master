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

import { HorseListComponent } from 'app/main/horses/horse-list/horse-list.component';
import { HorseListService } from 'app/main/horses/horse-list/horse-list.service';
import { HorseComponent } from 'app/main/horses/horse/horse.component';
import { HorseService } from 'app/main/horses/horse/horse.service';
import { HorseListSelectedBarComponent } from './selected-bar/selected-bar.component';

import { RegistrationsComponent } from 'app/main/horses/registrations/registrations.component';
import { RegistrationsService } from 'app/main/horses/registrations/registrations.service';
import { RegistrationFormDialogComponent } from 'app/main/horses/registrations/registration-form/registration-form.component';

import { OwnersComponent } from 'app/main/horses/owners/owners.component';
import { OwnersService } from 'app/main/horses/owners/owners.service';
import { OwnerFormDialogComponent } from 'app/main/horses/owners/owner-form/owner-form.component';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [    
    {
        path     : 'list/:uid',
        component: HorseComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: HorseService
        }
    },
    {
        path     : 'new',
        component: HorseComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: HorseService
        }
    },
    {
        path     : 'list',
        component: HorseListComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: HorseListService
        }
    }
];

@NgModule({
    declarations: [
        HorseListComponent,
        HorseComponent,
        HorseListSelectedBarComponent,
        RegistrationsComponent,
        RegistrationFormDialogComponent,
        OwnersComponent,
        OwnerFormDialogComponent
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
        HorseListService,
        HorseService,
        RegistrationsService,
        OwnersService,
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        RegistrationFormDialogComponent,
        OwnerFormDialogComponent
    ]
})
export class HorsesModule
{
}
