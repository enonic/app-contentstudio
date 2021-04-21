const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

const XPATH = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    textInput: `//div[contains(@id,'FormItem') and child::label[text()='Text']]//input[@type='text']`,
    urlInput: `//div[contains(@id,'FormItem') and child::label[text()='Url']]//input[@type='text']`,
    emailInput: `//div[contains(@id,'FormItem') and child::label[text()='Email']]//input[@type='text']`,
    urlInputValidationRecording: "//div[contains(@id,'FormItem') and child::label[text()='Url']]/..",
    textInputValidationRecording: "//div[contains(@id,'FormItem') and child::label[text()='Text']]/..",
};

class InsertLinkDialog extends Page {

    get textInput() {
        return XPATH.container + XPATH.textInput;
    }

    get textInputValidationRecording() {
        return XPATH.container + XPATH.textInputValidationRecording + lib.VALIDATION_RECORDING_VIEWER;
    }


    get urlInput() {
        return XPATH.container + XPATH.urlInput;
    }

    get urlInputValidationRecording() {
        return XPATH.container + XPATH.urlInputValidationRecording + lib.VALIDATION_RECORDING_VIEWER;
    }

    get emailInput() {
        return XPATH.container + XPATH.emailInput;
    }

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    get insertButton() {
        return XPATH.container + XPATH.insertButton;
    }

    typeText(text) {
        return this.typeTextInInput(this.textInput, text).catch(err => {
            this.saveScreenshot('err_type_link_text');
            throw new Error('error when type text in link-text input ' + err);
        });
    }

    typeUrl(url) {
        return this.typeTextInInput(this.urlInput, url).catch(err => {
            this.saveScreenshot('err_type_link_url');
            throw new Error('error when type URL in Insert Link modal dialog ' + err);
        });
    }

    selectTargetInDownloadTab(targetDisplayName) {
        let loaderComboBox = new LoaderComboBox();
        let selector = XPATH.container + lib.tabBarItemByName('Download');
        return this.clickOnElement(selector).then(() => {
            return this.waitForElementDisplayed(loaderComboBox.optionsFilterInput, appConst.shortTimeout);
        }).then(() => {
            return loaderComboBox.typeTextAndSelectOption(targetDisplayName, XPATH.container);
        })
    }

    fillEmailForm(email) {
        let selector = XPATH.container + lib.tabBarItemByName('Email');
        return this.clickOnElement(selector).then(() => {
            return this.waitForElementDisplayed(this.emailInput, appConst.shortTimeout);
        }).then(() => {
            return this.typeTextInInput(this.emailInput, email);
        }).catch(err => {
            this.saveScreenshot('err_type_email');
            throw new Error('error when type email in Insert Link modal dialog ' + err);
        });
    }

    async selectTargetInContentTab(targetDisplayName) {
        let loaderComboBox = new LoaderComboBox();
        let selector = "//div[contains(@id,'ContentComboBox')]" + loaderComboBox.optionsFilterInput;
        //opens Content tab
        await this.clickOnBarItem('Content');
        await this.pause(300);
        return await loaderComboBox.typeTextAndSelectOption(targetDisplayName, "//div[contains(@id,'ContentComboBox')]");
    }


    async clickOnCancelButton() {
        await this.clickOnElement(this.cancelButton);
        return await this.pause(300);
    }

    async clickOnInsertButton() {
        await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
        await this.clickOnElement(this.insertButton);
        return await this.pause(500);
    }

    async clickOnInsertButtonAndWaitForClosed() {
        await this.clickOnInsertButton();
        return await this.waitForDialogClosed();
    }

    waitForValidationMessage() {
        return this.waitForElementDisplayed(XPATH.container + lib.VALIDATION_RECORDING_VIEWER, appConst.shortTimeout).catch(err => {
            return false;
        });
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.cancelButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_link_dialog');
            throw new Error('Insert Link Dialog should be opened!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    clickOnBarItem(name) {
        let selector = XPATH.container + lib.tabBarItemByName(name);
        return this.clickOnElement(selector).catch(err => {
            this.saveScreenshot('err_click_on_bar_item');
            throw new Error('Insert Link Dialog, error when click on the bar item ' + name + " " + err);
        });
    }

    isTabActive(name) {
        let barItem = XPATH.container + lib.tabBarItemByName(name);
        return this.getAttribute(barItem, "class").then(result => {
            return result.includes('active');
        });
    }

    getSelectedOptionDisplayName() {
        let selector = XPATH.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        return this.getText(selector);
    }

    waitForValidationMessageForTextInputDisplayed() {
        return this.waitForElementDisplayed(this.textInputValidationRecording, appConst.mediumTimeout);
    }

    async getTextInputValidationMessage() {
        await this.waitForValidationMessageForTextInputDisplayed();
        return await this.getText(this.textInputValidationRecording);
    }

    waitForValidationMessageForUrlInputDisplayed() {
        return this.waitForElementDisplayed(this.urlInputValidationRecording, appConst.mediumTimeout);
    }

    async getUrlInputValidationMessage() {
        await this.waitForValidationMessageForUrlInputDisplayed();
        return await this.getText(this.urlInputValidationRecording);
    }
}

module.exports = InsertLinkDialog;


