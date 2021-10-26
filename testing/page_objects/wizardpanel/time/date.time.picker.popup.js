/**
 * Created on 11.10.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'DateTimePickerPopup')]`,
    timezone: "//li[@class='timezone']",
};

class DateTimePickerPopup extends Page {

    get timezone() {
        return XPATH.container + XPATH.timezone;
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        return await this.pause(200);
    }

    async waitForTimeZoneDisplayed() {
        return await this.waitForElementDisplayed(XPATH.timezone, appConst.mediumTimeout);

    }
}

module.exports = DateTimePickerPopup;


