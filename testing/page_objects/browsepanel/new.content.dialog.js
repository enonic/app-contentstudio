/**
 * Created on 1.12.2017.
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[@role='dialog' and @data-state='open']`,
    dialogTitle: `//h3[contains(.,'Create content')]`,
    searchInput: `//input[@aria-label='Search']`,
    uploaderButton: "//div[contains(@id,'NewContentUploader')]",
    header: `//div[contains(@id,'NewContentDialogHeader')]`,
    typesList: `//ul[contains(@id,'FilterableItemsList')]`,
    mostPopularBlock: "//div[contains(@id,'MostPopularItemsBlock')]",
    emptyViewDiv: "//div[contains(@class,'empty-view')]",
    contentTypeByName(name) {
        return `//button[descendant::span[contains(.,'${name}')]]`;
    },
};

class NewContentDialog extends Page {

    get title() {
        return XPATH.container + XPATH.dialogTitle;
    }

    get searchInput() {
        return XPATH.container + XPATH.searchInput;
    }

    get allButton() {
        return XPATH.container + BUTTONS.button('All');
    }

    get suggestedButton() {
        return XPATH.container + BUTTONS.button('Suggested');
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    async clickOnMediaButton() {
        try {
            let mediaButton = XPATH.container + BUTTONS.button('Media');
            await this.waitForElementDisplayed(mediaButton, appConst.mediumTimeout);
            await this.clickOnElement(mediaButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Media button:`, 'err_media_new_content_dlg', err);
        }
    }

    async clickOnAllButton() {
        try {
            await this.waitForElementDisplayed(this.allButton, appConst.mediumTimeout);
            await this.clickOnElement(this.allButton);
        } catch (err) {
            await this.handleError(`New Content dialog, All button:`, 'err_all_new_content_dlg', err);
        }
    }
    async clickOnSuggestedButton() {
        try {
            await this.waitForElementDisplayed(this.suggestedButton, appConst.mediumTimeout);
            await this.clickOnElement(this.suggestedButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Suggested button:`, 'err_suggested_new_content_dlg', err);
        }
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton, appConst.mediumTimeout);
            await this.clickOnElement(this.closeButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Close button:`, 'err_close_new_content_dlg', err);
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

    // type Search Text in Hidden Input
    async typeSearchText(text) {
        try {
            const firstChar = text.charAt(0);
            const remainingText = text.substring(1);
            // Focus on the input
            await this.getBrowser().keys([firstChar]);
            await this.pause(100);
            await this.clickOnElement(this.searchInput);
            // Type the remaining text
            await this.addTextInInput(this.searchInput, remainingText);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('New Content dialog, search input.', 'err_new_content_search', err);
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
