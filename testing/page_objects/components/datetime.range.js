/**
 * Created on 02.08.2019.
 */
const appConst = require('../../libs/app_const');
const {BUTTONS} = require('../../libs/elements');
const Page = require('../page');
const XPATH = {
    container: `//div[@data-component='PublishScheduleForm']`,
    onlineFromDateTime: `//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online from')]]//input`,
    onlineToDateTime: `//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online to')]]//input`,
    onlineFromTrigger: `//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online from')]]//button[@data-component='DatePicker.Trigger']`,
    onlineToTrigger: `//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online to')]]//button[@data-component='DatePicker.Trigger']`,
    // Validation message (e.g. 'Invalid format. Use YYYY-MM-DD hh:mm') shown below each input:
    onlineFromValidationRecord: `//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online from')]]//div[contains(@class,'text-error')]`,
    onlineToValidationRecord: `//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online to')]]//div[contains(@class,'text-error')]`,
    // The date picker dialog is portaled out of the form; each Content is matched to its own field
    // by joining its @aria-labelledby to the corresponding trigger's @id:
    onlineFromPickerPopup: `//div[@data-component='DatePicker.Content' and @data-state='open' and @aria-labelledby=//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online from')]]//button[@data-component='DatePicker.Trigger']/@id]`,
    onlineToPickerPopup: `//div[@data-component='DatePicker.Content' and @data-state='open' and @aria-labelledby=//div[@data-component='DatePicker.Root' and descendant::label[contains(.,'Online to')]]//button[@data-component='DatePicker.Trigger']/@id]`,
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

    get onlineFromTriggerButton() {
        return this.parentContainer + XPATH.container + XPATH.onlineFromTrigger;
    }

    get onlineToTriggerButton() {
        return this.parentContainer + XPATH.container + XPATH.onlineToTrigger;
    }

    get onlineToValidationRecording() {
        return this.parentContainer + XPATH.container + XPATH.onlineToValidationRecord;
    }

    get onlineFromValidationRecording() {
        return this.parentContainer + XPATH.container + XPATH.onlineFromValidationRecord;
    }

    clearOnlineFrom() {
        return this.clearInputText(this.parentContainer + this.onlineFromDateTimeInput);
    }

    async showOnlineToPickerPopup() {
        try {
            await this.clickOnElement(this.onlineToTriggerButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimeRange - showOnlineToPickerPopup', 'err_show_online_to_picker_popup', err);
        }
    }

    async showOnlineFromPickerPopup() {
        await this.clickOnElement(this.onlineFromTriggerButton);
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

    async waitForOnlineToValidationRecording() {
        return await this.waitForElementDisplayed(this.onlineToValidationRecording, appConst.mediumTimeout);
    }

    waitForOnlineFromValidationRecording() {
        return this.waitForElementDisplayed(this.onlineFromValidationRecording, appConst.mediumTimeout);
    }

    waitForOnlineToValidationRecordingNotDisplayed() {
        return this.waitForElementNotDisplayed(this.onlineToValidationRecording, appConst.shortTimeout);
    }

    waitForOnlineFromValidationRecordingNotDisplayed() {
        return this.waitForElementNotDisplayed(this.onlineFromValidationRecording, appConst.shortTimeout);
    }


    async getOnlineToValidationRecord() {
        try {
            return await this.getText(this.onlineToValidationRecording);
        } catch (err) {
            await this.handleError('DateTimeRange - validation record.', 'err_schedule_validation_record', err);
        }
    }

    async getOnlineFromValidationRecord() {
        try {
            return await this.getText(this.onlineFromValidationRecording);
        } catch (err) {
            await this.handleError('DateTimeRange - validation record.', 'err_schedule_validation_record', err);
        }
    }

    waitForDisplayed() {
        return this.waitUntilDisplayed(this.parentContainer + XPATH.container, appConst.shortTimeout);
    }

    async waitForOnlineFromPickerDisplayed() {
        try {
            return await this.waitUntilDisplayed(XPATH.onlineFromPickerPopup, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('DateTimeRange - Online from picker popup', 'err_online_from_picker_popup', err);
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
        try {
            let selector = XPATH.onlineFromPickerPopup + "//a[@class='next']/span";
            let elems = await this.findElements(selector);
            await elems[0].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimeRange - try to click on HoursArrow online From', 'err_click_on_hours_arrow_online_from', err);
        }
    }
}

module.exports = DateTimeRange;
