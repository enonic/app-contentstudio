/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const xpath = {
    container: "//div[contains(@id,'FormOptionSetOccurrenceView') and contains(@class,'single-selection')]",
    nameTextInput: "//div[contains(@id,'InputView') and descendant::div[text()='Name']]" + lib.TEXT_INPUT,
    addItemSetButton: "//button[contains(@id,'Button') and @title='Add My Item-set']",
    itemSetOccurrenceMenuButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//button[contains(@id,'MoreButton')]",
    optionSetMenuButton: "//div[contains(@class,'single-selection-header selected')]" + "//button[contains(@id,'MoreButton')]",
    labelInput: "//div[contains(@id,'FormItemSetOccurrenceView')]//input[contains(@name,'label')]",
    itemSetOccurrenceMenuItems: "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//li[contains(@id,'MenuItem')]",
    itemSetOccurrenceDeleteMenuItem: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Delete']",
    itemSetOccurrenceAddAboveMenuItem: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Add above']",
    itemSetOccurrenceAddBelowMenuItem: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Add below']",
    optionSetOccurrenceLabel: "//div[contains(@id,'FormOccurrenceDraggableLabel')]",
    singleOptionView: "//div[contains(@id,'FormOptionSetOccurrenceViewSingleOption')]",
};

class SingleSelectionOptionSet extends Page {

    // Single selection, Option 1, name input:
    get nameTextInput() {
        return xpath.container + xpath.nameTextInput;
    }

    get dropDownHandle() {
        return xpath.container + lib.DIV.DROPDOWN_DIV + lib.DROP_DOWN_HANDLE;
    }

    get addItemSetButton() {
        return xpath.container + xpath.addItemSetButton;
    }

    get removeItemSetOccurrenceButton() {
        return xpath.container + xpath.removeItemSetOccurrenceButton;
    }

    async typeTextInOptionNameInput(name) {
        await this.typeTextInInput(this.nameTextInput, name);
        return await this.pause(300);
    }

    async typeInLabelInput(text, index) {
        let selector = xpath.container + "//div[contains(@id,'TextLine')]//input[contains(@name,'label')]";
        if (typeof index === 'undefined') {
            await this.typeTextInInput(selector, text);
        } else {
            let result = await this.findElements(selector);
            await result[index].setValue(text);
        }
        return await this.pause(300);
    }

    async clickOnAddItemSetButton() {
        try {
            await this.waitForElementEnabled(this.addItemSetButton, appConst.mediumTimeout);
            await this.clickOnElement(this.addItemSetButton);
            return await this.pause(400);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_add_button'));
            throw new Error(err);
        }
    }

    async expandMenuClickOnDelete(index) {
        let locator = xpath.itemSetOccurrenceMenuButton;
        let menuButtons = await this.findElements(locator);
        await this.getBrowser().elementClick(menuButtons[index].elementId);
        await this.pause(400);
        let res = await this.getDisplayedElements(
            "//div[contains(@id,'FormItemSetOccurrenceView')]" + "//li[contains(@id,'MenuItem') and text()='Delete']");
        await res[0].waitForEnabled({timeout: appConst.shortTimeout, timeoutMsg: "Option Set - Delete menu item should be enabled!"});
        await res[0].click();
        return await this.pause(300);
    }

    // Clicks on 'More' button then clicks on a menu item (Reset,Delete, Add above)
    async expandOptionSetMenuAndClickOnMenuItem(index, menuItem) {
        let menuLocator = xpath.optionSetMenuButton;
        let menuButtons = await this.findElements(menuLocator);
        // 1. Clicking on More button:
        await menuButtons[index].click();
        await this.pause(400);
        // 2. Select a menu-item
        let res = await this.getDisplayedElements(
            "//div[contains(@id,'FormOptionSetOccurrenceView')]" + `//li[contains(@id,'MenuItem') and text()='${menuItem}']`);
        await res[0].click();
        return await this.pause(1000);
    }

    async selectOption(option) {
        try {
            await this.waitForElementDisplayed(this.dropDownHandle, appConst.mediumTimeout);
            await this.clickOnElement(this.dropDownHandle);
            let optionLocator = xpath.container + lib.itemByDisplayName(option);
            await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
            await this.clickOnElement(optionLocator);
            return await this.pause(500);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_optionset");
            await this.saveScreenshot(screenshot);
            throw new Error('Error,after selecting the option in single selection, screenshot:' + screenshot + "  " + err);
        }
    }

    async expandItemSetMenu(index) {
        try {
            let locator = xpath.itemSetOccurrenceMenuButton;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            let menuButtons = await this.findElements(locator);
            await menuButtons[index].click();
            return await this.pause(400);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_opt_set");
            await this.saveScreenshot(screenshot);
            throw new Error("Option Set , error after expand option menu, screenshot:" + screenshot + " " + err);
        }
    }

    async isDeleteSetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.itemSetOccurrenceDeleteMenuItem);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    async isAddAboveSetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.itemSetOccurrenceAddAboveMenuItem);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    async isAddBelowSetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.itemSetOccurrenceAddBelowMenuItem);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    async isResetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.itemSetOccurrenceAddBelowMenuItem);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    async getSingleSelectionTitle() {
        let locator = xpath.container + xpath.optionSetOccurrenceLabel;
        let result = await this.getText(locator);
        let tittle = result.split("\n");
        return tittle[0].trim();
    }

    async getSingleSelectionSubtitle() {
        let locator = xpath.container + xpath.optionSetOccurrenceLabel + "//p[@class='note']";
        return await this.getText(locator);
    }

    async getItemSetLabel() {
        let locator = xpath.container + xpath.optionSetOccurrenceLabel;
        let elems = this.findElements(locator);
        let result = await this.getText(locator);
        let tittle = result.split("\n");
        return tittle[0].trim();
    }

    collapseForm() {
        return this.clickOnElement(xpath.container + xpath.optionSetOccurrenceLabel);
    }

    async getValidationRecording() {
        let locator = xpath.singleOptionView + "//div[@class='selection-message']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForValidationRecordingNotDisplayed() {
        let locator = xpath.singleOptionView + "//div[@class='selection-message']";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = SingleSelectionOptionSet;
