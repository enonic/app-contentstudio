/**
 * Created on 07.12.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

const xpath = {
    section: "//section[@data-component='DetailsWidgetAttachmentsSection']",
    sectionTitle: "//div[@data-component='Separator']//span[contains(@class,'truncate')]",
    attachmentLink: "//ul/li//a[@data-component='Link']",
    attachmentName: "//ul/li//a[@data-component='Link']//span[contains(@class,'text-xs')]",
};

class BaseAttachmentsWidgetItemView extends Page {

    async waitForLoaded() {
        try {
            return await this.waitForElementDisplayed(this.attachmentsWidget);
        } catch (err) {
            await this.handleError('Attachments widget should be loaded', 'err_attachments_widget_load', err);
        }
    }

    // The section is not rendered at all when the selected content has no attachments
    async waitForNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.attachmentsWidget);
        } catch (err) {
            await this.handleError('Attachments widget should not be displayed', 'err_attachments_widget_hidden', err);
        }
    }

    async getSectionTitle() {
        let locator = this.attachmentsWidget + xpath.sectionTitle;
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async getAttachmentsName() {
        let locator = this.attachmentsWidget + xpath.attachmentName;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async getAttachmentLinks() {
        let locator = this.attachmentsWidget + xpath.attachmentLink;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let elements = await this.findElements(locator);
        return await Promise.all(elements.map(el => el.getAttribute('href')));
    }

    async clickOnAttachmentLink(name) {
        try {
            let locator = this.attachmentsWidget + xpath.attachmentLink + `[descendant::span[text()='${name}']]`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError(`Attachments widget - link '${name}' should be clickable`, 'err_attachment_link', err);
        }
    }

    async waitForAttachmentItemsNotDisplayed() {
        try {
            let locator = this.attachmentsWidget + xpath.attachmentLink;
            await this.waitForElementNotDisplayed(locator);
        } catch (err) {
            await this.handleError('Attachments widget - items should not be displayed', 'err_attachments', err);
        }
    }
}

module.exports = BaseAttachmentsWidgetItemView;
