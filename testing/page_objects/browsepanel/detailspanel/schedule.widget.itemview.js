/**
 * Created on 03.03.2023
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'OnlinePropertiesWidgetItemView')]`,
    onlineFromDescriptionTerm: "//dd[contains(.,'Online from')]/following-sibling::dt[1]",//<dt>
    onlineToDescriptionTerm: "//dd[contains(.,'Online to')]/following-sibling::dt[1]",
    editScheduleButton: "//a[contains(@class,'edit-settings-link') and text()='Edit Schedule']",
};

class ScheduleItemView extends Page {

    get scheduleValidationRecord() {
        return xpath.scheduleForm + lib.OCCURRENCE_ERROR_BLOCK;
    }

    get onlineFromDateTimeTerm() {
        return xpath.container + xpath.onlineFromDescriptionTerm;
    }

    get editScheduleButton() {
        return xpath.container + xpath.editScheduleButton;
    }

    get onlineToDateTimeTerm() {
        return xpath.container + xpath.onlineToDescriptionTerm;
    }


    waitForEditScheduleButtonDisplayed() {
        return this.waitForElementDisplayed(this.editScheduleButton, appConst.mediumTimeout);
    }

    waitForEditScheduleButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.editScheduleButton, appConst.mediumTimeout);
    }

    async clickOnEditScheduleButton() {
        try {
            await this.waitForEditScheduleButtonDisplayed();
            await this.clickOnElement(this.editScheduleButton);
            await this.pause(300);
        } catch (err) {
            await this.handleError('OnlinePropertiesWidget - Edit Schedule button:', 'err_edit_schedule_button', err);
        }
    }
    async getOnlineFromDateTime() {
        try {
            await this.waitForElementDisplayed(this.onlineFromDateTimeTerm, appConst.mediumTimeout);
            return await this.getText(this.onlineFromDateTimeTerm);
        } catch (err) {
            await this.handleError('OnlinePropertiesWidget - Online From Date/Time:', 'err_online_from_date_time', err);
        }
    }
    async getOnlineToDateTime() {
        try {
            await this.waitForElementDisplayed(this.onlineToDateTimeTerm, appConst.mediumTimeout);
            return await this.getText(this.onlineToDateTimeTerm);
        } catch (err) {
            await this.handleError('OnlinePropertiesWidget - Online to Date/Time:', 'err_online_to_date_time', err);
        }
    }
}

module.exports = ScheduleItemView;


