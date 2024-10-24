/**
 * Created on 06/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const EditPermissionsDialog = require('../../../page_objects/edit.permissions.dialog');

const xpath = {
    container: "//div[contains(@id,'WidgetView')]//div[contains(@id,'UserAccessWidgetItemView')]",
    headerString: "//span[contains(@class,'header-string')]",
    editPermissionsLink: "//a[@class='edit-permissions-link']",
    accessList: "//div[contains(@id,'UserAccessListItemView')]",
    principalCompactViewer: "//div[contains(@id,'PrincipalViewerCompact')]",
    getOperation: userCompactName => `//div[contains(@id,'UserAccessListItemView') and descendant::span[contains(@class,'user-icon') and text()='${userCompactName}']]//span[contains(@class,'access-line')]`
};

class UserAccessWidgetItemView extends Page {

    get editPermissionsLink() {
        return xpath.container + xpath.editPermissionsLink;
    }

    async getHeader() {
        let locator = xpath.container + xpath.headerString;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getText(locator);
    }

    getPrincipalAccess(userCompactName) {
        let locator = xpath.container + xpath.getOperation(userCompactName);
        return this.getText(locator);
    }

    async getPrincipalsCompactName() {
        let locator = xpath.container + xpath.accessList + xpath.principalCompactViewer + "/span[contains(@class,'user-icon')]";
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInElements(locator);
    }

    async clickOnEditPermissionsLink() {
        try {
            //await this.waitForSpinnerNotVisible(appConst.TIMEOUT_4);
            await this.waitForElementDisplayed(this.editPermissionsLink, appConst.shortTimeout);
            return await this.clickOnElement(this.editPermissionsLink);
        } catch (err) {
            throw new Error('Error when clicking on `Edit Permissions link`! ' + err);
        }
    }

    async clickOnEditPermissionsLinkAndWaitForDialog() {
        try {
            let editPermissionsDialog = new EditPermissionsDialog();
            await this.clickOnEditPermissionsLink();
            await editPermissionsDialog.waitForDialogLoaded();
            return await this.pause(500);
        } catch (err) {
            await this.saveScreenshot("edit_perm_dlg_not_loaded");
            throw new Error("Edit permissions dialog was not loaded!  " + err);
        }
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.editPermissionsLink, appConst.shortTimeout).catch(err => {
            throw new Error('Access widget was not loaded! ' + err);
        });
    }
}

module.exports = UserAccessWidgetItemView;


