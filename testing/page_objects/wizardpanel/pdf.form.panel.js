/**
 * Created on 07.09.2021 updated on 29.04.2026
 */
const Page = require('../page');
const {COMMON} = require("../../libs/elements");
const XPATH = {
    dataComponent: "//div[@data-component='TagInput']",
};

class PdfForm extends Page {

    get abstractTextArea() {
        return COMMON.INPUTS.inputFieldByLabel('Abstract') + '//textarea';
    }

    get tagsInput() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponent + COMMON.INPUTS.INPUT;
    }

    async typeTextInAbstractionTextArea(text) {
        await this.waitForAbstractionTextAreaDisplayed();
        await this.typeChars(this.abstractTextArea, text);
        return await this.pause(300);
    }

    async waitForAbstractionTextAreaDisplayed() {
        return await this.waitForElementDisplayed(this.abstractTextArea);
    }

    async waitForTagsInputDisplayed() {
        return await this.waitForElementDisplayed(COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponent);
    }

    getExtractionData() {
        return this.getTextInInput(this.abstractTextArea);
    }

    async clickInTagInput() {
        let locator = COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponent;
        await this.clickOnElement(locator);
        await this.pause(400);
    }

    async typeInTagInput(text) {
        let locator = COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + XPATH.dataComponent + COMMON.INPUTS.INPUT;
        let inputs = await this.getDisplayedElements(locator);
        if (inputs.length === 0) {
            throw new Error("Tag input is not displayed - the maximum number of tags may have been reached");
        }
        await inputs[0].click();
        await this.pause(300);
        for (const ch of text) {
            await inputs[0].addValue(ch);
        }
    }

    async addTag(text) {
        await this.typeInTagInput(text);
        return await this.pressEnterKey();
    }
}

module.exports = PdfForm;
