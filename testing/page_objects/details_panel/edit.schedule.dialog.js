/**
 * Created  on 03.03.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const DateTimeRange = require('../components/datetime.range');

const xpath = {
    container: `//div[contains(@id,'EditPropertiesDialog')]`,
    scheduleStepFormDiv: "//div[contains(@id,'ScheduleWizardStepForm')]",
    dialogTitle: "//div[contains(@id,'EditDetailsDialogHeader') and child::h2[@class='title']]",
};

class EditScheduleDialog extends Page {

    get scheduleValidationRecord() {
        return xpath.scheduleStepFormDiv + lib.OCCURRENCE_ERROR_BLOCK;
    }

    get cancelTopButton() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    get cancelButton() {
        return xpath.container + lib.dialogButton('Cancel');
    }

    get applyButton() {
        return xpath.container + lib.dialogButton('Apply');
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
        await this.clickOnElement(this.cancelButton);
        await this.pause(300);
    }

    waitForApplyButtonDisplayed() {
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }

    waitForApplyButtonEnabled() {
        return this.waitForElementEnabled(this.applyButton, appConst.mediumTimeout);
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(xpath.scheduleStepFormDiv);
        await this.waitForApplyButtonDisplayed();
    }

    waitForClosed() {
        this.waitForElementNotDisplayed(xpath.scheduleStepFormDiv, appConst.mediumTimeout);
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonDisplayed();
        await this.waitForApplyButtonEnabled();
        await this.clickOnElement(this.applyButton);
        await this.waitForClosed();
        return await this.pause(800);
    }

    typeOnlineFrom(value) {
        let dateTimeRange = new DateTimeRange(xpath.container);
        return dateTimeRange.typeOnlineFrom(value);
    }

    async getOnlineFrom() {
        let dateTimeRange = new DateTimeRange(xpath.scheduleStepFormDiv);
        return await dateTimeRange.getOnlineFrom();
    }

    getOnlineTo() {
        let dateTimeRange = new DateTimeRange(xpath.scheduleStepFormDiv);
        return dateTimeRange.getOnlineTo();
    }

    typeOnlineTo(value) {
        let dateTimeRange = new DateTimeRange(xpath.scheduleStepFormDiv);
        return dateTimeRange.typeOnlineTo(value);
    }

    waitForValidationRecording() {
        return this.waitForElementDisplayed(this.scheduleValidationRecord, appConst.shortTimeout);
    }

    getScheduleValidationRecord() {
        let dateTimeRange = new DateTimeRange(xpath.scheduleStepFormDiv);
        return dateTimeRange.getValidationRecord();
    }

    waitForScheduleFormDisplayed() {
        return this.waitUntilDisplayed(xpath.scheduleStepFormDiv, appConst.shortTimeout);
    }

    async waitForScheduleFormNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(xpath.container + xpath.scheduleStepFormDiv, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_schedule_form');
            throw new Error(`Error - Schedule form should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    waitForOnlineToInputDisplayed() {
        let dateTimeRange = new DateTimeRange(xpath.scheduleStepFormDiv);
        return dateTimeRange.waitForOnlineToInputDisplayed();
    }

    waitForOnlineFromInputDisplayed() {
        let dateTimeRange = new DateTimeRange(xpath.scheduleStepFormDiv);
        return dateTimeRange.waitForOnlineFromInputDisplayed();
    }
}

module.exports = EditScheduleDialog;
