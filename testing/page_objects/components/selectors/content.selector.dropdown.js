/**
 * Created on 08.01.2024 updated on 11.02.2026
 */
const BaseDropdown = require('./base.dropdown');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const {DROPDOWN, BUTTONS} = require('../../../libs/elements');
const XPATH = {
    contentListBoxUL: "//ul[contains(@id,'ContentListBox')]",
    contentsTreeListUL: "//ul[contains(@id,'ContentsTreeList')]",
    selectionItemDisplayName: "//div[@data-component='SelectorSelectionItem']//div[@data-component='MediaSelectorItemView']//span[contains(@class,'font-semibold')]",
    addNewContentButton: "//div[@data-component='ContentCombobox']/following-sibling::div//button",
};

class ContentSelectorDropdown extends BaseDropdown {

    constructor(parentElementXpath) {
        super();
        this._container = parentElementXpath;
    }

    // returns the element that contains the dropdown:
    get container() {
        return this._container;
    }

    optionsFilterInput() {
        return this.dataComponentDiv + DROPDOWN.OPTION_FILTER_INPUT;
    }

    get dataComponentDiv() {
        return "//div[contains(@data-component,'ContentCombobox')]";
    }

    get addNewContentButton() {
        return this.container + XPATH.addNewContentButton;
    }

    async getSelectedOptionsDisplayName() {
        const locator = this.container + XPATH.selectionItemDisplayName;
        return await this.getTextInDisplayedElements(locator);
    }

    // selects a tree option by display name .
    async selectFilteredByDisplayNameContent(displayName) {
        try {
            await this.doFilterItem(displayName);
            await this.clickOnTreeItemOptionByDisplayName(displayName);
            await this.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(`Content selector, tried to click on the filtered option, ${displayName} `, 'err_content_sel', err);
        }
    }

    async selectFilteredByDisplayNameContentMulti(displayName, parent) {
        try {
            // Selects then clicks on Apply button:
            await this.clickOnFilteredByDisplayNameItemAndClickOnApply(displayName, parent);
        } catch (err) {
            await this.handleError(`Content selector - Error during selecting the option`, 'err_content_selector_dropdown', err);
        }
    }

    async getOptionsDisplayNameInTreeMode() {
        return await super.getOptionsDisplayNameInTreeMode();
    }

    async getOptionsDisplayNameInFlatMode() {
        return await super.getOptionsDisplayNameInFlatMode();
    }

    async getOptionsName(parentXpath) {
        let locator = XPATH.contentListBoxUL + lib.DROPDOWN_SELECTOR.DROPDOWN_LIST_ITEM + lib.P_SUB_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async removeSelectedOption(displayName) {
        try {
            const locator = this.container + DROPDOWN.selectedItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Content selector form, tried to remove the selected option: ${displayName}`, 'err_remove_option', err);
        }
    }
    async removeContentSelectedOption(displayName) {
        try {
            const locator = this.container + DROPDOWN.contentSelectionItemByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON;
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError(
                `Content selector form, tried to remove the selected option: ${displayName}`, 'err_remove_option', err);
        }
    }

    async waitForAddNewContentButtonDisplayed() {
        try {
            await this.waitForElementDisplayed(this.addNewContentButton);
        } catch (err) {
            await this.handleError(`'Add new' button should be displayed`, 'err_add_new_btn', err);
        }
    }

    async waitForAddNewContentButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.addNewContentButton);
        } catch (err) {
            await this.handleError(`'Add new' button should not be displayed`, 'err_add_new_btn', err);
        }
    }

    async clickOnAddNewContentButton() {
        await this.clickOnElement(this.addNewContentButton);
    }

}

module.exports = ContentSelectorDropdown;
