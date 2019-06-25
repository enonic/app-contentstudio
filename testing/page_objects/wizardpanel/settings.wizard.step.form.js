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
    removeLanguageButton: "//div[contains(@id,'LocaleSelectedOptionView')]",
};

class SettingsStepForm extends Page {

    get languageFilterInput() {
        return xpath.container + xpath.localeCombobox + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get removeLanguageButton() {
        return xpath.container + xpath.removeLanguageButton + lib.REMOVE_ICON;
    }

    filterOptionsAndSelectLanguage(language) {
        if (language == null) {
            return Promise.resolve();
        } else {
            return this.typeTextInInput(this.languageFilterInput, language).then(() => {
                let loaderComboBox = new LoaderComboBox()
                return loaderComboBox.selectOption(language);
            }).catch(err => {
                this.saveScreenshot(appConst.generateRandomName('err_option'));
                throw new Error('Settings form, language selector :' + err);
            });
        }
    }

    getSelectedLanguage() {
        let selector = xpath.container + xpath.selectedLocale + lib.H6_DISPLAY_NAME;
        return this.getTextInElements();
    }

    getSelectedOwner() {
        let selector = xpath.container + xpath.selectedOwner + lib.H6_DISPLAY_NAME;
        return this.getText(selector);
    }

    clickOnRemoveLanguage(displayName) {
        return this.clickOnElement(this.removeLanguageButton).then(() => {
            return this.pause(500);
        }).catch(err => {
            this.saveScreenshot("err_click_on_remove_language_icon");
            throw new Error('Error when removing the language! ' + err);
        });
    }
};
module.exports = SettingsStepForm;


