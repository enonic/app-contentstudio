/**
 * Created on 08.01.2024
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const Page = require('../../page');

const XPATH = {
    rightCheckBoxDiv: "//li[contains(@class,'checkbox-right')]//div[contains(@id,'Checkbox')]",
    rightCheckboxByDisplayName: displayName => `//li[contains(@class,'checkbox-right') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]//div[contains(@id,'Checkbox')]`,
    expanderIconByName: name => {
        return `//div[contains(@id,'NamesView') and child::p[contains(@class,'sub-name') and contains(.,'${name}')]]` +
               `//ancestor::li[contains(@id,'ContentListElement')]//div[contains(@class,'toggle icon-arrow_drop_up')]`;
    },
}

class BaseDropdown extends Page {

    get modeTogglerButton() {
        return this.container + lib.DROPDOWN_SELECTOR.MODE_TOGGLER_BUTTON;
    }

    get dropdownHandle() {
        return this.container + lib.DROPDOWN_SELECTOR.DROPDOWN_HANDLE;
    }

    get applySelectionButton() {
        return this.container + lib.DROPDOWN_SELECTOR.APPLY_SELECTION_BUTTON;
    }

    get optionsFilterInput() {
        return this.container + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    waitForOptionFilterInputDisplayed(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        return this.waitForElementDisplayed(this.optionsFilterInput, appConst.mediumTimeout);
    }

    async waitForOptionFilterInputDisabled(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(parentLocator + this.optionsFilterInput, 'class');
            return result.includes('disabled');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Options Filter input should be disabled'});
    }

    async clickOnModeTogglerButton(parentElement) {
        await this.waitForElementDisplayed(parentElement + this.modeTogglerButton);
        return await this.clickOnElement(parentElement + this.modeTogglerButton);
    }

    async clickOnDropdownHandle(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.waitForElementDisplayed(parentLocator + this.dropdownHandle, appConst.mediumTimeout);
        return await this.clickOnElement(parentLocator + this.dropdownHandle);
    }


    async waitForApplySelectionButtonDisplayed(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.waitUntilDisplayed(parentLocator + this.applySelectionButton, appConst.shortTimeout);
        await this.pause(200);
    }

    async clickOnApplySelectionButton(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.waitForApplySelectionButtonDisplayed(parentLocator);
        let elements = await this.getDisplayedElements(parentLocator + this.applySelectionButton);
        await elements[0].click();
        await this.pause(400);
    }

    async filterItem(text, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.waitUntilDisplayed(parentLocator + this.optionsFilterInput, appConst.mediumTimeout);
        let elements = await this.getDisplayedElements(parentLocator + this.optionsFilterInput);
        await elements[0].setValue(text);
        return await this.pause(300);
    }

    async clickOnExpanderIconInOptionsList(listItemName) {
        let locator = XPATH.expanderIconByName(listItemName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async isOptionsFilterInputDisplayed(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        try {
            return await this.waitForElementDisplayed(parentLocator + this.optionsFilterInput, appConst.shortTimeout);
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
    async clickOnFilteredByDisplayNameItem(optionDisplayName, parentLocator) {
        // parentLocator - modal dialog or wizard panel
        // 1. Insert the text in Options Filter Input:
        await this.filterItem(optionDisplayName, parentLocator);
        // 2. Wait for the required option is displayed then click on it:
        await this.clickOnOptionByDisplayName(optionDisplayName, parentLocator);
    }

    // Click on option-item by display name:
    async clickOnOptionByDisplayName(optionDisplayName, parentLocator) {
        let optionLocator = this.buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator);
        //  Wait for the required option is displayed:
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // Click on the item:
        await this.clickOnElement(optionLocator);
    }

    // 1. Insert a text in Filter input
    // 2. Click on the filtered by name item (p[contains(@class,'sub-name'))
    // 3. Click on OK button and apply the selection.
    async clickOnFilteredByNameItemAndClickOnApply(optionName, parentLocator) {
        // parent locator - it is locator for parent modal dialog or wizard form,
        // 1. type the text in Options Filter Input:
        await this.filterItem(optionName, parentLocator);
        // 3. Click on the row with the item:
        await this.clickOnOptionByName(optionName, parentLocator);
        // 4. Click on 'OK' button:
        return await this.clickOnApplySelectionButton(parentLocator);
    }

    async clickOnFilteredByNameItem(optionName, parentLocator) {
        // parent locator - it is locator for parent modal dialog or wizard form,
        // 1. type the text in Options Filter Input:
        await this.filterItem(optionName, parentLocator);
        // 3. Click on the row with the item:
        await this.clickOnOptionByName(optionName, parentLocator);
    }

    async clickOnOptionByName(name, parentLocator) {
        let optionLocator = this.buildLocatorForOptionByName(name, parentLocator);
        //  Wait for the required option is displayed:
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // Click on the item:
        await this.clickOnElement(optionLocator);
    }

    // builds a locator for clickable option in Dropdown List options:
    buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        let locator = parentLocator + this.container;
        return lib.DROPDOWN_SELECTOR.dropdownListItemByDisplayName(locator, optionDisplayName);
    }

    // builds a locator for clickable option in Dropdown List options:
    buildLocatorForOptionByName(name, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        let locator = parentLocator + this.container;
        return lib.DROPDOWN_SELECTOR.dropdownListItemByName(locator, name);
    }

    async clickOnCheckboxInDropdown(index, parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.rightCheckBoxDiv;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let result = await this.findElements(locator);
        await result[index].click();
        return await this.pause(300);
    }

    async clickOnCheckboxInDropdownByDisplayName(displayName, parentXpath) {
        if (parentXpath === undefined) {
            parentXpath = '';
        }
        let locator = parentXpath + XPATH.rightCheckboxByDisplayName(displayName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let result = await this.findElements(locator);
        await result[0].click();
        return await this.pause(300);
    }

    // tree mode if 'active' is present in @class attribute
    async getMode(xpath) {
        let attr = await this.getAttribute(xpath + this.modeTogglerButton, 'class');
        //return attr.includes('active') ? 'tree' : 'flat';
        return attr.includes('folder-closed') ? 'flat' : 'tree';
    }

    async getSelectedOptionsDisplayName() {
        let locator = this.container + "//li[contains(@class,'item-view-wrapper') and contains(@class,'selected')]" + lib.H6_DISPLAY_NAME;
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
        let result = await Promise.all(pr);
        return result;
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
