import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { TranslateModule } from '@ngx-translate/core';
import 'hammerjs';

import { FuseModule } from '@fuse/fuse.module';
import { FuseSharedModule } from '@fuse/shared.module';
import { FuseProgressBarModule, FuseSidebarModule, FuseThemeOptionsModule } from '@fuse/components';

import { fuseConfig } from 'app/fuse-config';

import { FakeDbService } from 'app/fake-db/fake-db.service';
import { AppComponent } from 'app/app.component';
import { LayoutModule } from 'app/layout/layout.module';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule, FirestoreSettingsToken } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { environment } from '../environments/environment';


const appRoutes: Routes = [
    {
        path        : 'users/horse-managers',
        loadChildren: './main/users/horse-managers/horse-managers.module#HorseManagersModule'             
    },
    {
        path        : 'users/service-providers',
        loadChildren: './main/users/service-providers/service-providers.module#ServiceProvidersModule'             
    },
    {
        path        : 'users/incomplete-users',
        loadChildren: './main/users/incomplete-users/incomplete-users.module#IncompleteUsersModule'             
    },
    {
        path        : 'horses',
        loadChildren: './main/horses/horses.module#HorsesModule'             
    }, 
    {
        path        : 'payments',
        loadChildren: './main/payments/payments.module#PaymentsModule'        
    },
    {
        path        : 'invoices',
        loadChildren: './main/invoices/invoices.module#InvoicesModule'        
    },
    {
        path        : 'requests',
        loadChildren: './main/requests/requests.module#RequestsModule'        
    }, 
    {
        path        : 'notifications',
        loadChildren: './main/notifications/notifications.module#NotificationsModule'        
    }, 
    {
        path        : 'service-shows',
        loadChildren: './main/service-shows/service-shows.module#ServiceShowsModule'        
    }, 
    {
        path        : 'settings',
        loadChildren: './main/settings/settings.module#SettingsModule'        
    }, 
    {
        path        : 'auth',
        loadChildren: './main/auth/auth.module#AuthModule'
    },
    {
        path      : '**',
        redirectTo: 'auth/login'
    }
];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports     : [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot(appRoutes),

        TranslateModule.forRoot(),
        InMemoryWebApiModule.forRoot(FakeDbService, {
            delay             : 0,
            passThruUnknownUrl: true
        }),
        // Material moment date module
        MatMomentDateModule,

        // Material
        MatButtonModule,
        MatIconModule,

        // Fuse modules
        FuseModule.forRoot(fuseConfig),
        FuseProgressBarModule,
        FuseSharedModule,
        FuseSidebarModule,
        FuseThemeOptionsModule,

        // App modules
        LayoutModule,

        //Firebase module
        AngularFireModule.initializeApp(environment.firebaseConfig),
        AngularFirestoreModule,
        AngularFireAuthModule,
        AngularFireStorageModule
    ],
    bootstrap   : [
        AppComponent
    ],
    providers: [    
        { provide: FirestoreSettingsToken, useValue: {} }
    
    ],
})
export class AppModule
{
}
