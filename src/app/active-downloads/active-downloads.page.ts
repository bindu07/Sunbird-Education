import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NavController, PopoverController, ToastController } from '@ionic/angular';
import { ActiveDownloadsInterface } from './active-downloads.interface';
import { Observable, Subscription } from 'rxjs';
import { InteractSubtype, Environment, PageId, ActionButtonType, ImpressionType, InteractType } from '../../services/telemetry-constants';
import {
  ContentDownloadRequest,
  DownloadEventType,
  DownloadProgress,
  DownloadRequest,
  DownloadService,
  EventNamespace,
  EventsBusService
} from 'sunbird-sdk';
import { Location } from '@angular/common';
//  import { SbPopoverComponent } from '@app/component';
import { AppHeaderService, CommonUtilService, TelemetryGeneratorService } from '../../services/index';
import { SbNoNetworkPopupComponent } from '../components/popups/sb-no-network-popup/sb-no-network-popup.component';
import { SbPopoverComponent } from '../components/popups/sb-popover/sb-popover.component';
// import { SbNoNetworkPopupComponent } from '../../component/popups/sb-no-network-popup/sb-no-network-popup';
@Component({
  selector: 'app-active-downloads',
  templateUrl: './active-downloads.page.html',
  styleUrls: ['./active-downloads.page.scss'],
})
export class ActiveDownloadsPage implements OnInit, OnDestroy, ActiveDownloadsInterface {

  downloadProgressMap: { [key: string]: number };
  activeDownloadRequests$: Observable<ContentDownloadRequest[]>;
  defaultImg = 'assets/imgs/ic_launcher.png';

  private _appHeaderSubscription?: Subscription;
  private _downloadProgressSubscription?: Subscription;
  private _networkSubscription?: Subscription;
  private _headerConfig = {
    showHeader: true,
    showBurgerMenu: false,
    actionButtons: [] as string[]
  };
  private _toast: any;

  constructor(
    private popoverCtrl: PopoverController,
    private changeDetectionRef: ChangeDetectorRef,
    private headerService: AppHeaderService,
    private navCtrl: NavController,
    private commonUtilService: CommonUtilService,
    private toastController: ToastController,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private location: Location,
    @Inject('DOWNLOAD_SERVICE') private downloadService: DownloadService,
    @Inject('EVENTS_BUS_SERVICE') private eventsBusService: EventsBusService,
  ) {
    this.downloadProgressMap = {};
    // @ts-ignore
    this.activeDownloadRequests$ = this.downloadService.getActiveDownloadRequests()
      .do(() => this.changeDetectionRef.detectChanges());
  }

  ngOnInit() {
    this.initDownloadProgress();
    this.initAppHeader();
    this.initNetworkDetection();
    this.telemetryGeneratorService.generatePageViewTelemetry(
      PageId.ACTIVE_DOWNLOADS,
      Environment.DOWNLOADS, '');
  }

  ngOnDestroy() {
    if (this._downloadProgressSubscription) {
      this._downloadProgressSubscription.unsubscribe();
    }
    if (this._appHeaderSubscription) {
      this._appHeaderSubscription.unsubscribe();
    }
    if (this._networkSubscription) {
      this._networkSubscription.unsubscribe();
      if (this._toast) {
        this._toast.dismiss();
        this._toast = undefined;
      }
    }
  }

