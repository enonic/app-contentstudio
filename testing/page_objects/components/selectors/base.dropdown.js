/**
 * Created on 08.01.2024 updated on 11.02.2026
 */
const {COMMON, BUTTONS, DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const Page = require('../../page');

const XPATH = {
    rightCheckBoxDiv: "//li[contains(@class,'checkbox-right')]//div[contains(@id,'Checkbox')]",
    rightCheckboxByDisplayName: displayName => `//li[contains(@class,'checkbox-right') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]//div[contains(@id,'Checkbox')]`,
    expanderIconByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]` +
               `//ancestor::li[contains(@id,'ContentListElement')]//div[contains(@class,'toggle icon-arrow_drop_up')]`;
    },
    // v6: text span inside each selected option row in SortableGridList
    sortableGridListSelectedOptionText:
        `//div[@data-component='SortableGridList']/div//span[contains(@class,'truncate')]`,
}

class BaseDropdown extends Page {

    get modeTogglerButton() {
        const base = this.dataComponentDiv ? this.container + this.dataComponentDiv : this.container;
        return base + DROPDOWN.MODE_TOGGLE;
    }

    get dropdownHandle() {
        const base = this.dataComponentDiv ? this.container + this.dataComponentDiv : this.container;
        return base + DROPDOWN.DROPDOWN_HANDLE;
    }

    get applySelectionButton() {
        const base = this.dataComponentDiv ? this.container + this.dataComponentDiv : this.container;
        return base + BUTTONS.buttonAriaLabel('Apply');
    }

    optionsFilterInput() {
        return (this.dataComponentDiv ? this.dataComponentDiv : '') + COMMON.INPUTS.INPUT;
    }

    optionsFilterInputByAriaLabel(ariaLabel = '') {
        return (this.dataComponentDiv ? this.dataComponentDiv : '') + COMMON.INPUTS.inputByAriaLabel(ariaLabel);
    }

    async waitForOptionFilterInputDisplayed() {
        return await this.waitForElementDisplayed(this.optionsFilterInput());
    }

    async waitForOptionFilterInputNotDisplayed() {
        return await this.waitForElementNotDisplayed(this.optionsFilterInput());
    }

