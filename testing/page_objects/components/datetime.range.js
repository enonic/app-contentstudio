/**
 * Created on 02.08.2019.
 */
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const Page = require('../page');
const XPATH = {
    container: "//div[contains(@id,'DateTimeRange')]",
    onlineFromDateTime: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online from']]//input[contains(@id,'TextInput')]",
    onlineFromPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online from']]" +
                           "//div[contains(@id,'DateTimePickerPopup')]",
    onlineToDateTime: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[text()='Online to']]//input[contains(@id,'TextInput')]",
    validationRecording: `//div[contains(@id,'ValidationRecordingViewer')]//li`,
};

//ScheduleWizardStepForm, DateTimeRange
class DateTimeRange extends Page {

    get onlineFromDateTimeInput() {
        return XPATH.container + XPATH.onlineFromDateTime;
    }

    get onlineToDateTimeInput() {
        return XPATH.container + XPATH.onlineToDateTime;
    }

    get validationRecord() {
        return lib.FORM_VIEW + lib.OCCURRENCE_ERROR_BLOCK;
    }

    clearOnlineFrom(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.clearTextInput(xpath + this.onlineFromDateTimeInput);
    }

    typeOnlineFrom(value, xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.typeTextInInput(xpath + this.onlineFromDateTimeInput, value);
    }

    waitForOnlineToInputDisplayed(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.waitForElementDisplayed(xpath + this.onlineToDateTimeInput, appConst.mediumTimeout);
    }

    waitForOnlineFromInputDisplayed(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.waitForElementDisplayed(xpath + this.onlineFromDateTimeInput, appConst.mediumTimeout);
    }

    async getOnlineFrom(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        await this.waitForOnlineFromInputDisplayed();
        await this.pause(300);
        return await this.getTextInInput(xpath + this.onlineFromDateTimeInput);
    }

    getOnlineTo(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.getTextInInput(this.onlineToDateTimeInput);
    }

    typeOnlineTo(value, xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.typeTextInInput(this.onlineToDateTimeInput, value);
    }


    waitForValidationRecording(ms, xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.waitForElementDisplayed(xpath + this.validationRecord, ms);
    }

    isValidationRecordingDisplayed(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.isElementDisplayed(xpath + this.validationRecord);
    }

    getValidationRecord(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.getText(xpath + this.validationRecord).catch(err => {
            this.saveScreenshot('err_schedule_validation_record');
            throw new Error('getting Validation text: ' + err);
        })
    }

    waitForDisplayed(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.waitUntilDisplayed(xpath + XPATH.container, appConst.shortTimeout);
    }

    async waitForOnlineFromPickerDisplayed() {
        try {
            return await this.waitUntilDisplayed(XPATH.onlineFromPickerPopup, appConst.shortTimeout);
        } catch (err) {
            throw new Error("Online from picker popup should be opened!" + err);
        }
    }

    waitForNotDisplayed(xpath) {
        if (xpath === undefined) {
            xpath = '';
        }
        return this.waitUntilElementNotVisible(xpath + XPATH.container, appConst.shortTimeout);
    }

    async doOpenOnlineFromPickerPopup() {
        await this.clickOnElement(this.onlineFromDateTimeInput);
        return await this.waitForOnlineFromPickerDisplayed();
    }

    async clickOnHoursArrowOnlineFrom() {
        let selector = XPATH.onlineFromPickerPopup + "//a[@class='next']/span";
        let elems = await this.findElements(selector);
        await elems[0].click();
        return await this.pause(300);
    }

}

module.exports = DateTimeRange;
