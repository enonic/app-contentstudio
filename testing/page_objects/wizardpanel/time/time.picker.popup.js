/**
 * Created on 11.10.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'TimePickerPopup')]`,
    timezone: "//li[@class='timezone']",
};

class TimePickerPopup extends Page {

    get timezone() {
        return XPATH.container + XPATH.timezone;
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    async waitForTimeZoneNotDisplayed() {
        return await this.waitForElementNotDisplayed(XPATH.timezone, appConst.mediumTimeout);

    }
}

module.exports = TimePickerPopup;


