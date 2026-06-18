/**
 * Created on 13.10.2021 updated on 18.06.2026
 */
const OccurrencesFormView = require('../wizardpanel/occurrences.form.view');
const appConst = require('../../libs/app_const');

const XPATH = {
    attachmentUploaderDiv: "//div[@data-component='AttachmentUploaderInput']",
    gridRow: "//div[@data-component='GridList.Row']",
    fileLink: "//div[@data-component='GridList.Row']//a[@data-component='Link']",
    removeButton: "//div[@data-component='GridList.Row']//button[@data-component='IconButton']",
};

class AttachmentsForm extends OccurrencesFormView {

    get removeItemIcon() {
        return XPATH.attachmentUploaderDiv + XPATH.removeButton;
    }

    get attachmentFileLink() {
        return XPATH.attachmentUploaderDiv + XPATH.fileLink;
    }

    async clickOnRemoveItemIcon(index) {
        await this.waitForElementDisplayed(this.removeItemIcon);
        let result = await this.findElements(this.removeItemIcon);
        await result[index].click();
        return await this.pause(200);
    }

    async getAttachmentFileNames() {
        await this.waitForElementDisplayed(this.attachmentFileLink, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(this.attachmentFileLink);
    }

    waitForAttachmentLinkDisplayed() {
        return this.waitForElementDisplayed(this.attachmentFileLink, appConst.mediumTimeout);
    }

    waitForAttachmentLinkNotDisplayed() {
        return this.waitForElementNotDisplayed(this.attachmentFileLink, appConst.mediumTimeout);
    }
}

module.exports = AttachmentsForm;
