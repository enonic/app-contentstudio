/**
 * Created on 06/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const EditPermissionsGeneralStep = require('../../permissions/edit.permissions.general.step');
const {BUTTONS} = require('../../../libs/elements');

const xpath = {
    container: "//section[contains(@data-component,'DetailsWidgetPermissionsSection')]",
    description: "//div[contains(@data-component,'PermissionsAccessDescription')]/span",
    permissionsListDiv: "//div[contains(@data-component,'PermissionsList')]",
    principalCompactViewer: "//div[contains(@id,'PrincipalViewerCompact')]",
    getOperation: userCompactName => `/span[contains(@class,'text-subtle') and following-sibling::div[1][child::span[contains(.,'${userCompactName}')]]]`,

};

class DetailsWidgetPermissionsSection extends Page {

    get editPermissionsButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Edit permissions');
    }

    async getHeader() {
        let locator = xpath.container + xpath.description;
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getText(locator);
    }

    async getPrincipalAccess(userCompactName) {
        let locator = xpath.container + xpath.permissionsListDiv + xpath.getOperation(userCompactName);
        return await this.getText(locator);
    }

    async getPrincipalsCompactName() {
        let locator = xpath.container + xpath.permissionsListDiv +  "/div/span/span";
        await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        return await this.getTextInElements(locator);
    }

    async clickOnEditPermissionsButton() {
        try {
            await this.waitForElementDisplayed(this.editPermissionsButton, appConst.shortTimeout);
            return await this.clickOnElement(this.editPermissionsButton);
        } catch (err) {
            await this.handleError(`Access Widget, Edit Permissions button`, 'err_widget_edit_permissions_link', err);
        }
    }

    async clickOnEditPermissionsLinkAndWaitForDialog() {
        let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
        await this.clickOnEditPermissionsButton();
        await editPermissionsGeneralStep.waitForLoaded();
        return await this.pause(500);
    }

    async waitForLoaded() {
        return await this.waitForElementDisplayed(this.editPermissionsButton, appConst.shortTimeout);
    }
}

module.exports = DetailsWidgetPermissionsSection;


