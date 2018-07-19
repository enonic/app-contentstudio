/**
 * Created on 05.07.2018.
 */

const page = require('../page');
const elements = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const loaderComboBox = require('../components/loader.combobox');
const siteConfigDialog = require('./site.configurator.dialog');
const xpath = {
    container: `//div[contains(@id,'SettingsWizardStepForm')]`,
    localeCombobox: `//div[contains(@id,'LocaleComboBox')]`,
    ownerCombobox: `//div[contains(@id,'PrincipalComboBox')]`,
    applicationsSelectedOptions: "//div[contains(@id,'SiteConfiguratorSelectedOptionView')]",
    selectedOwner: `//div[contains(@class,'selected-options principal-selected-options-view')]`,
    selectedLocale: `//div[contains(@id,'LocaleSelectedOptionView')]`,
    removeLanguageButton: "//div[contains(@id,'LocaleSelectedOptionView')]",
}
var settingsStepForm = Object.create(page, {

    languageFilterInput: {
        get: function () {
            return `${xpath.container}` + `${xpath.localeCombobox}` + `${elements.COMBO_BOX_OPTION_FILTER_INPUT}`;
        }
    },
    removeLanguageButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.removeLanguageButton}` + `${elements.REMOVE_ICON}`;
        }
    },
    filterOptionsAndSelectLanguage: {
        value: function (language) {
            if (language == null) {
                return Promise.resolve();
            } else {
                return this.typeTextInInput(this.languageFilterInput, language).pause(1000).then(() => {
                    return loaderComboBox.selectOption(language);
                }).catch(err => {
                    this.saveScreenshot(appConst.generateRandomName('err_option'));
                    throw new Error('Settings form, language selector :' + err);
                });
            }
        }
    },
    getSelectedLanguage: {
        value: function () {
            let selector = `${xpath.container}` + `${xpath.selectedLocale}` + `${elements.H6_DISPLAY_NAME}`;
            return this.getTextFromElements();
        }
    },
    getSelectedOwner: {
        value: function () {
            let selector = `${xpath.container}` + `${xpath.selectedOwner}` + `${elements.H6_DISPLAY_NAME}`;
            return this.getText(selector);
        }
    },
    clickOnRemoveLanguage: {
        value: function (displayName) {
            return this.doClick(this.removeLanguageButton).pause(500).catch(err => {
                this.saveScreenshot("err_click_on_remove_language_icon");
                throw new Error('Error when removing the language! ' + err);
            });
        }
    },
});
module.exports = settingsStepForm;


