/**
 * Created on 08.01.2024
 */
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const Page = require('../page');
const XPATH = {
    rightCheckBoxDiv:"//li[contains(@class,'checkbox-right')]//div[contains(@id,'Checkbox')]"
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

    async waitForApplySelectionButtonDisplayed() {
        return this.waitForElementDisplayed(this.applySelectionButton, appConst.mediumTimeout);
    }

    async clickOnApplySelectionButton() {
        await this.waitForApplySelectionButtonDisplayed(this.applySelectionButton, appConst.mediumTimeout);
        await this.clickOnElement(this.applySelectionButton);
        await this.pause(300);
    }

    async filterItem(optionDisplayName) {
        await this.waitForElementDisplayed(this.optionsFilterInput, appConst.longTimeout);
        await this.typeTextInInput(this.optionsFilterInput, optionDisplayName);
    }

    async clickOnFilteredItemAndClickOnOk(optionDisplayName, parentLocator) {
        // parent locator - it is locator for parent modal dialog or wizard form,
        let parent = parentLocator === undefined ? '' : parentLocator;
        let locator = parent + this.container;
        let optionSelector = lib.dropdownListItemRowByDisplayName(locator, optionDisplayName);
        // 1. type the text in Options Filter Input:
        await this.filterItem(optionDisplayName);
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
