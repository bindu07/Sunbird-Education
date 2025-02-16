import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { ProfilePage } from '@app/app/profile/profile.page';
import { ProfileRoutingModule } from '@app/app/profile/profile-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@app/app/components/components.module';
import { EditContactDetailsPopupComponent } from '../components';

const routes: Routes = [
  {
    path: '',
    component: ProfilePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfileRoutingModule,
    TranslateModule,
    ComponentsModule
  ],
  declarations: [ProfilePage],
  entryComponents: []
})
export class ProfilePageModule { }
