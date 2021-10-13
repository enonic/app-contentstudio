/**
 * Created on 13.10.2021
 */
const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');

const XPATH = {
    attachmentUploaderDiv: "//div[contains(@id,'AttachmentUploader')]",
};

class AttachmentsForm extends OccurrencesFormView {

    get attachmentUploader() {
        return lib.FORM_VIEW + XPATH.attachmentUploaderDiv;
    }

    waitForUploaderDisplayed() {
        return this.waitForElementDisplayed(this.bodyTextArea, appConst.mediumTimeout);
    }
}

module.exports = AttachmentsForm;


