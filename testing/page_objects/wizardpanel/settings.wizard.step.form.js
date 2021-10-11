/**
 * Created on 05.07.2018.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const LoaderComboBox = require('../components/loader.combobox');
const xpath = {
    container: `//div[contains(@id,'SettingsWizardStepForm')]`,
    localeCombobox: `//div[contains(@id,'LocaleComboBox')]`,
    ownerCombobox: `//div[contains(@id,'PrincipalComboBox')]`,
    applicationsSelectedOptions: "//div[contains(@id,'SiteConfiguratorSelectedOptionView')]",
    selectedOwner: `//div[contains(@class,'selected-options principal-selected-options-view')]`,
    selectedLocale: `//div[contains(@id,'LocaleSelectedOptionView')]`,
    languageSelectedOption: "//div[contains(@id,'LocaleSelectedOptionView')]",
    ownerSelectedOption: "//div[contains(@id,'PrincipalSelectedOptionView')]",
    removedPrincipal: "//div[contains(@id,'RemovedPrincipalSelectedOptionView')]",
};

class SettingsStepForm extends Page {

    get languageFilterInput() {
        return xpath.container + xpath.localeCombobox + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get ownerFilterInput() {
        return xpath.container + xpath.ownerCombobox + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get removeLanguageButton() {
        return xpath.container + xpath.languageSelectedOption + lib.REMOVE_ICON;
    }

    get removeOwnerButton() {
        return xpath.container + xpath.ownerSelectedOption + lib.REMOVE_ICON;
    }

    filterOptionsAndSelectLanguage(language) {
        if (language == null) {
            return Promise.resolve();
        } else {
            return this.typeTextInInput(this.languageFilterInput, language).then(() => {
                let loaderComboBox = new LoaderComboBox();
                return loaderComboBox.selectOption(language);
            }).catch(err => {
                this.saveScreenshot(appConst.generateRandomName('err_option'));
                throw new Error('Settings form, language selector :' + err);
            });
        }
    }

    async filterOptionsAndSelectOwner(owner) {
        try {
            await this.typeTextInInput(this.ownerFilterInput, owner);
            let loaderComboBox = new LoaderComboBox();
            await loaderComboBox.selectOption(owner);
            return await this.pause(200);
        } catch (err) {
            this.saveScreenshot(appConst.generateRandomName('err_option'));
            throw new Error('Settings form, language selector :' + err);
        }
    }

    async getSelectedLanguage() {
        let selector = xpath.container + xpath.selectedLocale + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
        return await this.getText(selector);
    }

    waitForSelectedLanguageNotDisplayed() {
        let selector = xpath.container + xpath.selectedLocale + lib.H6_DISPLAY_NAME;
        return this.waitForElementNotDisplayed(selector, appConst.mediumTimeout);
    }

    getSelectedOwner() {
        let selector = xpath.container + xpath.selectedOwner + lib.H6_DISPLAY_NAME;
        return this.getText(selector);
    }

    async waitForOwnerRemoved() {
        await this.waitForElementDisplayed(xpath.removedPrincipal, appConst.mediumTimeout);
        return await this.getText(xpath.removedPrincipal + lib.P_SUB_NAME);
    }

    async clickOnRemoveLanguage() {
        try {
            await this.clickOnElement(this.removeLanguageButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot("err_click_on_remove_language_icon");
            throw new Error('Error when removing the language! ' + err);
        }
    }

    async clickOnRemoveOwner() {
        try {
            await this.clickOnElement(this.removeOwnerButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot("err_click_on_remove_owner_icon");
            throw new Error('Error when removing the owner! ' + err);
        }
    }

    isLanguageOptionsFilterVisible() {
        return this.isElementDisplayed(this.languageFilterInput);
    }

    isOwnerOptionsFilterVisible() {
        return this.isElementDisplayed(this.ownerFilterInput);
    }
}

module.exports = SettingsStepForm;


