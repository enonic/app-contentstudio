const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='HtmlAreaLinkDialog']`,
    urlPanel: "//div[@data-component='UrlTabPanel']",
};

class InsertLinkDialogUrlPanel extends Page {

    get urlInput() {
        return XPATH.container + XPATH.urlPanel + "//input";
    }

    get urlInputValidationMessage() {
        return XPATH.container + XPATH.urlPanel + "//div[contains(@class,'text-error')]";
    }

    // types text in URL input(URL tab)
    typeUrl(url) {
        return this.typeTextInInput(this.urlInput, url).catch(err => {
            this.saveScreenshot('err_type_link_url');
            throw new Error('error when type URL in Insert Link modal dialog ' + err);
        });
    }

    waitForValidationMessage() {
        return this.waitForElementDisplayed(this.urlInputValidationMessage, appConst.shortTimeout);
    }

    async getValidationMessage() {
        await this.waitForValidationMessage();
        return await this.getText(this.urlInputValidationMessage);
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
        let locator = XPATH.container + XPATH.urlPanel + "//button[@role='combobox']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(200);
    }

    async getUrlTypeMenuOptions() {
        let locator = XPATH.container + "//div[@role='option']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnUrlTypeMenuOption(option) {
        await this.clickOnUrlTypeButton();
        let optionLocator = `//div[@role='option' and contains(.,'${option}')]`;
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(300);
    }

    async waitForValidationMessageForUrlInputDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.urlInputValidationMessage, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_validation"));
            throw new Error("Validation message for URL input is not displayed " + err);
        }
    }

    async waitForValidationMessageForUrlInputNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.urlInputValidationMessage, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_close_insert_link"));
            throw new Error("Insert link dialog should be closed " + err);
        }
    }
}

module.exports = InsertLinkDialogUrlPanel;
