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

    selectOption(optionDisplayName) {
        let optionSelector = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
        return this.waitForElementDisplayed(optionSelector, appConst.TIMEOUT_3).catch(err => {
            throw new Error('option was not found! ' + optionDisplayName + ' ' + err);
        }).then(() => {
            return this.clickOnElement(optionSelector).catch((err) => {
                this.saveScreenshot('err_select_option');
                throw new Error('option not found!' + optionDisplayName);
            })
        })
    }

    async typeTextAndSelectOption(optionDisplayName, xpath) {
        let optionSelector = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
        if (xpath === undefined) {
            xpath = '';
        }
        let elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
        //await this.getBrowser().elementSendKeys(elems[0].elementId, [optionDisplayName]);
        await elems[0].setValue(optionDisplayName);
        await this.waitForElementDisplayed(optionSelector);
        await this.pause(300);
        await this.clickOnElement(optionSelector);
        this.saveScreenshot('combo_clicking_on_option');
        return await this.pause(500);
    }

    getOptionDisplayNames() {
        //TODO implement it
    }
};
module.exports = LoaderComboBox;


