/**
 * Created on 13.10.2021
 */
const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    attachmentUploaderDiv: "//div[contains(@id,'AttachmentUploader')]",
    uploadButton: "//button[contains(@class,'upload-button')]",
};

class AttachmentsForm extends OccurrencesFormView {

    get attachmentUploader() {
        return XPATH.attachmentUploaderDiv + XPATH.uploadButton;
    }

    waitForUploaderDisplayed() {
        return this.waitForElementDisplayed(this.attachmentUploader, appConst.mediumTimeout);
    }
}

module.exports = AttachmentsForm;


