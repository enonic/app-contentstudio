/**
 * Created  on 22.02.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements-old');
const {BUTTONS} = require('../../libs/elements');
const LocaleSelectorDropdown = require('../components/selectors/locale.selector.dropdown');
const PrincipalComboBox = require('../components/selectors/principal.combobox.dropdown')

const xpath = {
    container: `//div[contains(@id,'EditPropertiesDialog')]`,
    settingsStepFormDiv: "//div[contains(@id,'SettingsWizardStepForm')]",
    dialogTitle: "//div[contains(@id,'EditDetailsDialogHeader') and child::h2[@class='title']]",
    localeCombobox: `//div[contains(@id,'LocaleComboBox')]`,
    ownerCombobox: `//div[contains(@id,'PrincipalComboBox')]`,
    selectedOwner: `//div[contains(@class,'selected-options principal-selected-options-view')]`,
    languageSelectedOption: "//div[contains(@id,'LocaleSelectedOptionView')]",
    ownerSelectedOption: "//div[contains(@id,'PrincipalSelectedOptionView')]",
    removedPrincipal: "//div[contains(@id,'RemovedPrincipalSelectedOptionView')]",
    scheduleForm: `//div[contains(@id,'ScheduleWizardStepForm')]`,
};

class EditSettingDialog extends Page {

    get cancelTopButton() {
        return xpath.container + lib.CANCEL_BUTTON_TOP;
    }

    get cancelButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Cancel');
    }

    get applyButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Apply');
    }

    get languageFilterInput() {
        return xpath.container + xpath.localeCombobox + lib.OPTION_FILTER_INPUT;
    }

    get removeLanguageButton() {
        return xpath.container + xpath.languageSelectedOption + lib.REMOVE_ICON;
    }

    get removeOwnerButton() {
        return xpath.container + xpath.ownerSelectedOption + lib.REMOVE_ICON;
    }

    async clickOnCancelButton() {
        await this.waitForElementDisplayed(this.cancelButton, appConst.mediumTimeout);
        await this.clickOnElement(this.cancelButton);
        await this.pause(300);
    }

    waitForApplyButtonDisplayed() {
        return this.waitForElementDisplayed(this.applyButton, appConst.mediumTimeout);
    }

    waitForApplyButtonEnabled() {
        return this.waitForElementEnabled(this.applyButton, appConst.mediumTimeout);
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton, appConst.mediumTimeout);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(xpath.settingsStepFormDiv, appConst.mediumTimeout);
            await this.waitForApplyButtonDisplayed();
        }catch (err){
            await this.handleError('Edit Setting dialog was not loaded','err_edit_settings_loaded', err)
        }
    }

    waitForClosed() {
        this.waitForElementNotDisplayed(xpath.container, appConst.mediumTimeout);
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonDisplayed();
        await this.waitForApplyButtonEnabled();
        await this.clickOnElement(this.applyButton);
        await this.waitForClosed();
        return await this.pause(200);
    }

    async filterOptionsAndSelectLanguage(language) {
        try {
            let localeSelectorDropdown = new LocaleSelectorDropdown();
            await localeSelectorDropdown.clickOnFilteredLanguage(language);
        } catch (err) {
            await this.handleError('Edit Setting dialog, language selector','err_lang_option', err);
        }
    }

    async filterOptionsAndSelectOwner(owner) {
        try {
            let principalComboBox = new PrincipalComboBox();
            await principalComboBox.selectFilteredUser(owner, xpath.container);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Edit Setting dialog, owner selector','err_owner_option', err);
        }
    }

    async getSelectedLanguage() {
        try {
            let selector = xpath.container + xpath.languageSelectedOption + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getText(selector);
        } catch (err) {
            await this.handleError('Edit Setting dialog, the selected language is not displayed','err_lang_display', err);
        }
    }

    waitForSelectedLanguageNotDisplayed() {
        let selector = xpath.container + xpath.languageSelectedOption + lib.H6_DISPLAY_NAME;
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
            await this.handleError('Edit Setting dialog, error when removing the language','err_click_remove_lang', err);
        }
    }

    async clickOnRemoveOwner() {
        try {
            await this.clickOnElement(this.removeOwnerButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Edit Setting dialog, error when removing the owner','err_click_remove_owner', err);
        }
    }

    isLanguageOptionsFilterVisible() {
        return this.isElementDisplayed(this.languageFilterInput);
    }

    waitForLanguageOptionsFilterDisplayed() {
        return this.waitForElementDisplayed(this.languageFilterInput, appConst.mediumTimeout);
    }
}

module.exports = EditSettingDialog;
