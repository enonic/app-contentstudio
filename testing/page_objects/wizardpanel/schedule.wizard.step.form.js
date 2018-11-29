/**
 * Created on 21.11.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const formXpath = {
    container: `//div[contains(@id,'ScheduleWizardStepForm')]`,
    onlineFromInputView: `//div[contains(@id,'InputView') and descendant::div[text()='Online from']]`,
    onlineToInputView: "//div[contains(@id,'InputView') and descendant::div[text()='Online to']]",
};
const scheduleForm = Object.create(page, {

    onlineFromInput: {
        get: function () {
            return `${formXpath.onlineFromInputView}` + elements.DATE_TIME_PICKER_INPUT;
        }
    },
    onlineToInput: {
        get: function () {
            return `${formXpath.onlineToInputView}` + elements.DATE_TIME_PICKER_INPUT;
        }
    },
    typeOnlineFrom: {
        value: function (value) {
            return this.typeTextInInput(this.onlineFromInput, value);
        }
    },
    waitForOnlineFromInputVisible: {
        value: function () {
            return this.waitForVisible(this.onlineFromInput, appConst.TIMEOUT_2);
        }
    },
    waitForOnlineToInputVisible: {
        value: function () {
            return this.waitForVisible(this.onlineToInput, appConst.TIMEOUT_2);
        }
    },
});
module.exports = scheduleForm;
