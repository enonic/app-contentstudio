/**
 * Created on 06/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const EditPermissionsGeneralStep = require('../../permissions/edit.permissions.general.step');

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

    async getPrincipalAccess(userCompactName) {
        let locator = xpath.container + xpath.getOperation(userCompactName);
        return await this.getText(locator);
    }

    async getPrincipalsCompactName() {
        let locator = xpath.container + xpath.accessList + xpath.principalCompactViewer + "/span[contains(@class,'user-icon')]";
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInElements(locator);
    }

    async clickOnEditPermissionsLink() {
        try {
            await this.waitForElementDisplayed(this.editPermissionsLink, appConst.shortTimeout);
            return await this.clickOnElement(this.editPermissionsLink);
        } catch (err) {
            await this.handleError(`Access Widget, Edit Permissions link`, 'err_widget_edit_permissions_link', err);
        }
    }

    async clickOnEditPermissionsLinkAndWaitForDialog() {
        let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
        await this.clickOnEditPermissionsLink();
        await editPermissionsGeneralStep.waitForLoaded();
        return await this.pause(500);
    }

    async waitForLoaded() {
        return await this.waitForElementDisplayed(this.editPermissionsLink, appConst.shortTimeout);
    }
}

module.exports = UserAccessWidgetItemView;


