/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const FilterableListBox = require('../../components/selectors/filterable.list.box');

const xpath = {
    container: "//div[contains(@id,'FormOptionSetOccurrenceViewSingleOption') and contains(@class,'single-selection')]",
    nameTextInput: "//div[contains(@id,'InputView') and descendant::label[text()='Name']]" + lib.TEXT_INPUT,
    addItemSetButton: "//button[contains(@id,'Button') and @title='Add My Item-set']",
    itemSetOccurrenceMenuButton: "//div[contains(@id,'FormItemSetOccurrenceView')]" + lib.BUTTONS.MORE_BUTTON,
    labelInput: "//div[contains(@id,'FormItemSetOccurrenceView')]//input[contains(@name,'label')]",
    itemSetOccurrenceMenuItems: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem')]",
    itemSetOccurrenceDeleteMenuItem: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Delete']",
    itemSetOccurrenceAddAboveMenuItem: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Add above']",
    itemSetOccurrenceAddBelowMenuItem: "//div[contains(@id,'FormItemSetOccurrenceView')]//li[contains(@id,'MenuItem') and text()='Add below']",
    singleSelectedOptionResetMenuItem: "//li[contains(@id,'MenuItem') and text()='Reset']",
    singleSelectedOptionDeleteMenuItem: "//li[contains(@id,'MenuItem') and text()='Delete']",
    singleSelectedOptionAddAboveMenuItem: "//li[contains(@id,'MenuItem') and text()='Add above']",
    optionSetOccurrenceLabel: "//div[contains(@id,'FormOccurrenceDraggableLabel')]",
    singleOptionView: "//div[contains(@id,'FormOptionSetOccurrenceViewSingleOption')]",
};

class SingleSelectionOptionSet extends Page {

    // Single selection, Option 1, name input:
    get nameTextInput() {
        return xpath.container + xpath.nameTextInput;
    }

    get moreButton() {
        return xpath.container + lib.BUTTONS.MORE_BUTTON;
    }

    get optionsFilterInput() {
        return xpath.container + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get dropDownHandle() {
        return xpath.container + lib.DIV.DROPDOWN_DIV + lib.DROP_DOWN_HANDLE;
    }

    get addItemSetButton() {
        return xpath.container + xpath.addItemSetButton;
    }

    async typeTextInOptionsFilterInput(text) {
        await this.waitForElementDisplayed(this.optionsFilterInput, appConst.mediumTimeout);
        await this.typeTextInInput(this.optionsFilterInput, text);
        return await this.pause(300);
    }

    // Type a text in the Input name. This is an item from 'Option 1' in the single selection option-set
    async typeTextInOptionNameInput(name) {
        await this.typeTextInInput(this.nameTextInput, name);
        return await this.pause(300);
    }

    // Label text input is an item from 'Option 1'
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
            await this.handleError('Single Selection Option Set - Add Item-set button', 'err_add_button', err);
        }
    }

    // Clicks on 'More' button in Item Set in Single Selection then clicks on 'Delete' menu item
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
        // 1. click on More menu button, expand the dropdown:
        await this.expandMoreMenuInSingleSelectionOptionSet(index);
        let optionLocator = xpath.singleOptionView + `//li[contains(@id,'MenuItem') and text()='${menuItem}']`;
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        // 2. Click on the menu-item
        await this.clickOnElement(optionLocator);
        return await this.pause(500);
    }

    async expandMoreMenuInSingleSelectionOptionSet(index) {
        try {
            await this.waitForElementDisplayed(this.moreButton, appConst.mediumTimeout);
            let items = await this.findElements(this.moreButton);
            await items[index].click();
            await this.pause(400);
        } catch (err) {
            await this.handleError('Option Set , single selection, More button', 'err_more_button', err);
        }
    }

    async isDeleteMenuItemInSingleSelectedOptionDisabled() {
        let locator = xpath.container + xpath.singleSelectedOptionDeleteMenuItem;
        let menuItemElements = await this.getDisplayedElements(locator);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    async isResetMenuItemInSingleSelectedOptionDisabled() {
        let locator = xpath.container + xpath.singleSelectedOptionResetMenuItem;
        let menuItemElements = await this.getDisplayedElements(locator);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    async isAddAboveMenuItemInSingleSelectedOptionDisabled() {
        let locator = xpath.container + xpath.singleSelectedOptionAddAboveMenuItem;
        let menuItemElements = await this.getDisplayedElements(locator);
        let res = await menuItemElements[0].getAttribute('class');
        return res.includes('disabled');
    }

    // Expands the selector and clicks on the option
    async selectOption(optionDisplayName) {
        try {
            let filterableListBox = new FilterableListBox();
            await filterableListBox.clickOnDropdownHandle(xpath.container);
            await filterableListBox.clickOnOptionByDisplayName(optionDisplayName);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Error after selecting the option in single selection', 'err_single_selection_select_option', err);
        }
    }

    async filterAndSelectOption(option) {
        try {
            let filterableListBox = new FilterableListBox();
            await filterableListBox.clickOnFilteredByDisplayNameItem(option);
            return await this.pause(100);
        } catch (err) {
            await this.handleError('Error during filtering and selecting the option in single selection', 'err_filter_select_option', err);
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
            await this.handleError('Option Set Single Selection , error after expand option menu', 'err_opt_set', err);
        }
    }

    async getOccurrenceViewMenuItems() {
        let locator = xpath.container + xpath.itemSetOccurrenceMenuItems;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
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
        try {
            let locator = xpath.singleOptionView + "//div[@class='selection-message']";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Validation recording in Single Selection Option Set', 'err_get_validation_recording', err);
        }
    }

    waitForValidationRecordingNotDisplayed() {
        let locator = xpath.singleOptionView + "//div[@class='selection-message']";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = SingleSelectionOptionSet;
