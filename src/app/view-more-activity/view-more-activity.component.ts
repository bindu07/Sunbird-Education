import { FormAndFrameworkUtilService } from '@app/services/formandframeworkutil.service';
import { Events, NavController , Platform } from '@ionic/angular';
import { Component, Inject, NgZone, OnInit, Input } from '@angular/core';
import {
  Content,
  ContentEventType,
  ContentImportRequest,
  ContentImportResponse,
  ContentImportStatus,
  ContentRequest,
  ContentSearchCriteria,
  ContentSearchResult,
  ContentService,
  Course,
  CourseService,
  DownloadEventType,
  DownloadProgress,
  EventsBusEvent,
  EventsBusService,
  SearchType,
  TelemetryObject,
  CorrelationData,
  LogLevel
} from 'sunbird-sdk';
import {
  Environment,
  ErrorType,
  ImpressionType,
  InteractSubtype,
  InteractType,
  Mode,
  PageId,
  CorReleationDataType
} from '../../services/telemetry-constants';
import * as _ from 'lodash';
import {ContentType, ViewMore, MimeType , RouterLinks, ContentFilterConfig } from '../../app/app.constant';
// import {ContentDetailsPage} from '../content-details/content-details';
import { CourseUtilService } from '../../services/course-util.service';
import { TelemetryGeneratorService } from '../../services/telemetry-generator.service';
import { CommonUtilService } from '../../services/common-util.service';
import { Subscription } from 'rxjs';
// import { CollectionDetailsEtbPage } from '../collection-details-etb/collection-details-etb';
import { AppHeaderService } from '../../services';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import {Location} from '@angular/common';

@Component({
  selector: 'app-view-more-activity',
  templateUrl: './view-more-activity.component.html',
  styleUrls: ['./view-more-activity.component.scss'],
})
export class ViewMoreActivityComponent implements OnInit {

  /**
   * Contains search query
   */
  searchQuery: any;
  title: any;

  /**
   * To hold search result
   */
  searchList: any;

  showLoader: any;

  /**
   * Contains tab bar element ref
   */
  tabBarElement: any;

  /**
   * Flag to show / hide button
   */
  loadMoreBtn = true;

  /**
   * Flag to show / hide downloads only button
   */
  showDownloadsOnlyToggle = false;

  /**
   * value for downloads only toggle button, may have true/false
   */
  downloadsOnlyToggle = false;

  shouldGenerateEndTelemetry = false;



  /**
   * Offset
   */
  offset = 0;

  /**
   * Contains search limit
   */
  searchLimit = 10;

  /**
   * Total search count
   */
  totalCount: number;

  /**
   * Load more flag
   */
  isLoadMore = false;

  /**
   * Flag to switch between view-more-card in view
   */
  localContentsCard = false;
  backButtonFunc: Subscription;

  /**
   * Header title
   */
  headerTitle: string;
  private corRelationList: Array<CorrelationData>;
  /**
   * Default page type
   */
  pageType = 'library';
  source = '';

  /**
   * To queue downloaded identifier
   */
  queuedIdentifiers: Array<any> = [];

  downloadPercentage = 0;

  showOverlay = false;

  resumeContentData: any;
  uid: any;
  audience: any;
  defaultImg: string;
  private eventSubscription: Subscription;
  // adding for ETBV2 integration, to show saved resources after recentlyViewed
  savedResources: Array<any>;

  enrolledCourses: any;

  guestUser: any;
  userId: any;
  requestParams: any;

  @Input() course: any;

  /**
   * Contains layout name
   *
   * @example layoutName = Inprogress / popular
   */
  @Input() layoutName: string;

  @Input() pageName: string;

  @Input() onProfile = false;

  @Input() index: number;

  @Input() sectionName: string;

  @Input() env: string;
  identifier: string;
  didViewLoad: boolean;
  objId;
  objType;
  objVer;

