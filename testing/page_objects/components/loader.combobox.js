/**
 * Created on 01.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'LoaderComboBox')]`,
    modeTogglerButton: `//button[contains(@id,'ModeTogglerButton')]`,
};

class LoaderComboBox extends Page {

    get optionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    async selectOption(optionDisplayName) {
        let optionSelector = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(optionSelector);
        }, {timeout: appConst.longTimeout, timeoutMsg: 'option was not found! ' + optionDisplayName});
        let optionElement = await this.getDisplayedElements(optionSelector);
        await optionElement[0].click();
        return await this.pause(500);
    }

    async selectOptionByName(optionName) {
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
            await this.saveScreenshot(appConst.generateRandomName("err_combobox"));
            throw new Error(err);
        }
    }

    async getOptionDisplayNames(xpath) {
        let locator = lib.SLICK_VIEW_PORT + lib.H6_DISPLAY_NAME;
        if (xpath === undefined) {
            xpath = '';
        }
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = LoaderComboBox;


