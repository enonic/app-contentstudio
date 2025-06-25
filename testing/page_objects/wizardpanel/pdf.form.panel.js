/**
 * Created on 07.09.2021
 */
const Page = require('../page');
const lib = require('../../libs/elements-old');
const appConst = require('../../libs/app_const');
const XPATH = {
    abstractTextArea: `//textarea[contains(@name,'abstract')]`,
    tagsInput: "//ul[contains(@id,'Tags')]//input[@type='text']",
};

class PdfForm extends Page {

    get abstractTextArea() {
        return lib.FORM_VIEW + XPATH.abstractTextArea;
    }

    get tagsInput() {
        return lib.FORM_VIEW + XPATH.tagsInput;
    }

    async typeTextInAbstractionTextArea(text) {
        await this.waitForAbstractionTextAreaDisplayed();
        await this.typeTextInInput(this.abstractTextArea, text);
        return await this.pause(300);
    }

    waitForAbstractionTextAreaDisplayed() {
        return this.waitForElementDisplayed(this.abstractTextArea, appConst.mediumTimeout);
    }

    waitForTagsInputDisplayed() {
        return this.waitForElementDisplayed(this.tagsInput, appConst.mediumTimeout);
    }


    getExtractionData() {
        return this.getTextInInput(this.abstractTextArea);
    }

    async addTag(text) {
        await this.waitForTagsInputDisplayed();
        await this.typeTextInInput(this.tagsInput, text);
        return await this.pressEnterKey();
    }
}

module.exports = PdfForm;
