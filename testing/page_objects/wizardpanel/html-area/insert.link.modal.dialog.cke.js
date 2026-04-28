const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='HtmlAreaLinkDialog']`,
    emailPanel: "//div[@data-component='EmailTabPanel']",
    tabTriggerByName: name => `//button[@role='tab' and child::span[contains(.,'${name}')]]`,
    errorMessage: "//div[contains(@class,'text-error')]",
};

class InsertLinkDialog extends Page {

    get linkTextInput() {
        return XPATH.container + "//label[contains(.,'Text')]/ancestor::div[2]//input";
    }

    get linkTooltipInput() {
        return XPATH.container + "//label[contains(.,'Tooltip')]/ancestor::div[2]//input";
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Cancel');
    }

    get cancelButtonTop() {
        return XPATH.container + "//button[@aria-label='Close']";
    }

    get insertButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Insert');
    }

    get updateButton() {
        return XPATH.container + BUTTONS.buttonByLabel('Update');
    }

    // types text in link text input
    async typeInLinkTextInput(text) {
        try {
            await this.waitForElementDisplayed(this.linkTextInput);
            await this.typeTextInInput(this.linkTextInput, text);
        } catch (err) {
            await this.handleError('Insert Link Dialog- error when type text in link-text input', 'err_type_link_text', err);
        }
    }

    // types text in link tooltip input
    async typeInLinkTooltip(text) {
        try {
            await this.waitForElementDisplayed(this.linkTooltipInput);
            return await this.typeTextInInput(this.linkTooltipInput, text);
        } catch (err) {
            await this.handleError('Insert Link Dialog- error when type text in link-tooltip input', 'err_type_link_tooltip', err);
        }
    }

    getTextInLinkTooltipInput() {
        return this.getTextInInput(this.linkTooltipInput);
    }

    async clickOnCancelButton() {
        await this.clickOnElement(this.cancelButtonTop);
        return await this.pause(300);
    }

    async clickOnInsertButton() {
        await this.waitForElementDisplayed(this.insertButton);
        await this.clickOnElement(this.insertButton);
        return await this.pause(500);
    }

    async clickOnInsertButtonAndWaitForClosed() {
        await this.clickOnInsertButton();
        return await this.waitForDialogClosed();
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(this.insertButton);
        } catch (err) {
            await this.handleError('Insert Link Dialog should be open!', 'err_open_insert_link_dialog', err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container);
    }

    async clickOnBarItem(name) {
        try {
            let selector = XPATH.container + XPATH.tabTriggerByName(name);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Insert Link Dialog- error when click on the bar item', 'err_click_bar_item', err);
        }
    }

    async isTabActive(name) {
        let tabTrigger = XPATH.container + XPATH.tabTriggerByName(name);
        let attr = await this.getAttribute(tabTrigger, 'data-state');
        return attr === 'active';
    }

    get emailInput() {
        return XPATH.container + XPATH.emailPanel + "//label[contains(.,'Email')]/ancestor::div[2]//input";
    }

    get subjectInput() {
        return XPATH.container + XPATH.emailPanel + "//label[contains(.,'Subject')]/ancestor::div[2]//input";
    }

    get emailInputValidationMessage() {
        return XPATH.container + XPATH.emailPanel + "//div[contains(@class,'text-error')]";
    }

    async typeTextInEmailInput(email) {
        try {
            await this.waitForElementDisplayed(this.emailInput);
            await this.typeTextInInput(this.emailInput, email);
        } catch (err) {
            await this.handleError('Insert Link Dialog- error when type text in email input', 'err_type_email_input', err);
        }
    }

    async waitForValidationMessageForEmailInputDisplayed() {
        return this.waitForElementDisplayed(this.emailInputValidationMessage, appConst.mediumTimeout);
    }

    async getEmailInputValidationMessage() {
        await this.waitForValidationMessageForEmailInputDisplayed();
        return await this.getText(this.emailInputValidationMessage);
    }

    async waitForValidationMessageForTextInputDisplayed() {
        let locator = XPATH.container + "//label[contains(.,'Text')]/ancestor::div[2]//div[contains(@class,'text-error')]";
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async getTextInputValidationMessage() {
        await this.waitForValidationMessageForTextInputDisplayed();
        let locator = XPATH.container + "//label[contains(.,'Text')]/ancestor::div[2]//div[contains(@class,'text-error')]";
        return await this.getText(locator);
    }
}

module.exports = InsertLinkDialog;