  cancelAllDownloads(): void {
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.DOWNLOAD_CANCEL_ALL_CLICKED,
      Environment.DOWNLOADS,
      PageId.ACTIVE_DOWNLOADS);
    this.showCancelPopUp();
  }

  cancelDownload(downloadRequest: DownloadRequest): void {
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.DOWNLOAD_CANCEL_CLICKED,
      Environment.DOWNLOADS,
      PageId.ACTIVE_DOWNLOADS);
    this.showCancelPopUp(downloadRequest);
  }

  getContentDownloadProgress(contentId: string): number {
    return this.downloadProgressMap[contentId] && (this.downloadProgressMap[contentId] > -1) ? this.downloadProgressMap[contentId] : 0;
  }

  private initDownloadProgress(): void {
    // @ts-ignore
    this._downloadProgressSubscription = this.eventsBusService.events(EventNamespace.DOWNLOADS)
      .filter((event) => event.type === DownloadEventType.PROGRESS)
      .do((event) => {
        const downloadEvent = event as DownloadProgress;
        this.downloadProgressMap[downloadEvent.payload.identifier] = downloadEvent.payload.progress;
        this.changeDetectionRef.detectChanges();
      }).subscribe();
  }

  private initAppHeader() {
    this._appHeaderSubscription = this.headerService.headerEventEmitted$.subscribe(eventName => {
      this.handleHeaderEvents(eventName);
    });
    this._headerConfig = this.headerService.getDefaultPageConfig();
    this._headerConfig.actionButtons = [];
    this._headerConfig.showBurgerMenu = false;
    this.headerService.updatePageConfig(this._headerConfig);
  }

  private handleHeaderEvents(event: { name: string }) {
    switch (event.name) {
      case 'back':
        // this.navCtrl.pop();
        this.location.back();
        break;
    }
  }

  private initNetworkDetection() {
    this._networkSubscription = this.commonUtilService.networkAvailability$.subscribe((available: boolean) => {
      if (available) {
        this.presentToast();
        if (this._toast) {
          this._toast.dismiss();
          this._toast = undefined;
        }
      } else {
        this.presentPopupForOffline();
      }
    });
  }

  private async presentToast() {
    const toast = await this.toastController.create({
      duration: 2000,
      message: this.commonUtilService.translateMessage('INTERNET_AVAILABLE'),
      showCloseButton: false,
      position: 'top',
      cssClass: 'toastForOnline'
    });
    toast.present();
  }

  private async showCancelPopUp(downloadRequest?: DownloadRequest) {
    this.telemetryGeneratorService.generatePageViewTelemetry(
      downloadRequest ? PageId.SINGLE_CANCEL_CONFIRMATION_POPUP : PageId.BULK_CANCEL_CONFIRMATION_POPUP,
      Environment.DOWNLOADS);
    const popupMessage = downloadRequest ? 'CANCEL_DOWNLOAD_MESSAGE' : 'CANCEL_ALL_DOWNLOAD_MESSAGE';


    const confirm = await this.popoverCtrl.create({
      component: SbPopoverComponent,
      componentProps: {
        sbPopoverHeading: this.commonUtilService.translateMessage('CANCEL_DOWNLOAD_TITLE'),
        sbPopoverMainTitle: this.commonUtilService.translateMessage(popupMessage),
        actionsButtons: [
          {
            btntext: this.commonUtilService.translateMessage('CANCEL_DOWNLOAD'),
            btnClass: 'popover-color'
          },
        ],
        icon: null,
        // metaInfo: this.content.contentData.name,
      },
      cssClass: 'sb-popover danger dw-active-downloads-popover',
    });

    await confirm.present();

    const loader = await this.commonUtilService.getLoader();

    const response = await confirm.onDidDismiss();
    if (response.data.canDelete) {
      let valuesMap;
      if (downloadRequest) {
        valuesMap = {
          count: 1
        };
      } else {
        valuesMap = {
          count: (await this.activeDownloadRequests$.take(1).toPromise()).length
        };
      }
      this.telemetryGeneratorService.generateInteractTelemetry(
        InteractType.TOUCH,
        InteractSubtype.DOWNLOAD_CANCEL_CLICKED,
        Environment.DOWNLOADS,
        PageId.ACTIVE_DOWNLOADS, undefined, valuesMap);
      loader.present().then(() => {
        return downloadRequest ?
          this.downloadService.cancel(downloadRequest).toPromise() :
          this.downloadService.cancelAll().toPromise();
      }).then(() => {
        return loader.dismiss();
      });
    }
  }

  private async presentPopupForOffline() {
    // migration-TODO
    this._toast = await this.popoverCtrl.create({
      component: SbNoNetworkPopupComponent,
      componentProps: {
        sbPopoverHeading: this.commonUtilService.translateMessage('INTERNET_CONNECTIVITY_NEEDED'),
        sbPopoverMessage: this.commonUtilService.translateMessage('OFFLINE_DOWNLOAD_MESSAGE'),
      },
      cssClass: 'sb-popover no-network',
    });

    this._toast.present();
  }

}





