const Page = require('../../page');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    urlTypeButton: "//div[contains(@id,'MenuButton')]//button[contains(@id,'ActionButton') and child::span[text()='Type']]",
    urlPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and contains(@class,'panel url-panel')]",
    menuItemByName: optionName => `//div[contains(@id,'MenuButton')]//li[text()='${optionName}']`,
};

class InsertLinkDialogUrlPanel extends Page {

    get urlTypeButton() {
        return XPATH.container + XPATH.urlTypeButton;
    }

    get urlInput() {
        return XPATH.container + XPATH.urlPanel + lib.TEXT_INPUT;
    }

    get urlInputValidationRecording() {
        return XPATH.container + XPATH.urlPanel + lib.VALIDATION_RECORDING_VIEWER;
    }

    // types text in URL input(URL tab)
    typeUrl(url) {
        return this.typeTextInInput(this.urlInput, url).catch(err => {
            this.saveScreenshot('err_type_link_url');
            throw new Error('error when type URL in Insert Link modal dialog ' + err);
        });
    }

    waitForValidationMessage() {
        return this.waitForElementDisplayed(XPATH.urlPanel + lib.VALIDATION_RECORDING_VIEWER, appConst.shortTimeout);
    }

    getValidationMessage() {
        return this.getText(XPATH.urlPanel + lib.VALIDATION_RECORDING_VIEWER, appConst.shortTimeout);
    }


    async getTextInUrlInput() {
        try {
            return await this.getTextInInput(this.urlInput);
        } catch (err) {
            await this.saveScreenshot('err_url_input');
            throw new Error('URL input, Insert Link modal dialog ' + err);
        }
    }

    async clickOnUrlTypeButton() {
        await this.waitForElementDisplayed(this.urlTypeButton, appConst.mediumTimeout);
        await this.clickOnElement(this.urlTypeButton);
        return await this.pause(200);
    }

    async getUrlTypeMenuOptions() {
        let locator = XPATH.container + "//div[contains(@id,'MenuButton')]//li";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async isUrlTypeOptionSelected(option) {
        let locator = XPATH.container + XPATH.menuItemByName(option);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let attr = await this.getAttribute(locator, 'class');
        return attr.includes('selected');
    }

    async clickOnUrlTypeMenuOption(option) {
        let optionLocator = XPATH.container + XPATH.menuItemByName(option);
        await this.clickOnUrlTypeButton();
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(300);
    }

    async getUrlInputValidationMessage() {
        await this.waitForValidationMessageForUrlInputDisplayed();
        return await this.getText(this.urlInputValidationRecording);
    }

    async waitForValidationMessageForUrlInputDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.urlInputValidationRecording, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_validation"));
            throw new Error("Validation message for URL input is not displayed " + err);
        }
    }

    async waitForValidationMessageForUrlInputNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.urlInputValidationRecording, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_close_insert_link"));
            throw new Error("Insert link dialog should be closed " + err);
        }
    }

}

module.exports = InsertLinkDialogUrlPanel;


