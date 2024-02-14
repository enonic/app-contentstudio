/**
 * Created on 08.01.2024
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const Page = require('../page');
const XPATH = {
    rightCheckBoxDiv: "//li[contains(@class,'checkbox-right')]//div[contains(@id,'Checkbox')]"
}

class BasDropdown extends Page {

    get modeTogglerButton() {
        return this.container + lib.COMBOBOX.MODE_TOGGLER_BUTTON;
    }

    get dropdownHandle() {
        return this.container + lib.DROP_DOWN_HANDLE;
    }

    get applySelectionButton() {
        return this.container + lib.COMBOBOX.APPLY_SELECTION_BUTTON;
    }

    get optionsFilterInput() {
        return this.container + lib.OPTION_FILTER_INPUT;
    }

    waitForOptionFilterInputDisplayed() {
        return this.waitForElementDisplayed(appConst.mediumTimeout);
    }

    clickOnModeTogglerButton() {
        return this.clickOnElement(this.modeTogglerButton);
    }

    async waitForApplySelectionButtonDisplayed(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        return await this.waitForElementDisplayed(parentLocator + this.applySelectionButton, appConst.mediumTimeout);
    }

    async clickOnApplySelectionButton(parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.waitForApplySelectionButtonDisplayed(parentLocator);
        await this.clickOnElement(parentLocator + this.applySelectionButton);
        await this.pause(300);
    }

    async filterItem(optionDisplayName, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        await this.waitForElementDisplayed(parentLocator + this.optionsFilterInput, appConst.longTimeout);
        await this.typeTextInInput(parentLocator + this.optionsFilterInput, optionDisplayName);
    }

    async clickOnFilteredItemAndClickOnOk(optionDisplayName, parentLocator) {
        try {
            // parentLocator - modal dialog or wizard panel
            // 1. type the text in Options Filter Input:
            await this.filterItem(optionDisplayName, parentLocator);
            // 2. Wait for the required option is displayed then click on it:
            await this.clickOnFilteredItem(optionDisplayName, parentLocator);
            // 3. Click on 'OK' button:
            return await this.clickOnApplySelectionButton(parentLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combobox');
            throw new Error("Error occurred in Combobox, screenshot: " + screenshot + '  ' + err);
        }
    }

    buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator) {
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        let locator = parentLocator + this.container;
        return lib.dropdownListItemByDisplayName(locator, optionDisplayName);
    }

    async clickOnFilteredItem(optionDisplayName, parentLocator) {
        try {
            let optionLocator = this.buildLocatorForOptionByDisplayName(optionDisplayName, parentLocator);
            //  Wait for the required option is displayed:
            let res = await this.getDisplayedElements(optionLocator);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            // Click on the item:
            await this.clickOnElement(optionLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combo');
            throw new Error("Error occurred in Combobox, screenshot:" + screenshot + ' ' + err)
        }
    }

    async clickOnFilteredByNameItemAndClickOnOk(optionName, parentLocator) {
        // parent locator - it is locator for parent modal dialog or wizard form,
        if (parentLocator === undefined) {
            parentLocator = '';
        }
        let locator = parentLocator + this.container;
        let optionSelector = lib.dropdownListItemRowByName(locator, optionName);
        // 1. type the text in Options Filter Input:
        await this.filterItem(optionName);
        // 2. Wait for the required option is displayed:
        await this.waitForElementDisplayed(optionSelector, appConst.mediumTimeout);
        // 3. Click on the row:
        await this.clickOnElement(optionSelector);
        return await this.clickOnApplySelectionButton();
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
}

module.exports = BasDropdown;
