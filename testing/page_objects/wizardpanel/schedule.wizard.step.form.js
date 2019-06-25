/**
 * Created on 21.11.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const XPATH = {
    container: `//div[contains(@id,'ScheduleWizardStepForm')]`,
    onlineFromInputView: `//div[contains(@id,'InputView') and descendant::div[text()='Online from']]`,
    onlineToInputView: "//div[contains(@id,'InputView') and descendant::div[text()='Online to']]",
};

class ScheduleForm extends Page {

    get onlineFromInput() {
        return XPATH.onlineFromInputView + lib.DATE_TIME_PICKER_INPUT;
    }

    get onlineToInput() {
        return XPATH.onlineToInputView + lib.DATE_TIME_PICKER_INPUT;
    }

    typeOnlineFrom(value) {
        return this.typeTextInInput(this.onlineFromInput, value);
    }

    waitForOnlineFromInputVisible() {
        return this.waitForElementDisplayed(this.onlineFromInput, appConst.TIMEOUT_2);
    }

    waitForOnlineToInputVisible() {
        return this.waitForElementDisplayed(this.onlineToInput, appConst.TIMEOUT_2);
    }
};
module.exports = ScheduleForm;
