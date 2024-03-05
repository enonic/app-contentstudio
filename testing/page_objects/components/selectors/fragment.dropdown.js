/**
 * Created on 01.03.2024
 */
const BaseDropdown = require('../base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'FragmentDropdown')]",
    fragmentDropdownListUL: "//ul[contains(@id,'FragmentDropdownList')]",
    dropdownListItem: "//li[contains(@class,'item-view-wrapper')]",
    optionByText: text => {
        return `//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${text}']`
    },
};

class FragmentDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredFragmentAndClickOnOk(optionName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(optionName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('CustomSelectorComboBox - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayName() {
        let locator = XPATH.container + XPATH.fragmentDropdownListUL + XPATH.dropdownListItem + lib.H6_DISPLAY_NAME;
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
