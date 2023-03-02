/**
 * Created on 03.03.2023
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'OnlinePropertiesWidgetItemView')]`,
    onlineFromFromProperty: "//dd[contains(.,'Online from')]/following-sibling::dt[1]",
    onlineFromToProperty: "//dd[contains(.,'Online to')]/following-sibling::dt[1]",
    editScheduleButton: "//a[contains(@class,'edit-settings-link') and text()='Edit Schedule']",
};

class ScheduleItemView extends Page {

    get scheduleValidationRecord() {
        return xpath.scheduleForm + lib.OCCURRENCE_ERROR_BLOCK;
    }

    get onlineFromFromProperty() {
        return xpath.container + xpath.onlineFromFromProperty;
    }

    get editScheduleButton() {
        return xpath.container + xpath.editScheduleButton;
    }

    get onlineFromToProperty() {
        return xpath.container + xpath.onlineFromToProperty;
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
            let screenshot = appConst.generateRandomName('widget_schedule_edit');
            await this.saveScreenshot(screenshot);
            throw new Error(`Properties Widget, Edit Schedule  ${screenshot} ` + err);
        }
    }
}

module.exports = ScheduleItemView;


