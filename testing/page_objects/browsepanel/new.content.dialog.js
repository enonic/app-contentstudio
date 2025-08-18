/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'NewContentDialog')]`,
    dialogTitle: `//h2[contains(@class,'title') and text()='Create Content']`,
    searchInput: `//div[contains(@id,'FileInput')]/input`,
    uploaderButton: "//div[contains(@id,'NewContentUploader')]",
    header: `//div[contains(@id,'NewContentDialogHeader')]`,
    typesList: `//ul[contains(@id,'FilterableItemsList')]`,
    mostPopularBlock: "//div[contains(@id,'MostPopularItemsBlock')]",
    emptyViewDiv: "//div[contains(@class,'empty-view')]",
    contentTypeByName(name) {
        return `//div[@class='content-types-content']//li[contains(@class,'content-types-list-item') and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`;
    },
};

class NewContentDialog extends Page {

    get title() {
        return XPATH.container + XPATH.dialogTitle;
    }

    get searchInput() {
        return XPATH.container + XPATH.searchInput;
    }

    get cancelButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }


    async clickOnCancelButtonTop() {
        try {
            await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
            await this.clickOnElement(this.cancelButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Cancel button:`, 'err_cancel_new_content_dlg', err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(this.title, appConst.mediumTimeout);
            await this.pause(200);
        } catch (err) {
            await this.handleError(`New Content dialog should be loaded:`, 'err_new_content_dialog', err);
        }
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container, appConst.mediumTimeout)
        } catch (err) {
            await this.handleError(`New Content dialog should be closed:`, 'err_new_content_close', err);
        }
    }

    async waitForMostPopularBlockDisplayed() {
        let locator = XPATH.container + XPATH.mostPopularBlock;
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    getHeaderText() {
        return this.getText(this.title);
    }

    // type Search Text In Hidden Input
    async typeSearchText(text) {
        try {
            await this.getBrowser().keys(text)
            return await this.pause(200);
        } catch (err) {
            await this.handleError('New Content dialog, search input.', 'err_new_content_search',err);
        }
    }

    async clickOnContentType(contentTypeName) {
        let typeSelector = XPATH.contentTypeByName(contentTypeName);
        await this.waitForElementDisplayed(typeSelector, appConst.mediumTimeout);
        let elems = await this.getDisplayedElements(typeSelector);
        await elems[0].click();
        return await this.pause(500);
    }

    async waitForUploaderButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(XPATH.uploaderButton, appConst.shortTimeout)
        } catch (err) {
            await this.handleError(`New Content dialog, Uploader button should be displayed:`, 'err_uploader_button', err);
        }
    }

    async waitForUploaderButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(XPATH.uploaderButton, appConst.shortTimeout)
        } catch (err) {
            await this.handleError(`New Content dialog, Uploader button should not be displayed:`, 'err_uploader_button', err);
        }
    }

    async getItems() {
        let locator = XPATH.typesList + lib.H6_DISPLAY_NAME;
        return await this.getTextInElements(locator);
    }

    async getEmptyViewText() {
        try {
            let locator = XPATH.container + XPATH.emptyViewDiv;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError(`New Content dialog should display empty view text:`, 'err_new_content_empty_view', err);
        }
    }
}

module.exports = NewContentDialog;
