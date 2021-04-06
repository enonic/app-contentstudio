/**
 * Created on 25.12.2017.
 */

const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    doubleInput: `//div[contains(@id,'Double')]`,
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
    addButton: "//div[@class='bottom-button-row']//button[child::span[text()='Add']]",
};

class DoubleForm extends Page {

    get doubleInput() {
        return lib.FORM_VIEW + XPATH.doubleInput + lib.TEXT_INPUT;
    }

    get validationRecord() {
        return lib.FORM_VIEW + XPATH.validationRecording;
    }

    get addButton() {
        return lib.FORM_VIEW + XPATH.addButton;
    }

    async clickOnAddButton(longData) {
        await this.waitForElementDisplayed(this.addButton);
        return await this.clickOnElement(this.addButton);
    }

    typeDouble(value) {
        return this.typeTextInInput(this.doubleInput, value);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    getValidationRecord() {
        return this.getText(this.validationRecord).catch(err => {
            this.saveScreenshot('err_double_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }

    async isInvalidValue(index) {
        let inputs = await this.getDisplayedElements(this.doubleInput);
        if (inputs.length === 0) {
            throw new Error("Double Form - Double inputs were not found!");
        }
        let attr = await inputs[index].getAttribute("class");
        return attr.includes("invalid");
    }
}

module.exports = DoubleForm;
