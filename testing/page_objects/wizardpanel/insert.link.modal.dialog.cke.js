const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

const XPATH = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    linkTextFieldset: `//fieldset[contains(@id,'Fieldset') and descendant::label[text()='Text']]`,
    linkTooltipFieldset: `//fieldset[contains(@id,'Fieldset') and descendant::label[text()='Tooltip']]`,
    urlPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and contains(@class,'panel url-panel')]",
    emailPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and @class='panel']",
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


    get urlInput() {
        return XPATH.container + XPATH.urlPanel + lib.TEXT_INPUT;
    }

    get urlInputValidationRecording() {
        return XPATH.container + XPATH.urlPanel + lib.VALIDATION_RECORDING_VIEWER;
    }

    get emailInput() {
        return XPATH.container + XPATH.emailPanel + lib.TEXT_INPUT;
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

    //types text in link text input
    typeText(text) {
        return this.typeTextInInput(this.linkTextInput, text).catch(err => {
            this.saveScreenshot('err_type_link_text');
            throw new Error('error when type text in link-text input ' + err);
        });
    }

    //types text in link tooltip input
    async typeInLinkTooltip(text) {
        try {
            await this.waitForElementDisplayed(this.linkTooltipInput,appConst.mediumTimeout);
            return await this.typeTextInInput(this.linkTooltipInput, text)
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_tooltip_link'));
            throw new Error('error when type text in link-text input ' + err);
        }
    }
    getTextInLinkTooltipInput(){
        return this.getTextInInput(this.linkTooltipInput);
    }

    //types text in URL input(URL tab)
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

    async clickOnBarItem(name) {
        try {
            let selector = XPATH.container + lib.tabBarItemByName(name);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector)
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

    getSelectedOptionDisplayName() {
        let selector = XPATH.container + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        return this.getText(selector);
    }

    waitForValidationMessageForTextInputDisplayed() {
        return this.waitForElementDisplayed(this.linkTextInputValidationRecording, appConst.mediumTimeout);
    }

    async getTextInputValidationMessage() {
        await this.waitForValidationMessageForTextInputDisplayed();
        return await this.getText(this.linkTextInputValidationRecording);
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