  constructor(
    @Inject('CONTENT_SERVICE') private contentService: ContentService,
    private events: Events,
    private ngZone: NgZone,
    @Inject('EVENTS_BUS_SERVICE') private eventBusService: EventsBusService,
    @Inject('COURSE_SERVICE') private courseService: CourseService,
    private courseUtilService: CourseUtilService,
    private commonUtilService: CommonUtilService,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private headerServie: AppHeaderService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private platform: Platform,
    private zone: NgZone,
    private formAndFrameworkUtilService: FormAndFrameworkUtilService
  ) {
    this.route.queryParams.subscribe(params => {
      if (this.router.getCurrentNavigation().extras.state) {
        console.log('params from state : ', this.router.getCurrentNavigation().extras.state);
        this.uid = this.router.getCurrentNavigation().extras.state.uid;
        this.showDownloadsOnlyToggle = this.router.getCurrentNavigation().extras.state.showDownloadOnlyToggle;
        this.title = this.router.getCurrentNavigation().extras.state.headerTitle;
        this.userId = this.router.getCurrentNavigation().extras.state.headerTitle;
        this.pageName = this.router.getCurrentNavigation().extras.state.pageName;
        this.guestUser = this.router.getCurrentNavigation().extras.state.guestUser;
        this.searchQuery = this.router.getCurrentNavigation().extras.state.requestParams;
        this.audience = this.router.getCurrentNavigation().extras.state.audience;
        this.enrolledCourses = this.router.getCurrentNavigation().extras.state.enrolledCourses;

        console.log('in constructor' , this.headerTitle);
        if (this.headerTitle !== this.title) {
          console.log('inside header title if condition');
          this.headerTitle = this.headerTitle;
          this.offset = 0;
          this.loadMoreBtn = true;
          this.mapper();
        }
      }
    });
    this.defaultImg = 'assets/imgs/ic_launcher.png';
    // migration-TODO
    // this.tabBarElement = document.querySelector('.tabbar.show-tabbar');
    this.subscribeUtilityEvents();
  }

  /**
   * Angular life cycle hooks
   */
  ngOnInit() {
    // migration-TODO
    // this.tabBarElement.style.display = 'none';
  }

  /**
   * Ionic default life cycle hook
   */
  ionViewWillEnter(): void {
    this.zone.run(() => {
      this.headerServie.showHeaderWithBackButton();
      // migration-TODO
      // this.tabBarElement.style.display = 'none';
      this.handleBackButton();
    });
  }

  async subscribeUtilityEvents() {
    await this.events.subscribe('savedResources:update', async (res) => {
      if (res && res.update) {
        if (this.pageName === ViewMore.PAGE_RESOURCE_SAVED) {
          this.getLocalContents(false, this.downloadsOnlyToggle);
        } else if (this.pageName === ViewMore.PAGE_RESOURCE_RECENTLY_VIEWED) {
          await this.getLocalContents(true, this.downloadsOnlyToggle);
          this.getLocalContents();
        }
      }
    });

    this.events.subscribe('viewMore:Courseresume', (data) => {
      this.resumeContentData = data.content;
      this.getContentDetails(data.content);
    });
  }

  handleBackButton() {
    this.backButtonFunc = this.platform.backButton.subscribe(() => {
      this.telemetryGeneratorService.generateBackClickedTelemetry(
        PageId.VIEW_MORE,
        Environment.HOME,
        false,
        this.identifier,
        this.corRelationList
      );
      this.didViewLoad = false;
      this.generateEndEvent(this.objId, this.objType, this.objVer);

      if (this.shouldGenerateEndTelemetry) {
        this.generateQRSessionEndEvent(this.source, this.course.identifier);
      }
      this.location.back();
      this.backButtonFunc.unsubscribe();
    });
  }

