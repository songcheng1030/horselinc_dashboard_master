import { NgModule } from '@angular/core';

import { LoginModule } from 'app/main/auth/login/login.module';
import { RegisterModule } from 'app/main/auth/register/register.module';
import { ForgotPasswordModule } from 'app/main/auth/forgot-password/forgot-password.module';
import { ResetPasswordModule } from 'app/main/auth/reset-password/reset-password.module';
import { LockModule } from 'app/main/auth/lock/lock.module';
import { MailConfirmModule } from 'app/main/auth/mail-confirm/mail-confirm.module';

import { AuthService } from 'app/main/auth/auth.service';
import { AuthGuard } from 'app/main/auth/auth.guard';

@NgModule({
    imports: [
        // Auth
        LoginModule,
        RegisterModule,
        ForgotPasswordModule,
        ResetPasswordModule,
        LockModule,
        MailConfirmModule
    ],
    providers   : [      
        AuthService,
        AuthGuard    
    ],
})
export class AuthModule
{

}
