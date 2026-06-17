/**
 * Created on 23.01.2019. Updated on 17.06.2026
 */
const Page = require('../../page');
const {COMMON} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    addItemSetButton: "//div[@data-component='OptionSetOccurrenceBody']//button[@data-component='Button' and @aria-label='Add']",
    itemSetOccurrenceMenuButton: "//div[@data-component='ItemSetOccurrenceView']//button[@aria-label='More actions']",
    optionSetMoreMenuButton: "//div[@data-component='OptionSetOccurrenceView']//button[@aria-label='More actions']",
    labelInput: "//div[@data-component='ItemSetOccurrenceView']//input[@aria-label='Label']",
    itemSetOccurrenceMenuItems: "//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item']",
    contextMenuItem: (text) => `//div[@data-component='ContextMenu.Content']//div[@data-component='ContextMenu.Item' and child::span[text()='${text}']]`,
    setHeader: "//div[@data-component='SetHeader']",
    occurrenceBody: "//div[@data-component='OptionSetOccurrenceBody']",
};

class SingleSelectionOptionSet extends Page {

    constructor(label = 'Single selection') {
        super();
        this._container = `//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='${label}']]`;
    }

    get container() {
        return this._container;
    }

    get nameTextInput() {
        return this.container + COMMON.INPUTS.inputFieldByLabel('Name') + COMMON.INPUTS.INPUT;
    }

    get addItemSetButton() {
        return this.container + xpath.addItemSetButton;
    }

    async typeTextInOptionNameInput(name) {
        await this.typeTextInInput(this.nameTextInput, name);
        return await this.pause(300);
    }

    async typeInLabelInput(text, index) {
        let selector = this.container + xpath.labelInput;
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
            await this.handleError('Single Selection Option Set - click on Add Item Set button', 'err_add_button', err);
        }
    }

    async clickOnItemSetOccurrenceHeader(index) {
        let locator = this.container + "//div[@data-component='ItemSetOccurrenceView']//button[@aria-expanded]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let items = await this.findElements(locator);
        await items[index].click();
        return await this.pause(300);
    }

    async expandMenuClickOnDelete(index) {
        let menuButtons = await this.findElements(this.container + xpath.itemSetOccurrenceMenuButton);
        await this.getBrowser().elementClick(menuButtons[index].elementId);
        await this.pause(400);
        let res = await this.getDisplayedElements(xpath.contextMenuItem('Delete'));
        await res[0].waitForEnabled({timeout: appConst.shortTimeout, timeoutMsg: 'Option Set - Delete menu item should be enabled!'});
        await res[0].click();
        return await this.pause(300);
    }

    async expandOptionSetMenuAndClickOnMenuItem(index, menuItem) {
        await this.expandMoreMenuInSingleSelectionOptionSet(index);
        let optionLocator = this.container + xpath.contextMenuItem(menuItem);
        await this.waitForElementDisplayed(optionLocator, appConst.mediumTimeout);
        await this.clickOnElement(optionLocator);
        return await this.pause(500);
    }

    async expandMoreMenuInSingleSelectionOptionSet(index) {
        let menuLocator = this.container + xpath.optionSetMoreMenuButton;
        await this.waitForElementDisplayed(menuLocator, appConst.mediumTimeout);
        let items = await this.findElements(menuLocator);
        await items[index].click();
        await this.pause(400);
    }

    async getSelectedOption() {
        let locator = this.container + "//button[@data-component='RadioGroup.Item' and @aria-checked='true']//span";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async selectOption(optionDisplayName) {
        try {
            let locator = this.container + COMMON.INPUTS.dataComponentRadioByLabel(optionDisplayName);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Single Selection option set:', 'err_optionset', err);
        }
    }


    async isDeleteSetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.contextMenuItem('Delete'));
        let attr = await menuItemElements[0].getAttribute('aria-disabled');
        return attr === 'true';
    }

    async isAddAboveSetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.contextMenuItem('Add above'));
        let attr = await menuItemElements[0].getAttribute('aria-disabled');
        return attr === 'true';
    }

    async isAddBelowSetMenuItemDisabled() {
        let menuItemElements = await this.getDisplayedElements(xpath.contextMenuItem('Add below'));
        let attr = await menuItemElements[0].getAttribute('aria-disabled');
        return attr === 'true';
    }

    async getSingleSelectionTitle() {
        let locator = this.container + xpath.setHeader + "//span[contains(@class,'font-semibold')]";
        return await this.getText(locator);
    }

    async getSingleSelectionSubtitle() {
        let locator = this.container + xpath.setHeader + "//span[contains(@class,'text-subtle')]";
        return await this.getText(locator);
    }

    collapseForm() {
        return this.clickOnElement(this.container + xpath.setHeader + "//span[contains(@class,'font-semibold')]");
    }

    async getValidationRecording() {
        try {
            let locator = this.container + xpath.occurrenceBody + "//div[contains(@class,'text-error')]";
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('Single Selection Option Set - validation recording', 'err_validation_recording', err);
        }
    }

    waitForValidationRecordingNotDisplayed() {
        let locator = this.container + xpath.occurrenceBody + "//div[contains(@class,'text-error')]";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = SingleSelectionOptionSet;
