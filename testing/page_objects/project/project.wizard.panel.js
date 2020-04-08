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
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    radioButtonByDescription: descr => XPATH.projectReadAccessWizardStepForm +
                                       `//span[contains(@id,'RadioButton') and descendant::label[contains(.,'${descr}')]]`,
};

class ProjectWizardPanel extends Page {
    get projectNameInput() {
        return XPATH.container + lib.formItemByLabel("Project name") + lib.TEXT_INPUT;
    }

    get projectNameValidationMessage() {
        return XPATH.container + lib.formItemByLabel("Project name") + "//span[@class='error']";
    }

    get displayNameInput() {
        return XPATH.container + XPATH.displayNameInput;
    }

    get projectAccessControlComboBox() {
        return XPATH.container + XPATH.projectAccessControlComboBox;
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

    async getProjectNameValidationMessage() {
        await this.waitForElementDisplayed(this.projectNameValidationMessage, appConst.TIMEOUT_2)
        return await this.getText(this.projectNameValidationMessage);
    }

    async getProjectNameValidationMessageNotVisible() {
        return await this.waitForElementNotDisplayed(this.projectNameValidationMessage, appConst.TIMEOUT_2);
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

    async waitForCancelButtonDisplayed() {
        try {
            return await this.waitForElementDisplayed(this.cancelButton, appConst.TIMEOUT_2);
        } catch (err) {
            throw new Error("New Setting Item dialog - Cancel button is not displayed :" + err);
        }
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

    waitForCancelButtonTopDisplayed() {
        return this.waitForElementDisplayed(this.cancelButtonTop, appConst.TIMEOUT_2);
    }

    async typeName(name) {
        await this.waitForElementDisplayed(this.displayNameInput)
        return await this.typeTextInInput(this.displayNameInput, name);
    }

    typeDescription(description) {
        return this.typeTextInInput(this.descriptionInput, description);
    }

    getDescription() {
        return this.getTextInInput(this.descriptionInput);
    }

    getProjectName() {
        return this.getTextInInput(this.projectNameInput);
    }

    waitForProjectNameInputDisabled() {
        return this.waitForElementDisabled(this.projectNameInput, appConst.TIMEOUT_2);
    }

    async typeInProjectName(name) {
        await this.waitForElementDisplayed(this.projectNameInput);
        await this.clearInputText(this.projectNameInput);
        return await this.typeTextInInput(this.projectNameInput, name);
    }

    waitForDescriptionInputDisplayed() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.TIMEOUT_2);
    }

    waitForProjectNameInputDisplayed() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.TIMEOUT_2);
    }

    waitForProjectAccessSelectorDisplayed() {
        return this.waitForElementDisplayed(this.projectAccessControlComboBox);
    }

    async selectProjectAccessItem(principalDisplayName) {
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
        await comboBox.typeTextAndSelectOption(principalDisplayName, XPATH.container + XPATH.projectReadAccessWizardStepForm);
        console.log("Project Wizard, principal is selected: " + principalDisplayName);
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

    async clickOnReadAccessRadio(access) {
        let selector = XPATH.radioButtonByDescription(access) + "/input[@type='radio']";
        await this.waitForElementDisplayed(XPATH.radioButtonByDescription(access), appConst.TIMEOUT_2);
        return await this.clickOnElement(selector);
    }

    waitForCustomReadAccessComboboxDisabled() {
        let selector = XPATH.projectReadAccessWizardStepForm + lib.COMBO_BOX_OPTION_FILTER_INPUT;
        return this.waitForElementDisabled(selector, appConst.TIMEOUT_2);
    }

    waitForCustomReadAccessComboboxEnabled() {
        let selector = XPATH.projectReadAccessWizardStepForm + lib.COMBO_BOX_OPTION_FILTER_INPUT;
        return this.waitForElementEnabled(selector, appConst.TIMEOUT_2);
    }
};
module.exports = ProjectWizardPanel;
