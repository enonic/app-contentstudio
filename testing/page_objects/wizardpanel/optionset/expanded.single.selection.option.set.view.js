/**
 * Created on 31.10.2022 updated on 14.06.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const {COMMON, DROPDOWN} = require('../../../libs/elements');

const xpath = {
    container: "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='Single selection']]",
    resetMenuItem: "//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item' and text()='Reset']",
};

/**
 * Page Object for content with single-select option-sets with <expanded>true</expanded>
 */
class ExpandedSingleSelectionOptionSet extends Page {

    get option1TextInput() {
        return xpath.container + COMMON.INPUTS.inputFieldByLabel('option-1-name') + COMMON.INPUTS.INPUT;
    }

    get option2OptionsFilterInput() {
        return xpath.container + COMMON.INPUTS.inputFieldByLabel('option-2-image-selector') + DROPDOWN.OPTION_FILTER_DATA_COMPONENT;
    }

    waitForOption1TextInputDisplayed() {
        return this.waitForElementDisplayed(this.option1TextInput, appConst.mediumTimeout);
    }

    waitForOption1TextInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.option1TextInput, appConst.mediumTimeout);
    }

    waitForOption2FilterInputDisplayed() {
        return this.waitForElementDisplayed(this.option2OptionsFilterInput, appConst.mediumTimeout);
    }

    waitForOption2FilterInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.option2OptionsFilterInput, appConst.mediumTimeout);
    }

    get selectionMenuButton() {
        return xpath.container + "//div[@data-component='ContextMenu.Trigger']//button";
    }

    async expandOptionSetMenu() {
        await this.waitForElementDisplayed(this.selectionMenuButton, appConst.mediumTimeout);
        await this.clickOnElement(this.selectionMenuButton);
        return await this.pause(500);
    }

    async clickOnResetMenuItem() {
        await this.waitForElementDisplayed(xpath.resetMenuItem, appConst.mediumTimeout);
        await this.clickOnElement(xpath.resetMenuItem);
        return await this.pause(400);
    }

    async selectOption(option) {
        try {
            let locator = xpath.container + COMMON.INPUTS.dataComponentRadioByLabel(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_optionset');
            throw new Error(`Error selecting option '${option}' in single selection, screenshot: ${screenshot} ` + err);
        }
    }
}

module.exports = ExpandedSingleSelectionOptionSet;
