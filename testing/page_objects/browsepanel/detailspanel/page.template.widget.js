/**
 * Created on 10.02.2022
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const lib = require('../../../libs/elements-old');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'PageTemplateWidgetItemView')]`,
};

class PageTemplateWidget extends Page {


    get controllerNameLocator() {
        return xpath.container + lib.P_SUB_NAME + "/span";
    }

    get controllerLinkLocator() {
        return xpath.container + lib.P_SUB_NAME + "//a";
    }

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
        } catch (err) {
            //Workaround for the issue with empty Details panel in Wizard
            await this.refresh();
            await this.pause(3000);
            await this.waitForElementDisplayed(xpath.container, appConst.shortTimeout);
        }
    }

    async getControllerName() {
        await this.waitForElementDisplayed(this.controllerNameLocator, appConst.mediumTimeout);
        return await this.getText(this.controllerNameLocator);
    }

    async getControllerLink() {
        await this.waitForElementDisplayed(this.controllerLinkLocator, appConst.mediumTimeout);
        return await this.getText(this.controllerLinkLocator);
    }

    async waitForNoTemplateMessageDisplayed() {
        let locator = xpath.container + "//p[@class='no-template']";
        return await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async getControllerType() {
        let locator = xpath.container + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return this.getText(locator);
    }
}

module.exports = PageTemplateWidget;


