/**
 * Created  on 22.02.2023
 */
const Page = require('../page');
const {BUTTONS} = require('../../libs/elements');
const LocaleSelectorDropdown = require('../components/selectors/locale.selector.dropdown');
const PrincipalComboBox = require('../components/selectors/principal.combobox.dropdown')

const xpath = {
    container: `//div[@data-component='EditPropertiesDialog']`,
    dialogTitle: "//div[contains(@id,'EditDetailsDialogHeader') and child::h2[@class='title']]",
    removeLanguageButton: `//div[@data-component="LanguageSelector"]/..//div[@role="grid"]//button[@type="button"]`,
    removeOwnerButton: `//div[@data-component="PrincipalSelector"]/..//div[@role="grid"]//button[@type="button"]`,
    // span with language display text — aria-hidden ancestor excludes the flag icon
    languageSelectedText: `//div[@data-component='LanguageSelector']/..//div[@role='grid']//span[not(ancestor::*[@aria-hidden='true'])]`,
    // grid row — used for waitForSelectedLanguageNotDisplayed after removal
    languageGridRow: `//div[@data-component='LanguageSelector']/..//div[@role='grid']//div[@role='row']`,
    // display-name span inside ItemLabel — leading-5.5 distinguishes it from the "SU" avatar span (text-xs)
    ownerDisplayName: `//div[@data-component='PrincipalSelector']/..//div[@role='grid']//span[contains(@class,'leading-5.5')]`,
    scheduleForm: `//div[contains(@id,'ScheduleWizardStepForm')]`,
};

// Language and owner properties
class EditPropertiesDialog extends Page {

    get closeButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Close');
    }

    get applyButton() {
        return xpath.container + BUTTONS.buttonAriaLabel('Apply');
    }

    get languageFilterInput() {
        let localeSelectorDropdown = new LocaleSelectorDropdown(xpath.container);
        return localeSelectorDropdown.optionsFilterInput();
    }

    get removeLanguageButton() {
        return xpath.container + xpath.removeLanguageButton;
    }

    get removeOwnerButton() {
        return xpath.container + xpath.removeOwnerButton;
    }

    async clickOnCloseButton() {
        await this.waitForElementDisplayed(this.closeButton);
        await this.clickOnElement(this.closeButton);
        await this.pause(300);
    }

    async waitForApplyButtonDisplayed() {
        return await this.waitForElementDisplayed(this.applyButton);
    }

    waitForApplyButtonEnabled() {
        return this.waitForElementEnabled(this.applyButton);
    }

    waitForApplyButtonDisabled() {
        return this.waitForElementDisabled(this.applyButton);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(xpath.container);
            await this.waitForApplyButtonDisplayed();
        } catch (err) {
            await this.handleError('Edit Setting dialog was not loaded', 'err_edit_settings_loaded', err)
        }
    }

    async waitForClosed() {
        await this.waitForElementNotDisplayed(xpath.container);
    }

    async clickOnApplyButton() {
        await this.waitForApplyButtonDisplayed();
        await this.waitForApplyButtonEnabled();
        await this.clickOnElement(this.applyButton);
        await this.waitForClosed();
        return await this.pause(700);
    }

    async filterOptionsAndSelectLanguage(language) {
        try {
            let localeSelectorDropdown = new LocaleSelectorDropdown(xpath.container);
            await localeSelectorDropdown.clickOnFilteredLanguage(language);
        } catch (err) {
            await this.handleError('Edit Setting dialog, language selector', 'err_lang_option', err);
        }
    }

    async filterOptionsAndSelectOwner(owner) {
        try {
            let principalComboBox = new PrincipalComboBox(xpath.container);
            await principalComboBox.selectFilteredUser(owner);
            return await this.pause(200);
        } catch (err) {
            await this.handleError('Edit Setting dialog, owner selector', 'err_owner_option', err);
        }
    }

    async getSelectedLanguage() {
        try {
            let selector = xpath.container + xpath.languageSelectedText;
            await this.waitForElementDisplayed(selector);
            return await this.getText(selector);
        } catch (err) {
            await this.handleError('Edit Setting dialog, the selected language is not displayed', 'err_lang_display', err);
        }
    }

    async waitForSelectedLanguageNotDisplayed() {
        let selector = xpath.container + xpath.languageGridRow;
        return await this.waitForElementNotDisplayed(selector);
    }

    async getSelectedOwner() {
        let selector = xpath.container + xpath.ownerDisplayName;
        return await this.getText(selector);
    }

    async clickOnRemoveLanguage() {
        try {
            await this.clickOnElement(this.removeLanguageButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Edit Setting dialog, error when removing the language', 'err_click_remove_lang', err);
        }
    }

    async clickOnRemoveOwner() {
        try {
            await this.clickOnElement(this.removeOwnerButton);
            return await this.pause(500);
        } catch (err) {
            await this.handleError('Edit Setting dialog, error when removing the owner', 'err_click_remove_owner', err);
        }
    }

    isLanguageOptionsFilterVisible() {
        return this.isElementDisplayed(this.languageFilterInput);
    }

   async waitForLanguageOptionsFilterDisplayed() {
        return await this.waitForElementDisplayed(this.languageFilterInput);
    }
}

module.exports = EditPropertiesDialog;
