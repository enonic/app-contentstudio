/**
 * Created on 07.12.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

const xpath = {
    attachmentsList: "//ul[contains(@class,'attachment-list')",
    attachmentListItem: "//ul[@class='attachment-list']/li/a",
    attachmentPlaceholder: "//span[@class='att-placeholder']",
};

class BaseAttachmentsWidgetItemView extends Page {

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(this.attachmentsWidget, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachments_widget_load');
            throw new Error("Attachments widget was not loaded, screenshot: " + screenshot + ' ' + err);
        }
    }

    async getAttachmentsName() {
        await this.waitForElementDisplayed(this.attachmentsWidget + xpath.attachmentListItem, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(this.attachmentsWidget + xpath.attachmentListItem);
    }

    async getAttachmentsPlaceholder() {
        await this.waitForElementDisplayed(this.attachmentsWidget + xpath.attachmentPlaceholder, appConst.mediumTimeout);
        return await this.getText(xpath.attachmentPlaceholder);
    }

    async waitForAttachmentItemsDisplayed() {
        try {
            await this.waitForElementDisplayed(this.attachmentsWidget + xpath.attachmentListItem, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachments');
            throw new Error("Attachments widget - items should be displayed, screenshot: " + screenshot + '' + err);
        }
    }

    async waitForAttachmentItemsNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.attachmentsWidget + xpath.attachmentListItem, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachments');
            throw new Error("Attachments widget - items should not be displayed, screenshot: " + screenshot + '' + err);
        }
    }
}

module.exports = BaseAttachmentsWidgetItemView;


