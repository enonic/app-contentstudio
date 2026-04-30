/**
 * Created on 1.12.2017. update on 29.04.2026
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const XPATH = {
    container: `//div[@role='dialog' and @data-state='open' and descendant::h3[contains(.,'Create content')]]`,
    dialogTitle: `//h3[contains(.,'Create content')]`,
    mediaTabDiv: "//div[@data-component='NewContentDialogMediaTab']",
    mediaDropZone: "//div[@data-component='DropZone']",
    suggestedTabDiv: "//div[@role ='tabpanel' and contains(@id,'suggested')]",
    allTabDiv: "//div[@role ='tabpanel' and contains(@id,'panel-all')]",
    searchInput: `//input[@aria-label='Search']`,
    header: `//div[contains(@id,'NewContentDialogHeader')]`,
    typesList: `//ul//div[@data-component='ItemLabel']//span`,
    mostPopularBlock: "//div[contains(@id,'MostPopularItemsBlock')]",
    emptyViewP: "//p[contains(.,'No content types found')]",
    contentTypeContainsName(name) {
        return `//button[descendant::span[contains(.,'${name}')]]`;
    },
    contentTypeByName(name) {
        return `//button[descendant::span[text()='${name}']]`;
    },
};

class NewContentDialog extends Page {

    get title() {
        return XPATH.container + XPATH.dialogTitle;
    }

    get searchInput() {
        return XPATH.container + XPATH.searchInput;
    }

    // Tab button All
    get allButton() {
        return XPATH.container + BUTTONS.buttonByLabel('All');
    }

    // Tab button Suggested
    get suggestedButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Suggested');
    }

    // Tab button Media
    get mediaButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Media');
    }

    get closeButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Close');
    }

    async waitForMediaTabButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.mediaButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Media tab button should be disabled:`, 'err_media_tab_disabled', err);
        }
    }

    async waitForSuggestedTabButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.suggestedButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Suggested tab button should be disabled:`, 'err_suggested_tab_disabled', err);
        }
    }

    async clickOnMediaButton() {
        try {
            await this.waitForElementDisplayed(this.mediaButton);
            await this.clickOnElement(this.mediaButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Media button:`, 'err_media_new_content_dlg', err);
        }
    }

    async waitForDropZoneDisplayed() {
        return await this.waitForElementDisplayed(XPATH.container + XPATH.mediaTabDiv + XPATH.mediaDropZone);
    }

    async waitForAllTabDisplayed() {
        return await this.waitForElementDisplayed(XPATH.container + XPATH.allTabDiv);
    }

    async waitForAllTabNotDisplayed() {
        return await this.waitForElementNotDisplayed(XPATH.container + XPATH.allTabDiv);
    }


    //No content types found
    async waitForNoTypesFoundMessage(tabName) {
        const tabConfig = {
            'All': XPATH.allTabDiv,
            'Suggested': XPATH.suggestedTabDiv,
            'Media': XPATH.mediaTabDiv,
        };

        if (!tabConfig[tabName]) {
            throw new Error(
                `Invalid tab name '${tabName}'. Expected: ${Object.keys(tabConfig).join(', ')}`
            );
        }

        try {
            const locator = XPATH.container + tabConfig[tabName] + XPATH.emptyViewP;
            await this.waitForElementDisplayed(locator);
            const message = await this.getText(locator);
            return message;
        } catch (err) {
            await this.handleError(
                `New Content dialog, '${tabName}' tab - 'No content types found' message:`,
                'err_no_content_types_new_content_dlg', err
            );
        }
    }

    async clickOnAllButton() {
        try {
            await this.waitForElementDisplayed(this.allButton);
            await this.clickOnElement(this.allButton);
        } catch (err) {
            await this.handleError(`New Content dialog, All button:`, 'err_all_new_content_dlg', err);
        }
    }

    async clickOnSuggestedButton() {
        try {
            await this.waitForElementDisplayed(this.suggestedButton);
            await this.clickOnElement(this.suggestedButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Suggested button:`, 'err_suggested_new_content_dlg', err);
        }
    }

    async clickOnCloseButton() {
        try {
            await this.waitForElementDisplayed(this.closeButton);
            await this.clickOnElement(this.closeButton);
        } catch (err) {
            await this.handleError(`New Content dialog, Close button:`, 'err_close_new_content_dlg', err);
        }
    }

    async waitForOpened() {
        try {
            await this.waitForElementDisplayed(this.title);
            await this.pause(200);
        } catch (err) {
            await this.handleError(`New Content dialog should be loaded:`, 'err_new_content_dialog', err);
        }
    }

    async waitForClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError(`New Content dialog should be closed:`, 'err_new_content_close', err);
        }
    }

    async waitForMostPopularBlockDisplayed() {
        let locator = XPATH.container + XPATH.mostPopularBlock;
        return await this.waitForElementDisplayed(locator);
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
            //await this.addTextInInput(this.searchInput, remainingText);
            await this.enterTextUsingArray(this.searchInput, remainingText);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('New Content dialog, search input.', 'err_new_content_search', err);
        }
    }

    async clickOnContentType(contentTypeName) {
        let typeSelector = XPATH.contentTypeByName(contentTypeName);
        await this.waitForElementDisplayed(typeSelector);
        let elems = await this.getDisplayedElements(typeSelector);
        await elems[0].click();
        return await this.pause(500);
    }

    async getItemsInAllTab() {
        let locator = XPATH.allTabDiv+ XPATH.typesList;
        await this.waitForElementDisplayed(locator);
        return await this.getTextInElements(locator);
    }
}

module.exports = NewContentDialog;
