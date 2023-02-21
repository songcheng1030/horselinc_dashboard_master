import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/shareReplay';

import { auth } from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from 'firebase';

import { Router } from '@angular/router';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

@Injectable({
    providedIn:  'root'
})
export class AuthService {
    user: User;

    constructor(
        private _afAuth:  AngularFireAuth, 
        private _router:  Router,
        private _db: AngularFirestore
    ) {
        this._afAuth.authState.subscribe(user => {
            if (user){
              this.user = user;
              localStorage.setItem('user', JSON.stringify(this.user));
              console.log('Saved user storage');
            } else {
              localStorage.setItem('user', null);
              console.log('Removed user storage');
            }
          });
    }

    async login(email: string, password: string): Promise<any> {
        return new Promise<any> ((resolve, reject) => {
            this._afAuth.auth.signInWithEmailAndPassword(email, password).then(res => {
                resolve(res);
              }, reject);
        });
    }

    async register(email: string, password: string): Promise<any> {
        return new Promise<any> ((resolve, reject) => {
            this._afAuth.auth.createUserWithEmailAndPassword(email, password).then((newUserCredential: firebase.auth.UserCredential) => {
                firebase
                .firestore()
                .doc(`/admins/${newUserCredential.user.uid}`)
                .set({
                  email,
                  userType: 'admin',
                  createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(newUserCredential);
                resolve(newUserCredential);
              }, reject);
        });        
        // this.sendEmailVerification();
    }

    async sendEmailVerification(): Promise<any> {
        await this._afAuth.auth.currentUser.sendEmailVerification();
        this._router.navigate(['auth/mail-confirm']);
    }

    async sendPasswordResetEmail(passwordResetEmail: string): Promise<any>  {
        return await this._afAuth.auth.sendPasswordResetEmail(passwordResetEmail);
    }

    async logout(): Promise<any> {
        await this._afAuth.auth.signOut();
        localStorage.removeItem('user');
        this._router.navigate(['auth/login']);
    }

    isAuthenticated(): boolean {
        const  user  =  JSON.parse(localStorage.getItem('user'));
        // console.log(user);
        return  user  !==  null;
    }

    async  loginWithGoogle(): Promise<any>{
        await  this._afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
        this._router.navigate(['/notifications']);
    }
    /* login(credential: User): Promise<any> {
        return new Promise((resolve, reject) => {
            this._httpClient.post(this.apiUrl + '/login', credential)
                .subscribe((response: any) => {                         
                    this.setToken(response.data.token); 
                    this.removeSelectedCompany();
                    resolve(response);
                }, reject);
        });
    }

    getCompanyList(): Promise<any>{
        return new Promise((resolve, reject) => {            
            this._httpClient.get(this.apiUrl + '/companies', this.getHttpHeaders())
                .subscribe((companies: any) => {                    
                    // this.company_list = companies.data;                                        
                    resolve(companies.data);
                }, reject);
        });
    }

    logout(): void {
        this.removeToken();
        this.removeSelectedCompany();
    }

    // return header after check validate of token
    getHttpHeaders(): any{
        if (!this.isAuthenticated()){
            this._router.navigate(['auth/login']);
        }else{
            return new HttpHeaders().set('Authorization', this.getToken());
        }
    }

    // validate token 
    isAuthenticated(): boolean {
        const token = this.getToken();        
        return token ? !this.isTokenExpired(token) : false;
    }

    getToken(): string {        
        return localStorage.getItem(this.TOKEN_NAME);
    }

    setToken(token: string): void {        
        localStorage.setItem(this.TOKEN_NAME, token);
    }

    removeToken(): void {
        localStorage.removeItem(this.TOKEN_NAME);                        
    }

    removeSelectedCompany(): void{
        localStorage.removeItem(environment.selectedCompanyId);                  
        localStorage.removeItem(environment.selectedCompanyName);  
    }

    isTokenExpired(token: string): boolean {
        return this.jwtHelper.isTokenExpired(token);
    }

    getUserEmail(): string {     
        if (!this.getToken()){
            return ''; 
        }   
        return this.jwtHelper.decodeToken(this.getToken()).email;
    }
    getUserName(): string {
        if (!this.getToken()){
            return ''; 
        }  
        return this.jwtHelper.decodeToken(this.getToken()).name;
    }
    getIsSuper(): boolean {
        if (!this.getToken()){
            return false; 
        }  
        return this.jwtHelper.decodeToken(this.getToken()).is_super;
    }
    getUserCompanies(): string {
        if (!this.getToken()){
            return ''; 
        }  
        return this.jwtHelper.decodeToken(this.getToken()).companies;
    } */
    

}
