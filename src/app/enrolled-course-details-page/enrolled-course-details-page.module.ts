import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EnrolledCourseDetailsPage } from './enrolled-course-details-page';
import { DirectivesModule } from '@app/directives/directives.module';
import { PipesModule } from '@app/pipes/pipes.module';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../components/components.module';
import { ContentActionsComponent } from '../components';
import { IonicRatingModule, RatingComponent } from 'ionic4-rating';

const routes: Routes = [
  {
    path: '',
    component: EnrolledCourseDetailsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IonicRatingModule,
    RouterModule.forChild(routes),
    RouterModule.forChild(routes),
    TranslateModule.forChild(),
    PipesModule,
    DirectivesModule,
    ComponentsModule
  ],
  declarations: [EnrolledCourseDetailsPage],
  entryComponents:[ContentActionsComponent],
  providers: [DatePipe]
})
export class EnrolledCourseDetailsPagePageModule { }
