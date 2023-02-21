import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from 'app/main/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private _auth: AuthService) { }

  canActivate(): boolean {
    // check token duration    
    if (!this._auth.isAuthenticated()) {
      console.log('invalid token!');
      this.router.navigate(['auth/login']);
      return false;
    }
    return true;
  }
}
