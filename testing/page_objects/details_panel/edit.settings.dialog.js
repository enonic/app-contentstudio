/**
 * Created  on 22.02.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const LoaderComboBox = require('../components/loader.combobox');

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
        return xpath.container + lib.dialogButton('Cancel');
    }

    get applyButton() {
        return xpath.container + lib.dialogButton('Apply');
    }


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
        await this.waitForElementDisplayed(xpath.settingsStepFormDiv);
        await this.waitForApplyButtonDisplayed();
    }

    waitForClosed() {
        this.waitForElementNotDisplayed(xpath.container, appConst.mediumTimeout);
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonDisplayed();
        await this.waitForApplyButtonEnabled();
        await this.clickOnElement(this.applyButton);
        await this.waitForClosed();
        return await this.pause(800);
    }

    async filterOptionsAndSelectLanguage(language) {
        try {
            await this.typeTextInInput(this.languageFilterInput, language);
            await this.pause(300);
            let loaderComboBox = new LoaderComboBox();
            await loaderComboBox.selectOption(language);
            await this.pause(300);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_option'));
            throw new Error('Edit Setting dialog, language selector :' + err);
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
        try {
            let selector = xpath.container + xpath.languageSelectedOption + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(selector, appConst.mediumTimeout);
            return await this.getText(selector);
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_setting_dialog_language'));
            throw new Error('Edit Setting dialog, error during getting the selected language. ' + err);
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

    waitForLanguageOptionsFilterDisplayed() {
        return this.waitForElementDisplayed(this.languageFilterInput, appConst.mediumTimeout);
    }

    isOwnerOptionsFilterVisible() {
        return this.isElementDisplayed(this.ownerFilterInput);
    }
}

module.exports = EditSettingDialog;
