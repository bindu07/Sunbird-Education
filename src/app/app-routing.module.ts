import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { RouterLinks } from './app.constant';
import { HasNotBeenOnboardedGuard } from '@app/guards/has-not-been-onboarded.guard';
import { HasNotSelectedFrameworkGuard } from '@app/guards/has-not-selected-framework.guard';
import { HasNotSelectedLanguageGuard } from '@app/guards/has-not-selected-language.guard';
import { HasNotSelectedUserTypeGuard } from '@app/guards/has-not-selected-user-type.guard';
import { IsGuestUserGuard } from '@app/guards/is-guest-user.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: `${RouterLinks.LANGUAGE_SETTING}`,
    pathMatch: 'full',
  },
  {
    path: `${RouterLinks.LANGUAGE_SETTING}`,
    loadChildren: './language-settings/language-settings.module#LanguageSettingsModule',
    canLoad: [IsGuestUserGuard, HasNotBeenOnboardedGuard, HasNotSelectedLanguageGuard],
  },
  {
    path: `${RouterLinks.USER_TYPE_SELECTION}`,
    loadChildren: './user-type-selection/user-type-selection.module#UserTypeSelectionPageModule',
    canLoad: [IsGuestUserGuard, HasNotBeenOnboardedGuard, HasNotSelectedUserTypeGuard],
  },
  {
    path: RouterLinks.PROFILE_SETTINGS,
    loadChildren: './profile-settings/profile-settings.module#ProfileSettingsPageModule',
    canLoad: [HasNotBeenOnboardedGuard, HasNotSelectedFrameworkGuard],
  },
  {
    path: RouterLinks.TABS,
    loadChildren: './tabs/tabs.module#TabsPageModule'
  },

  { path: RouterLinks.USER_AND_GROUPS, loadChildren: './user-and-groups/user-and-groups.module#UserAndGroupsPageModule' },
  {
    path: RouterLinks.RESOURCES,
    loadChildren: './resources/resources.module#ResourcesModule',
  },
  { path: RouterLinks.VIEW_MORE_ACTIVITY, loadChildren: './view-more-activity/view-more-activity.module#ViewMoreActivityModule' },
  { path: RouterLinks.SETTINGS, loadChildren: './settings/settings.module#SettingsPageModule' },
  { path: RouterLinks.REPORTS, loadChildren: './reports/reports.module#ReportsPageModule' },
  { path: RouterLinks.DOWNLOAD_MANAGER, loadChildren: './download-manager/download-manager.module#DownloadManagerPageModule' },
  { path: RouterLinks.STORAGE_SETTINGS, loadChildren: './storage-settings/storage-settings.module#StorageSettingsPageModule' },
  { path: RouterLinks.COURSES, loadChildren: './courses/courses.module#CoursesPageModule' },
  { path: RouterLinks.SEARCH, loadChildren: './search/search.module#SearchPageModule' },
  { path: RouterLinks.PROFILE, loadChildren: './profile/profile.module#ProfilePageModule' },
  { path: RouterLinks.ACTIVE_DOWNLOADS, loadChildren: './active-downloads/active-downloads.module#ActiveDownloadsPageModule' },
  { path: RouterLinks.COURSE_BATCHES, loadChildren: './course-batches/course-batches.module#CourseBatchesPageModule' },
  {
    path: RouterLinks.ENROLLED_COURSE_DETAILS,
    loadChildren: './enrolled-course-details-page/enrolled-course-details-page.module#EnrolledCourseDetailsPagePageModule'
  },
  { path: RouterLinks.QRSCANNER_ALERT, loadChildren: './qrscanner-alert/qrscanner-alert.module#QrscannerAlertPageModule' },
  {
    path: RouterLinks.COLLECTION_DETAIL_ETB,
    loadChildren: './collection-detail-etb/collection-detail-etb.module#CollectionDetailEtbPageModule'
  },
  {
    path: RouterLinks.ENROLLMENT_DETAILS,
    loadChildren: './enrolled-course-details-page/enrollment-details-page/enrollment-details-page.module#EnrollmentDetailsPagePageModule'
  },
  { path: RouterLinks.COLLECTION_DETAILS, loadChildren: './collection-details/collection-details.module#CollectionDetailsPageModule' },
  { path: RouterLinks.CONTENT_DETAILS, loadChildren: './content-details/content-details.module#ContentDetailsPageModule' },
  { path: RouterLinks.PLAYER, loadChildren: './player/player.module#PlayerPageModule' },
  { path: RouterLinks.PAGE_FILTER, loadChildren: './page-filter/page-filter.module#PageFilterPageModule' },
  {
    path: RouterLinks.PAGE_FILTER_OPTIONS,
    loadChildren: './page-filter/page-filter-options/page-filter-options.module#PageFilterOptionsPageModule'
  },
  { path: RouterLinks.QRCODERESULT, loadChildren: './qrcoderesult/qrcoderesult.module#QrcoderesultPageModule' },
  { path: RouterLinks.NOTIFICATION, loadChildren: './notification/notification.module#NotificationPageModule' },
  { path: RouterLinks.FAQ_HELP, loadChildren: './faq-help/faq-help.module#FaqHelpPageModule' },
  {
    path: RouterLinks.TERMS_AND_CONDITIONS,
    loadChildren: './terms-and-conditions/terms-and-conditions.module#TermsAndConditionsPageModule'
  },
  {
    path: `${RouterLinks.MENU_LANGUAGE_SETTING}/:isFromSettings`,
    loadChildren: './language-settings/language-settings.module#LanguageSettingsModule'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule],
  providers: [
    HasNotBeenOnboardedGuard,
    HasNotSelectedLanguageGuard,
    HasNotSelectedUserTypeGuard,
    HasNotSelectedFrameworkGuard,
    IsGuestUserGuard],
})
export class AppRoutingModule { }
