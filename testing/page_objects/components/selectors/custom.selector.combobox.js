/**
 * Created on 20.02.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'CustomSelectorComboBox')]",
    selectorListBoxUL: "//ul[contains(@id,'CustomSelectorListBox')]",
    optionByText: text => {
        return `//div[contains(@id,'ComboBoxDisplayValueViewer') and text()='${text}']`
    },
};

class CustomSelectorComboBox extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredOptionAndClickOnApply(optionName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(optionName, parentElement);
        } catch (err) {
            await this.handleError(`Error after trying to select option ${optionName} and click on Apply`, 'err_select_option_apply', err);
        }
    }

    async getOptionsName(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.selectorListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = CustomSelectorComboBox;