  /**
   * Search content
   */
  async search() {
    const loader = await this.commonUtilService.getLoader();
    await loader.present();
    const searchCriteria: ContentSearchCriteria = {
      searchType: SearchType.FILTER
    };
    this.searchQuery.request['searchType'] = SearchType.FILTER;
    this.searchQuery.request['offset'] = this.offset;
    this.contentService.searchContent(searchCriteria, this.searchQuery).toPromise()
      .then((data: ContentSearchResult) => {
        this.ngZone.run(async () => {
          if (data && data.contentDataList) {
            this.loadMoreBtn = data.contentDataList.length >= this.searchLimit;
            if (this.isLoadMore) {
              _.forEach(data.contentDataList, (value) => {
                this.searchList.push(value);
              });
            } else {
              this.searchList = data.contentDataList;
            }
          } else {
            this.loadMoreBtn = false;
          }
          await loader.dismiss();
        });
        this.generateImpressionEvent();
        this.generateLogEvent(data);
      })
      .catch(async () => {
        console.error('Error: while fetching view more content');
        await loader.dismiss();
      });
  }

  /**
   * Load more result
   */
  loadMore() {
    this.isLoadMore = true;
    this.offset = this.offset + this.searchLimit;
    if (!this.commonUtilService.networkInfo.isNetworkAvailable) {
      this.commonUtilService.showToast(this.commonUtilService.translateMessage('NO_INTERNET_TITLE'));
    } else {
      this.mapper();
    }
  }

  /**
   * Mapper to call api based on page.Layout name
   */
  async mapper() {
    const pageName = this.pageName;
    switch (pageName) {
      case ViewMore.PAGE_COURSE_ENROLLED:
        this.pageType = 'enrolledCourse';
        this.loadMoreBtn = false;
        this.localContentsCard = false;
        this.getEnrolledCourse();
        break;

      case ViewMore.PAGE_COURSE_POPULAR:
        this.pageType = 'popularCourses';
        this.localContentsCard = false;
        this.search();
        break;

      case ViewMore.PAGE_RESOURCE_SAVED:
        this.loadMoreBtn = false;
        this.localContentsCard = true;
        this.getLocalContents();
        break;

      case ViewMore.PAGE_RESOURCE_RECENTLY_VIEWED:
        this.loadMoreBtn = false;
        this.localContentsCard = true;
        await this.getLocalContents(true);
        this.getLocalContents();
        break;

      default:
        this.search();
    }
    console.log('search List =>', this.searchList);
  }

  /**
   * Get enrolled courses
   */
  async getEnrolledCourse() {
    const loader = await this.commonUtilService.getLoader();
    await loader.present();
    this.pageType = 'enrolledCourse';
    const option = {
      userId: this.userId,
      refreshEnrolledCourses: false,
      returnRefreshedEnrolledCourses: true
    };
    this.courseService.getEnrolledCourses(option).toPromise()
      .then(async (data: Course[]) => {
        if (data) {
          // data = JSON.parse(data);
          this.searchList = data ? data : [];
          this.loadMoreBtn = false;
        }
        await loader.dismiss();
      })
      .catch(async (error: any) => {
        console.error('error while loading enrolled courses', error);
        await loader.dismiss();
      });
  }

