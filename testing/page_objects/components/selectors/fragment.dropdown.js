/**
 * Created on 01.03.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'FragmentDropdown')]",
    fragmentDropdownListUL: "//ul[contains(@id,'FragmentDropdownList')]",
}

class FragmentDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredFragment(optionName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItem(optionName, parentElement);
        } catch (err) {
            await this.handleError(`Tried to select the option ${optionName}`,'err_fragment_dropdown', err)
        }
    }

    async getOptionsDisplayName() {
        let locator = XPATH.container + XPATH.fragmentDropdownListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }

    async getSelectedOptionPath(optionName) {
        let locator = XPATH.container + lib.P_SUB_NAME;
        return await this.getText(locator);
    }
}

module.exports = FragmentDropdown;
