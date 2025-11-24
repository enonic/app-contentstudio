/**
 * Created on 23.02.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'PageTemplateAndControllerSelector')]",
    selectorListBoxUL: "//ul[contains(@id,'PageOptionsList')]",
    optionByName: text => {
        return `//div[contains(@id,'PageTemplateAndSelectorViewer') and descendant::h6[ text()='${text}']]`
    },
};

class InspectPanelControllerSelector extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredOptionByDisplayName(optionName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItem(optionName, parentElement);
        } catch (err) {
            await this.handleError(`Inspect Panel, Controller Selector - Error during selecting the filtered option: ${optionName}`, err);
        }
    }

    async getOptionsName(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.selectorListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsDescription(parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.selectorListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForApplySelectionButtonNotDisplayed(parentLocator = '') {
        try {
            // Wait until the Apply Selection button is not displayed
            await this.waitForElementNotDisplayed(this.applySelectionButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError(`Page Inspection Panel 'Apply Selection' button should not be displayed in the controller selector`,
                'err_page_controller_apply_button', err);
        }
    }
}

module.exports = InspectPanelControllerSelector;