  /**
   * Get local content
   */
  async getLocalContents(recentlyViewed?: boolean, downloaded?: boolean) {
    const loader = await this.commonUtilService.getLoader();
    await loader.present();

    let contentTypes;
    if (recentlyViewed) {
      contentTypes = [];
    } else {
      contentTypes = await this.formAndFrameworkUtilService.getSupportedContentFilterConfig(
        ContentFilterConfig.NAME_LIBRARY);
    }

    const requestParams: ContentRequest = {
      uid: this.uid,
      audience: this.audience,
      recentlyViewed: recentlyViewed,
      localOnly: downloaded,
      contentTypes: contentTypes,
      limit: recentlyViewed ? 20 : 0
    };
    this.contentService.getContents(requestParams).toPromise()
      .then(data => {
        const contentData = [];
        _.forEach(data, (value) => {
          value.contentData.lastUpdatedOn = value.lastUpdatedTime;
          if (value.contentData.appIcon) {
            if (value.contentData.appIcon.includes('http:') || value.contentData.appIcon.includes('https:')) {
              if (this.commonUtilService.networkInfo.isNetworkAvailable) {
                value.contentData.appIcon = value.contentData.appIcon;
              } else {
                value.contentData.appIcon = this.defaultImg;
              }
            } else if (value.basePath) {
              value.contentData.appIcon = value.basePath + '/' + value.contentData.appIcon;
            }
          }
          contentData.push(value);
          // if saved resources are available
        });
        this.ngZone.run(() => {
          if ((this.pageName === ViewMore.PAGE_RESOURCE_RECENTLY_VIEWED) && recentlyViewed) {
            this.searchList = contentData;
          }
          //
          if ((this.pageName === ViewMore.PAGE_RESOURCE_RECENTLY_VIEWED) && !recentlyViewed) {
            this.savedResources = contentData;
            for (let i = 0; i < this.searchList.length; i++) {
              const index = this.savedResources.findIndex((el) => {
                return el.identifier === this.searchList[i].identifier;
              });

              if (index !== -1) {
                this.savedResources.splice(index, 1);
              }
            }
            this.searchList.push(...this.savedResources);
          }
          console.log('content data is =>', contentData);
          loader.dismiss();
          this.loadMoreBtn = false;
        });
      })
      .catch(async () => {
        await loader.dismiss();
      });
  }

  getContentDetails(content) {
    const identifier = content.contentId || content.identifier;
    this.contentService.getContentDetails({ contentId: identifier }).toPromise()
      .then((data: Content) => {
        if (Boolean(data.isAvailableLocally)) {
          const contentDetailsParams: NavigationExtras = {
            state: {
              content: {identifier: content.lastReadContentId},
              depth: '1',
              contentState: {
                batchId: content.batchId ? content.batchId : '',
                courseId: identifier
              },
              isResumedCourse: true,
              isChildContent: true,
              resumedCourseCardData: this.resumeContentData
            }
          };
          this.router.navigate([RouterLinks.COLLECTION_DETAILS], contentDetailsParams);
        } else {
          this.subscribeSdkEvent();
          this.showOverlay = true;
          this.importContent([identifier], false);
        }

      })
      .catch((error: any) => {
        console.log(error);
      });
  }

  importContent(identifiers, isChild) {
    this.queuedIdentifiers.length = 0;
    const option: ContentImportRequest = {
      contentImportArray: this.courseUtilService.getImportContentRequestBody(identifiers, isChild),
      contentStatusArray: [],
      fields: ['appIcon', 'name', 'subject', 'size', 'gradeLevel']
    };

    this.contentService.importContent(option).toPromise()
      .then((data: ContentImportResponse[]) => {
        this.ngZone.run(() => {
          if (data && data.length) {
            _.forEach(data, (value) => {
              if (value.status === ContentImportStatus.ENQUEUED_FOR_DOWNLOAD) {
                this.queuedIdentifiers.push(value.identifier);
              }
            });
            if (this.queuedIdentifiers.length === 0) {
              this.showOverlay = false;
              this.downloadPercentage = 0;
              this.commonUtilService.showToast('ERROR_CONTENT_NOT_AVAILABLE');
            }
          }
        });
      })
      .catch(() => {
        this.ngZone.run(() => {
          this.showOverlay = false;
          this.commonUtilService.showToast('ERROR_CONTENT_NOT_AVAILABLE');
        });
      });
  }

  generateEndEvent(objectId, objectType, objectVersion) {
    const telemetryObject = new TelemetryObject(objectId, objectType, objectVersion);
    this.telemetryGeneratorService.generateEndTelemetry(objectType,
      Mode.PLAY,
      PageId.COURSE_DETAIL,
      Environment.HOME,
      telemetryObject,
      undefined,
      this.corRelationList);
  }

  generateQRSessionEndEvent(pageId: string, qrData: string) {
    if (pageId !== undefined) {
      const telemetryObject = new TelemetryObject(qrData, 'qr', undefined);
      this.telemetryGeneratorService.generateEndTelemetry(
        'qr',
        Mode.PLAY,
        pageId,
        Environment.HOME,
        telemetryObject,
        undefined,
        this.corRelationList);
    }
  }

