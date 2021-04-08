/**
 * Created on 25.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const XPATH = {
    longInput: "//div[contains(@id,'Long') and contains(@class,'input-type-view')]",
    validationRecording: "//div[contains(@id,'ValidationRecordingViewer')]//li",
    addButton: "//div[@class='bottom-button-row']//button[child::span[text()='Add']]",
};

class LongForm extends Page {

    get longInput() {
        return lib.FORM_VIEW + XPATH.longInput + lib.TEXT_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    get addButton() {
        return lib.FORM_VIEW + XPATH.addButton;
    }

    async clickOnAddButton() {
        await this.waitForElementDisplayed(this.addButton);
        return await this.clickOnElement(this.addButton);
    }

    waitForValidationRecording(ms) {
        return this.waitForElementDisplayed(this.validationRecord, ms);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_long_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }

    //get values in occurrences of inputs
    async getLongValues() {
        let values = [];
        let longElements = await this.getDisplayedElements(this.longInput);
        await Promise.all(longElements.map(async (el) => {
            const value = await el.getValue();
            values.push(value);
        }));
        return values;
    }

    async typeLong(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let longElements = await this.getDisplayedElements(this.longInput);
        await longElements[index].setValue(value);
        return await this.pause(300);
    }
}

module.exports = LongForm;
