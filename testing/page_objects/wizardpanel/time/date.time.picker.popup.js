/**
 * Created on 11.10.2021 updated on 13.08.2026
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const XPATH = {
    container: `//div[@data-component='DatePicker.Content']`,
    datePickerContent: `//div[@data-component='DatePicker.Content' and @data-state='open']`,
    nextMonthButton: `//button[@data-component='IconButton' and @aria-label='Next month']`,
    prevMonthButton: `//button[@data-component='IconButton' and @aria-label='Previous month']`,
    monthSelect: `//button[@data-component='DatePicker.MonthSelect']`,
    yearSelect: `//button[@data-component='DatePicker.YearSelect']`,
    // Day cell of the currently displayed month (trailing days of adjacent months carry 'text-subtle'):
    dayByNumber: (day) =>
        `//button[@data-component='DatePicker.Day' and not(contains(@class,'text-subtle')) and normalize-space(.)='${day}']`,
    hourSelect: `//button[@data-component='TimePicker.HourSelect']`,
    minuteSelect: `//button[@data-component='TimePicker.MinuteSelect']`,
    selectorValue: `//span[@data-component='Selector.Value']`,
    okButton: `//button[@data-component='Button' and translate(normalize-space(.),'ok','OK')='OK']`,
    timezone: `//div[@data-component='TimePicker.Root']//span[starts-with(normalize-space(.),'UTC')]`,
};

class DateTimePickerPopup extends Page {
    get timezone() {
        return XPATH.container + XPATH.timezone;
    }

    get okButton() {
        return XPATH.datePickerContent + XPATH.okButton;
    }

    get monthSelect() {
        return XPATH.datePickerContent + XPATH.monthSelect;
    }

    get yearSelect() {
        return XPATH.datePickerContent + XPATH.yearSelect;
    }

    get hourSelect() {
        return XPATH.datePickerContent + XPATH.hourSelect;
    }

    get minuteSelect() {
        return XPATH.datePickerContent + XPATH.minuteSelect;
    }

    async waitForLoaded() {
        await this.waitForElementDisplayed(XPATH.datePickerContent);
        return await this.pause(200);
    }

    async waitForClosed() {
        return await this.waitForElementNotDisplayed(XPATH.datePickerContent);
    }

    async waitForTimeZoneDisplayed() {
        return await this.waitForElementDisplayed(this.timezone);
    }

    // Returns the timezone label, e.g. 'UTC+02:00':
    async getTimezone() {
        try {
            await this.waitForTimeZoneDisplayed();
            return await this.getText(this.timezone);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - get timezone', 'err_get_timezone', err);
        }
    }

    // 'OK' button is disabled until a date or time is changed in the popup:
    async waitForOkButtonEnabled() {
        try {
            await this.waitForElementDisplayed(this.okButton);
            return await this.waitForElementEnabled(this.okButton);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - OK button should be enabled', 'err_ok_button_enabled', err);
        }
    }

    async waitForOkButtonDisabled() {
        try {
            await this.waitForElementDisplayed(this.okButton);
            return await this.waitForElementDisabled(this.okButton);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - OK button should be disabled', 'err_ok_button_disabled', err);
        }
    }

    async clickOnOkButton() {
        try {
            await this.waitForOkButtonEnabled();
            await this.clickOnElement(this.okButton);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - click on OK button', 'err_click_on_ok_button', err);
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
            await this.handleError(
                'DateTimePickerPopup - click on Next month button',
                'err_click_on_next_month_button',
                err,
            );
        }
    }

    // Click on 'Previous month' button (chevron-left) in the open date picker:
    async clickOnPrevMonthButton() {
        try {
            let selector = XPATH.datePickerContent + XPATH.prevMonthButton;
            await this.waitForElementDisplayed(selector);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                'DateTimePickerPopup - click on Previous month button',
                'err_click_on_prev_month_button',
                err,
            );
        }
    }

    // Click on the given day number in the currently displayed month of the open date picker:
    async clickOnDayInCalendar(day) {
        try {
            let selector = XPATH.datePickerContent + XPATH.dayByNumber(day);
            await this.waitForElementDisplayed(selector);
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(
                `DateTimePickerPopup - click on day '${day}' in calendar`,
                'err_click_on_day_in_calendar',
                err,
            );
        }
    }

    // Returns the month displayed in the 'Month' dropdown selector (locale-dependent, e.g. 'Aug'):
    async getMonth() {
        try {
            let locator = this.monthSelect + XPATH.selectorValue;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - get month', 'err_get_month', err);
        }
    }

    // Returns the year displayed in the 'Year' dropdown selector:
    async getYear() {
        try {
            let locator = this.yearSelect + XPATH.selectorValue;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - get year', 'err_get_year', err);
        }
    }

    // Returns the value displayed in the 'Hour' dropdown selector:
    async getHours() {
        try {
            let locator = this.hourSelect + XPATH.selectorValue;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - get hours', 'err_get_hours', err);
        }
    }

    // Returns the value displayed in the 'Minute' dropdown selector:
    async getMinutes() {
        try {
            let locator = this.minuteSelect + XPATH.selectorValue;
            await this.waitForElementDisplayed(locator);
            return await this.getText(locator);
        } catch (err) {
            await this.handleError('DateTimePickerPopup - get minutes', 'err_get_minutes', err);
        }
    }

    // Returns the time displayed in the TimePicker selectors as 'hh:mm':
    async getTime() {
        let hours = await this.getHours();
        let minutes = await this.getMinutes();
        return hours + ':' + minutes;
    }

    // Only one picker popup is open at a time in the new UI, so the time
    // is read from the TimePicker selectors of the currently open popup:
    async getTimeInOnlineFrom() {
        try {
            return await this.getTime();
        } catch (err) {
            await this.handleError('DateTimePickerPopup - getTime In Online From', 'err_get_time_in_online_from', err);
        }
    }
}

module.exports = DateTimePickerPopup;