  subscribeSdkEvent() {
    this.eventSubscription = this.eventBusService.events().subscribe((event: EventsBusEvent) => {
      this.ngZone.run(() => {
        if (event.type === DownloadEventType.PROGRESS) {
          const downloadEvent = event as DownloadProgress;
          this.downloadPercentage = downloadEvent.payload.progress === -1 ? 0 : downloadEvent.payload.progress;
        }
        if (event.payload && event.type === ContentEventType.IMPORT_COMPLETED && this.downloadPercentage === 100) {
          this.showOverlay = false;
          const contentDetailsParams: NavigationExtras = {
            state: {
              content: {identifier: this.resumeContentData.lastReadContentId},
              depth: '1',
              contentState: {
                batchId: this.resumeContentData.batchId ? this.resumeContentData.batchId : '',
                courseId: this.resumeContentData.contentId || this.resumeContentData.identifier
              },
              isResumedCourse: true,
              isChildContent: true,
              resumedCourseCardData: this.resumeContentData
            }
          };
          this.router.navigate([RouterLinks.COLLECTION_DETAILS], contentDetailsParams);
        }
      });
    }) as any;
  }

  cancelDownload() {
    this.ngZone.run(() => {
      this.contentService.cancelDownload(this.resumeContentData.contentId || this.resumeContentData.identifier)
        .toPromise().then(() => {
          this.showOverlay = false;
        }).catch(() => {
          this.showOverlay = false;
        });
    });
  }


  showDisabled(resource) {
    return !resource.isAvailableLocally && !this.commonUtilService.networkInfo.isNetworkAvailable;
  }

  /**
   * Ionic life cycle hook
   */
  ionViewWillLeave() {
    this.ngZone.run(() => {
      if (this.eventSubscription) {
        this.eventSubscription.unsubscribe();
      }
      // migration-TODO
      // this.tabBarElement.style.display = 'flex';
      this.isLoadMore = false;
      this.showOverlay = false;
      this.backButtonFunc.unsubscribe();
    });
  }

  private generateImpressionEvent() {
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.SEARCH, '',
      PageId.VIEW_MORE,
      Environment.HOME, '', '', '');
  }

  private generateLogEvent(searchResult) {
    if (searchResult != null) {
      const contentArray: Array<any> = searchResult.contentDataList;
      const params = new Array<any>();
      const paramsMap = new Map();
      paramsMap['SearchResults'] = contentArray.length;
      paramsMap['SearchCriteria'] = searchResult.request;
      params.push(paramsMap);
      this.telemetryGeneratorService.generateLogEvent(LogLevel.INFO,
        PageId.VIEW_MORE,
        Environment.HOME,
        ImpressionType.SEARCH, params);
    }
  }
  navigateToDetailPage(content: any): boolean {
    if (!content.isAvailableLocally && !this.commonUtilService.networkInfo.isNetworkAvailable) {
      return false;
    }
    const identifier = content.contentId || content.identifier;
    const type = this.telemetryGeneratorService.isCollection(content.mimeType) ? content.contentType : ContentType.RESOURCE;
    const telemetryObject: TelemetryObject = new TelemetryObject(identifier, type, content.pkgVersion);

    const values = new Map();
    values['sectionName'] = this.sectionName;
    values['positionClicked'] = this.index;

    this.telemetryGeneratorService.generateInteractTelemetry(InteractType.TOUCH,
      InteractSubtype.CONTENT_CLICKED,
      this.env,
      this.pageName ? this.pageName : this.layoutName,
      telemetryObject,
      values);
    if (content.mimeType === MimeType.COLLECTION) {
      this.router.navigate([RouterLinks.COLLECTION_DETAIL_ETB], {
        state : {
          content: content
        }
      });
    } else {
      this.router.navigate([RouterLinks.CONTENT_DETAILS], {
        state: {
          content: content
        }
      });

    }
  }

}
