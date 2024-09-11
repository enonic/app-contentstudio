/**
 * Created on 23.02.2024
 */
const BasDropdown = require('../selectors/base.dropdown');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');
const XPATH = {
    container: "//div[contains(@id,'ExtendedPrincipalComboBox')]",
    principalByName:
        name => `//div[contains(@id,'PrincipalSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    principalByDisplayName:
        name => `//div[contains(@id,'PrincipalSelectedOptionView') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`,
};

// Selected users can read content(3 of 7 - Select default read permissions for a new content in the project)
class ExtendedPrincipalComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    // Custom - Selected users can read content
    async clickOnFilteredByDisplayNameUserAndClickOnOk(displayName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(displayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Error occurred in ProjectAccessControlComboBox, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async removeSelectedUserItem(principalName, parentLocator) {
        try {
            let selector = parentLocator + XPATH.container + XPATH.principalByName(principalName) + lib.REMOVE_ICON;
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_principal');
            throw new Error("Error when trying to remove project Access Item, screenshot: " + screenshot + "  " + err);
        }
    }
}

module.exports = ExtendedPrincipalComboBox;
