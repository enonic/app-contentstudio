/**
 * Created on 09.07.2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

class BaseSelectorForm extends Page {

    get selectorValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    async getSelectorValidationMessage() {
        try {
            let locator = lib.CONTENT_WIZARD_STEP_FORM + this.selectorValidationRecording;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
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

    async swapOptions(sourceName, destinationName) {
        let sourceLocator = this.selectedOptionByDisplayName(sourceName);
        let destinationLocator = this.selectedOptionByDisplayName(destinationName);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destinationLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(lib.EMPTY_OPTIONS_DIV, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_empty_opt');
            throw new Error("Empty options text is not visible, screenshot: " + screenshot + ' ' + err);
        }
    }
}

module.exports = BaseSelectorForm;
