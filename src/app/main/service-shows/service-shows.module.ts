import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
    MatButtonModule, MatCheckboxModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatRippleModule, MatTableModule, MatToolbarModule,
    MatPaginatorModule, MatSortModule, MatSnackBarModule
} from '@angular/material';

import { FuseSharedModule } from '@fuse/shared.module';
import { FuseConfirmDialogModule, FuseSidebarModule } from '@fuse/components';

import { ServiceShowsComponent } from 'app/main/service-shows/service-shows.component';
import { ServiceShowsService } from 'app/main/service-shows/service-shows.service';
import { ServiceShowListComponent } from 'app/main/service-shows/service-show-list/service-show-list.component';
import { ServiceShowsSelectedBarComponent } from 'app/main/service-shows/selected-bar/selected-bar.component';
import { ServiceShowFormDialogComponent } from 'app/main/service-shows/service-show-form/service-show-form.component';

import { MatSelectSearchModule } from 'app/utils/mat-select-search/mat-select-search.module';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [
    {
        path     : '**',
        component: ServiceShowsComponent,
        canActivate: [AuthGuard],
        resolve  : {
            serviceShows: ServiceShowsService
        }
    }
];

@NgModule({
    declarations   : [
        ServiceShowsComponent,
        ServiceShowListComponent,
        ServiceShowsSelectedBarComponent,
        ServiceShowFormDialogComponent
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
        MatSnackBarModule,

        FuseSharedModule,
        FuseConfirmDialogModule,

        // Mat-select-search
        MatSelectSearchModule
        
    ],
    providers      : [
        ServiceShowsService,      
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        ServiceShowFormDialogComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ServiceShowsModule
{
}
