const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ComboBox = require('../components/loader.combobox');

const XPATH = {
    settingsContainer: "//div[contains(@id,'ContentAppBar')]",
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
    languageSelectedOption: "//div[contains(@id,'LocaleSelectedOptionView')]",
    projectAccessSelectorTabMenu: "//div[contains(@id,'ProjectAccessSelector') and contains(@class,'tab-menu access-selector')]",
    parentProjectComboboxDiv: "//div[contains(@id,'ProjectsComboBox')]",
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    radioButtonByDescription: descr => XPATH.projectReadAccessWizardStepForm +
                                       `//span[contains(@id,'RadioButton') and descendant::label[contains(.,'${descr}')]]`,
    wizardStepByTitle:
        name => `//ul[contains(@id,'WizardStepNavigator')]//li[contains(@id,'TabBarItem') and @title='${name}']`,
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

    get customReadAccessOptionsFilterInput() {
        return XPATH.projectReadAccessWizardStepForm + XPATH.accessFormItem + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get localeOptionsFilterInput() {
        return XPATH.projectReadAccessWizardStepForm + XPATH.localeComboBoxDiv + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get projectsOptionsFilterInput() {
        return XPATH.container + XPATH.parentProjectComboboxDiv + lib.COMBO_BOX_OPTION_FILTER_INPUT;
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

    get removeLanguageButton() {
        return XPATH.container + XPATH.languageSelectedOption + lib.REMOVE_ICON;
    }

    isDescriptionInputClickable() {
        return this.isClickable(this.descriptionInput);
    }

    isDisplayNameInputClickable() {
        return this.isClickable(this.displayNameInput);
    }

    isLocaleOptionsFilterInputClickable() {
        return this.isClickable(this.localeOptionsFilterInput);
    }

    async waitAndClickOnSave() {
        await this.waitForSaveButtonEnabled();
        await this.clickOnElement(this.saveButton);
        return await this.pause(1000);
    }

    async getProjectIdentifierValidationMessage() {
        await this.waitForElementDisplayed(this.projectIdentifierValidationMessage, appConst.shortTimeout);
        return await this.getText(this.projectIdentifierValidationMessage);
    }

    async getProjectIdentifierValidationMessageNotVisible() {
        return await this.waitForElementNotDisplayed(this.projectIdentifierValidationMessage, appConst.shortTimeout);
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.shortTimeout).catch(err => {
            this.saveScreenshot('err_open_insert_anchor_dialog');
            throw new Error('Project Wizard was not loaded!' + err);
        });
    }

    waitForWizardClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.longTimeout);
    }

    getTabTitle() {
        return this.getText(XPATH.settingsContainer + XPATH.tabTitle);
    }

    async waitForSaveButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.saveButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Save button is not enabled :" + err);
        }
    }

    async waitForSaveButtonDisabled() {
        try {
            let result = await this.getDisplayedElements(this.saveButton);
            if (result.length === 0) {
                await this.saveScreenshot("err_pr_wizard");
                throw new Error("Save button is not disabled!");
            }
            return await this.waitForElementDisabled(this.saveButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Save button is not disabled :" + err);
        }
    }

    async waitForDeleteButtonDisabled() {
        try {
            let result = await this.getDisplayedElements(this.deleteButton);
            if (result.length === 0) {
                await this.saveScreenshot("err_pr_wizard");
                throw new Error("Delete button is not disabled!");
            }
            return await this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
        } catch (err) {
            throw new Error("Delete button is not disabled :" + err);
        }
    }

    async waitForDeleteButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.deleteButton, appConst.longTimeout);
        } catch (err) {
            throw new Error("Delete button is not enabled :" + err);
        }
    }

    async typeDisplayName(name) {
        await this.waitForElementDisplayed(this.displayNameInput);
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
            await this.waitForElementDisplayed(selector, appConst.shortTimeout);
            return await this.getText(selector);
        } catch (err) {
            this.saveScreenshot("err_selected_locale");
            throw new Error("Selected language was not found " + err);
        }
    }

    waitForProjectIdentifierInputDisabled() {
        return this.waitForElementDisabled(this.projectIdentifierInput, appConst.mediumTimeout);
    }

    waitForProjectIdentifierInputEnabled() {
        return this.waitForElementEnabled(this.projectIdentifierInput, appConst.shortTimeout);
    }

    async typeInProjectIdentifier(identifier) {
        await this.waitForElementDisplayed(this.projectIdentifierInput);
        await this.clearInputText(this.projectIdentifierInput);
        return await this.typeTextInInput(this.projectIdentifierInput, identifier);
    }

    waitForDescriptionInputDisplayed() {
        return this.waitForElementDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async isNoModify() {
        let result = await this.getAttribute(XPATH.container, "class");
        return result.includes("no-modify-permissions");
    }

    waitForProjectIdentifierInputDisplayed() {
        return this.waitForElementDisplayed(this.projectIdentifierInput, appConst.shortTimeout);
    }

    waitForRolesComboboxDisplayed() {
        return this.waitForElementDisplayed(this.rolesComboBox);
    }

    //Adds an user with the default role (Contributor) in Roles step form:
    async selectProjectAccessRoles(principalDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(principalDisplayName, XPATH.container + XPATH.projectAccessControlComboBox);
        console.log("Project Wizard, principal is selected: " + principalDisplayName);
        return await this.pause(1000);
    }

    //selects an project(parent) :
    async selectParentProject(projectDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(projectDisplayName, XPATH.container + XPATH.parentProjectComboboxDiv);
        console.log("Project Wizard, parent project is selected: " + projectDisplayName);
        return await this.pause(400);
    }

    //click on the role, open menu and select new role for the user:
    async updateUserAccessRole(userDisplayName, newRole) {
        let menuLocator = XPATH.container + XPATH.projectAccessControlComboBox + XPATH.accessItemByName(userDisplayName) +
                          "//div[contains(@id,'TabMenuButton')]";
        await this.waitForElementEnabled(menuLocator, appConst.mediumTimeout);
        await this.clickOnElement(menuLocator);
        await this.pause(400);
        let menuItem = XPATH.container + XPATH.projectAccessControlComboBox + XPATH.accessItemByName(userDisplayName) +
                       lib.tabMenuItem(newRole);
        await this.waitForElementDisplayed(menuItem, appConst.shortTimeout);
        await this.pause(300);
        await this.clickOnElement(menuItem);
        return await this.pause(500);
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

    //clicks on remove icon and  remove a user from Roles form:
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

    async selectUserInCustomReadAccess(principalDisplayName) {
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
        await this.waitForElementEnabled(XPATH.radioButtonByDescription(mode), appConst.shortTimeout);
        await this.pause(200);
        return await this.clickOnElement(selector);
    }

    async isAccessModeRadioSelected(mode) {
        let selector = XPATH.radioButtonByDescription(mode) + "/input[@type='radio']";
        await this.waitForElementDisplayed(XPATH.radioButtonByDescription(mode), appConst.shortTimeout);
        return await this.isSelected(selector);
    }

    waitForCustomAccessModeComboboxDisabled() {
        return this.waitForElementDisabled(this.customReadAccessOptionsFilterInput, appConst.mediumTimeout);
    }

    waitForCustomReadAccessComboboxEnabled() {
        return this.waitForElementEnabled(this.customReadAccessOptionsFilterInput, appConst.mediumTimeout);
    }

    async waitForProjectAccessSelectorTabMenuExpanded(principalName) {
        let selector = XPATH.container + XPATH.accessItemByName(principalName) + XPATH.projectAccessSelectorTabMenu;
        await this.getBrowser().waitUntil(async () => {
            let result = await this.getAttribute(selector, "class");
            return result.includes("expanded");
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Project access menu should be expanded!"});
    }

    getSelectedRoleInProjectAccessControlEntry(name) {
        let selector = XPATH.container + XPATH.accessItemByName(name) + XPATH.projectAccessSelectorTabMenu + "//a";
        return this.getText(selector);
    }

    addPrincipalsInRolesForm(memberDisplayNames) {
        let result = Promise.resolve();
        memberDisplayNames.forEach(displayName => {
            result = result.then(() => this.selectProjectAccessRoles(displayName));
        });
        return result;
    }

    async expandProjectAccessMenuAndSelectRole(principalName, role) {
        let selector = XPATH.container + XPATH.accessItemByName(principalName) + XPATH.projectAccessSelectorTabMenu;
        await this.clickOnWizardStep("Roles");
        await this.clickOnElement(selector);
        await this.waitForProjectAccessSelectorTabMenuExpanded(principalName);
        await this.pause(1000);
        await this.waitForElementDisplayed(selector + `//li[contains(@id,'TabMenuItem') and child::a[text()='${role}']]`,
            appConst.shortTimeout);
        await this.clickOnElement(selector + `//li[contains(@id,'TabMenuItem') and child::a[text()='${role}']]`);
        return await this.pause(500);
    }

    async getAvailableProjectAccessRoles(principalName) {
        let selector = XPATH.container + XPATH.accessItemByName(principalName) + XPATH.projectAccessSelectorTabMenu;
        await this.clickOnWizardStep("Roles");
        await this.clickOnElement(selector);
        await this.waitForProjectAccessSelectorTabMenuExpanded(principalName);
        await this.pause(1000);
        return await this.getTextInElements(selector + "//li[contains(@id,'TabMenuItem')]//a");
    }

    async clickOnWizardStep(title) {
        let stepXpath = XPATH.wizardStepByTitle(title);
        await this.clickOnElement(stepXpath);
        return await this.pause(900);
    }

    async clickOnRemoveLanguage() {
        try {
            await this.waitForElementDisplayed(this.removeLanguageButton);
            await this.clickOnElement(this.removeLanguageButton);
            return await this.pause(500);
        } catch (err) {
            this.saveScreenshot("err_click_on_remove_language_icon");
            throw new Error('Error when removing the language! ' + err);
        }
    }

    async waitForDisplayNameInputFocused() {
        let message = "Display Name input is not focused" + appConst.mediumTimeout;
        await this.getBrowser().waitUntil(async () => {
            return await this.isFocused(this.displayNameInput);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: message});
    }
}

module.exports = ProjectWizardPanel;
