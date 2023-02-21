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

import { RequestListComponent } from 'app/main/requests/request-list/request-list.component';
import { RequestListService } from 'app/main/requests/request-list/request-list.service';
import { RequestComponent } from 'app/main/requests/request/request.component';
import { RequestService } from 'app/main/requests/request/request.service';
import { RequestListSelectedBarComponent } from './selected-bar/selected-bar.component';

import { ListenersComponent } from 'app/main/requests/listeners/listeners.component';
import { ListenersService } from 'app/main/requests/listeners/listeners.service';
import { ListenerFormDialogComponent } from 'app/main/requests/listeners/listener-form/listener-form.component';

import { ServicesComponent } from 'app/main/requests/services/services.component';
import { ServicesService } from 'app/main/requests/services/services.service';
import { ServiceFormDialogComponent } from 'app/main/requests/services/service-form/service-form.component';

import { AuthGuard } from 'app/main/auth/auth.guard';
import { AuthService } from 'app/main/auth/auth.service';

const routes: Routes = [    
    {
        path     : 'list/:uid',
        component: RequestComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: RequestService
        }
    },
    {
        path     : 'new/:invoiceId',
        component: RequestComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: RequestService
        }
    },
    {
        path     : 'list',
        component: RequestListComponent,
        canActivate: [AuthGuard],
        resolve  : {
            data: RequestListService
        }
    }
];

@NgModule({
    declarations: [
        RequestListComponent,
        RequestComponent,
        RequestListSelectedBarComponent,
        ListenersComponent,
        ListenerFormDialogComponent,
        ServicesComponent,
        ServiceFormDialogComponent
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
        RequestListService,
        RequestService,
        ListenersService,
        ServicesService,
        AuthGuard,
        AuthService
    ],
    entryComponents: [
        ListenerFormDialogComponent,
        ServiceFormDialogComponent
    ]
})
export class RequestsModule
{
}
