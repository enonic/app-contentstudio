/**
 * Created on 25.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    addButton: "//div[@class='bottom-button-row']//button[child::span[text()='Add']]",
    removeButton: "//div[contains(@id,'TextLine')]//button[@class='remove-button']",
};

class OccurrencesFormView extends Page {

    get formValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    get inputOccurrenceErrorRecording() {
        return lib.FORM_VIEW + lib.OCCURRENCE_ERROR_BLOCK;
    }

    get addButton() {
        return lib.FORM_VIEW + XPATH.addButton;
    }

    get removeButton() {
        return lib.FORM_VIEW + XPATH.removeButton;
    }

    async clickOnLastRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        let removeElements = await this.getDisplayedElements(this.removeButton);
        return await removeElements[removeElements.length - 1].click();
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should be displayed"});
    }

    async getFormValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements[0].getText();
    }

    async waitForFormValidationRecordingNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should not be displayed"});
    }

    async getOccurrenceValidationRecording(index) {
        try {
            let elements = await this.findElements(this.inputOccurrenceErrorRecording);
            if (elements.length === 0) {
                throw new Error("occurrences form - Element was not found:" + this.inputOccurrenceErrorRecording);
            }
            return await elements[index].getText();
        } catch (err) {
            this.saveScreenshot('err_long_validation_recording');
            throw new Error('getting Validation text: ' + err);
        }
    }

    waitForAddButtonDisplayed() {
        return this.waitUntilDisplayed(this.addButton, appConst.mediumTimeout);
    }

    waitForRemoveButtonDisplayed() {
        return this.waitUntilDisplayed(this.removeButton, appConst.mediumTimeout);
    }

    waitForRemoveButtonNotDisplayed() {
        this.waitForElementNotDisplayed(this.removeButton, appConst.mediumTimeout);
    }

    waitForAddButtonNotDisplayed() {
        this.waitForElementNotDisplayed(this.addButton, appConst.mediumTimeout);
    }

    async clickOnAddButton() {
        await this.waitForAddButtonDisplayed();
        let result = await this.getDisplayedElements(this.addButton);
        return await result[0].click();
    }
}

module.exports = OccurrencesFormView;
