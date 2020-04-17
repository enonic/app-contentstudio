const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBox = require('../components/loader.combobox');

const XPATH = {
    settingsContainer: "//div[contains(@id,'SettingsAppContainer')]",
    container: `//div[contains(@id,'ProjectWizardPanel')]`,
    displayNameInput: `//input[contains(@name,'displayName')]`,
    tabTitle: "//li[contains(@id,'AppBarTabMenuItem')]",
    toolbar: `//div[contains(@id,'Toolbar')]`,
    saveButton: `//button[contains(@id,'ActionButton') and child::span[text()='Save']]`,
    deleteButton: `//button[contains(@id,'ActionButton') and child::span[text()='Delete']]`,
    selectedProjectAccessOptions: "//div[contains(@id,'ProjectACESelectedOptionsView')]",
    selectedReadAccessOptions: "//div[contains(@id,'PrincipalSelectedOptionsView')]",
    selectedReadAccessOption: "//div[contains(@id,'PrincipalSelectedOptionView')]",
    projectAccessControlComboBox: "//div[contains(@id,'ProjectAccessControlComboBox')]",
    projectReadAccessWizardStepForm: "//div[contains(@id,'ProjectReadAccessWizardStepForm')]",
    accessFormItem: "//div[contains(@id,'ProjectFormItem') and contains(@class,'access')]",
    localeComboBoxDiv: "//div[contains(@id,'LocaleComboBox')]",
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    radioButtonByDescription: descr => XPATH.projectReadAccessWizardStepForm +
                                       `//span[contains(@id,'RadioButton') and descendant::label[contains(.,'${descr}')]]`,
};

class ProjectWizardPanel extends Page {
    get projectIdentifierInput() {
        return XPATH.container + lib.formItemByLabel("Identifier") + lib.TEXT_INPUT;
    }

    get projectIdentifierValidationMessage() {
        return XPATH.container + lib.formItemByLabel("Identifier") + "//div[contains(@id,'ValidationRecordingViewer')]//li";
    }

    get displayNameInput() {
        return XPATH.container + XPATH.displayNameInput;
    }

    get rolesComboBox() {
        return XPATH.container + XPATH.projectAccessControlComboBox;
    }

    get customReadAccessCombobox() {
        return XPATH.projectReadAccessWizardStepForm + XPATH.accessFormItem + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get localeCombobox() {
        return XPATH.projectReadAccessWizardStepForm + XPATH.localeComboBoxDiv + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get saveButton() {
        return XPATH.container + XPATH.toolbar + XPATH.saveButton;
    }

    get deleteButton() {
        return XPATH.container + XPATH.toolbar + XPATH.deleteButton;
    }

    get descriptionInput() {
        return XPATH.container + lib.formItemByLabel("Description") + lib.TEXT_INPUT;
    }

    get selectedCustomReadAccessOptions() {
        return XPATH.container + XPATH.selectedReadAccessOptions + XPATH.selectedReadAccessOption
    }

    async waitAndClickOnSave() {
        await this.waitForSaveButtonEnabled();
        await this.clickOnElement(this.saveButton);
        return await this.pause(200);
    }

    async getProjectIdentifierValidationMessage() {
        await this.waitForElementDisplayed(this.projectIdentifierValidationMessage, appConst.TIMEOUT_2);
        return await this.getText(this.projectIdentifierValidationMessage);
    }

    async getProjectIdentifierValidationMessageNotVisible() {
        return await this.waitForElementNotDisplayed(this.projectIdentifierValidationMessage, appConst.TIMEOUT_2);
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_open_insert_anchor_dialog');
            throw new Error('Project Wizard was not loaded!' + err);
        });
    }

    waitForWizardClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_5);
    }

    getTabTitle() {
        return this.getText(XPATH.settingsContainer + XPATH.tabTitle);
    }

    async waitForSaveButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.saveButton, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("Save button is not enabled :" + err);
        }
    }

    async waitForSaveButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.saveButton, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("Save button is not disabled :" + err);
        }
    }

    async waitForDeleteButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.deleteButton, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("Delete button is not disabled :" + err);
        }
    }

    async waitForDeleteButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.deleteButton, appConst.TIMEOUT_10);
        } catch (err) {
            throw new Error("Delete button is not enabled :" + err);
        }
    }

    async typeDisplayName(name) {
        await this.waitForElementDisplayed(this.displayNameInput)
        return await this.typeTextInInput(this.displayNameInput, name);
    }

    typeDescription(description) {
        return this.typeTextInInput(this.descriptionInput, description);
    }

    getDescription() {
        return this.getTextInInput(this.descriptionInput);
    }

    getProjectIdentifier() {
        return this.getTextInInput(this.projectIdentifierInput);
    }

    async getSelectedLanguage() {
        try {
            let selector = XPATH.container + lib.SELECTED_LOCALE;
            await this.waitForElementDisplayed(selector, 1000);
            return await this.getText(selector);
        } catch (err) {
            this.saveScreenshot("err_selected_locale");
            throw new Error("Selected language was not found " + err);
        }

    }

    waitForProjectIdentifierInputDisabled() {
        return this.waitForElementDisabled(this.projectIdentifierInput, appConst.TIMEOUT_2);
    }

    async typeInProjectIdentifier(identifier) {
        await this.waitForElementDisplayed(this.projectIdentifierInput);
        await this.clearInputText(this.projectIdentifierInput);
        return await this.typeTextInInput(this.projectIdentifierInput, identifier);
    }

    waitForDescriptionInputDisplayed() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.TIMEOUT_2);
    }

    waitForProjectIdentifierInputDisplayed() {
        return this.waitForElementDisplayed(this.projectIdentifierInput, appConst.TIMEOUT_2);
    }

    waitForRolesComboboxDisplayed() {
        return this.waitForElementDisplayed(this.rolesComboBox);
    }

    //Add(Roles) principal with access:
    async selectProjectAccessRoles(principalDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(principalDisplayName, XPATH.container + XPATH.projectAccessControlComboBox);
        console.log("Project Wizard, principal is selected: " + principalDisplayName);
        return await this.pause(300);
    }

    async getSelectedProjectAccessItems() {
        let selector = XPATH.container + XPATH.selectedProjectAccessOptions + lib.H6_DISPLAY_NAME;
        let isDisplayed = await this.isElementDisplayed(XPATH.container + XPATH.selectedProjectAccessOptions);
        if (isDisplayed) {
            return await this.getTextInElements(selector);
        } else {
            return [];
        }
    }

    async removeProjectAccessItem(principalName) {
        try {
            let selector = XPATH.container + XPATH.projectAccessControlComboBox + XPATH.accessItemByName(principalName) + lib.REMOVE_ICON;
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot("err_remove_access_entry");
            throw new Error("Error when trying to remove project Access Item " + err);
        }
    }

    async selectCustomReadAccessItem(principalDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(principalDisplayName, XPATH.projectReadAccessWizardStepForm + XPATH.accessFormItem);
        console.log("Project Wizard, principal is selected: " + principalDisplayName);
        return await this.pause(300);
    }

    async selectLanguage(language) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(language, XPATH.projectReadAccessWizardStepForm + XPATH.localeComboBoxDiv);
        console.log("Project Wizard, language is selected: " + language);
        return await this.pause(300);
    }

    async getSelectedCustomReadAccessOptions() {
        let h6_element = this.selectedCustomReadAccessOptions + lib.H6_DISPLAY_NAME;
        let isDisplayed = await this.isElementDisplayed(this.selectedCustomReadAccessOptions);
        if (isDisplayed) {
            return await this.getTextInElements(h6_element);
        } else {
            return [];
        }
    }

    clickOnDeleteButton() {
        return this.clickOnElement(this.deleteButton);
    }

    hotKeyClose() {
        return this.getBrowser().keys(['Alt', 'w']);
    }

    //Click on radio button and selects 'Access mode'
    async clickOnAccessModeRadio(mode) {
        let selector = XPATH.radioButtonByDescription(mode) + "/input[@type='radio']";
        await this.waitForElementDisplayed(XPATH.radioButtonByDescription(mode), appConst.TIMEOUT_2);
        return await this.clickOnElement(selector);
    }

    async isAccessModeRadioSelected(mode) {
        let selector = XPATH.radioButtonByDescription(mode) + "/input[@type='radio']";
        await this.waitForElementDisplayed(XPATH.radioButtonByDescription(mode), appConst.TIMEOUT_2);
        return await this.isSelected(selector);
    }

    waitForCustomAccessModeComboboxDisabled() {
        return this.waitForElementDisabled(this.customReadAccessCombobox, appConst.TIMEOUT_2);
    }

    waitForCustomReadAccessComboboxEnabled() {
        return this.waitForElementEnabled(this.customReadAccessCombobox, appConst.TIMEOUT_2);
    }
};
module.exports = ProjectWizardPanel;
