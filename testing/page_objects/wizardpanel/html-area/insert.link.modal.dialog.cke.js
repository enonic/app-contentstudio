const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    linkTextFieldset: `//fieldset[contains(@id,'Fieldset') and descendant::span[text()='Text']]`,
    linkTooltipFieldset: `//fieldset[contains(@id,'Fieldset') and descendant::span[text()='Tooltip']]`,
    urlPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and contains(@class,'panel url-panel')]",
    emailPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and @class='panel']",
    urlTypeButton: "//div[contains(@id,'MenuButton')]//button[contains(@id,'ActionButton') and child::span[text()='Type']]",
    anchorFormItem: "//div[contains(@class,'anchor-form-item')]",
    parametersFormItem: "//div[contains(@id,'FormItem') and descendant::label[text()='Parameters']]",
};

class InsertLinkDialog extends Page {

    get linkTooltipInput() {
        return XPATH.container + XPATH.linkTooltipFieldset + lib.TEXT_INPUT;
    }

    get linkTextInput() {
        return XPATH.container + XPATH.linkTextFieldset + lib.TEXT_INPUT;
    }

    get linkTextInputValidationRecording() {
        return XPATH.container + XPATH.linkTextFieldset + lib.VALIDATION_RECORDING_VIEWER;
    }

    get emailInputValidationRecording() {
        return XPATH.container + XPATH.emailPanel + lib.VALIDATION_RECORDING_VIEWER;
    }

    get emailInput() {
        return XPATH.container + XPATH.emailPanel + "//fieldset[descendant::span[text()='Email']]" + lib.TEXT_INPUT;
    }

    get subjectInput() {
        return XPATH.container + XPATH.emailPanel + "//fieldset[descendant::label[text()='Subject']]" + lib.TEXT_INPUT;
    }

    get cancelButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Cancel');
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get insertButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Insert');
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

    async typeTextInEmailInput(email) {
        try {
            await this.waitForElementDisplayed(XPATH.emailPanel);
            let res = await this.findElements(this.emailInput);
            await this.typeTextInInput(this.emailInput, email);
        } catch (err) {
            await this.handleError('Insert Link Dialog- error when type text in email input', 'err_type_email_input', err);
        }
    }

    async clickOnCancelButton() {
        await this.clickOnElement(this.cancelButton);
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
            return await this.waitForElementDisplayed(this.cancelButton);
        } catch (err) {
            await this.handleError('Insert Link Dialog should be open!', 'err_open_insert_link_dialog', err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container);
    }

    async clickOnBarItem(name) {
        try {
            let selector = XPATH.container + lib.tabBarItemByName(name);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Insert Link Dialog- error when click on the bar item' , 'err_click_bar_item', err);
        }
    }

    isTabActive(name) {
        let barItem = XPATH.container + lib.tabBarItemByName(name);
        return this.getAttribute(barItem, "class").then(result => {
            return result.includes('active');
        });
    }

    waitForValidationMessageForTextInputDisplayed() {
        return this.waitForElementDisplayed(this.linkTextInputValidationRecording, appConst.mediumTimeout);
    }

    async getTextInputValidationMessage() {
        await this.waitForValidationMessageForTextInputDisplayed();
        return await this.getText(this.linkTextInputValidationRecording);
    }

    waitForValidationMessageForEmailInputDisplayed() {
        return this.waitForElementDisplayed(this.emailInputValidationRecording, appConst.mediumTimeout);
    }


    async getEmailInputValidationMessage() {
        await this.waitForValidationMessageForEmailInputDisplayed();
        return await this.getText(this.emailInputValidationRecording);
    }
}

module.exports = InsertLinkDialog;


