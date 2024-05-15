/**
 * Created on 02.08.2019.
 */
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const Page = require('../page');
const XPATH = {
    container: "//div[contains(@id,'DateTimeRange')]",
    onlineFromDateTime: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online from']]//input[contains(@id,'TextInput')]",
    onlineFromPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online from']]//div[contains(@id,'DateTimePickerPopup')]",
    onlineToPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online to']]//div[contains(@id,'DateTimePickerPopup')]",
    onlineToDateTime: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online to']]//input[contains(@id,'TextInput')]",
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

// ScheduleWizardStepForm, DateTimeRange form
class DateTimeRange extends Page {

    constructor(xpath) {
        super();
        this.parentContainer = xpath === undefined ? '' : xpath;
    }

    get onlineFromDateTimeInput() {
        return this.parentContainer + XPATH.container + XPATH.onlineFromDateTime;
    }

    get onlineToDateTimeInput() {
        return this.parentContainer + XPATH.container + XPATH.onlineToDateTime;
    }

    get validationRecord() {
        return this.parentContainer + lib.FORM_VIEW + lib.OCCURRENCE_ERROR_BLOCK;
    }

    clearOnlineFrom() {
        return this.clearTextInput(this.parentContainer + this.onlineFromDateTimeInput);
    }

    async showOnlineToPickerPopup() {
        await this.clickOnElement(this.onlineToDateTimeInput);
        return await this.pause(300);
    }

    async showOnlineFromPickerPopup() {
        await this.clickOnElement(this.onlineFromDateTimeInput);
        return await this.pause(300);
    }

    typeOnlineFrom(value) {
        return this.typeTextInInput(this.onlineFromDateTimeInput, value);
    }

    waitForOnlineToInputDisplayed() {
        return this.waitForElementDisplayed(this.onlineToDateTimeInput, appConst.mediumTimeout);
    }

    waitForOnlineFromInputDisplayed() {
        return this.waitForElementDisplayed(this.onlineFromDateTimeInput, appConst.mediumTimeout);
    }

    async getOnlineFrom() {
        await this.waitForOnlineFromInputDisplayed();
        await this.pause(300);
        return await this.getTextInInput(this.onlineFromDateTimeInput);
    }

    getOnlineTo() {
        return this.getTextInInput(this.onlineToDateTimeInput);
    }

    typeOnlineTo(value) {
        return this.typeTextInInput(this.onlineToDateTimeInput, value);
    }


    waitForValidationRecording(ms) {
        return this.waitForElementDisplayed(this.validationRecord, ms);
    }

    isValidationRecordingDisplayed() {
        return this.isElementDisplayed(this.validationRecord);
    }

    async getValidationRecord() {
        try {
            return await this.getText(this.validationRecord);
        } catch (err) {
            await this.saveScreenshot('err_schedule_validation_record');
            throw new Error('getting Validation text: ' + err);
        }
    }

    waitForDisplayed() {
        return this.waitUntilDisplayed(this.parentContainer + XPATH.container, appConst.shortTimeout);
    }

    async waitForOnlineFromPickerDisplayed() {
        try {
            return await this.waitUntilDisplayed(XPATH.onlineFromPickerPopup, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Online from picker popup should be opened!" + err);
        }
    }

    async waitForOnlineToPickerDisplayed() {
        try {
            return await this.waitUntilDisplayed(XPATH.onlineToPickerPopup, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Online from picker popup should be opened!" + err);
        }
    }

    waitForNotDisplayed() {
        return this.waitUntilElementNotVisible(this.parentContainer + XPATH.container, appConst.shortTimeout);
    }

    async clickOnHoursArrowOnlineFrom() {
        let selector = XPATH.onlineFromPickerPopup + "//a[@class='next']/span";
        let elems = await this.findElements(selector);
        await elems[0].click();
        return await this.pause(300);
    }
}

module.exports = DateTimeRange;
