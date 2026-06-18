/**
 * Created on 07.12.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

const xpath = {
    section: "//section[@data-component='DetailsWidgetAttachmentsSection']",
    attachmentLink: "//ul/li//a[@data-component='Link']",
    attachmentName: "//ul/li//a[@data-component='Link']//span[contains(@class,'text-xs')]",
};

class BaseAttachmentsWidgetItemView extends Page {

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(this.attachmentsWidget, appConst.shortTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachments_widget_load');
            throw new Error('Attachments widget was not loaded, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async getAttachmentsName() {
        let locator = this.attachmentsWidget  + xpath.attachmentName;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForAttachmentItemsDisplayed() {
        try {
            let locator = this.attachmentsWidget  + xpath.attachmentLink;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachments');
            throw new Error('Attachments widget - items should be displayed, screenshot: ' + screenshot + ' ' + err);
        }
    }

    async waitForAttachmentItemsNotDisplayed() {
        try {
            let locator = this.attachmentsWidget  + xpath.attachmentLink;
            await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_attachments');
            throw new Error('Attachments widget - items should not be displayed, screenshot: ' + screenshot + ' ' + err);
        }
    }
}

module.exports = BaseAttachmentsWidgetItemView;
