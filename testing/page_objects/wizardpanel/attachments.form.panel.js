/**
 * Created on 13.10.2021
 */
const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const appConst = require('../../libs/app_const');

const XPATH = {
    attachmentUploaderDiv: "//div[contains(@id,'AttachmentUploader')]",
    uploadButton: "//button[contains(@class,'upload-button')]",
    attachmentItemDiv: "//div[contains(@id,'AttachmentItem')]"
};

class AttachmentsForm extends OccurrencesFormView {

    get attachmentUploader() {
        return XPATH.attachmentUploaderDiv + XPATH.uploadButton;
    }

    get removeItemIcon() {
        return XPATH.attachmentItemDiv + "//div[contains(@class,'icon remove')]";
    }

    async clickOnRemoveItemIcon(index) {
        await this.waitForElementDisplayed(this.removeItemIcon, appConst.mediumTimeout);
        let result = await this.findElements(this.removeItemIcon);
        result[index].click();
        await this.pause(200);
    }

    waitForUploaderDisplayed() {
        return this.waitForElementDisplayed(this.attachmentUploader, appConst.mediumTimeout);
    }
}

module.exports = AttachmentsForm;


