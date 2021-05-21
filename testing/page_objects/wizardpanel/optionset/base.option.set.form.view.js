/**
 * Created on 20.05.2021.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const XPATH = {
    formOptionSetOccurrenceView: "//div[contains(@id,'FormOptionSetOccurrenceView')]"
};

class BaseOptionSetFormView extends Page {

    get formValidationRecording() {
        return this.formOptionSet + XPATH.formOptionSetOccurrenceView + "//div[@class='selection-message']";
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should be displayed"});
    }

    async getOptionSetValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements[0].getText();
    }

    async waitForOptionSetValidationRecordingNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should not be displayed"});
    }


    async getOccurrenceValidationRecording(index) {
        try {
            let elements = await this.findElements(this.formValidationRecording);
            if (elements.length === 0) {
                throw new Error("occurrences  option set form - Element was not found:" + this.formValidationRecording);
            }
            return await elements[index].getText();
        } catch (err) {
            this.saveScreenshot('err_option_set_validation_recording');
            throw new Error('getting Validation text: ' + err);
        }
    }
}

module.exports = BaseOptionSetFormView;
