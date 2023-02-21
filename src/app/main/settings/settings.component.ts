import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { SettingsService } from './settings.service';
import { takeUntil } from 'rxjs/operators';
import { fuseAnimations } from '@fuse/animations';

interface ServiceType {
    key: string;
    value: string;
}

@Component({
    selector   : 'settings',
    templateUrl: './settings.component.html',
    styleUrls  : ['./settings.component.scss'],
    animations   : fuseAnimations
})
export class SettingsComponent implements OnInit, OnDestroy
{
    settingsForm: FormGroup;
    settings: any;
    serviceTypes: ServiceType[];
    // Private
    private _unsubscribeAll: Subject<any>;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent
    >;

    /**
     * Constructor
     *
     * @param {FormBuilder} _formBuilder
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _settingsService: SettingsService,
        public _matDialog: MatDialog
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        

        this._settingsService.onSettingsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(settings => {

                if ( settings )
                {
                    this.settings = settings;
                }
                this.settingsForm = this.createSettingsForm();
            });

        this._settingsService.onSettingsServiceTypesChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(serviceTypes => {
                if ( serviceTypes.length > 0 ){
                    this.serviceTypes = [];
                    serviceTypes.map(serviceType => {
                        const tempServiceType: ServiceType = ({key: '', value: ''});
                        tempServiceType.key = serviceType.serviceType.key;
                        tempServiceType.value = serviceType.serviceType.value;
                        this.serviceTypes.push(tempServiceType);
                    });
                }
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    createSettingsForm(): FormGroup
    {
        // Settings Form
        return this._formBuilder.group({
            application_fee   : [this.settings['application-fee'], Validators.required],
            email             : [this.settings.emails.contact, [Validators.required, Validators.email]],
            phone             : [this.settings.phones.contact, Validators.required],            
            privacy           : [this.settings.urls.privacy, Validators.required],
            terms             : [this.settings.urls.terms, Validators.required],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update Setting data
     */
    updateSettings(): void {

        const data = this.settingsForm.getRawValue();
        data.serviceTypes = this.serviceTypes;

        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to update?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if ( result )
            {   
                console.log('this.settingsForm.getRawValue()', data);
                this._settingsService.updateSettings(data);
            }
            this.confirmDialogRef = null;
        });
        
    }
    
}
