/**
 * Created on 12.02.2024
 */
const BasDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const XPATH = {
    container: "//div[contains(@id,'CSPrincipalCombobox')]",
    listBoxUL: "//ul[contains(@id,'PrincipalsListBox')]",
    principalViewerDiv: "//div[contains(@id,'PrincipalViewer')]",
};

class PrincipalComboBox extends BasDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredUser(userDisplayName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItem(userDisplayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('Principal Comboboox selector - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getPrincipalsDisplayNameInOptions(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.listBoxUL + XPATH.principalViewerDiv + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = PrincipalComboBox;
