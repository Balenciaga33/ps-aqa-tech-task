import { BasePage } from './base.page';

export class ProfilePage extends BasePage {
  email() {
    return this.page.locator('#profile-email');
  }

  userId() {
    return this.page.locator('#profile-id');
  }
}
