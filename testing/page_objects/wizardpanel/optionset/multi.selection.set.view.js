/**
 * Created on 23.01.2019.
 */
const Page = require('../../page');
const lib = require('../../../libs/elements-old');
const appConst = require('../../../libs/app_const');
const HtmlAreaForm = require('../htmlarea.form.panel');
const xpath = {
    container: "//div[contains(@id,'FormView')]//div[contains(@id,'FormOptionSetView') and descendant::h5[text()='Multi selection']]",
    validationMessage: "//div[contains(@class,'selection-message')]",
    nameTextInput: "//div[contains(@id,'InputView') and descendant::div[text()='Name']]" + lib.TEXT_INPUT,
    optionSetOccurrenceLabel: "//div[contains(@id,'FormOccurrenceDraggableLabel')]",
    multiOptionsView: "//div[contains(@id,'FormOptionSetOccurrenceViewMultiOptions')]",
    optionLabelLocator: option => `//div[contains(@id,'FormOptionSetOptionView') and descendant::span[text()='${option}']]//label`,
    optionCheckboxLocator:
        option => `//div[contains(@id,'FormOptionSetOptionView') and descendant::span[text()='${option}']]//input[@type='checkbox']`
};

//Page Object for Custom option set
class MultiSelectionOptionSet extends Page {

    get nameTextInput() {
        return xpath.container + xpath.nameTextInput;
    }

    get addItemSetButton() {
        return xpath.container + xpath.addItemSetButton;
    }

    async clickOnOption(option) {
        let locator = xpath.optionLabelLocator(option);
        //await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.waitForOptionCheckboxEnabled(option);
        await this.clickOnElement(locator);
        return this.pause(300);
    }

    async waitForOptionCheckboxEnabled(option) {
        try {
            let locator = xpath.optionLabelLocator(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_multi_select_option"));
            throw new Error("Option Set multi selection: " + err);
        }
    }

    async waitForOptionCheckboxDisabled(option) {
        try {
            let locator = xpath.optionLabelLocator(option);
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.waitForElementDisabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName("err_multi_select_enabled"));
            throw new Error("Option Set multi selection: " + err);
        }
    }

    async getMultiSelectionTitle() {
        let locator = xpath.container + xpath.optionSetOccurrenceLabel;
        let result = await this.getText(locator);
        let tittle = result.split("\n");
        return tittle[0].trim();
    }

    async getMultiSelectionSubtitle() {
        let locator = xpath.container + xpath.optionSetOccurrenceLabel + "//p[@class='note']";
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
        let locator = "//div[contains(@id,'FormOptionSetOptionView') and descendant::span[text()='Option 1']]//button[child::span[text()='Add']]";
        await this.waitForElementEnabled(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        return await this.pause(300);
    }

    async getValidationRecording() {
        let locator = xpath.container + xpath.multiOptionsView + "//div[@class='selection-message']";
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    waitForValidationRecordingNotDisplayed() {
        let locator = xpath.container + xpath.multiOptionsView + "//div[@class='selection-message']";
        return this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    async typeTextInHtmlAreaInOption3(index, text) {
        let htmlAreaForm = new HtmlAreaForm();
        return await htmlAreaForm.insertTextInHtmlArea(index, text);
    }

    async showToolbarInHtmlArea(index) {
        let htmlAreaForm = new HtmlAreaForm();
        return await htmlAreaForm.showToolbar(index);
    }

    async showToolbarAndClickOnInsertImageButton() {
        let htmlAreaForm = new HtmlAreaForm();
        return await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
    }
}

module.exports = MultiSelectionOptionSet;
