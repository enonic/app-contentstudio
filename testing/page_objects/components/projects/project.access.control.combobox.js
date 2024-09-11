/**
 * Created on 23.02.2024
 */
const BasDropdown = require('../selectors/base.dropdown');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'ProjectAccessControlComboBox')]",
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    accessItemByDisplayName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`,
};

// select a user in the dropdown selector and specify a role
class ProjectAccessControlComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async clickOnFilteredByDisplayNamePrincipalAndClickOnOk(displayName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in ProjectAccessControlComboBox, screenshot: ' + screenshot + ' ' + err);
        }
    }

    // click on the role, open menu and select new role for the user:
    async updateUserAccessRole(userDisplayName, newRole, parentElement) {
        let menuLocator = parentElement + XPATH.container + XPATH.accessItemByName(userDisplayName) +
                          "//div[contains(@id,'TabMenuButton')]";
        await this.waitForElementEnabled(menuLocator, appConst.mediumTimeout);
        await this.clickOnElement(menuLocator);
        await this.pause(400);
        let menuItem = parentElement + XPATH.container + XPATH.accessItemByName(userDisplayName) + lib.tabMenuItem(newRole);
        await this.waitForElementDisplayed(menuItem, appConst.shortTimeout);
        await this.pause(300);
        await this.clickOnElement(menuItem);
        return await this.pause(500);
    }

    async removeProjectAccessItem(principalName, parentLocator) {
        try {
            let selector = parentLocator + XPATH.container + XPATH.accessItemByDisplayName(principalName) + lib.REMOVE_ICON;
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_principal');
            throw new Error("Error when trying to remove project Access Item, screenshot: " + screenshot + "  " + err);
        }
    }
}

module.exports = ProjectAccessControlComboBox;
