/**
 * Created on 06/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const EditPermissionsDialog = require('../../../page_objects/edit.permissions.dialog');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'UserAccessWidgetItemView')]`,
    editPermissionsLink: `//a[@class='edit-permissions-link']`
};

class UserAccessWidgetItemView extends Page {

    get editPermissionsLink() {
        return xpath.container + xpath.editPermissionsLink;
    }

    clickOnEditPermissionsLink() {
        return this.waitForSpinnerNotVisible(appConst.TIMEOUT_2).pause(300).then(() => {
            return this.waitForElementDisplayed(this.editPermissionsLink, appConst.TIMEOUT_2);
        }).then(() => {
            return this.clickOnElement(this.editPermissionsLink);
        }).catch(err => {
            throw new Error('Error when clicking on `Edit Permissions link`! ' + err);
        }).then(() => {
            return this.pause(400);
        });
    }

    clickOnEditPermissionsLinkAndWaitForDialog() {
        return this.waitForSpinnerNotVisible(appConst.TIMEOUT_7).then(() => {
            return this.waitForElementDisplayed(this.editPermissionsLink, appConst.TIMEOUT_3);
        }).then(() => {
            return this.clickOnElement(this.editPermissionsLink);
        }).catch(err => {
            this.saveScreenshot("err_clicking_on_edit_permissions");
            throw new Error('Error when clicking on `Edit Permissions link` ! ' + err);
        }).then(() => {
            let editPermissionsDialog = new EditPermissionsDialog();
            return editPermissionsDialog.waitForDialogLoaded();
        }).catch(err => {
            this.saveScreenshot("edit_perm_dlg_not_loaded");
            throw new Error("Edit permissions dialog was not loaded!  " + err);
        })
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.editPermissionsLink, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Access widget was not loaded! ' + err);
        });
    }
};
module.exports = UserAccessWidgetItemView;


