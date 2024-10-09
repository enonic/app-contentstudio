/**
 * Created on 06.09.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'CompareDropdown')]",
    compareVersionsDropdownListUL: "//ul[contains(@id,'CompareList')]",
}

class CompareDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredVersionItemAndClickOnOk(optionName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(optionName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('CompareDropdown - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayName() {
        let locator = XPATH.container + XPATH.compareVersionsDropdownListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM +
                      lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = CompareDropdown;
