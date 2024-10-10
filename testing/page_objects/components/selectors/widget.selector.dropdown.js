/**
 * Created on 27.08.2024
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'WidgetFilterDropdown')]",
    widgetDropdownListUL: "//ul[contains(@id,'WidgetSelectorDropdown')]",
}

class WidgetSelectorDropdown extends BaseDropdown {

    get container() {
        return XPATH.container;
    }

    async selectFilteredWidgetItem(widgetDisplayName, parentElement) {
        try {
            await this.clickOnFilteredByDisplayNameItem(widgetDisplayName, parentElement);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error('WidgetSelectorDropdown - Error during selecting the option, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getOptionsName() {
        let locator = XPATH.container + XPATH.widgetDropdownListUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.H6_DISPLAY_NAME;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = WidgetSelectorDropdown;
