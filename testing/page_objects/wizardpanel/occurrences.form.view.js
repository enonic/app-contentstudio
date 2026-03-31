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
};

class OccurrencesFormView extends Page {

    get formValidationRecording() {
        return COMMON.INPUTS.FORM_RENDERER_DATA_COMPONENT + COMMON.INPUTS.VALIDATION_RECORDING;
    }

    //Validation recording
    get hideDetailsButton() {
        return lib.FORM_VIEW + XPATH.validationBlock + XPATH.hideDetailsButton;
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

    waitForShowDetailsButtonDisplayed() {
        return this.waitUntilDisplayed(this.showDetailsButton, appConst.mediumTimeout);
    }

    waitForShowDetailsButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.showDetailsButton, appConst.mediumTimeout);
    }

    waitForHideDetailsButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.hideDetailsButton, appConst.mediumTimeout);
    }

    waitForHideDetailsButtonDisplayed() {
        return this.waitUntilDisplayed(this.hideDetailsButton, appConst.mediumTimeout);
    }

    async clickOnShowDetailsButton() {
        await this.waitForShowDetailsButtonDisplayed();
        return await this.clickOnElement(this.showDetailsButton);
    }

    async clickOnHideDetailsButton() {
        await this.waitForHideDetailsButtonDisplayed();
        return await this.clickOnElement(this.hideDetailsButton);
    }

    async clickOnLastRemoveButton() {
        await this.waitForRemoveButtonDisplayed();
        let removeElements = await this.getDisplayedElements(this.removeButton);
        return await removeElements[removeElements.length - 1].click();
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

    // async waitForOccurrenceValidationRecordingDisplayed(index, expectedMessage) {
    //     try {
    //         await this.getBrowser().waitUntil(async () => {
    //             let elements = await this.findElements(this.inputOccurrenceErrorRecording);
    //             if (elements.length <= index) {
    //                 return false;
    //             }
    //             let text = await elements[index].getText();
    //             return text === expectedMessage;
    //         }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Occurrence Validation recording should be displayed'});
    //     } catch (err) {
    //         await this.handleError('Occurrence Validation recording should be displayed', 'err_occurrence_valid_recording', err);
    //     }
    // }

    async waitForOccurrenceValidationRecordingNotDisplayedAt(index) {
        try {
            let occurrenceSelector = `(${COMMON.INPUTS.OCCURRENCES_DATA_COMPONENT}//div[contains(@class,'w-full')])[${index + 1}]`;
            let errorSelector = occurrenceSelector + "//div[contains(@class,'text-error')]";
            return await this.waitForElementNotDisplayed(errorSelector);
        } catch (err) {
            await this.handleError('Occurrence Validation record should not be displayed', 'err_occurrence_valid_recording', err);
        }
    }
    async waitForOccurrenceValidationRecordingDisplayedAt(index, expectedMessage) {
        try {
            let occurrenceSelector = `(${COMMON.INPUTS.OCCURRENCES_DATA_COMPONENT}//div[contains(@class,'w-full')])[${index + 1}]`;
            let errorSelector = occurrenceSelector + "//div[contains(@class,'text-error')]";
            await this.getBrowser().waitUntil(async () => {
                let elements = await this.findElements(errorSelector);
                if (elements.length === 0) {
                    return false;
                }
                let text = await elements[0].getText();
                return text === expectedMessage;
            }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Occurrence Validation recording should be displayed'});
        } catch (err) {
            await this.handleError('Occurrence Validation recording should be displayed', 'err_occurrence_valid_recording', err);
        }
    }

    async getOccurrenceValidationRecording(index) {
        try {
            let elements = await this.findElements(this.inputOccurrenceErrorRecording);
            if (elements.length === 0) {
                throw new Error('occurrences form - Element was not found:' + this.inputOccurrenceErrorRecording);
            }
            return await elements[index].getText();
        } catch (err) {
            await this.handleError('Occurrence Validation record', 'err_occurrence_valid_recording', err);
        }
    }

    waitForAddButtonDisplayed() {
        return this.waitUntilDisplayed(this.addButton);
    }

    waitForRemoveButtonDisplayed() {
        return this.waitUntilDisplayed(this.removeButton);
    }

    waitForRemoveButtonNotDisplayed() {
        this.waitForElementNotDisplayed(this.removeButton);
    }

    async waitForAddButtonNotDisplayed() {
        await this.waitForElementNotDisplayed(this.addButton);
    }

    async clickOnAddButton() {
        await this.waitForAddButtonDisplayed();
        let result = await this.getDisplayedElements(this.addButton);
        return await result[0].click();
    }

}

module.exports = OccurrencesFormView;
