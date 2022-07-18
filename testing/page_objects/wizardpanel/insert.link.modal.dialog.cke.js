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
    radioButtonByLabel: label => `//span[contains(@id,'RadioButton') and child::label[contains(.,'${label}')]]`,
    urlTypeButton: "//div[contains(@id,'MenuButton')]//button[contains(@id,'ActionButton') and child::span[text()='Type']]",
    menuItemByName: optionName => `//div[contains(@id,'MenuButton')]//li[text()='${optionName}']`,
    anchorFormItem: "//div[contains(@class,'anchor-form-item')]",
    parametersFormItem: "//div[contains(@id,'FormItem') and descendant::label[text()='Parameters']]",
};

class InsertLinkDialog extends Page {

    get addAnchorButton() {
        return XPATH.container + XPATH.anchorFormItem + lib.BUTTON_WITH_SPAN_ADD;
    }

    get anchorTextInput() {
        return XPATH.container + XPATH.anchorFormItem + lib.TEXT_INPUT;
    }

    get parameterNameInput() {
        return XPATH.container + XPATH.parametersFormItem + "//input[contains(@id,'TextInput') and @placeholder='Name']";
    }

    get parameterValueInput() {
        return XPATH.container + XPATH.parametersFormItem + "//input[contains(@id,'TextInput') and @placeholder='Value']";
    }

    get addParametersButton() {
        return XPATH.container + XPATH.parametersFormItem + lib.BUTTON_WITH_SPAN_ADD;
    }

    get urlTypeButton() {
        return XPATH.container + XPATH.urlTypeButton;
    }

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

    get emailInputValidationRecording() {
        return XPATH.container + XPATH.emailPanel + lib.VALIDATION_RECORDING_VIEWER;
    }

    get emailInput() {
        return XPATH.container + XPATH.emailPanel + "//fieldset[descendant::label[text()='Email']]" + lib.TEXT_INPUT;
    }

    get subjectInput() {
        return XPATH.container + XPATH.emailPanel + "//fieldset[descendant::label[text()='Subject']]" + lib.TEXT_INPUT;
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
    typeInLinkTextInput(text) {
        return this.typeTextInInput(this.linkTextInput, text).catch(err => {
            this.saveScreenshot('err_type_link_text');
            throw new Error('error when type text in link-text input ' + err);
        });
    }

    //types text in link tooltip input
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

    //types text in URL input(URL tab)
    typeUrl(url) {
        return this.typeTextInInput(this.urlInput, url).catch(err => {
            this.saveScreenshot('err_type_link_url');
            throw new Error('error when type URL in Insert Link modal dialog ' + err);
        });
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
        let attr = await this.getAttribute(locator, "class");
        return attr.includes("selected");
    }

    async clickOnUrlTypeMenuOption(option) {
        let optionLocator = XPATH.container + XPATH.menuItemByName(option);
        await this.clickOnUrlTypeButton();
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(300);
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

    waitForValidationMessageForEmailInputDisplayed() {
        return this.waitForElementDisplayed(this.emailInputValidationRecording, appConst.mediumTimeout);
    }

    async getUrlInputValidationMessage() {
        await this.waitForValidationMessageForUrlInputDisplayed();
        return await this.getText(this.urlInputValidationRecording);
    }

    async getEmailInputValidationMessage() {
        await this.waitForValidationMessageForEmailInputDisplayed();
        return await this.getText(this.emailInputValidationRecording);
    }

    //Click on a radio in Media options:
    async clickOnRadioButton(label) {
        let locator = XPATH.container + XPATH.radioButtonByLabel(label)
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator + "//input");
    }

    async waitForAddAnchorButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.addAnchorButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_anchor_btn"));
            throw new Error("Add Anchor button should be displayed! " + err);
        }
    }

    async waitForAddAnchorButtonNotDisplayed() {
        try {
            return this.waitForElementNotDisplayed(this.addAnchorButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_anchor_btn"));
            throw new Error("Add Anchor button should not be displayed! " + err);
        }
    }

    async waitForAddParametersButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.addParametersButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_param_btn"));
            throw new Error("Add parameters button should be displayed! " + err);
        }
    }

    async clickOnAddAnchorButton() {
        await this.waitForAddAnchorButtonDisplayed();
        return await this.clickOnElement(this.addAnchorButton);
    }

    async clickOnAddParametersButton() {
        await this.waitForAddParametersButtonDisplayed();
        return await this.clickOnElement(this.addParametersButton);
    }

    async getTextInAnchorInput() {
        await this.waitForElementDisplayed(this.anchorTextInput, appConst.mediumTimeout);
        return await this.getTextInInput(this.anchorTextInput);
    }

    async typeTextInAnchorInput(text) {
        await this.waitForElementDisplayed(this.anchorTextInput, appConst.mediumTimeout);
        return await this.typeTextInInput(this.anchorTextInput, text);
    }

    async typeInParameterNameInput(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputElements = await this.getDisplayedElements(this.parameterNameInput);
        await inputElements[index].setValue(value);
        return await this.pause(300);
    }

    async getTextInParameterNameInput(index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputElements = await this.getDisplayedElements(this.parameterNameInput);
        return await inputElements[index].getValue();
    }

    async typeInParameterValueInput(value, index) {
        index = typeof index !== 'undefined' ? index : 0;
        let inputElements = await this.getDisplayedElements(this.parameterValueInput);
        await inputElements[index].setValue(value);
        return await this.pause(300);
    }

    async getParametersFormValidationMessage() {
        let locator = XPATH.container + XPATH.parametersFormItem + lib.VALIDATION_RECORDING_VIEWER;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async getAnchorFormValidationMessage() {
        let locator = XPATH.container + XPATH.anchorFormItem + lib.VALIDATION_RECORDING_VIEWER;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }
}

module.exports = InsertLinkDialog;


