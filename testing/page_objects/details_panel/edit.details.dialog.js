/**
 * Created  on 22.02.2023
 */
const Page = require('../page');
const appConst = require('../../libs/app_const');
const lib = require('../../libs/elements');
const LoaderComboBox = require('../components/loader.combobox');
const DateTimeRange = require('../components/datetime.range');

const xpath = {
    container: `//div[contains(@id,'EditDetailsDialog')]`,
    dialogTitle: "//div[contains(@id,'EditDetailsDialogHeader') and child::h2[@class='title']]",
    localeCombobox: `//div[contains(@id,'LocaleComboBox')]`,
    ownerCombobox: `//div[contains(@id,'PrincipalComboBox')]`,
    selectedOwner: `//div[contains(@class,'selected-options principal-selected-options-view')]`,
    languageSelectedOption: "//div[contains(@id,'LocaleSelectedOptionView')]",
    ownerSelectedOption: "//div[contains(@id,'PrincipalSelectedOptionView')]",
    removedPrincipal: "//div[contains(@id,'RemovedPrincipalSelectedOptionView')]",
    scheduleForm: `//div[contains(@id,'ScheduleWizardStepForm')]`,
};

class EditDetailsDialog extends Page {

    get scheduleValidationRecord() {
        return xpath.scheduleForm + lib.OCCURRENCE_ERROR_BLOCK;
    }

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
        await this.waitForApplyButtonDisplayed();
        await this.pause(300);
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
            throw new Error('Edit Details dialog, language selector :' + err);
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
            await this.saveScreenshot(appConst.generateRandomName('err_pr_wizard_language'));
            throw new Error('Edit Details dialog, error during getting the selected language. ' + err);
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

    typeOnlineFrom(value) {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.typeOnlineFrom(value, xpath.container);
    }

    async getOnlineFrom() {
        let dateTimeRange = new DateTimeRange();
        return await dateTimeRange.getOnlineFrom(xpath.container);
    }

    getOnlineTo() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.getOnlineTo(xpath.container);
    }

    typeOnlineTo(value) {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.typeOnlineTo(value, xpath.container);
    }


    waitForValidationRecording() {
        let dateTimeRange = new DateTimeRange();
        return this.waitForElementDisplayed(this.scheduleValidationRecord, appConst.shortTimeout);
    }

    getScheduleValidationRecord() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.getValidationRecord(xpath.scheduleForm);
    }

    waitForScheduleFormDisplayed() {
        return this.waitUntilDisplayed(xpath.scheduleForm, appConst.shortTimeout);
    }

    async waitForScheduleFormNotDisplayed() {
        try {
            await this.waitForElementNotDisplayed(xpath.container + xpath.scheduleForm, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_schedule_form');
            await this.saveScreenshot(screenshot);
            throw new Error(`Error - Schedule form should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    waitForOnlineToInputDisplayed() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.waitForOnlineToInputDisplayed(xpath.container);
    }

    waitForOnlineFromInputDisplayed() {
        let dateTimeRange = new DateTimeRange();
        return dateTimeRange.waitForOnlineFromInputDisplayed(xpath.container);
    }

}

module.exports = EditDetailsDialog;
