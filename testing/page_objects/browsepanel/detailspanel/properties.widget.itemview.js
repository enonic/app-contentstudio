/**
 * Created on 04/07/2018.
 */
const page = require('../../page');
const elements = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'DetailsView')]//div[contains(@id,'PropertiesWidgetItemView')]`,
    languageProperty: `//dd[contains(.,'Language:')]/following-sibling::dt[1]`
}
var propertiesItemView = Object.create(page, {

    languageProperty: {
        get: function () {
            return `${xpath.container}` + `${xpath.languageProperty}`;
        }
    },
    waitForLanguageVisible: {
        value: function () {
            return this.waitForVisible(this.languageProperty, appConst.TIMEOUT_2).catch(err => {
                throw new Error('Properties widget- language was not loaded in ' + appConst.TIMEOUT_2);
            });
        }
    },
    waitForLanguageNotVisible: {
        value: function () {
            return this.waitForNotVisible(this.languageProperty, appConst.TIMEOUT_2).catch(err => {
                return false;
            });
        }
    },
    getLanguage: {
        value: function () {
            return this.waitForLanguageVisible().then(() => {
                return this.getText(this.languageProperty);
            }).catch(err => {
                this.saveScreenshot('properties_widget_no_language_property');
                return "";
            })
        }
    },
});
module.exports = propertiesItemView;


