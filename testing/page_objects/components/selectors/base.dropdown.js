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
    SortableGridListSelectedOptionText:
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
            return await this.clickOnElement(this.modeTogglerButton);
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

    async clickOnApplySelectionButtonOld() {
        try {
            let locator = this.container + lib.DROPDOWN_SELECTOR.APPLY_SELECTION_BUTTON;
            await this.waitUntilDisplayed(locator, appConst.shortTimeout);
            let elements = await this.getDisplayedElements(locator);
            await elements[0].click();
            await this.pause(100);
        } catch (err) {
            await this.handleError('Dropdown, tried to click on Apply Selection button.', 'err_click_apply_button', err);
        }
    }

    async clickOnApplySelectionButton() {
        try {
            await this.waitForApplySelectionButtonDisplayed();
            let elements = await this.getDisplayedElements(this.applySelectionButton);
            await elements[0].click();
            await this.pause(1000);
        } catch (err) {
            await this.handleError('Dropdown, tried to click on Apply Selection button.', 'err_click_apply_button', err);
        }
    }

    // new
    async doFilterItem(text) {
        let optionsFilterLocator = this.optionsFilterInput();
        await this.waitUntilDisplayed(optionsFilterLocator, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(optionsFilterLocator);
        await elements[0].setValue(text);
        return await this.pause(300);
    }

    async clickOnExpanderIconInOptionsList(listItemName) {
        try {
            let locator = DROPDOWN.COMBOBOX_POPUP + DROPDOWN.treeItemExpanderByDisplayName(listItemName);
            await this.waitForElementDisplayed(locator);
            await this.clickOnElement(locator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Dropdown, tried to click on expander icon for list item: ${listItemName}`, 'err_click_expander_icon',
                err);
        }
    }

    async isOptionsFilterInputDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.container + this.optionsFilterInput, appConst.shortTimeout);
        } catch (err) {
            return false;
        }
    }

    // 1. Insert a text in Filter input
    // 2. Click on the filtered by displayName item (h6[contains(@class,'main-name'))
    // 3. Click on Apply button and apply the selection.
    async clickOnFilteredByDisplayNameItemAndClickOnApply(optionDisplayName, parentLocator) {
        // 1. Click on the filtered item:
        await this.clickOnFilteredByDisplayNameItem(optionDisplayName, parentLocator);
        // 3. Click on 'OK' button:
        return await this.clickOnApplySelectionButton(parentLocator);
    }

    // Do filter by a display name then Click on the item
    // old
    async clickOnFilteredByDisplayNameItem(optionDisplayName, parentLocator) {
        // parentLocator - modal dialog or wizard panel
        // 1. Insert the text in Options Filter Input:
        await this.filterItem(optionDisplayName);
        // 2. Wait for the required option is displayed then click on it:
        await this.clickOnOptionByDisplayName(optionDisplayName, parentLocator);
    }

    // epic-enonic-ui
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

    // epic-enonic-ui
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

    // 1. Insert a text in Filter input
    // 2. Click on the filtered by name item (p[contains(@class,'sub-name'))
    // 3. Click on OK button and apply the selection.
    async clickOnFilteredByNameItemAndClickOnApply(optionName, parentLocator = '') {
        // parent locator - it is locator for parent modal dialog or wizard form,
        // 1. type the text in Options Filter Input:
        await this.filterItem(optionName);
        // 3. Click on the row with the item:
        await this.clickOnOptionByName(optionName, parentLocator);
        // 4. Click on 'OK' button:
        return await this.clickOnApplySelectionButton(parentLocator);
    }

    async clickOnOptionByName(name, parentLocator) {
        let optionLocator = this.buildLocatorForOptionByName(name, parentLocator);
        //  Wait for the required option is displayed:
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // Click on the item:
        await this.clickOnElement(optionLocator);
    }

    // builds a locator for clickable option in Dropdown List options:
    buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator = '') {
        let locator = parentLocator + this.container;
        return lib.DROPDOWN_SELECTOR.dropdownListItemByDisplayName(locator, optionDisplayName);
    }

    // builds a locator for clickable option in Dropdown List options:
    buildLocatorForOptionByName(name, parentLocator = '') {
        let locator = parentLocator + this.container;
        return lib.DROPDOWN_SELECTOR.dropdownListItemByName(locator, name);
    }

    async clickOnCheckboxInDropdown(index, parentXpath = '') {
        let locator = parentXpath + XPATH.rightCheckBoxDiv;
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

    async getSelectedOptionsDisplayName() {
        const base = this.dataComponentDiv ? this.container + this.dataComponentDiv : this.container;
        const locator = base + XPATH.SortableGridListSelectedOptionText;
        return await this.getTextInDisplayedElements(locator);
    }

    async getCheckedOptionsDisplayNameInDropdownList(parentXpath) {
        let locator = parentXpath + "//ul[contains(@id,'ContentListBox')]" + "//li[contains(@class,'item-view-wrapper')]";
        let optionElements = await this.findElements(locator);
        let checkedOptionElements = await this.doFilterCheckedOptionsElements(optionElements);
        let pr = await checkedOptionElements.map(async (el) => {
            let e = await el.$(".//h6[contains(@class,'main-name')]");
            return await e.getText();

        });
        return await Promise.all(pr);
    }

    async doFilterCheckedOptionsElements(elements) {
        let pr = await elements.map(async (el) => await this.isOptionItemChecked(el));
        let result = await Promise.all(pr);
        return elements.filter((el, i) => result[i]);
    }

    async isOptionItemChecked(el) {
        let value = await el.getAttribute('class');
        return value.includes('checked');
    }

}

module.exports = BaseDropdown;
