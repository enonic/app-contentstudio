/**
 * Created on 04.12.2018. updated on 11.02.2026
 */
const OccurrencesFormView = require('../occurrences.form.view');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements-old');
const HtmlAreaForm = require('../htmlarea.form.panel');

const XPATH = {
    container: "//div[contains(@id,'XDataWizardStepForm')]",
};

class XDataHtmlArea extends OccurrencesFormView {

    async typeTextInHtmlArea(text) {
        let htmlAreaForm = new HtmlAreaForm(XPATH.container);
        await htmlAreaForm.clickInTextArea();
        await htmlAreaForm.typeTextInHtmlArea(text)
        //await htmlAreaForm.pressEnterKey();
    }

    getTextInHtmlArea() {
        let htmlAreaForm = new HtmlAreaForm(XPATH.container);
        return htmlAreaForm.getTextFromHtmlArea();
    }

    waitForHtmlAreaVisible() {
        return this.waitForElementDisplayed(XPATH.container + "//div[contains(@id,'cke_TextArea')]");
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(XPATH.container + this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should be displayed"});
    }

    async waitForFormValidationRecordingNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(XPATH.container + this.formValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Form Validation recording should not be displayed"});
    }

    async waitForXdataRedBorderDisplayed() {
        let locator = XPATH.container + "//div[contains(@id,'FormView')]";
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, "class");
            return result.includes("display-validation-errors");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Red border should be displayed in X-data Form!"});
    }

    async waitForXdataRedBorderNotDisplayed() {
        let locator = XPATH.container + "//div[contains(@id,'FormView')]";
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(locator, "class");
            return !result.includes("display-validation-errors");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Red border should not be displayed in X-data Form!"});
    }

    async waitForHelpTextToggleNotDisplayedInsideXdata() {
        return await this.waitForElementNotDisplayed(XPATH.container + lib.HELP_TEXT.TOGGLE);
    }

    async getHelpText(inputLabel) {
        try {
            let locator = XPATH.container + lib.HELP_TEXT.TEXT;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_help_text');
            throw new Error(`Error occurred in optionSet help-text: ${err} , Screenshot: ${screenshot}`);
        }
    }
}

module.exports = XDataHtmlArea;
