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
        return this.waitForElementDisplayed(optionSelector, appConst.TIMEOUT_5).catch(err => {
            throw new Error('option was not found! ' + optionDisplayName + ' ' + err);
        }).then(() => {
            return this.clickOnElement(optionSelector).catch(err => {
                this.saveScreenshot('err_select_option');
                throw new Error('Error when clicking on the option!' + optionDisplayName + " " + err);
            }).then(() => {
                return this.pause(300);
            })
        })
    }

    async typeTextAndSelectOption(optionDisplayName, xpath) {
        try {
            let optionSelector = lib.slickRowByDisplayName(XPATH.container, optionDisplayName);
            if (xpath === undefined) {
                xpath = '';
            }
            let elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
            if (elems.length === 0) {
                await this.waitForElementDisplayed(xpath + this.optionsFilterInput, appConst.TIMEOUT_3);
                elems = await this.getDisplayedElements(xpath + this.optionsFilterInput);
            }
            //await this.getBrowser().elementSendKeys(elems[0].elementId, [optionDisplayName]);
            await elems[0].setValue(optionDisplayName);
            await this.waitForElementDisplayed(optionSelector, appConst.TIMEOUT_5);
            await this.pause(300);
            await this.clickOnElement(optionSelector);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot(appConst.generateRandomName("err_combobox"));
            throw new Error(err);
        }

    }

    getOptionDisplayNames() {
        //TODO implement it
    }
};
module.exports = LoaderComboBox;


