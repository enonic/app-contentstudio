/**
 * Created on 25.12.2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    removeButton: "//button[@class='remove-button']",
    hideDetailsButton: "//button[contains(@id,'TogglerButton') and child::span[text()='Hide details']]",
    showDetailsButton: "//button[contains(@id,'TogglerButton') and child::span[text()='Show details']]",
    validationBlock: "//div[contains(@class,'validation-block')]",
};

class OccurrencesFormView extends Page {

    get formValidationRecording() {
        return lib.FORM_VIEW + lib.INPUT_VALIDATION_VIEW;
    }

    get hideDetailsButton() {
        return lib.FORM_VIEW + XPATH.validationBlock + XPATH.hideDetailsButton;
    }

    get showDetailsButton() {
        return lib.FORM_VIEW + XPATH.validationBlock + XPATH.showDetailsButton;
    }

    get inputOccurrenceErrorRecording() {
        return lib.FORM_VIEW + lib.OCCURRENCE_ERROR_BLOCK;
    }

    get addButton() {
        return lib.FORM_VIEW + lib.BUTTONS.ADD_BUTTON;
    }

    get removeButton() {
        return lib.FORM_VIEW + XPATH.removeButton;
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
        return this.waitUntilDisplayed(this.addButton, appConst.mediumTimeout);
    }

    waitForRemoveButtonDisplayed() {
        return this.waitUntilDisplayed(this.removeButton, appConst.mediumTimeout);
    }

    waitForRemoveButtonNotDisplayed() {
        this.waitForElementNotDisplayed(this.removeButton, appConst.mediumTimeout);
    }

    waitForAddButtonNotDisplayed() {
        this.waitForElementNotDisplayed(this.addButton, appConst.mediumTimeout);
    }

    async clickOnAddButton() {
        await this.waitForAddButtonDisplayed();
        let result = await this.getDisplayedElements(this.addButton);
        return await result[0].click();
    }

    async waitForRedBorderInInput(index, inputLocator) {
        let inputs = await this.getDisplayedElements(inputLocator);
        await this.getBrowser().waitUntil(async () => {
            let result = await inputs[index].getAttribute('class');
            return result.includes('invalid');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Attribute class  does not contain the value:invalid"});
    }

    async waitForRedBorderNotDisplayedInInput(index, inputLocator) {
        let inputs = await this.getDisplayedElements(inputLocator);
        await this.getBrowser().waitUntil(async () => {
            let result = await inputs[index].getAttribute('class');
            return !result.includes('invalid');
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Attribute class still contain the value:invalid"});
    }
}

module.exports = OccurrencesFormView;
