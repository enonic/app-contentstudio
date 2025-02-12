/**
 * Created on 11.10.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'DateTimePickerPopup')]`,
    timezone: "//li[@class='timezone']",
    okButton: "//div[@class='picker-buttons']//button[child::span[text()='OK']]",
    onlineFromPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[child::span[text()='Online from']]]//div[contains(@id,'DateTimePickerPopup')]",
    onlineToPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[child::span[text()='Online to']]]//div[contains(@id,'DateTimePickerPopup')]",
};

class DateTimePickerPopup extends Page {

    get timezone() {
        return XPATH.container + XPATH.timezone;
    }

    get okButton() {
        return XPATH.container + XPATH.okButton;
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        return await this.pause(200);
    }

    async waitForTimeZoneDisplayed() {
        return await this.waitForElementDisplayed(XPATH.timezone, appConst.mediumTimeout);
    }

    async clickOnOkButton() {
        await this.waitUntilDisplayed(this.okButton, appConst.mediumTimeout);
        let elems = await this.getDisplayedElements(this.okButton);
        await elems[0].click();
        await this.pause(200);
    }

    async clickOnHoursArrowOnlineFrom() {
        let selector = XPATH.container + "//a[@class='next']/span";
        let elems = await this.findElements(selector);
        await elems[0].click();
        return await this.pause(300);
    }

    async getTimeInOnlineFrom() {
        let locator = XPATH.onlineFromPickerPopup + "//ul[contains(@id,'TimePickerPopup')]/li/span[1]";
        let elements = await this.findElements(locator);
        if (elements.length !== 2) {
            throw new Error('Error occurred during getting time in  TimePickerPopup');
        }
        let h = await elements[0].getText();
        let min = await elements[1].getText();
        return h + ':' + min;
    }
}

module.exports = DateTimePickerPopup;


