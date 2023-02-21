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

import { ServiceProviderListComponent } from 'app/main/users/service-providers/service-provider-list/service-provider-list.component';
import { ServiceProviderListService } from 'app/main/users/service-providers/service-provider-list/service-provider-list.service';
import { ServiceProviderComponent } from 'app/main/users/service-providers/service-provider/service-provider.component';
import { ServiceProviderService } from 'app/main/users/service-providers/service-provider/service-provider.service';
import { ServiceProviderListSelectedBarComponent } from './selected-bar/selected-bar.component';

import { ProviderServicesComponent } from 'app/main/users/service-providers/provider-services/provider-services.component';
import { ProviderServicesService } from 'app/main/users/service-providers/provider-services/provider-services.service';
import { ProviderServiceFormDialogComponent } from 'app/main/users/service-providers/provider-services/provider-service-form/provider-service-form.component';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [    
    {
        path     : 'list/:uid',
        component: ServiceProviderComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: ServiceProviderService
        }
    },
    {
        path     : 'new',
        component: ServiceProviderComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: ServiceProviderService
        }
    },
    {
        path     : 'list',
        component: ServiceProviderListComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: ServiceProviderListService
        }
    }
];

@NgModule({
    declarations: [
        ServiceProviderListComponent,
        ServiceProviderComponent,
        ServiceProviderListSelectedBarComponent,
        ProviderServicesComponent,
        ProviderServiceFormDialogComponent
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
        ServiceProviderListService,
        ServiceProviderService,
        ProviderServicesService,
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        ProviderServiceFormDialogComponent
    ]
})
export class ServiceProvidersModule
{
}
