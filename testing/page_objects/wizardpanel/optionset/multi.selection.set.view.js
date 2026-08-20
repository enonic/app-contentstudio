/**
 * Created on 23.01.2019. Updated on 17.06.2026
 */
const Page = require('../../page');
const { BUTTONS, COMMON } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const HtmlAreaForm = require('../htmlarea.form.panel');

const xpath = {
    container:
        "//div[@data-component='OptionSetView' and child::div[@data-component='SetHeader']//span[text()='Multi selection']]",
    setHeader: "//div[@data-component='SetHeader']",
    multiOptionsView: "//div[@data-component='OptionSetOccurrenceBody']",
    // Bold label in the occurrence header, e.g. 'Option 2, Option 1' - lists the selected options:
    occurrenceItemLabel:
        "//div[@data-component='OptionSetOccurrenceView']//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold')]",
    occurrenceItemLabelContainer: "//div[@data-component='OptionSetOccurrenceView']//div[@data-component='ItemLabel']",
    validationMessage: "//div[contains(@class,'text-error')]",
    optionLabelLocator: (option) => `//div[@data-component='Checkbox' and descendant::span[text()='${option}']]//label`,
    optionCheckboxLocator: (option) =>
        `//div[@data-component='Checkbox' and descendant::span[text()='${option}']]//input[@type='checkbox']`,
};

class MultiSelectionOptionSet extends Page {
    async clickOnOption(option) {
        let locator = xpath.optionLabelLocator(option);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.waitForOptionCheckboxEnabled(option);
        await this.clickOnElement(locator);
        return this.pause(300);
    }

    async waitForOptionCheckboxEnabled(option) {
        try {
            let locator = xpath.optionCheckboxLocator(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_multi_select_option'));
            throw new Error('Option Set multi selection: ' + err);
        }
    }

    async waitForOptionCheckboxDisabled(option) {
        try {
            let locator = xpath.optionCheckboxLocator(option);
            await this.waitForElementDisplayed(locator);
            return await this.waitForElementDisabled(locator);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_multi_select_enabled'));
            throw new Error('Option Set multi selection: ' + err);
        }
    }

    async getMultiSelectionTitle() {
        let locator = xpath.container + xpath.setHeader + "//span[contains(@class,'font-semibold')]";
        return await this.getText(locator);
    }

    async getMultiSelectionItemLabel(index = 0) {
        try {
            let locator = xpath.container + xpath.occurrenceItemLabel;
            await this.waitForElementDisplayed(locator);
            let items = await this.findElements(locator);
            if (index >= items.length) {
                throw new Error(
                    `Option Set occurrence with index ${index} was not found, total occurrences: ${items.length}`,
                );
            }
            return await items[index].getText();
        } catch (err) {
            await this.handleError(
                'Option Set multi selection - get occurrence item label',
                'err_multi_select_item_label',
                err,
            );
        }
    }

    async getMultiSelectionItemLabels() {
        let locator = xpath.container + xpath.occurrenceItemLabel;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInElements(locator);
    }

    // Returns the optional secondary line under the bold label, e.g. 'Hello World!', or null when the occurrence has none:
    async getMultiSelectionItemSubLabel(index = 0) {
        try {
            let locator = xpath.container + xpath.occurrenceItemLabelContainer;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            let items = await this.findElements(locator);
            if (index >= items.length) {
                throw new Error(
                    `Option Set occurrence with index ${index} was not found, total occurrences: ${items.length}`,
                );
            }
            let subLabels = await items[index].$$('.//small');
            return subLabels.length > 0 ? await subLabels[0].getText() : null;
        } catch (err) {
            await this.handleError(
                'Option Set multi selection - get occurrence item sub label',
                'err_multi_select_item_sub_label',
                err,
            );
        }
    }

    // One entry per occurrence, null for occurrences without the secondary line:
    async getMultiSelectionItemSubLabels() {
        let locator = xpath.container + xpath.occurrenceItemLabelContainer;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        let items = await this.findElements(locator);
        let result = [];
        for (const item of items) {
            let subLabels = await item.$$('.//small');
            result.push(subLabels.length > 0 ? await subLabels[0].getText() : null);
        }
        return result;
    }

    async getMultiSelectionSubtitle() {
        let locator = xpath.container + xpath.setHeader + "//span[contains(@class,'text-subtle')]";
        return await this.getText(locator);
    }

    async isCheckboxSelected(option) {
        let locator = xpath.optionCheckboxLocator(option);
        return await this.isSelected(locator);
    }

    waitForValidationMessageDisplayed() {
        let locator = xpath.container + xpath.validationMessage;
        return this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async getValidationMessage() {
        await this.waitForValidationMessageDisplayed();
        return await this.getText(xpath.container + xpath.validationMessage);
    }

    async clickOnAddLong() {
        let locator = xpath.container + COMMON.INPUTS.inputFieldByLabel('Long') + BUTTONS.buttonAriaLabel('Add');
        await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async getValidationRecording() {
        let locator = xpath.container + xpath.multiOptionsView + "//div[contains(@class,'text-error')]";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForValidationRecordingNotDisplayed() {
        let locator = xpath.container + xpath.multiOptionsView + "//div[contains(@class,'text-error')]";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async typeTextInHtmlAreaInOption3(index, text) {
        let htmlAreaForm = new HtmlAreaForm("//div[@data-component='OptionSetView']");
        return await htmlAreaForm.insertTextInHtmlArea(index, text);
    }

    async showToolbarAndClickOnInsertImageButton() {
        let htmlAreaForm = new HtmlAreaForm("//div[@data-component='OptionSetView']");
        return await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
    }
}

module.exports = MultiSelectionOptionSet;
