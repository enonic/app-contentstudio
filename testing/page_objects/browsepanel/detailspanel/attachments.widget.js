/**
 * Created on 08.02.2022
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'AttachmentsItemView')]`,
    attachmentListItem: "//ul[@class='attachment-list']/li/a",
    attachmentPlaceholder: "//span[@class='att-placeholder']",
};

class AttachmentsItemView extends Page {


    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
        } catch (err) {
            //Workaround for the issue with empty Details panel in Wizard
            await this.refresh();
            await this.pause(3000);
            await this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
        }
    }

    async getAttachmentsName() {
        await this.waitForElementDisplayed(xpath.attachmentListItem);
        return await this.getTextInDisplayedElements(xpath.attachmentListItem);
    }

    async getAttachmentsPlaceholder() {
        await this.waitForElementDisplayed(xpath.attachmentPlaceholder);
        return await this.getText(xpath.attachmentPlaceholder);
    }
}

module.exports = AttachmentsItemView;


