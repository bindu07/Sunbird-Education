import { Component, Inject, NgZone, OnInit } from '@angular/core';
import { Events, Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SharedPreferences } from 'sunbird-sdk';

import { appLanguages, PreferenceKey, RouterLinks } from '@app/app/app.constant';
import { Map } from '@app/app/telemetryutil';
import { AppGlobalService } from '@app/services';
import { CommonUtilService } from '@app/services';
import { TelemetryGeneratorService } from '@app/services';
import { AppHeaderService } from '@app/services';
import { Environment, ImpressionType, InteractSubtype, InteractType, PageId } from '@app/services/telemetry-constants';
import { NotificationService } from '@app/services/notification.service';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';


export interface ILanguages {
  label: string
  code: string
  isApplied: boolean
  name: string
}
@Component({
  selector: 'page-language-settings',
  templateUrl: 'language-settings.html',
  styleUrls: ['./language-settings.scss']
})
export class LanguageSettingsPage implements OnInit {

  languages: Array<ILanguages> = [];
  language: string;
  isLanguageSelected = false;
  isFromSettings = false;
  defaultDeviceLang = '';
  previousLanguage: any;
  selectedLanguage: any = {};
  btnColor = '#55acee';
  unregisterBackButton: Subscription;
  headerConfig: any;


  constructor(
    @Inject('SHARED_PREFERENCES') private preferences: SharedPreferences,
    public translateService: TranslateService,
    private events: Events,
    private zone: NgZone,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private platform: Platform,
    private appGlobalService: AppGlobalService,
    private commonUtilService: CommonUtilService,
    private headerService: AppHeaderService,
    private notification: NotificationService,
    private router: Router,
    private location: Location,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW, '',
      this.isFromSettings ? PageId.SETTINGS_LANGUAGE : PageId.ONBOARDING_LANGUAGE_SETTING,
      this.isFromSettings ? Environment.SETTINGS : Environment.ONBOARDING,
    );
  }

  ionViewDidEnter() {
    this.activatedRoute.params.subscribe(params => {
      this.isFromSettings = Boolean(params['isFromSettings']);
      console.log('FormSettings', this.isFromSettings);

      this.telemetryGeneratorService.generateImpressionTelemetry(
        ImpressionType.VIEW, '',
        this.isFromSettings ? PageId.SETTINGS_LANGUAGE : PageId.ONBOARDING_LANGUAGE_SETTING,
        this.isFromSettings ? Environment.SETTINGS : Environment.ONBOARDING,
      );
      this.handleBackButton();
    });
  }


  handleBackButton() {
    this.unregisterBackButton = this.platform.backButton.subscribeWithPriority(10, () => {
      this.telemetryGeneratorService.generateInteractTelemetry(
        InteractType.TOUCH, InteractSubtype.DEVICE_BACK_CLICKED,
        this.isFromSettings ? Environment.SETTINGS : Environment.ONBOARDING,
        this.isFromSettings ? PageId.SETTINGS_LANGUAGE : PageId.ONBOARDING_LANGUAGE_SETTING,
      );

      if (this.isFromSettings) {
        this.location.back();
      } else {
        const pId = this.isFromSettings ? PageId.SETTINGS_LANGUAGE : PageId.ONBOARDING_LANGUAGE_SETTING;
        const env = this.isFromSettings ? Environment.SETTINGS : Environment.ONBOARDING;
        this.commonUtilService.showExitPopUp(pId, env, false);
      }
    });
  }

  ionViewWillEnter() {
    this.selectedLanguage = {};
    this.init();
    if (!this.isFromSettings) {
      this.headerService.hideHeader();
    } else {
      this.headerService.showHeaderWithBackButton();
    }
    this.handleBackButton();
  }

  ionViewWillLeave() {
    if (this.isLanguageSelected) {
      if (!this.selectedLanguage.code) {
        if (this.previousLanguage) {
          this.translateService.use(this.previousLanguage);
        } else {
          this.translateService.use('en');
        }
      }
    }

    if (this.unregisterBackButton) {
      this.unregisterBackButton.unsubscribe();
    }
  }

  init(): void {
    this.languages = appLanguages;

    this.zone.run(() => {
      this.preferences.getString(PreferenceKey.SELECTED_LANGUAGE_CODE).toPromise()
        .then(val => {
          if (Boolean(val)) {
            this.previousLanguage = val;
            this.language = val;
          } else {
            this.previousLanguage = undefined;
          }
        });
    });

  }

  /**
   * It will set app language
   */
  onLanguageSelected() {
    if (this.language) {
      this.zone.run(() => {
        this.translateService.use(this.language);
        this.btnColor = '#006DE5';
        this.isLanguageSelected = true;
      });
    } else {
      this.btnColor = '#8FC4FF';
    }
  }

  generateLanguageSuccessInteractEvent(previousLanguage: string, currentLanguage: string) {
    const valuesMap = new Map();
    valuesMap['previousLanguage'] = previousLanguage ? previousLanguage : '';
    valuesMap['currentLanguage'] = currentLanguage;
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.LANGUAGE_SETTINGS_SUCCESS,
      this.isFromSettings ? Environment.SETTINGS : Environment.ONBOARDING,
      this.isFromSettings ? PageId.SETTINGS_LANGUAGE : PageId.ONBOARDING_LANGUAGE_SETTING,
      undefined,
      valuesMap
    );
  }

  generateClickInteractEvent(selectedLanguage: string, interactSubType) {
    const valuesMap = new Map();
    valuesMap['selectedLanguage'] = selectedLanguage;
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      interactSubType,
      this.isFromSettings ? Environment.SETTINGS : Environment.ONBOARDING,
      this.isFromSettings ? PageId.SETTINGS : PageId.ONBOARDING_LANGUAGE_SETTING,
      undefined,
      valuesMap
    );
  }

  continue() {
    // if language is not null, then select the checked language,
    // else set default language as english
    if (this.isLanguageSelected) {
      this.generateClickInteractEvent(this.language, InteractSubtype.CONTINUE_CLICKED);
      this.generateLanguageSuccessInteractEvent(this.previousLanguage, this.language);

      if (this.language) {
        this.selectedLanguage = this.languages.find(i => i.code === this.language);
        this.preferences.putString(PreferenceKey.SELECTED_LANGUAGE_CODE, this.selectedLanguage.code).toPromise();
        this.preferences.putString(PreferenceKey.SELECTED_LANGUAGE, this.selectedLanguage.label).toPromise();
        this.translateService.use(this.language);
      }
      this.events.publish('onAfterLanguageChange:update', {
        selectedLanguage: this.language
      });
      this.notification.setupLocalNotification(this.language);

      if (this.isFromSettings) {
        this.location.back();
      } else {
        this.router.navigate([RouterLinks.USER_TYPE_SELECTION]);
      }
    } else {
      this.generateClickInteractEvent('n/a', InteractSubtype.CONTINUE_CLICKED);
      this.btnColor = '#8FC4FF';
      this.commonUtilService.showToast('PLEASE_SELECT_A_LANGUAGE', false, 'redErrorToast');
    }
  }
}
