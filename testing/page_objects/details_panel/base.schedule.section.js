/**
 * Created on 13.07.2026.
 */
const Page = require('../page');

const xpath = {
    container: `//section[@data-component='DetailsWidgetScheduleSection']`,
    onlineFrom: "//span[text()='Online from']/following-sibling::span[1]",
    onlineTo: "//span[text()='Online to']/following-sibling::span[1]",
};

/*
Example
Online from 2026-07-31 16:00:00
Online to   2027-07-13 16:00:00
 */
class DetailsWidgetScheduleSection extends Page {

    get onlineFromProperty() {
        return this.scheduleWidget + xpath.onlineFrom;
    }

    get onlineToProperty() {
        return this.scheduleWidget + xpath.onlineTo;
    }

    async waitForLoaded() {
        return await this.waitForElementDisplayed(this.scheduleWidget);
    }

    async waitForOnlineFromPropertyDisplayed() {
        try {
            await this.waitForElementDisplayed(this.onlineFromProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetScheduleSection, onlineFrom was not displayed', 'err_schedule_section', err);
        }
    }

    async waitForOnlineToPropertyDisplayed() {
        try {
            await this.waitForElementDisplayed(this.onlineToProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetScheduleSection, onlineTo was not displayed', 'err_schedule_section', err);
        }
    }

    // Returns the 'Online from' value, e.g. '2026-07-31 16:00:00'
    async getOnlineFromValue() {
        try {
            await this.waitForOnlineFromPropertyDisplayed();
            return await this.getText(this.onlineFromProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetScheduleSection, get onlineFrom value', 'err_schedule_online_from', err);
        }
    }

    // Returns the 'Online to' value, e.g. '2027-07-13 16:00:00'
    async getOnlineToValue() {
        try {
            await this.waitForOnlineToPropertyDisplayed();
            return await this.getText(this.onlineToProperty);
        } catch (err) {
            await this.handleError('DetailsWidgetScheduleSection, get onlineTo value', 'err_schedule_online_to', err);
        }
    }
}

module.exports = DetailsWidgetScheduleSection;
