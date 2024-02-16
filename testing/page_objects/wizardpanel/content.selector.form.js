/**
 * Created on 09.07.2020.
 */
const lib = require('../../libs/elements');
const BaseSelectorForm = require('./base.selector.form');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/content.selector.dropdown');

const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'ContentSelector')]",
};

class ContentSelectorForm extends BaseSelectorForm {

    get optionsFilterInput() {
        return XPATH.container + lib.OPTION_FILTER_INPUT;
    }

    get dropdownHandle() {
        return XPATH.container + lib.DROP_DOWN_HANDLE;
    }

    get modeTogglerButton() {
        return XPATH.container + lib.SELECTOR_MODE_TOGGLER;
    }

    get addNewContentButton() {
        return XPATH.container + lib.ADD_NEW_CONTENT_BUTTON;
    }

    async clickOnModeTogglerButton() {
        await this.waitForElementDisplayed(this.modeTogglerButton, appConst.mediumTimeout);
        await this.clickOnElement(this.modeTogglerButton);
        await this.pause(500);
    }

    async clickOnDropdownHandle() {
        await this.waitForElementDisplayed(this.dropdownHandle, appConst.mediumTimeout);
        await this.clickOnElement(this.dropdownHandle);
        await this.pause(1000);
    }

    async clickOnCheckboxInDropdown(index) {
        let contentSelectorDropdown = new ContentSelectorDropdown();
        await contentSelectorDropdown.clickOnCheckboxInDropdown(index, XPATH.container);
        await this.pause(500);
    }

    selectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`;
    }

    getSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]//h6[contains(@class,'main-name')]";
        return this.getTextInElements(selector);
    }

    getNameOfSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]" + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.addNewContentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error('Add new button is not displayed, screenshot:' + screenshot + ' ' + err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.addNewContentButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error('Add new button should not be displayed, screenshot:' + screenshot + ' ' + err);
        }
    }

    async clickOnAddNewContentButton() {
        await this.waitForAddNewContentButtonDisplayed();
        return await this.clickOnElement(this.addNewContentButton);
    }

    //Selects an option by the display name then click on OK:
    async selectOption(optionDisplayName) {
        try {
            let contentSelector = new ContentSelectorDropdown();
            await this.typeTextInInput(this.optionsFilterInput, optionDisplayName);
            await contentSelector.clickOnFilteredItemAndClickOnOk(optionDisplayName);
            return await contentSelector.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combobox');
            throw new Error("Error occurred in content combobox, screenshot:" + screenshot + " " + err)
        }
    }

    async clickOnApplySelectionButton() {
        try {
            let contentSelector = new ContentSelectorDropdown();
            await contentSelector.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error("Error occurred in Content combobobox, OK button, screenshot: " + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayNameInTreeMode() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.getOptionsDisplayNameInTreeMode(XPATH.container);
    }
}

module.exports = ContentSelectorForm;
