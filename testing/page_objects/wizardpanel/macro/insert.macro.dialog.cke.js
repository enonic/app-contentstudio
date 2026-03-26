const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@role='dialog' and @data-component='HtmlAreaMacroDialog']`,
    configPanel: "//div[@data-component='MacroConfigPanel']",
    previewPanel: "//div[@data-component='MacroPreviewPanel']",
    textInPreviewTab: "//div[contains(@class,'preview-content')]",
    embedPreview: "//div[contains(@class,'embed-preview')]",
    warningInPreviewTab: "//div[contains(@class,'preview-message')]",
    tabTriggerByName: name => `//button[@role='tab' and contains(.,'${name}')]`,
    macroSelector: "//div[@data-component='MacroSelector']",
    validationError: "//span[contains(@class,'text-error')]",
};

class InsertMacroModalDialog extends Page {

    get cancelButton() {
        return XPATH.container + "//button[@aria-label='Close']";
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

    get previewTabItem() {
        return XPATH.container + XPATH.tabTriggerByName('Preview');
    }

    get configTabItem() {
        return XPATH.container + XPATH.tabTriggerByName('Configuration');
    }

    get configTextArea() {
        return XPATH.container + XPATH.configPanel + "//textarea";
    }

    get optionFilterInput() {
        return XPATH.container + XPATH.macroSelector + "//input";
    }

    async typeTextInConfigurationTextArea(text) {
        await this.waitForElementDisplayed(this.configTextArea, appConst.mediumTimeout);
        return await this.typeTextInInput(this.configTextArea, text);
    }

    typeTextInOptionFilterInput(text) {
        return this.typeTextInInput(this.optionFilterInput, text).catch(err => {
            this.saveScreenshot('err_insert_macro');
            throw new Error(err);
        })
    }

    async selectOption(option) {
        try {
            let filterInput = this.optionFilterInput;
            await this.waitForElementDisplayed(filterInput, appConst.mediumTimeout);
            await this.typeTextInInput(filterInput, option);
            await this.pause(500);
            let optionLocator = `//div[@role='listbox']//div[@role='option' and contains(.,'${option}')]`;
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_select_macro_option');
            throw new Error(`Error selecting macro option '${option}', screenshot: ${screenshot} ` + err);
        }
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnPreviewTabItem() {
        try {
            await this.waitForElementDisplayed(this.previewTabItem, appConst.mediumTimeout);
            await this.pause(500);
            await this.clickOnElement(this.previewTabItem);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshot('err_click_on_preview_tab');
            throw new Error(`Error occurred during clicking on Preview Tab Item! screenshot: ${screenshot} ` + err);
        }
    }

    async clickOnInsertButton() {
        await this.waitForElementDisplayed(this.insertButton, appConst.mediumTimeout);
        await this.pause(300);
        await this.clickOnElement(this.insertButton);
        return await this.pause(500);
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Insert Macro Dialog should be loaded!', 'err_insert_macro_dialog_loaded', err);
        }
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        return this.pause(1000);
    }

    async getTextInPreviewTab() {
        let locator = XPATH.container + XPATH.textInPreviewTab;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForIframeDisplayed(url) {
        let locator = XPATH.container + `//iframe[@src='${url}']`;
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async getTextInEmbedPreview() {
        let locator = XPATH.container + XPATH.embedPreview;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async getWarningInPreviewTab() {
        let locator = XPATH.container + XPATH.warningInPreviewTab;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async getValidationRecording() {
        let locator = XPATH.container + XPATH.validationError;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }
}

module.exports = InsertMacroModalDialog;
