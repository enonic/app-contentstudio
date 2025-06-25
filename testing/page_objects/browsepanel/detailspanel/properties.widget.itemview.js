/**
 * Created on 04/07/2018.
 */
const Page = require('../../page');
const appConst = require('../../../libs/app_const');
const {BUTTONS} = require('../../../libs/elements');

const xpath = {
    container: `//section[@data-component='DetailsWidgetInfoSection']`,
    languageProperty: "//dt[contains(.,'Language')]/following-sibling::dd[1]/span",
    ownerProperty: "//dt[contains(.,'Owner')]/following-sibling::dd[1]/span",
    publishFromProperty: "//dt[contains(.,'Publish From')]/following-sibling::dd[1]/span",
    applicationProperty: "//dt[contains(.,'Application')]/following-sibling::dd[1]/span",
    type: "//dt[contains(.,'Type')]/following-sibling::dd[1]/span",
    firstPublished: "//dt[contains(.,'First Published')]/following-sibling::dd[1]/span",
    modified: "//dt[contains(.,'Modified')]/following-sibling::dd[1]/span",
    createdDate: "//dt[contains(.,'Created')]/following-sibling::dd[1]/span",
};

class DetailsWidgetInfoSection extends Page {

    get applicationProperty() {
        return xpath.container + xpath.applicationProperty;
    }

    get editSettingsButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Edit settings');
    }

    get typeProperty() {
        return xpath.container + xpath.type;
    }

    get createdDateProperty() {
        return xpath.container + xpath.createdDate;
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
            await this.handleError('Details Widget Info Section, Edit Settings button was not displayed', 'err_click_edit_settings', err,);
        }
    }

    async waitForLanguageVisible() {
        try {
            await this.waitForElementDisplayed(this.languageProperty, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError('Widget Info Section, language was not displayed', 'err_edit_settings_lang', err);
        }
    }

    waitForLanguageNotVisible() {
        try {
            return this.waitForElementNotDisplayed(this.languageProperty, appConst.shortTimeout)
        } catch (err) {
            throw new Error('Language should not be displayed in the Widget Info Section! ' + err);
        }
    }

    async waitForOwnerNotVisible() {
        try {
            return await this.waitForElementNotDisplayed(this.ownerProperty, appConst.shortTimeout)
        } catch (err) {
            throw new Error('Owner should not be displayed in the Widget Info Section! ' + err);
        }
    }


    async getLanguage() {
        await this.waitForLanguageVisible();
        return await this.getText(this.languageProperty);
    }

    async getCreatedDate() {
        await this.waitForElementDisplayed(this.createdDateProperty, appConst.shortTimeout);
        return await this.getText(this.createdDateProperty);
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
            await this.handleError('Properties Widget, owner is not displayed', 'err_owner_displayed', err,);
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

module.exports = DetailsWidgetInfoSection;
