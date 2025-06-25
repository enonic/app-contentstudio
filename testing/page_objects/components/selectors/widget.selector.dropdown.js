/**
 * Created on 27.08.2024
 */
const Page = require('../../page');
const {DROPDOWN, COMMON} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements-old');

const XPATH = {
    container: "//button[contains(@id,'WidgetSelector') and @role='combobox']",
    widgetSelectorListbox: "//div[contains(@id,'WidgetsSelector') and @role='listbox']",
    optionsNameSpan: "//div[contains(@role,'option')]//div[@data-component='WidgetsSelectorItem']//span",
}

class WidgetSelectorDropdown extends Page {

    get container() {
        return XPATH.container;
    }

    get dropdownHandle() {
        return this.container;
    }

    async getSelectedOption(parent = '') {
        let selector = parent + COMMON.CONTEXT_WINDOW_WIDGET_SELECTOR_ITEM;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

    async clickOnOptionByDisplayName(optionDisplayName, parentLocator = '') {
        let optionLocator = DROPDOWN.selectorListOptionByName(optionDisplayName);//"//div[contains(@id,'WidgetsSelector') and @role='listbox']" ;
        //  Wait for the required option is displayed:
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // Click on the item:
        await this.clickOnElement(optionLocator);
    }

    async getOptionsName() {
        let locator = DROPDOWN.SELECTOR_LISTBOX + XPATH.optionsNameSpan;
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        await this.pause(300);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnDropdownHandle(parentLocator = '') {
        await this.waitForElementDisplayed(parentLocator + this.dropdownHandle, appConst.mediumTimeout);
        return await this.clickOnElement(parentLocator + this.dropdownHandle);
    }
}

module.exports = WidgetSelectorDropdown;
