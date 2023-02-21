import { FuseConfirmDialogModule } from '@fuse/components';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule, MatChipsModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatRippleModule, MatSelectModule, MatSnackBarModule,
         MatSortModule, MatRadioModule, MatSlideToggleModule, MatToolbarModule, MatDialogModule, MatStepperModule,
         MatTableModule, MatTabsModule, MatCheckboxModule, MatMenuModule, MatOptionModule, MatProgressBarModule 
       } from '@angular/material';

import { FuseSharedModule } from '@fuse/shared.module';
import { SettingsComponent } from 'app/main/settings/settings.component';
import { SettingsService } from './settings.service';
import { AuthGuard } from './../auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';
import { ServiceTypeFormDialogComponent } from 'app/main/settings/service-types/service-type-form/service-type-form.component';
import { ServiceTypesComponent } from 'app/main/settings/service-types/service-types.component';

const routes: Routes = [
    {
        path     : '**',
        component: SettingsComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: SettingsService
        }
    }
];

@NgModule({
    declarations: [
        SettingsComponent,
        ServiceTypesComponent,
        ServiceTypeFormDialogComponent,
    ],
    imports     : [
        RouterModule.forChild(routes),

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatToolbarModule,

        FuseSharedModule,
        FuseConfirmDialogModule,
    ],
    providers      : [
        SettingsService,      
        AuthGuard,
        AuthService,
    ],
    entryComponents: [
        ServiceTypeFormDialogComponent
    ]
})
export class SettingsModule
{
}
