/**
 * Created on 12.04.2019. updated on 12.06.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const {BUTTONS, COMMON} = require('../../../libs/elements');

const xpath = {
    itemSet: "//div[@data-component='ItemSetView']",
    // nested 'Input' item set (holds the Add button and occurrences)
    inputSetView: "//div[@data-component='ItemSetView' and child::div[@data-component='SetHeader']//span[text()='Input']]",
    elementTypeSetView: "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='element type']]",
    inputTypeSetView: "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='input type']]",
    contextMenuTrigger: "//div[@data-component='ContextMenu.Trigger']",
};

class FreeFormView extends Page {

    get addButton() {
        return xpath.inputSetView + BUTTONS.buttonAriaLabel('Add');
    }

    waitForAddButtonDisplayed() {
        return this.waitForElementDisplayed(this.addButton, appConst.mediumTimeout);
    }

    async clickOnAddButton() {
        try {
            await this.waitForAddButtonDisplayed();
            await this.pause(300);
            await this.scrollAndClickOnElement(this.addButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Free form - 'Add' button in the 'Input' item set`, 'err_add_btn_nested_set', err);
        }
    }

    // Clicks on a radio button('text', 'image', etc.) in the 'input type' single-select option set:
    async selectInputType(inputTypeName) {
        await this.scrollPanel(800);
        await this.pause(300);
        let locator = xpath.inputTypeSetView + COMMON.INPUTS.dataComponentRadioByLabel(inputTypeName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(200);
    }

    async clickOnItemSetOccurrenceHeader(index) {
        let locator = xpath.itemSet + "//button[@aria-expanded]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let items = await this.findElements(locator);
        await items[index].click();
        return await this.pause(300);
    }

    // Clicks on a radio button('Input', 'Button', 'Select') in the 'element type' option set in the occurrence with the given index:
    async selectElementType(optionDisplayName, occurrenceIndex) {
        let locator = xpath.elementTypeSetView + COMMON.INPUTS.dataComponentRadioByLabel(optionDisplayName);
        await this.waitUntilDisplayed(locator, appConst.mediumTimeout);
        let radioElements = await this.getDisplayedElements(locator);
        if (radioElements.length === 1) {
            await radioElements[0].click();
        } else {
            await radioElements[occurrenceIndex].click();
        }
        return await this.pause(300);
    }
}

module.exports = FreeFormView;
