import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { Component, Inject, OnInit, NgZone } from '@angular/core';
import { LoadingController } from '@ionic/angular';
// import { ReportListPage } from './report-list/report-list';
import {
  GetAllProfileRequest,
  Group,
  GroupService,
  ObjectType,
  Profile,
  ProfileService,
  ProfileType,
  TelemetryObject
} from 'sunbird-sdk';
import {
  AppHeaderService,
  Environment,
  ImpressionType,
  InteractSubtype,
  InteractType,
  PageId,
  TelemetryGeneratorService
} from '@app/services';
import { ProfileConstants, RouterLinks } from '@app/app/app.constant';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
})
export class ReportsPage implements OnInit {

  ProfileType = ProfileType;
  report = 'users';
  otherUsers;
  currentUser: {};
  groups;
  currentGroups: {};
  private profileDetails: any;

  constructor(
    @Inject('PROFILE_SERVICE') private profileService: ProfileService,
    @Inject('GROUP_SERVICE') private groupService: GroupService,
    private ngZone: NgZone,
    private loading: LoadingController,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private headerService: AppHeaderService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    if (this.router.getCurrentNavigation().extras.state) {
      this.profileDetails = this.router.getCurrentNavigation().extras.state.profile;
    }
  }

  async ngOnInit() {
    this.headerService.hideHeader();
    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW,
      '',
      Environment.USER,
      PageId.REPORTS_USER_GROUP
    );
    const loader = await this.loading.create({
      spinner: 'crescent'
    });
    await loader.present();
    let users, cUser, groups;
    this.populateUsers()
      .then(array => {
        cUser = array[0];
        users = array[1];
        return this.populateGroups();
      })
      .then(data => {
        groups = data;
        this.ngZone.run(async () => {
          this.groups = groups;
          this.otherUsers = users;
          this.currentUser = cUser;
          await loader.dismiss();
        });
      })
      .catch(async () => {
        await loader.dismiss();
      });
  }

  async populateUsers() {
    const that = this;

    return new Promise<Array<any>>((resolve, reject) => {
      const getAllProfileRequest: GetAllProfileRequest = {
        local: true
      };
      that.profileService.getAllProfiles(getAllProfileRequest).toPromise()
        .then((data: Profile[]) => {
          that.profileService.getActiveSessionProfile({ requiredFields: ProfileConstants.REQUIRED_FIELDS }).toPromise()
            .then((profile: Profile) => {
              if (this.profileDetails) {
                if (this.profileDetails.id === profile.uid) {
                  profile.handle = this.profileDetails.firstName;
                }
              }
              data = that.filterOutCurrentUser(data, profile);
              resolve([profile, data]);
            }).catch(error => {
              console.error('Error', error);
              reject(error);
            });
        })
        .catch((error) => {
          console.log('Something went wrong while fetching user list', error);
          reject(error);
        });
    });
  }

  async populateGroups() {
    const that = this;

    return new Promise<any>((resolve) => {

      that.groupService.getAllGroups()
        .subscribe((groups: Group[]) => {
          if (groups) {
            resolve(groups);
            console.log('group details', groups);
          } else {
            resolve();
          }
        });
    });
  }

  filterOutCurrentUser(userList, currentUser) {
    return userList.filter(user => {
      return user.uid !== currentUser.uid;
    });
  }

  goToUserReportList(uid: string, handle: string) {

    const telemetryObject = new TelemetryObject(uid, ObjectType.USER, undefined);
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.USER_CLICKED,
      Environment.USER,
      PageId.REPORTS_USER_GROUP,
      telemetryObject
    );

    const navigationExtras: NavigationExtras = { state: { isFromUsers: true, uids: [uid], handle: handle } };
    this.router.navigate([`/${RouterLinks.REPORTS}/${RouterLinks.REPORTS_LIST}`], navigationExtras);
  }

  goToGroupUserReportList(group) {
    const telemetryObject = new TelemetryObject(group.gid, ObjectType.GROUP, undefined);
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      InteractSubtype.GROUP_CLICKED,
      Environment.USER,
      PageId.REPORTS_USER_GROUP,
      telemetryObject
    );
    const getAllProfileRequest: GetAllProfileRequest = { local: true, groupId: group.gid };
    this.profileService.getAllProfiles(getAllProfileRequest).toPromise()
      .then((result: Profile[]) => {
        const map = new Map<string, string>();
        const uids: Array<string> = [];
        result.forEach(user => {
          uids.push(user.uid);
          map.set(user.uid, user.handle);
        });

        const navigationExtras: NavigationExtras = { state: { isFromGroups: true, uids: uids, users: map, group: group } };
        this.router.navigate([`/${RouterLinks.REPORTS}/${RouterLinks.REPORTS_LIST}`], navigationExtras);
      });
  }


  onSegmentChange(data) {
    const subType = (data === 'users') ? InteractSubtype.USERS_TAB_CLICKED : InteractSubtype.GROUPS_TAB_CLICKED;
    this.telemetryGeneratorService.generateInteractTelemetry(
      InteractType.TOUCH,
      subType,
      Environment.USER,
      PageId.REPORTS_USER_GROUP
    );

    this.telemetryGeneratorService.generateImpressionTelemetry(
      ImpressionType.VIEW,
      '',
      Environment.USER,
      PageId.REPORTS_USER_GROUP
    );
  }
}
