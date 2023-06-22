/**
 * Created on 04.12.2018.
 */
const OccurrencesFormView = require('../occurrences.form.view');
const HtmlArea = require('../../components/htmlarea');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: "//div[contains(@id,'XDataWizardStepForm')]",
};

class XDataHtmlArea extends OccurrencesFormView {

    typeTextInHtmlArea(text) {
        let htmlArea = new HtmlArea();
        return htmlArea.typeTextInHtmlArea(XPATH.container, text);
    }

    getTextInHtmlArea() {
        let htmlArea = new HtmlArea();
        return htmlArea.getTextFromHtmlArea(XPATH.container);
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
}

module.exports = XDataHtmlArea;
