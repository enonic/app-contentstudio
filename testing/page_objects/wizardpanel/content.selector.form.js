/**
 * Created on 09.07.2020.
 */
const {COMMON, BUTTONS} = require('../../libs/elements');
const BaseSelectorForm = require('./base.selector.form');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');

const XPATH = {
    container: "//div[@data-component='FormRenderer']",
    selectorSelectionDiv: "//div[@data-component='SelectorSelection']",
    selectedItemByDisplayName: (displayName) =>
        `//div[@data-component='SelectorSelectionItem' and descendant::span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,
};

class ContentSelectorForm extends BaseSelectorForm {

    get optionsFilterInput() {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        return contentSelectorDropdown.optionsFilterInput();
    }

    async waitForOptionFilterInputDisplayed() {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        return await contentSelectorDropdown.waitForOptionFilterInputDisplayed();
    }

    async clickOnModeTogglerButton() {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        await contentSelectorDropdown.clickOnModeTogglerButton();
        await this.pause(1000);
    }

    async clickOnDropdownHandle() {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        await contentSelectorDropdown.clickOnDropdownHandle();
        await this.pause(1000);
    }

    async clickOnCheckboxInDropdown(index) {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        await contentSelectorDropdown.clickOnCheckboxInDropdown(index);
        await this.pause(500);
    }

    selectedOptionByDisplayName(displayName) {
        return `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]`;
    }

    async getSelectedOptions() {
        let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
        return await contentSelectorDropdown.getSelectedOptionsDisplayName();
    }

    getNameOfSelectedOptions() {
        let selector = "//div[contains(@id,'ContentSelectedOptionView')]" + lib.P_SUB_NAME;
        return this.getTextInElements(selector);
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.addNewContentButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error(`'Add new' button is not displayed, screenshot:${screenshot} ` + err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.addNewContentButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_add_new_btn');
            throw new Error(`'Add new' button should not be displayed, screenshot:${screenshot} ` + err);
        }
    }

    async clickOnAddNewContentButton() {
        await this.waitForAddNewContentButtonDisplayed();
        return await this.clickOnElement(this.addNewContentButton);
    }

    // Selects an option by the display-name then click on Apply selection  button:
    async clickOnOptionByDisplayNameAndApply(optionDisplayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
            await contentSelectorDropdown.doFilterItem(optionDisplayName);
            await contentSelectorDropdown.clickOnListItemOptionByDisplayName(optionDisplayName);
            await contentSelectorDropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(
                `Content selector, tried to click on the option: ${optionDisplayName} and click on Apply button`, 'err_combobox', err);
        }
    }

    // if dropdown in three mode then after entering text it should automatically switch to flat mode.
    // Insert a text in Filter input, switches to flat mode, then click on the filtered by displayName item
    async doFilterOptionInTreeModeAndApply(optionDisplayName) {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown(XPATH.container);
            await contentSelectorDropdown.filterItem(optionDisplayName);
            await contentSelectorDropdown.pause(1000);
            let mode = await this.getOptionsMode();
            // TODO check the mode
            // 2. Wait for the required option is displayed then click on it:
            await contentSelectorDropdown.clickOnOptionByDisplayName(optionDisplayName);
            // 3. Click on 'Apply' button:
            return await contentSelectorDropdown.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(
                `Content selector, tried to select: ${optionDisplayName} in tree mode and Apply`, 'err_combobox_tree_mode', err);
        }
    }

    async clickOnApplySelectionButton() {
        try {
            let contentSelector = new ContentSelectorDropdown();
            await contentSelector.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`Content selector, tried to click on Apply button`, 'err_apply_btn', err);
        }
    }

    async getOptionsDisplayNameInTreeMode() {
        let contentSelector = new ContentSelectorDropdown(XPATH.container);
        return await contentSelector.getOptionsDisplayNameInTreeMode();
    }

    async getOptionsDisplayNameInFlatMode() {
        let contentSelector = new ContentSelectorDropdown(XPATH.container);
        return await contentSelector.getOptionsDisplayNameInFlatMode();
    }

    async removeSelectedOption(displayName) {
        try {
            const locator = XPATH.container + XPATH.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Content selector form, tried to remove the selected option: ${displayName}`, 'err_remove_option', err);
        }
    }

    async clickOnEditSelectedOption(displayName) {
        try {
            const locator = XPATH.container + XPATH.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_EDIT_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Content selector , tried to edit the selected option: ${displayName}`, 'err_edit_option', err);
        }
    }

    async getOptionsMode() {
        let contentSelector = new ContentSelectorDropdown(XPATH.container);
        return await contentSelector.getMode();
    }

    async getCheckedOptionsDisplayNameInDropdownList() {
        let contentSelector = new ContentSelectorDropdown(XPATH.container);
        return await contentSelector.getCheckedOptionsDisplayNameInDropdownList();
    }
}

module.exports = ContentSelectorForm;
