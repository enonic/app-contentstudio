/**
 * Created on 04/07/2018.
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');

class BaseDependenciesWidget extends Page {

    async clickOnShowAllOutgoingButton() {
        try {
            await this.waitForElementDisplayed(this.showAllOutgoingButton);
            await this.waitForElementEnabled(this.showAllOutgoingButton);
            await this.clickOnElement(this.showAllOutgoingButton);
            return await this.pause(3000);
        } catch (err) {
            await this.handleError('Show all outgoing button is not visible', 'err_outgoing_button', err);
        }
    }

    async clickOnShowAllIncomingButton() {
        try {
            await this.clickOnElement(this.showAllIncomingButton);
            await this.pause(1000);
        } catch (err) {
            await this.handleError('Show all incoming button is not visible', 'err_incoming_button', err);
        }
    }

    async waitForNoOutgoingDependenciesMessage() {
        try {
            let locator = this.dependenciesWidget + "//span[@data-component='DependenciesWidgetFlowSection'][2]";
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError('No outgoing dependencies message is not visible', 'err_no_outgoing_dependencies', err);
        }
    }

    async waitForNoIncomingDependenciesMessage() {
        try {
            let locator = this.dependenciesWidget + "//span[@data-component='DependenciesWidgetFlowSection'][1]";
            return await this.waitForElementDisplayed(locator);
        } catch (err) {
            await this.handleError('No incoming dependencies message is not visible', 'err_no_incoming_dependencies', err);
        }
    }

    getContentPath() {
        let locator = this.dependenciesWidget + "//p[contains(@class,'text-center')][2]";
        return this.getText(locator);
    }

    getContentName() {
        let locator = this.dependenciesWidget + "//p[contains(@class,'text-center')][1]";
        return this.getText(locator);
    }

    async getNumberOutgoingItems() {
        try {
            await this.waitForElementDisplayed(this.showAllOutgoingButton);
            let text = await this.getText(this.showAllOutgoingButton);
            let startIndex = text.indexOf('(');
            let endIndex = text.indexOf(')');
            return text.substring(startIndex + 1, endIndex);
        } catch (err) {
            await this.handleError('Show all outgoing button is not visible', 'err_outgoing_button', err);
        }
    }

    async waitForAllOutgoingButtonNotVisible() {
        try {
            await this.waitForElementNotDisplayed(this.showAllOutgoingButton);
        } catch (err) {
            await this.handleError('Show all outgoing button should be hidden', 'err_outgoing_button_should_be_hidden', err);
        }
    }

    isAllIncomingButtonVisible() {
        return this.isElementDisplayed(this.showAllIncomingButton);
    }

    async waitForAllOutgoingButtonVisible() {
        try {
            await this.waitForElementDisplayed(this.showAllOutgoingButton);
            await this.pause(500);
        } catch (err) {
            await this.handleError('showAllOutgoingButton is not visible', 'err_outgoing_button', err);
        }
    }

    async waitForAllIncomingButtonVisible() {
        try {
            await this.waitForElementDisplayed(this.showAllIncomingButton, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('showAllIncomingButton is not visible', 'err_incoming_button', err);
        }
    }
}

module.exports = BaseDependenciesWidget;


