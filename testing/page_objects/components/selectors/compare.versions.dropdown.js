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

    async selectFilteredVersionItem(optionName, parentElement) {
        try {
            await this.clickOnFilteredByNameItemAndClickOnApply(optionName, parentElement);
        } catch (err) {
            await this.handleError('CompareDropdown - Tried to select the option', 'err_compare_dropdown_select',err);
        }
    }

    async getOptionsDisplayName() {
        let locator = XPATH.container + XPATH.compareVersionsDropdownListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM +
                      lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);;
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = CompareDropdown;
