/**
 * Created on 25.12.2017.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const {COMMON, BUTTONS} = require('../../libs/elements');
const XPATH = {
    removeButton: "//button[@class='remove-button']",
    hideDetailsButton: "//button[contains(@id,'TogglerButton') and child::span[text()='Hide details']]",
    showDetailsButton: "//button[contains(@id,'TogglerButton') and child::span[text()='Show details']]",
    validationBlock: "//div[contains(@class,'validation-block')]",
    // v6 SortableGridList layout: an occurrence row is any direct child div that holds an Input.
    // Matches both draggable rows (role='button') and single non-draggable rows; skips Dnd helper divs.
    sortableOccurrence: "//div[@data-component='SortableGridList']/div[descendant::div[@data-component='Input']]",
};

class OccurrencesFormView extends Page {

    get formValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    // Validation recording
    get showDetailsButton() {
        return lib.FORM_VIEW + XPATH.validationBlock + XPATH.showDetailsButton;
    }

    get inputOccurrenceErrorRecording() {
        return COMMON.INPUTS.OCCURRENCES_DATA_COMPONENT + "//div[contains(@class,'text-error')]";
    }

    get addButton() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + BUTTONS.buttonByLabel('Add');
    }

    get removeButton() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + BUTTONS.buttonAriaLabel('Remove occurrence');
    }

    async clickOnLastRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        let removeElements = await this.getDisplayedElements(this.removeButton);
        return await removeElements[removeElements.length - 1].click();
    }

    async clickOnRemoveButton(index) {
        try {
            await this.waitForRemoveButtonDisplayed();
            let removeElements = await this.getDisplayedElements(this.removeButton);
            return await removeElements[index].click();
        } catch (err) {
            await this.handleError('Remove button should be displayed', 'err_click_remove_button', err);
        }
    }

    async waitForFormValidationRecordingDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length > 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Form Validation recording should be displayed'});
    }

    async getFormValidationRecording() {
        await this.waitForFormValidationRecordingDisplayed();
        let recordingElements = await this.getDisplayedElements(this.formValidationRecording);
        return await recordingElements[0].getText();
    }

    async waitForFormValidationRecordingNotDisplayed() {
        await this.getBrowser().waitUntil(async () => {
            let elements = await this.getDisplayedElements(this.formValidationRecording);
            return elements.length === 0;
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Form Validation recording should not be displayed'});
    }

    async waitForOccurrenceValidationRecordingNotDisplayedAt(index) {
        try {
            let errorSelector = await this.getOccurrenceErrorSelectorAt(index);
            return await this.waitForElementNotDisplayed(errorSelector);
        } catch (err) {
            await this.handleError('Occurrence Validation record should not be displayed', 'err_occurrence_valid_recording', err);
        }
    }

    // Builds the validation-message selector for the occurrence at the given index, supporting both
    // the multi-occurrence (SortableGridList rows) and single-occurrence (Input) layouts.
    async getOccurrenceErrorSelectorAt(index) {
        let sortableRows = await this.findElements(XPATH.sortableOccurrence);
        let occurrenceSelector = sortableRows.length > 0
                                 ? `(${XPATH.sortableOccurrence})[${index + 1}]`
                                 : `(${COMMON.INPUTS.OCCURRENCES_DATA_COMPONENT}${COMMON.INPUTS.DATA_COMPONENT_INPUT})[${index + 1}]`;
        return occurrenceSelector + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    async waitForOccurrenceValidationRecordingDisplayedAt(index, expectedMessage) {
        try {
            let errorSelector = await this.getOccurrenceErrorSelectorAt(index);
            await this.getBrowser().waitUntil(async () => {
                let elements = await this.findElements(errorSelector);
                if (elements.length === 0) {
                    return false;
                }
                let text = await elements[0].getText();
                return text === expectedMessage;
            }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Occurrence Validation recording should be displayed'});
        } catch (err) {
            await this.handleError(`Occurrence Validation recording should be displayed: ${expectedMessage} `, 'err_occur_valid_recording',
                err);
        }
    }

    async waitForAddButtonDisplayed() {
        return await this.waitUntilDisplayed(this.addButton);
    }

    waitForRemoveButtonDisplayed() {
        return this.waitUntilDisplayed(this.removeButton);
    }

    async waitForRemoveButtonNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(this.removeButton);
        } catch (err) {
            await this.handleError('Remove button should not be displayed', 'err_remove_button_not_displayed', err);
        }
    }

    async waitForAddButtonNotDisplayed() {
        await this.waitForElementNotDisplayed(this.addButton);
    }

    async clickOnAddButton() {
        try {
            await this.waitForAddButtonDisplayed();
            let result = await this.getDisplayedElements(this.addButton);
            await result[0].click();
            await this.pause(300);
        } catch (err) {
            await this.handleError('Add button should be displayed', 'err_click_add_button', err);
        }
    }

}

module.exports = OccurrencesFormView;
