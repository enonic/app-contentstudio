/**
 * Created on 09.07.2020.
 */
const lib = require('../../libs/elements');
const BaseSelectorForm = require('./base.selector.form');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');

const XPATH = {
    container: lib.FORM_VIEW + "//div[contains(@id,'ContentSelector')]",
    selectedOptionByName: option => {
        return `//div[contains(@id,'ContentSelector') and descendant::h6[contains(@class,'main-name') and text()='${option}']]`
    },
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

    // Selects an option by the display-name then click on Apply selection  button:
    async clickOnOptionByDisplayNameAndApply(optionDisplayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.clickOnFilteredByDisplayNameItemAndClickOnApply(optionDisplayName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combobox');
            throw new Error("Error occurred in content combobox, screenshot:" + screenshot + " " + err)
        }
    }

    // if dropdown in three mode then after entering text it should automatically switch to flat mode.
    // Insert a text in Filter input, switches to flat mode, then click on the filtered by displayName item
    async doFilterOptionInTreeModeAndApply(optionDisplayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            await contentSelectorDropdown.filterItem(optionDisplayName, XPATH.container);
            await contentSelectorDropdown.pause(1000);
            let mode = await this.getOptionsMode();
            // TODO check the mode
            // 2. Wait for the required option is displayed then click on it:
            await contentSelectorDropdown.clickOnOptionByDisplayName(optionDisplayName, XPATH.container);
            // 3. Click on 'Apply' button:
            return await contentSelectorDropdown.clickOnApplySelectionButton(XPATH.container);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combobox');
            throw new Error(`Error occurred in content combobox, screenshot:${screenshot} ` + err)
        }
    }


    async clickOnApplySelectionButton() {
        try {
            let contentSelector = new ContentSelectorDropdown();
            await contentSelector.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error(`Error occurred in Content combobox, OK button, screenshot:${screenshot} `  + err);
        }
    }

    async getOptionsDisplayNameInTreeMode() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.getOptionsDisplayNameInTreeMode(XPATH.container);
    }

    async getOptionsDisplayNameInFlatMode() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.getOptionsDisplayNameInFlatMode(XPATH.container);
    }

    async removeSelectedOption(option) {
        let locator = XPATH.selectedOptionByName(option) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(500);
    }

    async getOptionsMode() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.getMode(XPATH.container);
    }
    async getCheckedOptionsDisplayNameInDropdownList() {
        let contentSelector = new ContentSelectorDropdown();
        return await contentSelector.getCheckedOptionsDisplayNameInDropdownList(XPATH.container);
    }
}

module.exports = ContentSelectorForm;
