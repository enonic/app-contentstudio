/**
 * Created on 13.10.2021 updated on 26.04.2026
 */
const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const appConst = require('../../libs/app_const');

const XPATH = {
    attachmentUploaderDiv: "//div[@data-component='AttachmentUploaderInput']",
    uploadButton: "//div[contains(@class,'justify-end')]//button[@type,'button']",
};

class AttachmentsForm extends OccurrencesFormView {

    get attachmentUploader() {
        return XPATH.attachmentUploaderDiv + XPATH.uploadButton;
    }

    get removeItemIcon() {
        return XPATH.attachmentUploaderDiv + "//div[@role='grid']//button" ;
    }

    async clickOnRemoveItemIcon(index) {
        await this.waitForElementDisplayed(this.removeItemIcon);
        let result = await this.findElements(this.removeItemIcon);
        result[index].click();
        await this.pause(200);
    }

    waitForUploaderDisplayed() {
        return this.waitForElementDisplayed(this.attachmentUploader);
    }
}

module.exports = AttachmentsForm;


