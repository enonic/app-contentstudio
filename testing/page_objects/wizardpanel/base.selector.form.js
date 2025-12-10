/**
 * Created on 09.07.2020.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ContentSelectorDropdown = require('../components/selectors/content.selector.dropdown');

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
            await this.handleError(`Selector form - tried to get the validation message`, 'err_validation_message', err);
        }
    }

    async waitForSelectorValidationMessageNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.selectorValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Selector Validation recording should not be displayed"});
    }

    async clearOptionsFilterInput() {
        await this.clearTextInput(this.optionsFilterInput);
        await this.pause(1000);
    }

    async typeTextInOptionsFilterInput(text) {
        await this.typeTextInInput(this.optionsFilterInput, text);
        return await this.pause(500);
    }

    async clickInOptionsFilterInput() {
        await this.clickOnElement(this.optionsFilterInput);
        return await this.pause(500);
    }

    async swapOptions(sourceName, destinationName) {
        let sourceLocator = this.selectedOptionByDisplayName(sourceName);
        let destinationLocator = this.selectedOptionByDisplayName(destinationName);
        let source1 = await this.findElements(sourceLocator);
        let source = await this.findElement(sourceLocator);
        let destination = await this.findElement(destinationLocator);
        await source.dragAndDrop(destination);
        return await this.pause(1000);
    }

    async waitForEmptyOptionsMessage() {
        try {
            return await this.waitForElementDisplayed(lib.EMPTY_OPTIONS_H5, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Dropdown Selector - 'No matching items' text should be shown`, 'err_no_match_items', err);
        }
    }

    async getOptionsDisplayName() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            return await contentSelectorDropdown.getOptionsDisplayNameInFlatMode()
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_dropdown');
            throw new Error("Error occurred in the dropdown selector, screenshot: " + screenshot + ' ' + err);
        }
    }

    async getOptionsDisplayNameInTreeMode() {
        try {
            let contentSelectorDropdown = new ContentSelectorDropdown();
            return await contentSelectorDropdown.getOptionsDisplayNameInTreeMode()
        } catch (err) {
            await this.handleError(`Error occurred in the dropdown selector`, 'err_dropdown', err);
        }
    }

    async clickOnEditSelectedOption(displayName) {
        try {
            let locator = `//div[contains(@id,'ContentSelectedOptionView') and descendant::h6[contains(@class,'main-name') and text()='${displayName}']]` +
                          lib.EDIT_ICON;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            await this.clickOnElement(locator);
        } catch (err) {
            await this.handleError(`Error during clicking on Edit icon for selected option: ${displayName}`, 'err_click_edit_icon', err);
        }
    }

    async clickOnExpanderIconInOptionsList(optionName) {
        try {
            let contentSelector = new ContentSelectorDropdown();
            return await contentSelector.clickOnExpanderIconInOptionsList(optionName);
        } catch (err) {
            await this.handleError(`Error during clicking on Expander icon for option: ${optionName}`, 'err_click_expander_icon', err);
        }
    }
}

module.exports = BaseSelectorForm;
