/**
 * Created on 04/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'WidgetView')]//div[contains(@id,'PropertiesWidgetItemView')]`,
    languageProperty: "//dd[contains(.,'Language')]/following-sibling::dt[1]",
    ownerProperty: "//dd[contains(.,'Owner')]/following-sibling::dt[1]",
    publishFromProperty: "//dd[contains(.,'Publish From')]/following-sibling::dt[1]",
    applicationProperty: "//dd[contains(.,'Application')]/following-sibling::dt[1]",
    type: "//dd[contains(.,'Type')]/following-sibling::dt[1]",
    firstPublished: "//dd[contains(.,'First Published')]/following-sibling::dt[1]",
    modified: "//dd[contains(.,'Modified')]/following-sibling::dt[1]",
    editSettingsButton: "//a[contains(@class,'edit-settings-link') and text()='Edit Settings']",
};

class PropertiesItemView extends Page {

    get applicationProperty() {
        return xpath.container + xpath.applicationProperty;
    }

    get editSettingsButton() {
        return xpath.container + xpath.editSettingsButton;
    }

    get typeProperty() {
        return xpath.container + xpath.type;
    }

    get modifiedProperty() {
        return xpath.container + xpath.modified;
    }

    get firstPublishedProperty() {
        return xpath.container + xpath.firstPublished;
    }

    get languageProperty() {
        return xpath.container + xpath.languageProperty;
    }

    get ownerProperty() {
        return xpath.container + xpath.ownerProperty;
    }

    get publishFromProperty() {
        return xpath.container + xpath.publishFromProperty;
    }

    waitForEditSettingsButtonDisplayed() {
        return this.waitForElementDisplayed(this.editSettingsButton, appConst.mediumTimeout);
    }

    waitForEditSettingsButtonNotDisplayed() {
        return this.waitForElementNotDisplayed(this.editSettingsButton, appConst.mediumTimeout);
    }

    async clickOnEditSettingsButton() {
        try {
            await this.waitForEditSettingsButtonDisplayed();
            await this.clickOnElement(this.editSettingsButton);
        } catch (err) {
            await this.handleError('Properties Widget, Edit button is not displayed','err_click_edit_settings', err, );
        }
    }

    async waitForLanguageVisible() {
        try {
            await this.waitForElementDisplayed(this.languageProperty, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Properties Widget, language is not displayed','err_edit_settings_lang', err );
        }
    }

    waitForLanguageNotVisible() {
        return this.waitForElementNotDisplayed(this.languageProperty, appConst.shortTimeout).catch(err => {
            throw new Error("Language should not be present in the properties widget! " + err);
        });
    }

    waitForOwnerNotVisible() {
        return this.waitForElementNotDisplayed(this.ownerProperty, appConst.shortTimeout).catch(err => {
            throw new Error('Owner should not be present in the properties widget! ' + err);
        });
    }

    async getLanguage() {
        await this.waitForLanguageVisible();
        return await this.getText(this.languageProperty);
    }

    async getApplication() {
        await this.waitForElementDisplayed(this.applicationProperty, appConst.mediumTimeout);
        return await this.getText(this.applicationProperty);
    }

    async getType() {
        await this.waitForElementDisplayed(this.typeProperty, appConst.mediumTimeout);
        return await this.getText(this.typeProperty);
    }

    async getPublishFrom() {
        await this.waitForElementDisplayed(this.publishFromProperty, appConst.shortTimeout);
        return await this.getText(this.publishFromProperty);
    }

    async waitForOwnerDisplayed() {
        try {
            await this.waitForElementDisplayed(this.ownerProperty, appConst.shortTimeout);
        } catch (err) {
            await this.handleError('Properties Widget, owner is not displayed','err_owner_displayed', err,);
        }
    }

    async getOwnerName() {
        await this.waitForOwnerDisplayed();
        return await this.getText(this.ownerProperty);
    }

    waitForModifiedDateDisplayed() {
        return this.waitForElementDisplayed(this.modifiedProperty, appConst.shortTimeout);
    }

    waitForFirstPublishedDateDisplayed() {
        return this.waitForElementDisplayed(this.firstPublishedProperty, appConst.shortTimeout);
    }
}

module.exports = PropertiesItemView;
