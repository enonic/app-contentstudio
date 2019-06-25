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
        return this.waitForElementDisplayed(this.languageProperty, appConst.TIMEOUT_2).catch(err => {
            throw new Error('Properties widget- language was not loaded in ' + appConst.TIMEOUT_2);
        });
    }

    waitForLanguageNotVisible() {
        return this.waitForElementNotDisplayed(this.languageProperty, appConst.TIMEOUT_2).catch(err => {
            return false;
        });
    }

    getLanguage() {
        return this.waitForLanguageVisible().then(() => {
            return this.getText(this.languageProperty);
        }).catch(err => {
            this.saveScreenshot('properties_widget_no_language_property');
            return "";
        })
    }
};
module.exports = PropertiesItemView;


