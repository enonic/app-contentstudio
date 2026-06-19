/**
 * Created on 04.12.2018. updated on 11.02.2026
 */
const OccurrencesFormView = require('../occurrences.form.view');
const appConst = require('../../../libs/app_const');
const HtmlAreaForm = require('../htmlarea.form.panel');

const XPATH = {
    container: "//div[@data-component='Tab.Content' and contains(@id,'contenttypes:html-area')]",
};

class XDataHtmlArea extends OccurrencesFormView {

    async typeTextInHtmlArea(text) {
        let htmlAreaForm = new HtmlAreaForm(XPATH.container);
        await htmlAreaForm.clickInTextArea();
        await htmlAreaForm.typeTextInHtmlArea(text)
        //await htmlAreaForm.pressEnterKey();
    }

    async getTextInHtmlArea() {
        let htmlAreaForm = new HtmlAreaForm(XPATH.container);
        return await  htmlAreaForm.getTextFromHtmlArea();
    }

    async waitForHtmlAreaVisible() {
        let htmlAreaForm = new HtmlAreaForm(XPATH.container);
        await htmlAreaForm.waitForHtmlAreaDisplayed();
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

    async getHelpText() {
        try {
            let locator = XPATH.container + "//div[@data-component='InputLabel']/div[contains(@class,'text-subtle')]";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_help_text');
            throw new Error(`Error occurred in xdata html-area help-text: ${err} , Screenshot: ${screenshot}`);
        }
    }
}

module.exports = XDataHtmlArea;
