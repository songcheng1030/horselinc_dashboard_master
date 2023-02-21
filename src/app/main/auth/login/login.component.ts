import { environment } from 'environments/environment';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FuseConfigService } from '@fuse/services/config.service';
import { fuseAnimations } from '@fuse/animations';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
    selector     : 'login',
    templateUrl  : './login.component.html',
    styleUrls    : ['./login.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class LoginComponent implements OnInit
{
    loginForm: FormGroup;
    message: string;
    /**
     * Constructor
     */
    constructor(
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _auth: AuthService,
        private _router: Router
    )
    {
        // Configure the layout
        this._fuseConfigService.config = {
            layout: {
                navbar   : {
                    hidden: true
                },
                toolbar  : {
                    hidden: true
                },
                footer   : {
                    hidden: true
                },
                sidepanel: {
                    hidden: true
                }
            }
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // check session
        this.checkSession();
        
        this.loginForm = this._formBuilder.group({
            email   : ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.pattern(/[a-zA-Z0-9]/), Validators.minLength(4)]]
        });
    }

    /**
     * Login
     */
    
    login(): void{                
        const credential = this.loginForm.value;
        this._auth.login(credential.email, credential.password)
        .then(() => {
            this.navigateToFirstPage();
        })
        .catch((error) => {    
            console.log(error);            
            this.message = 'Login failed. Try again later';
            if ( error.message ) {
                this.message = error.message;
            }        
            
        });
    }

    /**
     * Check session
     */
    checkSession(): void {
        console.log('check session');
        if (this._auth.isAuthenticated()) {            
            this.navigateToFirstPage();
        }
    }

    navigateToFirstPage(): void {
        this._router.navigate(['users/horse-managers/list']);  // must be change
    }
    
}
