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
        }, appConst.longTimeout, 'option was not found! ' + optionDisplayName);
        let optionElement = await this.getDisplayedElements(optionSelector);
        await optionElement[0].click();
        return await this.pause(200);
    }

    async selectOptionByName(optionName) {
        let optionSelector = lib.slickRowByName(XPATH.container, optionName);
        await this.getBrowser().waitUntil(async () => {
            return await this.isElementDisplayed(optionSelector);
        }, appConst.longTimeout, 'option was not found! ' + optionName);
        let optionElement = await this.getDisplayedElements(optionSelector);
        return await optionElement[0].click();
    }

    async typeTextAndSelectOption(optionDisplayName, xpath) {
        try {
            let optionSelector = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
            if (xpath === undefined) {
                xpath = '';
            }
            let elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
            if (elems.length === 0) {
                await this.waitForElementDisplayed(xpath + this.optionsFilterInput, appConst.mediumTimeout);
                elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
            }
            //await this.getBrowser().elementSendKeys(elems[0].elementId, [optionDisplayName]);
            await elems[0].setValue(optionDisplayName);
            await this.waitForElementDisplayed(optionSelector, appConst.longTimeout);
            await this.pause(300);
            await this.clickOnElement(optionSelector);
            return await this.pause(700);
        } catch (err) {
            this.saveScreenshot(appConst.generateRandomName("err_combobox"));
            throw new Error(err);
        }

    }

    getOptionDisplayNames() {
        //TODO implement it
    }
}

module.exports = LoaderComboBox;


