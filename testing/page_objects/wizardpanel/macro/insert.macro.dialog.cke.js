const Page = require('../../page');
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const MacroComboBox = require('../../components/selectors/insert.macro.combobox');

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
        await this.waitForElementDisplayed(this.configTextArea);
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
            let macroComboBox= new MacroComboBox(XPATH.container);
            await macroComboBox.selectFilteredByDisplayNameItem(option);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(`Error occurred during selecting the macro option '${option}'!`, 'err_select_macro_option', err);
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
        await this.waitForElementDisplayed(this.insertButton);
        await this.pause(300);
        await this.clickOnElement(this.insertButton);
        return await this.pause(500);
    }

    async waitForUpdateButtonDisplayed() {
        await this.waitForElementDisplayed(this.updateButton);
    }

    async clickOnUpdateButton() {
        await this.waitForUpdateButtonDisplayed();
        await this.pause(300);
        await this.clickOnElement(this.updateButton);
        return await this.pause(500);
    }

    async waitForInsertButtonDisabled() {
        try {
            await this.waitForElementDisabled(this.insertButton);
        } catch (err) {
            await this.handleError('Insert button should be disabled!', 'err_insert_button_disabled', err);
        }
    }

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Insert Macro Dialog should be loaded!', 'err_insert_macro_dialog_loaded', err);
        }
    }

    async waitForDialogClosed() {
        try {
            await this.waitForElementNotDisplayed(XPATH.container);
            return await this.pause(500);
        }catch (err) {
            await this.handleError('Insert Macro Dialog should be closed!', 'err_insert_macro_dialog_closed', err);
        }
    }

    async getTextInPreviewTab() {
        let locator = XPATH.container + XPATH.textInPreviewTab;
        await this.waitForElementDisplayed(locator);
        return await this.getText(locator);
    }

    async waitForIframeDisplayed(url) {
        let locator = XPATH.container + `//iframe[@src='${url}']`;
        return await this.waitForElementDisplayed(locator);
    }

    async getTextInEmbedPreview() {
        let locator = XPATH.container + XPATH.embedPreview;
        await this.waitForElementDisplayed(locator);
        return this.getText(locator);
    }

    async getWarningInPreviewTab() {
        let locator = XPATH.container + XPATH.warningInPreviewTab;
        await this.waitForElementDisplayed(locator);
        return this.getText(locator);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }
}

module.exports = InsertMacroModalDialog;
