/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'NewContentDialog')]`,
    searchInput: `//div[contains(@id,'FileInput')]/input`,
    uploaderButton: "//div[contains(@id,'NewContentUploader')]",
    header: `//div[contains(@id,'NewContentDialogHeader')]`,
    typesList: `//ul[contains(@id,'FilterableItemsList')]`,
    contentTypeByName: function (name) {
        return `//div[@class='content-types-content']//li[contains(@class,'content-types-list-item') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`;
    },
};

class NewContentDialog extends Page {

    get header() {
        return XPATH.container + XPATH.header;
    }

    get searchInput() {
        return XPATH.container + XPATH.searchInput;
    }

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get applicationsLink() {
        return XPATH.container + `//a[contains(@data-id,'app.applications')]`;
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButton).catch(err => {
            this.saveScreenshot('err_cancel_new_content_dlg');
            throw new Error('Error when clicking on Cancel button ' + err);
        })
    }

    waitForOpened() {
        return this.waitForElementDisplayed(XPATH.typesList, appConst.mediumTimeout).catch(err => {
            this.saveScreenshot('err_load_new_content_dialog');
            throw new Error('New Content dialog was not loaded! ' + err);
        });
    }

    waitForClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout).catch(error => {
            this.saveScreenshot('err_new_content_dialog_close');
            throw new Error('New Content Dialog was not closed');
        });
    }

    getHeaderText() {
        return this.getText(this.header);
    }

    //type Search Text In Hidden Input
    typeSearchText(text) {
        return this.getBrowser().keys(text).catch(err => {
            throw new Error("New Content Dialog- error when typing the text in search input! ");
        });
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
};
module.exports = NewContentDialog;
