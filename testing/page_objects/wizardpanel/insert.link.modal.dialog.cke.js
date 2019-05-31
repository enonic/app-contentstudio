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
};

class InsertLinkDialog extends Page {

    get textInput() {
        return XPATH.container + XPATH.textInput;
    }

    get urlInput() {
        return XPATH.container + XPATH.urlInput;
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
            return this.waitForElementDisplayed(loaderComboBox.optionsFilterInput, appConst.TIMEOUT_2);
        }).then(() => {
            return loaderComboBox.typeTextAndSelectOption(targetDisplayName);
        })
    }

    fillEmailForm(email) {
        let selector = XPATH.container + lib.tabBarItemByName('Email');
        return this.clickOnElement(selector).then(() => {
            return this.waitForElementDisplayed(this.emailInput, appConst.TIMEOUT_2);
        }).then(() => {
            return this.typeTextInInput(this.emailInput, email);
        }).catch(err => {
            this.saveScreenshot('err_type_email');
            throw new Error('error when type email in Insert Link modal dialog ' + err);
        });
    }

    selectTargetInContentTab(targetDisplayName) {
        let loaderComboBox = new LoaderComboBox();
        return this.clickOnBarItem('Content').then(() => {
            return this.waitForElementDisplayed(loaderComboBox.optionsFilterInput, appConst.TIMEOUT_2);
        }).then(() => {
            return loaderComboBox.typeTextAndSelectOption(targetDisplayName, "//div[contains(@id,'ContentComboBox')]");
        })
    }


    async clickOnCancelButton() {
        await this.clickOnElement(this.cancelButton);
        return await this.pause(300);
    }

    clickOnInsertButton() {
        return this.clickOnElement(this.insertButton).catch((err) => {
            this.saveScreenshot('err_click_on_insert_link_icon');
            throw new Error('Insert Link Dialog, error when click on the Insert button  ' + err);
        })
    }

    clickOnInsertButtonAndWaitForClosed() {
        return this.clickOnElement(this.insertButton).catch((err) => {
            this.saveScreenshot('err_click_on_insert_link_icon');
            throw new Error('Insert Link Dialog, error when click on the Insert button  ' + err);
        }).then(() => {
            return this.waitForDialogClosed();
        })
    }

    waitForValidationMessage() {
        return this.waitForElementDisplayed(XPATH.container + lib.VALIDATION_RECORDING_VIEWER, appConst.TIMEOUT_2).catch(err => {
            return false;
        });
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.cancelButton, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_open_insert_link_dialog');
            throw new Error('Insert Link Dialog should be opened!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2);
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
};
module.exports = InsertLinkDialog;


