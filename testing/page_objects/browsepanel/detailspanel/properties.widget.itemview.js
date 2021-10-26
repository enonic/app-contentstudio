/**
 * Created on 04/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'PropertiesWidgetItemView')]`,
    languageProperty: "//dd[contains(.,'Language:')]/following-sibling::dt[1]",
    ownerProperty: "//dd[contains(.,'Owner:')]/following-sibling::dt[1]",
    publishFromProperty: "//dd[contains(.,'Publish From:')]/following-sibling::dt[1]",
};

class PropertiesItemView extends Page {

    get languageProperty() {
        return xpath.container + xpath.languageProperty;
    }

    get ownerProperty() {
        return xpath.container + xpath.ownerProperty;
    }

    get publishFromProperty() {
        return xpath.container + xpath.publishFromProperty;
    }

    async waitForLanguageVisible() {
        try {
            await this.waitForElementDisplayed(this.languageProperty, appConst.shortTimeout);
        } catch (err) {
            //Workaround for the issue with empty details panel in Wizard
            await this.refresh();
            await this.pause(2000);
            await this.waitForElementDisplayed(this.languageProperty, appConst.shortTimeout);
        }
    }

    waitForLanguageNotVisible() {
        return this.waitForElementNotDisplayed(this.languageProperty, appConst.shortTimeout).catch(err => {
            throw new Error("Language should not be present in the properties widget! " + err);
        });
    }

    waitForOwnerNotVisible() {
        return this.waitForElementNotDisplayed(this.ownerProperty, appConst.shortTimeout).catch(err => {
            throw new Error("Owner should not be present in the properties widget! " + err);
        });
    }

    async getLanguage() {
        await this.waitForLanguageVisible();
        return await this.getText(this.languageProperty);
    }

    async getPublishFrom() {
        await this.waitForElementDisplayed(this.publishFromProperty, appConst.shortTimeout);
        return await this.getText(this.publishFromProperty);
    }

    async waitForOwnerDisplayed() {
        try {
            await this.waitForElementDisplayed(this.ownerProperty, appConst.shortTimeout);
        } catch (err) {
            //Workaround for the issue with empty details panel in Wizard
            await this.refresh();
            await this.pause(2000);
            await this.waitForElementDisplayed(this.ownerProperty, appConst.shortTimeout);
        }
    }
}

module.exports = PropertiesItemView;


