import { Component, Inject, OnInit } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import {
  ContentRequest, ContentService, DeviceInfo, GetAllProfileRequest, ProfileService, SharedPreferences
} from 'sunbird-sdk';
import {
  TelemetryGeneratorService,
  CommonUtilService,
  UtilityService,
  AppHeaderService,
  InteractType,
  InteractSubtype,
  PageId,
  Environment,
  ImpressionType
} from '../../../services';
import { ContentType, AudienceFilter, RouterLinks } from '../../app.constant';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AppVersion } from '@ionic-native/app-version/ngx';

const KEY_SUNBIRD_CONFIG_FILE_PATH = 'sunbird_config_file_path';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss'],
})
export class AboutUsComponent implements OnInit {

  deviceId: string;
  version: string;
  fileUrl: string;
  headerConfig = {
    showHeader: false,
    showBurgerMenu: false,
    actionButtons: []
  };

  constructor(
    @Inject('PROFILE_SERVICE') private profileService: ProfileService,
    @Inject('CONTENT_SERVICE') private contentService: ContentService,
    @Inject('DEVICE_INFO') private deviceInfo: DeviceInfo,
    private socialSharing: SocialSharing,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private commonUtilService: CommonUtilService,
    @Inject('SHARED_PREFERENCES') private preferences: SharedPreferences,
    private utilityService: UtilityService,
    private headerService: AppHeaderService,
    private router: Router,
    private location: Location,
    private appVersion: AppVersion
  ) {
  }

  ionViewWillEnter() {
    this.headerConfig = this.headerService.getDefaultPageConfig();
    this.headerConfig.actionButtons = [];
    this.headerConfig.showHeader = false;
    this.headerConfig.showBurgerMenu = false;
    this.headerService.updatePageConfig(this.headerConfig);
  }

  ngOnInit() {
    this.version = 'app version will be shown here';

    this.deviceId = this.deviceInfo.getDeviceID();

    this.appVersion.getAppName()
      .then((appName: any) => {
        return appName;
      })
      .then(val => {
        this.getVersionName(val);
      });
  }

  ionViewDidLeave() {
    (<any>window).supportfile.removeFile(() => {
    }, (error) => {
      console.error('error', error);
    });
  }

  async shareInformation() {
    this.generateInteractTelemetry(InteractType.TOUCH, InteractSubtype.SUPPORT_CLICKED);
    const allUserProfileRequest: GetAllProfileRequest = {
      local: true,
      server: true
    };
    const contentRequest: ContentRequest = {
      contentTypes: ContentType.FOR_DOWNLOADED_TAB,
      audience: AudienceFilter.GUEST_TEACHER
    };
    const getUserCount = await this.profileService.getAllProfiles(allUserProfileRequest).map((profile) => profile.length).toPromise();
    const getLocalContentCount = await this.contentService.getContents(contentRequest)
      .map((contentCount) => contentCount.length).toPromise();

    (<any>window).supportfile.shareSunbirdConfigurations(getUserCount, getLocalContentCount, (result) => {
      const loader = this.commonUtilService.getLoader();
      loader.present();
      this.preferences.putString(KEY_SUNBIRD_CONFIG_FILE_PATH, result).toPromise()
        .then((res) => {
          this.preferences.getString(KEY_SUNBIRD_CONFIG_FILE_PATH).toPromise()
            .then(val => {
              loader.dismiss();
              if (Boolean(val)) {
                this.fileUrl = 'file://' + val;

                // Share via email
                this.socialSharing.share('', '', this.fileUrl).then(() => {
                }).catch(error => {
                  console.error('Sharing Data is not possible', error);
                });
              }

            });
        });
    }, (error) => {
      console.error('ERROR - ' + error);
    });
  }

  aboutApp() {
    this.router.navigate([`/${RouterLinks.SETTINGS}/${RouterLinks.ABOUT_APP}`]);
  }

  termsOfService() {
    this.router.navigate([`/${RouterLinks.SETTINGS}/${RouterLinks.TERMS_OF_SERVICE}`]);
  }

  privacyPolicy() {
    this.router.navigate([`/${RouterLinks.SETTINGS}/${RouterLinks.PRIVACY_POLICY}`]);
  }

  generateInteractTelemetry(interactionType, interactSubtype) {
    this.telemetryGeneratorService.generateInteractTelemetry(
      interactionType, interactSubtype,
      PageId.SETTINGS,
      Environment.SETTINGS, null,
      undefined,
      undefined
    );
  }

  generateImpressionEvent() {
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW, '',
      PageId.SETTINGS_ABOUT_US,
      Environment.SETTINGS, '', '', '',
      undefined,
      undefined
    );
  }

  getVersionName(appName): any {
    this.utilityService.getBuildConfigValue('VERSION_NAME')
      .then(response => {
        this.getVersionCode(appName, response);
        return response;
      })
      .catch(error => {
        console.log('Error--', error);
      });
  }

  getVersionCode(appName, versionName): any {
    this.utilityService.getBuildConfigValue('VERSION_CODE')
      .then(response => {
        this.version = appName + ' v' + versionName + '.' + response;
        return response;
      })
      .catch(error => {
        console.log('Error--', error);
      });
  }

  goBack() {
    this.location.back();
  }
}
