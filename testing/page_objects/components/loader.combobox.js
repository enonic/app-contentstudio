/**
 * Created on 01.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'LoaderComboBox')]`,
};

class LoaderComboBox extends Page {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get modeTogglerButton() {
        return XPATH.container + lib.DROPDOWN_SELECTOR.MODE_TOGGLER_BUTTON;
    }

    get applyButton() {
        return "//button[contains(@class,'small apply-button')]";
    }

    // tree mode if 'active' is present in @class attribute
    async getMode(xpath) {
        let attr = await this.getAttribute(xpath + this.modeTogglerButton, 'class');
        return attr.includes('active') ? 'tree' : 'flat';
    }

    async waitForApplyButtonDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(this.applyButton);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Combobox - Apply button is not displayed! '});
    }

    async clickOnApplyButton() {
        try {
            await this.waitForApplyButtonDisplayed();
            await this.clickOnElement(this.applyButton);
            await this.pause(1000);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error("Combobox, 'Apply' button, screenshot: " + screenshot + ' ' + err);
        }
    }

    async selectOption(optionDisplayName) {
        let optionSelector = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(optionSelector);
        }, {timeout: appConst.longTimeout, timeoutMsg: 'option was not found! ' + optionDisplayName});
        // to avoid the stale element reference error:
        await this.pause(400);
        let optionElement = await this.getDisplayedElements(optionSelector);
        await optionElement[0].click();
        return await this.pause(500);
    }

    async selectOptionByName(optionName, xpath) {
        let optionLocator = lib.slickRowByDisplayName(XPATH.container, optionName);
        if (xpath === undefined) {
            xpath = '';
        }
        let optionSelector = lib.slickRowByName(XPATH.container, optionName);
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(optionSelector);
        }, {timeout: appConst.longTimeout, timeoutMsg: 'option was not found! ' + optionName});
        let optionElement = await this.getDisplayedElements(optionSelector);
        return await optionElement[0].click();
    }

    async typeTextAndSelectOption(optionDisplayName, xpath) {
        try {
            let optionLocator = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
            if (xpath === undefined) {
                xpath = '';
            }
            let elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
            if (elems.length === 0) {
                await this.waitForElementDisplayed(xpath + this.optionsFilterInput, appConst.mediumTimeout);
                elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
            }
            //Set text in the options filter input:
            await elems[0].setValue(optionDisplayName);
            //wait for required options is filtered and displayed:
            await this.waitForElementDisplayed(optionLocator, appConst.longTimeout);
            await this.pause(300);
            //click on the option in the dropdown list
            await this.clickOnElement(optionLocator);
            return await this.pause(800);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combobox');
            throw new Error("Combobox, error during selecting the option,  screenshot: " + screenshot + ' ' + err);
        }
    }

    async getOptionDisplayNames(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        let locator = xpath + lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsName(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        let locator = xpath + lib.SLICK_VIEW_PORT + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnCheckboxInDropdown(index, xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        let locator = xpath +
                      "//div[contains(@id,'Grid') and contains(@class,'options-container')]//div[contains(@class,'slick-cell-checkboxsel')]/label";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let result = await this.findElements(locator);
        if (result.length === 0) {
            await this.saveScreenshot(appConst.generateRandomName('err_selector_dropdown'));
            throw new Error('Content selector - options were not found:' + err);
        }
        await result[index].click();
        await this.pause(300);
    }

    async clickOnCheckboxByNameInDropdown(contentName) {
        let locator = lib.checkboxByName(contentName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }
}

module.exports = LoaderComboBox;


