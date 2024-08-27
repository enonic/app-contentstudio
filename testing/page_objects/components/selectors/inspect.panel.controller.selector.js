/**
 * Created on 23.02.2024
 */
const BaseDropdown = require('../base.dropdown');
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

    async selectFilteredOptionAndClickOnOk(optionName, parentElement) {
        try {
            await this.clickOnFilteredItemAndClickOnOk(optionName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('CustomSelectorComboBox - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
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
}

module.exports = InspectPanelControllerSelector;
