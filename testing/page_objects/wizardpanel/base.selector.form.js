/**
 * Created on 09.07.2020.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');
const {COMMON} = require("../../libs/elements");

class BaseSelectorForm extends Page {

    get selectorValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    async getSelectorValidationMessage() {
        try {
            await this.waitForElementDisplayed(this.selectorValidationRecording);
            let recordingElements = await this.getDisplayedElements(this.selectorValidationRecording);
            return await recordingElements[0].getText();
        } catch (err) {
            await this.handleError("Selector Validation message should be displayed in the form", 'err_validation_message', err);
        }
    }

    async waitForSelectorValidationMessageNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.selectorValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Selector Validation recording should not be displayed"});
    }

    async clearOptionsFilterInput() {
        await this.clearInputText(this.optionsFilterInput);
        await this.pause(1000);
    }

    async typeTextInOptionsFilterInput(text) {
        await this.typeTextInInput(this.optionsFilterInput, text);
        return await this.pause(500);
    }

    async clickInOptionsFilterInput() {
        await this.clickOnElement(this.optionsFilterInput);
        return await this.pause(500);
    }

    async swapOptions(sourceName, destinationName) {
        let sourceLocator = this.selectedOptionByDisplayName(sourceName);
        let destinationLocator = this.selectedOptionByDisplayName(destinationName);
        let source1 = await this.findElements(sourceLocator);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destinationLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    async waitForEmptyOptionsMessage() {
        try {
            let locator = "//div[@data-combobox-popup]//span[contains(@class,'text-subtle') and contains(text(),'No matching items')]"
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError(`Image Selector - 'No matching items' text should appear`, 'err_img_sel_empty_opt', err);
        }
    }


    async clickOnExpanderIconInOptionsList(optionName) {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.clickOnExpanderIconInOptionsList(optionName);
    }
}

module.exports = BaseSelectorForm;
