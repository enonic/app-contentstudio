const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const LoaderComboBox = require('../../components/loader.combobox');

const XPATH = {
    container: `//div[contains(@id,'LinkModalDialog')]`,
    contentPanel: "//div[contains(@id,'DockedPanel')]//div[contains(@id,'Panel') and contains(@class,'panel content-panel')]",
    radioButtonByLabel: label => `//span[contains(@id,'RadioButton') and child::label[contains(.,'${label}')]]`,
    anchorFormItem: "//div[contains(@class,'anchor-form-item')]",
    parametersFormItem: "//div[contains(@id,'FormItem') and descendant::label[text()='Parameters']]",
    showContentCheckboxCheckboxDiv: "//div[contains(@id,'Checkbox') and child::label[contains(.,'Show content from the entire')]]",
    openInNewTabCheckboxDiv: "//div[contains(@id,'Checkbox') and child::label[contains(.,'Open in new tab')]]",
    showContentCheckboxLabel: "//div[contains(@id,'Checkbox')]//label[contains(.,'Show content from the entire')]",
    openInNewTabCheckboxLabel: "//div[contains(@id,'Checkbox')]//label[contains(.,'Open in new tab')]",
    contentCombobox: "//div[contains(@id,'ContentComboBox')]",
};

class InsertLinkDialogContentPanel extends Page {

    get showContentFromEntireProjectCheckbox() {
        return XPATH.contentPanel + XPATH.showContentCheckboxCheckboxDiv + lib.INPUTS.CHECKBOX_INPUT;
    }

    get openInNewTabCheckbox() {
        return XPATH.contentPanel + XPATH.openInNewTabCheckboxDiv + lib.INPUTS.CHECKBOX_INPUT;
    }

    get contentDropDownHandler() {
        return XPATH.contentPanel + XPATH.contentCombobox + lib.DROP_DOWN_HANDLE;
    }

    get contentSelectorModeTogglerButton() {
        return XPATH.contentPanel + XPATH.contentCombobox + lib.COMBOBOX.MODE_TOGGLER_BUTTON;
    }

    get addAnchorButton() {
        return XPATH.contentPanel + XPATH.anchorFormItem + lib.BUTTON_WITH_SPAN_ADD;
    }

    get anchorTextInput() {
        return XPATH.contentPanel + XPATH.anchorFormItem + lib.TEXT_INPUT;
    }

    get parameterNameInput() {
        return XPATH.contentPanel + XPATH.parametersFormItem + "//input[contains(@id,'TextInput') and @placeholder='Name']";
    }

    get parameterValueInput() {
        return XPATH.contentPanel + XPATH.parametersFormItem + "//input[contains(@id,'TextInput') and @placeholder='Value']";
    }

    get addParametersButton() {
        return XPATH.contentPanel + XPATH.parametersFormItem + lib.BUTTON_WITH_SPAN_ADD;
    }

    async clickOnContentDropdownHandle() {
        await this.waitForElementDisplayed(this.contentDropDownHandler, appConst.mediumTimeout);
        await this.clickOnElement(this.contentDropDownHandler);
        await this.pause(700);
    }

    async clickOnContentSelectorModeTogglerButton() {
        await this.waitForElementDisplayed(this.contentSelectorModeTogglerButton, appConst.mediumTimeout);
        await this.clickOnElement(this.contentSelectorModeTogglerButton);
        await this.pause(700);
    }

    async getDropdownListOptions() {
        let loaderComboBox = new LoaderComboBox();
        let optionsLocator = XPATH.container + lib.SLICK_ROW + lib.H6_DISPLAY_NAME;
        await loaderComboBox.waitForElementDisplayed(optionsLocator, appConst.mediumTimeout);
        return await loaderComboBox.getOptionDisplayNames(XPATH.container);
    }


    waitForShowContentFromEntireProjectCheckboxDisplayed() {
        let locator = XPATH.contentPanel +  XPATH.showContentCheckboxLabel;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    waitForOpenInNewTabCheckboxDisplayed() {
        let locator = XPATH.contentPanel + XPATH.openInNewTabCheckboxLabel;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    isShowContentFromEntireProjectCheckboxSelected() {
        return this.isSelected(this.showContentFromEntireProjectCheckbox);
    }

    isOpenInNewTabCheckboxSelected() {
        return this.isSelected(this.openInNewTabCheckbox);
    }

    async waitForShowContentFromEntireProjectCheckboxNotDisplayed() {
        try {
            let locator = XPATH.contentPanel + XPATH.showContentCheckboxLabel;
            return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_show_checkbox');
            await this.saveScreenshot(screenshot);
            throw new Error('Show Content From Entire Project Checkbox should not be displayed! screenshot: ' + screenshot + ' ' + err);
        }
    }

    async clickOnShowContentFromEntireProjectCheckbox() {
        let locator = XPATH.contentPanel + XPATH.showContentCheckboxCheckboxDiv + "//label";
        await this.waitForElementClickable(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async clickOnOpenInNewTabCheckbox() {
        let locator = XPATH.contentPanel + XPATH.openInNewTabCheckboxDiv + "//label";
        await this.waitForElementClickable(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async waitForAddParametersButtonDisplayed() {
        try {
            return this.waitForElementDisplayed(this.addParametersButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_add_param_btn')
            await this.saveScreenshot(screenshot);
            throw new Error('Add parameters button should be displayed! screenshot: ' + screenshot + ' ' + err);
        }
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

    async selectTargetInContentSelector(targetDisplayName) {
        let loaderComboBox = new LoaderComboBox();
        return await loaderComboBox.typeTextAndSelectOption(targetDisplayName, XPATH.contentCombobox);
    }

    getSelectedOptionDisplayName() {
        let selector = XPATH.container + XPATH.contentPanel + lib.CONTENT_SELECTED_OPTION_VIEW + lib.H6_DISPLAY_NAME;
        return this.getText(selector);
    }

    // Click on a radio in Media options:
    async clickOnRadioButton(label) {
        let locator = XPATH.container + XPATH.contentPanel + XPATH.radioButtonByLabel(label)
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator + "//input");
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

module.exports = InsertLinkDialogContentPanel;


