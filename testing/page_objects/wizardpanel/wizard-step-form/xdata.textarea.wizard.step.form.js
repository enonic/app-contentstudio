/**
 * Created on 24.09.2018. updated on 07.08.2026
 */
const OccurrencesFormView = require('../occurrences.form.view');
const appConst = require('../../../libs/app_const');
const { COMMON } = require('../../../libs/elements');

const XPATH = {
    container: "//div[@data-component='Tab.Content' and contains(@id,'contenttypes:text-area')]",
    textArea: "//div[@data-component='TextArea']//textarea",
};

class XDataTextArea extends OccurrencesFormView {
    get textAreaInput() {
        return XPATH.container + XPATH.textArea;
    }

    get validationRecord() {
        return XPATH.container + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    typeText(value) {
        return this.typeTextInInput(this.textAreaInput, value);
    }

    getTextInTextArea() {
        return this.getTextInInput(this.textAreaInput);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.validationRecord, appConst.shortTimeout);
    }

    waitForTextAreaVisible() {
        return this.waitForElementDisplayed(this.textAreaInput, appConst.shortTimeout);
    }

    waitForTextAreaNotVisible() {
        return this.waitForElementNotDisplayed(this.textAreaInput, appConst.shortTimeout);
    }

    isValidationRecordingVisible() {
        return this.isElementDisplayed(this.validationRecord);
    }

    async getValidationRecord() {
        try {
            return await this.getText(this.validationRecord);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_textarea_validation_record');
            throw new Error(`XDATA textarea, validation message, screenshot:${screenshot} ` + err);
        }
    }
}

module.exports = XDataTextArea;
