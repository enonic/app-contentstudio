/**
 * Created on 09.07.2020.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');

class BaseSelectorForm extends Page {

    get selectorValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    async getSelectorValidationMessage() {
        try {
            let contentSelector = new ContentSelectorDropdown();
            await contentSelector.getSelectorValidationMessage(this.selectorValidationRecording);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_validation_message');
            throw new Error("Validation message should be displayed in the form, screenshot:" + screenshot + ' ' + err);
        }
    }

    async waitForSelectorValidationMessageNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.selectorValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Selector Validation recording should not be displayed"});
    }

    async clearOptionsFilterInput(){
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


    async getOptionsDisplayNameInTreeMode() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            return await contentSelectorDropdown.getOptionsDisplayNameInTreeMode()
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error("Error occurred in the dropdown selector, screenshot: " + screenshot + ' ' + err);
        }
    }

    async clickOnExpanderIconInOptionsList(optionName) {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.clickOnExpanderIconInOptionsList(optionName);
    }
}

module.exports = BaseSelectorForm;
