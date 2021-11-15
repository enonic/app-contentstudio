/**
 * Created on 04.11.2021.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ArchiveDeleteDialog')]`,
    header: `//div[contains(@id,'DefaultModalDialogHeader')]`,
    contentTypeByName: name => {
        return `//div[@class='content-types-content']//li[contains(@class,'content-types-list-item') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`;
    },
};

class ArchiveDeleteDialog extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_DIALOG;
    }

    get deleteNowButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButtonTop).catch(err => {
            this.saveScreenshot('err_cancel_archive_delete_dlg');
            throw new Error('Error when clicking on Cancel button top ' + err);
        })
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout)
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_archive_delete'));
            throw new Error('Archive Delete Dialog was not loaded! ' + err);
        }
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (error) {
            await this.saveScreenshot(appConst.generateRandomName('err_new_content_close'));
            throw new Error('Archive Delete Dialog was not closed');
        }
    }

    waitForMostPopularBlockDisplayed() {
        let locator = XPATH.container + XPATH.mostPopularBlock;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    getHeaderText() {
        return this.getText(this.header);
    }

    //type Search Text In Hidden Input
    async typeSearchText(text) {
        try {
            await this.getBrowser().keys(text)
            return await this.pause(200);
        } catch (err) {
            throw new Error("New Content Dialog- error when typing the text in search input! " + err);
        }
    }

    async clickOnContentType(contentTypeName) {
        let typeSelector = XPATH.contentTypeByName(contentTypeName);
        await this.waitForElementDisplayed(typeSelector, appConst.mediumTimeout);
        let elems = await this.getDisplayedElements(typeSelector);
        await elems[0].click();
        return await this.pause(500);
    }

    waitForUploaderButtonDisplayed() {
        return this.waitForElementDisplayed(XPATH.uploaderButton, appConst.shortTimeout).catch(error => {
            this.saveScreenshot('uploader_button_not_visible');
            return false;
        });
    }

    async getItems() {
        let locator = XPATH.typesList + lib.H6_DISPLAY_NAME;
        return this.getTextInElements(locator);
    }
}

module.exports = ArchiveDeleteDialog;