    async waitForOptionFilterInputDisabled(parentLocator = '') {
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(parentLocator + this.optionsFilterInput(), 'class');
            return result.includes('disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Options Filter input should be disabled'});
    }

    async clickOnModeTogglerButton() {
        try {
            await this.waitForElementDisplayed(this.modeTogglerButton);
            await this.clickOnElement(this.modeTogglerButton);
            await this.pause(300);
        } catch (err) {
            await this.handleError('Tried to click on mode toggle icon.', 'err_click_mode_toggle', err);
        }
    }

    // wait for toggle-mode(flat/tree) icon is not displayed
    async waitForToggleIconNotDisplayed() {
        try {
            return await this.waitForElementNotDisplayed(this.modeTogglerButton);
        } catch (err) {
            await this.handleError('Dropdown,  mode-toggle icon should not be displayed.', 'err_toggle_mode_icon', err);
        }
    }

    async waitForToggleIconDisplayed(parentElement) {
        try {
            return await this.waitForElementDisplayed(parentElement + this.modeTogglerButton, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Dropdown,  mode-toggle icon should be displayed.', 'err_toggle_mode_icon', err);
        }
    }

    async clickOnDropdownHandle() {
        let locator = this.dropdownHandle;
        await this.waitForElementDisplayed(locator);
        return await this.clickOnElement(locator);
    }

    async waitForApplySelectionButtonDisplayed() {
        await this.waitUntilDisplayed(this.applySelectionButton);
        await this.pause(100);
    }

    async waitForApplySelectionButtonNotDisplayed() {
        try {
            // Wait until the Apply Selection button is not displayed
            await this.waitForElementNotDisplayed(this.applySelectionButton);
        } catch (error) {
            // Handle errors gracefully and log the issue
            await this.handleError('Failed to wait for Apply Selection button to disappear.', 'err_wait_apply_button', error);
        }
    }

    async clickOnApplySelectionButton() {
        try {
            await this.waitForApplySelectionButtonDisplayed();
            await this.clickOnElement(this.applySelectionButton);
            await this.pause(1000);
        } catch (err) {
            await this.handleError('Dropdown, tried to click on Apply Selection button.', 'err_click_apply_button', err);
        }
    }

    // new
    async doFilterItem(text) {
        let optionsFilterLocator = this.optionsFilterInput();
        await this.waitUntilDisplayed(optionsFilterLocator);
        let elements = await this.getDisplayedElements(optionsFilterLocator);
        await elements[0].setValue(text);
        return await this.pause(300);
    }

    async typeCharsInFilterItem(text) {
        let optionsFilterLocator = this.optionsFilterInput();
        await this.waitUntilDisplayed(optionsFilterLocator);
        let elements = await this.getDisplayedElements(optionsFilterLocator);
        await elements[0].click();
        await this.pause(200);
        await this.typeChars(elements[0], text);
    }

    async clickOnExpanderIconInOptionsList(listItemName) {
        try {
            let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.treeItemExpanderByDisplayName(listItemName);
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(400);
        } catch (err) {
            await this.handleError(`Dropdown, tried to click on expander icon for list item: ${listItemName}`, 'err_click_expander_icon',
                err);
        }
    }

    async isOptionsFilterInputDisplayed() {
        try {
            let locator = this.container + this.optionsFilterInput();
            return await this.waitForElementDisplayed(locator, appConst.shortTimeout);
        } catch (err) {
            return false;
        }
    }

    // Gets all displayName values in tree mode dropdown
// Returns array of display names from all visible tree items
    async getOptionsDisplayNameInTreeMode() {
        const locator = DROPDOWN.COMBOBOX_POPUP +
                        "//div[@data-component='VirtualizedTreeList.Row' and @aria-level>'0']//div[@data-component='ContentLabel']//span[contains(@class,'font-semibold')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(500);
        return await this.getTextInDisplayedElements(locator);
    }

    async getOptionsDisplayNameInFlatMode() {
        const locator = DROPDOWN.COMBOBOX_POPUP +
                        "//div[@data-component='VirtualizedTreeList.Row']//div[@data-component='ContentLabel']//span[contains(@class,'font-semibold')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.pause(200);
        return await this.getTextInDisplayedElements(locator);
    }

    async clickOnOptionByDisplayName(optionDisplayName) {
        try {
            let optionLocator = DROPDOWN.optionByDisplayName(optionDisplayName);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on filtered by display name option: ${optionDisplayName}`,
                'err_click_filtered_option', err);
        }
    }

    async clickOnListItemOptionByDisplayName(optionDisplayName) {
        try {
            let optionLocator = DROPDOWN.listItemOptionByDisplayName(optionDisplayName);
            await this.waitForElementDisplayed(optionLocator);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on filtered by display name option: ${optionDisplayName}`,
                'err_click_filtered_option', err);
        }
    }

    async clickOnOptionByDisplayNameInTreeMode(displayName) {
        try {
            let locator = DROPDOWN.COMBOBOX_POPUP +
                          `//div[@data-component='VirtualizedTreeList.Row' and @aria-level>'0' and descendant::div[@data-component='ContentLabel']//span[contains(@class,'font-semibold') and text()='${displayName}']]`;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Dropdown, tried to click on tree item: ${displayName}`, 'err_click_tree_item', err);
        }
    }

    async clickOnTreeItemOptionByDisplayName(optionDisplayName) {
        try {
            let optionLocator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.treeItemByDisplayName(optionDisplayName);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
        } catch (err) {
            await this.handleError(`Dropdown Selector, tried to click on filtered by display name option: ${optionDisplayName}`,
                'err_click_filtered_option', err);
        }
    }

    async clickOnCheckboxInDropdown(index) {
        let locator = DROPDOWN.COMBOBOX_POPUP + "//div[@data-component='VirtualizedTreeList.RowSelectionControl']";
        await this.waitForElementDisplayed(locator);
        let result = await this.findElements(locator);
        await result[index].click();
        return await this.pause(300);
    }

    async clickOnSelectRowCheckboxByDisplayName(displayName) {
        let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.treeItemCheckboxByDisplayName(displayName);
        await this.waitForElementDisplayed(locator);
        let result = await this.findElements(locator);
        await result[0].click();
        return await this.pause(300);
    }

    // tree mode if 'active' is present in @class attribute
    async getMode() {
        let attr = await this.getAttribute(this.modeTogglerButton, 'aria-label');
        //return attr.includes('active') ? 'tree' : 'flat';
        return attr.includes('List view') ? 'flat' : 'tree';
    }

    async getModeByDOM() {
        try {
            const treeLocator = DROPDOWN.COMBOBOX_POPUP + "//div[@role='tree']";
            const isTree = await this.findElements(treeLocator);
            return isTree.length > 0 ? 'tree' : 'flat';
        } catch (err) {
            return 'unknown';
        }
    }

    async getSelectedOptionsDisplayName() {
        const base = this.dataComponentDiv ? this.container + this.dataComponentDiv : this.container;
        const locator = base + XPATH.sortableGridListSelectedOptionText;
        return await this.getTextInDisplayedElements(locator);
    }

    async getCheckedOptionsDisplayNameInDropdownList() {
        let locator = DROPDOWN.COMBOBOX_POPUP +
                      "//div[@data-component='VirtualizedTreeList.Row' and descendant::div[@data-component='VirtualizedTreeList.RowSelectionControl' and @aria-checked='true']]" +
                      "//div[@data-component='ContentLabel']//span[contains(@class,'font-semibold')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = BaseDropdown;
