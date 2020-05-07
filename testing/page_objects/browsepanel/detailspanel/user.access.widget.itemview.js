/**
 * Created on 06/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const EditPermissionsDialog = require('../../../page_objects/edit.permissions.dialog');

const xpath = {
    container: "//div[contains(@id,'WidgetView')]//div[contains(@id,'UserAccessWidgetItemView')]",
    headerString: "//span[contains(@class,'header-string')]",
    editPermissionsLink: "//a[@class='edit-permissions-link']"
};

class UserAccessWidgetItemView extends Page {

    get editPermissionsLink() {
        return xpath.container + xpath.editPermissionsLink;
    }

    async clickOnEditPermissionsLink() {
        try {
            await this.waitForSpinnerNotVisible(appConst.TIMEOUT_4);
            await this.waitForElementDisplayed(this.editPermissionsLink, appConst.TIMEOUT_2);
            return await this.clickOnElement(this.editPermissionsLink);
        } catch (err) {
            throw new Error('Error when clicking on `Edit Permissions link`! ' + err);
        }
    }

    async clickOnEditPermissionsLinkAndWaitForDialog() {
        try {
            let editPermissionsDialog = new EditPermissionsDialog();
            await this.clickOnEditPermissionsLink();
            await this.pause(200);
            return await editPermissionsDialog.waitForDialogLoaded();
        } catch (err) {
            this.saveScreenshot("edit_perm_dlg_not_loaded");
            throw new Error("Edit permissions dialog was not loaded!  " + err);
        }
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.editPermissionsLink, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Access widget was not loaded! ' + err);
        });
    }
};
module.exports = UserAccessWidgetItemView;


