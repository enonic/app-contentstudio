/**
 * Created on 11.10.2021
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[contains(@id,'DateTimePickerPopup')]`,
    datePickerContent: `//div[@data-component='DatePicker.Content' and @data-state='open']`,
    nextMonthButton: `//button[@data-component='IconButton' and @aria-label='Next month']`,
    prevMonthButton: `//button[@data-component='IconButton' and @aria-label='Previous month']`,
    // Day cell of the currently displayed month (trailing days of adjacent months carry 'text-subtle'):
    dayByNumber: day => `//button[@data-component='DatePicker.Day' and not(contains(@class,'text-subtle')) and normalize-space(.)='${day}']`,
    timezone: "//li[@class='timezone']",
    okButton: `//button[@data-component='Button' and normalize-space(.)='Ok']`,
    onlineFromPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[child::span[text()='Online from']]]//div[contains(@id,'DateTimePickerPopup')]",
    onlineToPickerPopup: "//div[contains(@id,'DateTimePicker') and preceding-sibling::label[child::span[text()='Online to']]]//div[contains(@id,'DateTimePickerPopup')]",
};

class DateTimePickerPopup extends Page {

    get timezone() {
        return XPATH.container + XPATH.timezone;
    }

    get okButton() {
        return XPATH.datePickerContent + XPATH.okButton;
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        return await this.pause(200);
    }

    async waitForTimeZoneDisplayed() {
        return await this.waitForElementDisplayed(XPATH.timezone, appConst.mediumTimeout);
    }

    async clickOnOkButton() {
        try {
            await this.waitForElementDisplayed(this.okButton, appConst.mediumTimeout);
            await this.clickOnElement(this.okButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - click on OK button', 'err_click_on_ok_button', err);
        }
    }

    // Click on 'Next' (arrow-up) icon in Online To Data Picker and set a date/time in the input
    async clickOnHoursArrowUp() {
        try {
            //let selector = XPATH.container + "//a[@class='next']/span";
            let elems = await this.findElements(selector);
            await elems[0].click();
            return await this.pause(300);
        }catch (err){
            await this.handleError('DateTimePickerPopup - click hour ArrowUp icon', 'err_click_on_hours_arrow_next', err);
        }
    }

    // Click on 'Prev' (arrow-down) icon in Online To Data Picker and set a date/time in the input
    async clickOnHoursArrowDown() {
        try {
            let selector = XPATH.container + "//a[@class='prev']/span";
            let elems = await this.findElements(selector);
            await elems[0].click();
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - click ArrowPrev In Online To', 'err_click_on_hours_arrow_prev', err);
        }
    }

    // Click on 'Next month' button (chevron-right) in the open date picker:
    async clickOnNextMonthButton() {
        try {
            let selector = XPATH.datePickerContent + XPATH.nextMonthButton;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - click on Next month button', 'err_click_on_next_month_button', err);
        }
    }

    // Click on 'Previous month' button (chevron-left) in the open date picker:
    async clickOnPrevMonthButton() {
        try {
            let selector = XPATH.datePickerContent + XPATH.prevMonthButton;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - click on Previous month button', 'err_click_on_prev_month_button', err);
        }
    }

    // Click on the given day number in the currently displayed month of the open date picker:
    async clickOnDayInCalendar(day) {
        try {
            let selector = XPATH.datePickerContent + XPATH.dayByNumber(day);
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`DateTimePickerPopup - click on day '${day}' in calendar`, 'err_click_on_day_in_calendar', err);
        }
    }

    async getTimeInOnlineFrom() {
        try {
            let locator = XPATH.onlineFromPickerPopup + "//ul[contains(@id,'TimePickerPopup')]/li/span[1]";
            let elements = await this.findElements(locator);
            if (elements.length !== 2) {
                throw new Error('Error occurred during getting time in  TimePickerPopup');
            }
            let h = await elements[0].getText();
            let min = await elements[1].getText();
            return h + ':' + min;
        } catch (err) {
            await this.handleError('DateTimePickerPopup - getTime In Online From', 'err_get_time_in_online_from', err);
        }
    }
}

module.exports = DateTimePickerPopup;


