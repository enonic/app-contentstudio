const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const MacroComboBox = require('../../components/selectors/insert.macro.combobox');

const XPATH = {
    container: `//div[contains(@id,'MacroModalDialog')]`,
    insertButton: `//button[contains(@id,'DialogButton') and child::span[text()='Insert']]`,
    cancelButton: `//button[contains(@id,'DialogButton') and child::span[text()='Cancel']]`,
    configurationTab: "//div[@class='panel macro-config-panel']",
    previewTab: "//div[@class='panel macro-preview-panel']",
    textInPreviewTab: "//div[contains(@class,'preview-content')]",
    embedPreview: "//div[contains(@class,'embed-preview')]",
    warningInPreviewTab: "//div[contains(@class,'preview-message')]",
    previewTabItem: "//li[contains(@id,'TabBarItem') and child::a[text()='Preview']]",
    configurationTabItem: "//li[contains(@id,'TabBarItem') and @title='Configuration']",
};

class InsertMacroModalDialog extends Page {

    get cancelButton() {
        return XPATH.container + XPATH.cancelButton;
    }

    get cancelButtonTop() {
        return `${XPATH.container}` + `${lib.CANCEL_BUTTON_TOP}`;
    }

    get insertButton() {
        return XPATH.container + XPATH.insertButton;
    }

    get previewTabItem() {
        return XPATH.container + XPATH.previewTabItem;
    }

    get configTabItem() {
        return XPATH.container + XPATH.configurationTabItem;
    }

    get configTextArea() {
        return XPATH.configurationTab + lib.TEXT_AREA;
    }

    get optionFilterInput() {
        return XPATH.container + lib.TEXT_INPUT;
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
        let macroComboBox = new MacroComboBox();
        return await macroComboBox.selectFilteredByDisplayNameItem(option, XPATH.container);
    }

    clickOnCancelButton() {
        return this.clickOnElement(this.cancelButton);
    }

    async clickOnPreviewTabItem() {
        await this.clickOnElement(this.previewTabItem);
        return await this.waitForElementDisplayed(XPATH.previewTab, appConst.mediumTimeout);
    }

    async clickOnInsertButton() {
        await this.clickOnElement(this.insertButton);
        return await this.pause(1000);
    }

    waitForDialogLoaded() {
        return this.waitForElementDisplayed(this.insertButton, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_macro_dialog');
            throw new Error('Insert Macro Dialog should be opened!' + err);
        });
    }

    async waitForDialogClosed() {
        await this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
        return this.pause(1000);
    }

    async getTextInPreviewTab() {
        let locator = XPATH.previewTab + XPATH.textInPreviewTab;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async waitForIframeDisplayed(url) {
        let locator = XPATH.previewTab + `//iframe[@src='${url}']`;
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async getTextInEmbedPreview() {
        let locator = XPATH.previewTab + XPATH.embedPreview;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async getWarningInPreviewTab() {
        let locator = XPATH.previewTab + XPATH.warningInPreviewTab;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    async getValidationRecording() {
        let locator = XPATH.container + lib.INPUT_VALIDATION_VIEW;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }

    isDialogOpened() {
        return this.isElementDisplayed(XPATH.container);
    }
}

module.exports = InsertMacroModalDialog;
