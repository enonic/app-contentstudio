/**
 * Created on 04/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'PropertiesWidgetItemView')]`,
    languageProperty: `//dd[contains(.,'Language:')]/following-sibling::dt[1]`
};

class PropertiesItemView extends Page {

    get languageProperty() {
        return xpath.container + xpath.languageProperty;
    }

    waitForLanguageVisible() {
        return this.waitForElementDisplayed(this.languageProperty, appConst.shortTimeout).catch(err => {
            throw new Error('Properties widget- language is not displayed ' + appConst.shortTimeout);
        });
    }

    waitForLanguageNotVisible() {
        return this.waitForElementNotDisplayed(this.languageProperty, appConst.shortTimeout).catch(err => {
            throw new Error("Language should not be present in the preoperties widget! " + err);
        });
    }

    async getLanguage() {
        await this.waitForLanguageVisible();
        return await this.getText(this.languageProperty);
    }
};
module.exports = PropertiesItemView;


