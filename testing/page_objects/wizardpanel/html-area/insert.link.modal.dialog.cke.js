const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    linkTextFieldset: `//fieldset[contains(@id,'Fieldset') and descendant::span[text()='Text']]`,
    linkTooltipFieldset: `//fieldset[contains(@id,'Fieldset') and descendant::span[text()='Tooltip']]`,
    urlPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and contains(@class,'panel url-panel')]",
    emailPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and @class='panel']",
    urlTypeButton: "//div[contains(@id,'MenuButton')]//button[contains(@id,'ActionButton') and child::span[text()='Type']]",
    menuItemByName: optionName => `//div[contains(@id,'MenuButton')]//li[text()='${optionName}']`,
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
        return XPATH.container + lib.dialogButton('Cancel');
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get insertButton() {
        return XPATH.container + lib.dialogButton('Insert');
    }

    // types text in link text input
    typeInLinkTextInput(text) {
        return this.typeTextInInput(this.linkTextInput, text).catch(err => {
            this.saveScreenshot('err_type_link_text');
            throw new Error('error when type text in link-text input ' + err);
        });
    }

    // types text in link tooltip input
    async typeInLinkTooltip(text) {
        try {
            await this.waitForElementDisplayed(this.linkTooltipInput, appConst.mediumTimeout);
            return await this.typeTextInInput(this.linkTooltipInput, text)
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_tooltip_link'));
            throw new Error('error when type text in link-text input ' + err);
        }
    }

    getTextInLinkTooltipInput() {
        return this.getTextInInput(this.linkTooltipInput);
    }

    async typeTextInEmailInput(email) {
        try {
            await this.waitForElementDisplayed(XPATH.emailPanel, appConst.shortTimeout);
            let res = await this.findElements(this.emailInput);
            await this.typeTextInInput(this.emailInput, email);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_email'));
            throw new Error('error when type in email input, Insert Link modal dialog ' + err);
        }
    }

    async clickOnCancelButton() {
        await this.clickOnElement(this.cancelButton);
    }

    async clickOnInsertButton() {
        await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
        await this.clickOnElement(this.insertButton);
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
            return await this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout)
        } catch (err) {
            await this.saveScreenshot('err_open_insert_link_dialog');
            throw new Error('Insert Link Dialog should be open!' + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async clickOnBarItem(name) {
        try {
            let selector = XPATH.container + lib.tabBarItemByName(name);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_bar_item'));
            throw new Error('Insert Link Dialog-  error when click on the bar item ' + err);
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


