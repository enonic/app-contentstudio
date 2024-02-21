/**
 * Created on 09.07.2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');

class BaseSelectorForm extends Page {

    get selectorValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    async getSelectorValidationMessage() {
        try {
            let locator = lib.CONTENT_WIZARD_STEP_FORM + this.selectorValidationRecording;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getText(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_validation_message');
            throw new Error("Validation message should be displayed in the form, screenshot:" + screenshot + ' ' + err);
        }
    }

    async waitForSelectorValidationMessageNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.selectorValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Selector Validation recording should not be displayed"});
    }

    //Selects an option by the display name
    async selectOption(optionDisplayName) {
        try {
            let loaderComboBox = new LoaderComboBox();
            await this.typeTextInInput(this.optionsFilterInput, optionDisplayName);
            await loaderComboBox.selectOption(optionDisplayName);
            return await loaderComboBox.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_combobox');
            throw new Error("Error in loader combobox, screenshot:" + screenshot + " " + err)
        }
    }

    async clearOptionsFilterInput(){
        await this.clearTextInput(this.optionsFilterInput);
        await this.pause(1000);
    }

    async typeTextInOptionsFilterInput(text) {
        await this.typeTextInInput(this.optionsFilterInput, text);
        return await this.pause(500);
    }

    //Selects an option by the name
    async selectOptionByName(optionName) {
        let loaderComboBox = new LoaderComboBox();
        await this.typeTextInInput(this.optionsFilterInput, optionName);
        await loaderComboBox.selectOptionByName(optionName);
        return await loaderComboBox.pause(300);
    }

    async swapOptions(sourceName, destinationName) {
        let sourceLocator = this.selectedOptionByDisplayName(sourceName);
        let destinationLocator = this.selectedOptionByDisplayName(destinationName);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destinationLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    isOptionFilterDisplayed() {
        return this.isElementDisplayed(this.optionsFilterInput);
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(lib.EMPTY_OPTIONS_DIV, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_empty_opt');
            throw new Error("Empty options text is not visible, screenshot: " + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayName() {
        try {
            let loaderComboBox = new LoaderComboBox();
            let optionsLocator = "//div[contains(@id,'Grid') and contains(@class,'options-container')]" + lib.SLICK_ROW +
                                 lib.H6_DISPLAY_NAME;
            await loaderComboBox.waitForElementDisplayed(optionsLocator, appConst.mediumTimeout);
            return await loaderComboBox.getOptionDisplayNames();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error("Error occurred in the dropdown selector, screenshot: " + screenshot + ' ' + err);
        }
    }

    async clickOnApplyButton() {
        try {
            let loaderComboBox = new LoaderComboBox();
            await loaderComboBox.clickOnApplyButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_apply_btn');
            throw new Error("Loader combobox, Apply button, screenshot: " + screenshot + ' ' + err);
        }
    }

    async clickOnEditSelectedOption(optionDisplayName) {
        let locator = `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${optionDisplayName}']]` +
                      lib.EDIT_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }
}

module.exports = BaseSelectorForm;
