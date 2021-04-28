/**
 * Created on 25.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    occurrenceErrorBlock: "//div[contains(@id,'InputOccurrenceView')]//div[contains(@class,'error-block')]",
    inputValidationView: "//div[contains(@id,'InputViewValidationViewer')]",
    addButton: "//div[@class='bottom-button-row']//button[child::span[text()='Add']]",
};

class OccurrencesFormView extends Page {

    get formValidationRecording() {
        return lib.FORM_VIEW + XPATH.inputValidationView;
    }

    get occurrenceInputErrorRecording() {
        return lib.FORM_VIEW + XPATH.occurrenceErrorBlock;
    }

    waitForFormValidationRecordingDisplayed() {
        return this.waitForElementDisplayed(this.formValidationRecording, appConst.mediumTimeout);
    }

    async getForFormValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements[0].getText();
    }

    async waitForFormValidationRecordingNotDisplayed() {
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements.length == 0;

        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(recordingElements);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should not be displayed"});
    }


    async getOccurrenceValidationRecording(index) {
        try {
            let elements = await this.findElements(this.occurrenceInputErrorRecording);
            if (elements.length === 0) {
                throw new Error("Long Form - Element was not found:" + this.occurrenceInputErrorRecording);
            }
            return await elements[index].getText();
        } catch (err) {
            this.saveScreenshot('err_long_validation_recording');
            throw new Error('getting Validation text: ' + err);
        }
    }

    get addButton() {
        return lib.FORM_VIEW + XPATH.addButton;
    }

    async clickOnAddButton() {
        await this.waitForElementDisplayed(this.addButton);
        return await this.clickOnElement(this.addButton);
    }
}

module.exports = OccurrencesFormView;
