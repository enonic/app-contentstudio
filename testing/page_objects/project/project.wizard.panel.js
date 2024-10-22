const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const ProjectApplicationsComboBox = require('../components/projects/project.applications.combobox');
const ProjectAccessControlComboBox = require('../components/projects/project.access.control.combobox');
const LocaleSelectorDropdown = require('../components/selectors/locale.selector.dropdown');
const ExtendedPrincipalComboBox = require('../components/projects/extended.principal.combobox');

const XPATH = {
    settingsContainer: "//div[contains(@id,'ContentAppBar')]",
    container: `//div[contains(@id,'ProjectWizardPanel')]`,
    displayNameInput: `//input[contains(@name,'displayName')]`,
    projectSelectedOptionViewDiv: "//div[contains(@id,'ProjectSelectedOptionView')]",
    tabTitle: "//li[contains(@id,'AppBarTabMenuItem')]",
    toolbar: `//div[contains(@id,'Toolbar')]`,
    selectedProjectAccessOptions: "//div[contains(@id,'ProjectACESelectedOptionsView')]",
    selectedReadAccessOptions: "//div[contains(@id,'PrincipalSelectedOptionsView')]",
    selectedReadAccessOption: "//div[contains(@id,'PrincipalSelectedOptionView')]",
    projectAccessControlComboBox: "//div[contains(@id,'ProjectAccessControlComboBox')]",
    projectReadAccessWizardStepForm: "//div[contains(@id,'ProjectReadAccessWizardStepForm')]",
    accessFormItem: "//div[contains(@id,'ProjectReadAccessFormItem')]",
    localeComboBoxDiv: "//div[contains(@id,'LocaleComboBox')]",
    projectApplicationsComboboxDiv: "//div[contains(@id, 'ProjectApplicationsComboBox')]",
    languageSelectedOption: "//div[contains(@id,'LocaleSelectedOptionView')]",
    projectAccessSelectorTabMenu: "//div[contains(@id,'AccessSelector') and contains(@class,'tab-menu access-selector')]",
    selectedAppView: "//div[contains(@id,'ProjectSelectedApplicationViewer')]",
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,
    radioButtonByDescription: descr => XPATH.projectReadAccessWizardStepForm +
                                       `//span[contains(@id,'RadioButton') and descendant::label[contains(.,'${descr}')]]`,
    wizardStepByTitle:
        name => `//ul[contains(@id,'WizardStepNavigator')]//li[contains(@id,'TabBarItem') and @title='${name}']`,
    aclEntryByName: name => `//div[contains(@id,ProjectAccessControlEntryView) and descendant::h6[contains(@class,'main-name') and contains(.,'${name}')]]`,
    projectApplicationSelectedOptionByName: appName => `//div[contains(@id,'ProjectApplicationSelectedOptionView') and descendant::h6[contains(@class,'main-name') and contains(.,'${appName}')] ]`,
};

class ProjectWizardPanel extends Page {

    get toolbar() {
        return XPATH.toolbar;
    }

    get projectIdentifierInput() {
        return XPATH.container + lib.formItemByLabel('Identifier') + lib.TEXT_INPUT;
    }

    get displayNameInput() {
        return XPATH.container + XPATH.displayNameInput;
    }

    get rolesComboBox() {
        return XPATH.container + XPATH.projectAccessControlComboBox;
    }

    get customReadAccessOptionsFilterInput() {
        return XPATH.projectReadAccessWizardStepForm + XPATH.accessFormItem + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get localeOptionsFilterInput() {
        return XPATH.container + XPATH.localeComboBoxDiv + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get projectApplicationsOptionsFilterInput() {
        return XPATH.container + XPATH.projectApplicationsComboboxDiv + lib.DROPDOWN_SELECTOR.OPTION_FILTER_INPUT;
    }

    get saveButton() {
        return XPATH.container + XPATH.toolbar + lib.actionButtonStrict('Save');
    }

    get deleteButton() {
        return XPATH.container + XPATH.toolbar + lib.actionButtonStrict('Delete');
    }

    get descriptionInput() {
        return XPATH.container + lib.formItemByLabel('Description') + lib.TEXT_INPUT;
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

    async isProjectSelectorDisabled() {
        let locator = XPATH.container + "//div[contains(@id, 'ProjectsSelector')]";
        let classAttr = await this.getAttribute(locator, 'class');
        return classAttr.includes('disabled');
    }

    async getSelectedParentProjectsDisplayName() {
        let locator = XPATH.container + XPATH.projectSelectedOptionViewDiv + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitAndClickOnSave() {
        await this.waitForSaveButtonEnabled();
        await this.clickOnElement(this.saveButton);
        return await this.pause(1000);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(this.descriptionInput, appConst.shortTimeout)
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_wizard');
            throw new Error(`Project Wizard was not loaded! screenshot: ${screenshot} ` + err);
        }
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
            throw new Error("'Save' button is not enabled :" + err);
        }
    }

    async waitForSaveButtonDisabled() {
        try {
            let result = await this.getDisplayedElements(this.saveButton);
            if (result.length === 0) {
                await this.saveScreenshot('err_pr_wizard');
                throw new Error('Save button is not displayed!');
            }
            return await this.waitForElementDisabled(this.saveButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pr_wizard_save_btn');
            throw new Error(`Project Wizard Panel - Save button, screenshot :${screenshot} ` + err);
        }
    }

    async waitForDeleteButtonDisabled() {
        try {
            return await this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pr_wizard_delete_btn');
            throw new Error(`Delete button is not disabled, screenshot :${screenshot} ` + err);
        }
    }

    async waitForDeleteButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.deleteButton, appConst.longTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_pr_wizard_delete_btn');
            throw new Error(`Delete button is not enabled, screenshot: ${screenshot} ` + err);
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
            let screenshot = await this.saveScreenshotUniqueName('err_project_locale');
            throw new Error(`Selected language was not found, screenshot: ${screenshot} ` + err);
        }
    }

    waitForProjectIdentifierInputDisabled() {
        return this.waitForElementDisabled(this.projectIdentifierInput, appConst.mediumTimeout);
    }

    waitForDescriptionInputDisplayed() {
        return this.waitForElementDisplayed(XPATH.container, appConst.shortTimeout);
    }

    waitForLanguageDropdownDisplayed() {
        return this.waitForElementDisplayed(XPATH.container, appConst.shortTimeout);
    }

    async isNoModify() {
        let result = await this.getAttribute(XPATH.container, 'class');
        return result.includes('no-modify-permissions');
    }

    waitForRolesComboboxDisplayed() {
        return this.waitForElementDisplayed(this.rolesComboBox);
    }

    // Adds a user with the default role (Contributor) in Roles step form:
    async selectProjectAccessRoles(principalDisplayName) {
        let projectAccessControlComboBox = new ProjectAccessControlComboBox();
        await projectAccessControlComboBox.clickOnFilteredByDisplayNamePrincipalAndClickOnApply(principalDisplayName, XPATH.container);
        console.log('Project Wizard, principal is selected: ' + principalDisplayName);
        return await this.pause(1000);
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
        await this.saveScreenshot(appConst.generateRandomName(newRole));
        await this.pause(300);
        await this.clickOnElement(menuItem);
        return await this.pause(500);
    }

    // Roles dropdown selector - gets all names in ACL-entries in selected options:
    async getSelectedProjectAccessItems() {
        let selector = XPATH.container + XPATH.selectedProjectAccessOptions + lib.H6_DISPLAY_NAME;
        let isDisplayed = await this.isElementDisplayed(XPATH.container + XPATH.selectedProjectAccessOptions);
        if (isDisplayed) {
            return await this.getTextInElements(selector);
        } else {
            return [];
        }
    }

    // Gets user's role(Owner, Contributor..) in selected option in Roles-dropdown
    async getSelectedProjectAccessRole(userName) {
        let selector = XPATH.container + XPATH.aclEntryByName(userName) + XPATH.projectAccessSelectorTabMenu;
        let isDisplayed = await this.isElementDisplayed(selector);
        if (isDisplayed) {
            return await this.getTextInElements(selector);
        } else {
            return [];
        }
    }

    // clicks on remove icon and  remove a user from Roles form:
    async removeProjectAccessItem(principalName) {
        try {
            let selector = XPATH.container + XPATH.projectAccessControlComboBox + XPATH.accessItemByName(principalName) + lib.REMOVE_ICON;
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            await this.saveScreenshot('err_remove_access_entry');
            throw new Error('Error when trying to remove project Access Item ' + err);
        }
    }

    async selectUserInCustomReadAccess(principalDisplayName) {
        let extendedPrincipalComboBox = new ExtendedPrincipalComboBox();
        await extendedPrincipalComboBox.clickOnFilteredByDisplayNameUserAndClickOnApply(principalDisplayName,
            XPATH.projectReadAccessWizardStepForm);
        console.log('Project Wizard, principal is selected: ' + principalDisplayName);
        return await this.pause(300);
    }

    async selectLanguage(language) {
        let localeSelectorDropdown = new LocaleSelectorDropdown();
        await localeSelectorDropdown.clickOnFilteredLanguage(language);
        console.log('Project Wizard, language is selected: ' + language);
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

    // Click on radio button and selects 'Access mode'
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
            let result = await this.getAttribute(selector, 'class');
            return result.includes('expanded');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'Project access menu should be expanded!'});
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
        await this.clickOnWizardStep('Roles');
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
        await this.clickOnWizardStep('Roles');
        await this.clickOnElement(selector);
        await this.waitForProjectAccessSelectorTabMenuExpanded(principalName);
        await this.pause(1000);
        return await this.getTextInDisplayedElements(selector + "//li[contains(@id,'TabMenuItem')]//a");
    }

    async clickOnWizardStep(title) {
        let stepXpath = XPATH.wizardStepByTitle(title);
        await this.clickOnElement(stepXpath);
        return await this.pause(700);
    }

    async clickOnRemoveLanguage() {
        try {
            await this.waitForElementDisplayed(this.removeLanguageButton, appConst.mediumTimeout);
            await this.clickOnElement(this.removeLanguageButton);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_remove_icon');
            throw new Error(`Error occurred after clicking on remove language icon, screenshot: ${screenshot}  ` + err);
        }
    }

    waitForProjectApplicationsOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.projectApplicationsOptionsFilterInput, appConst.mediumTimeout);
    }

    waitForLanguageOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.localeOptionsFilterInput, appConst.mediumTimeout);
    }

    waitForLanguageOptionsFilterInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.localeOptionsFilterInput, appConst.mediumTimeout);
    }

    async selectApplication(appName) {
        try {
            let projectApplicationsComboBox = new ProjectApplicationsComboBox();
            //await this.waitForProjectApplicationsOptionsFilterInputDisplayed();
            await projectApplicationsComboBox.clickFilteredByAppNameItemAndClickOnOk(appName, XPATH.container);
            console.log('Project Wizard, application is selected: ' + appName);
            return await this.pause(300);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_wizard');
            throw new Error(`Error during selecting application, screenshot: ${screenshot}  ` + err);
        }
    }

    async getSelectedApplications() {
        try {
            let locator = XPATH.container + XPATH.selectedAppView + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.shortTimeout);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_apps');
            throw new Error(`Project apps were not found, screenshot: ${screenshot}  ` + err);
        }
    }

    async waitForRemoveAppIconNotDisplayed(appName) {
        try {
            let removeIconLocator = XPATH.container + XPATH.projectApplicationSelectedOptionByName(appName) + lib.REMOVE_ICON;
            await this.waitForElementNotDisplayed(removeIconLocator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_proj_wizard_page_remove_icon');
            throw new Error(`Project wizard page - 'remove app' icon should not be displayed, screenshot: ${screenshot} ` + err);
        }
    }

    async waitForRemoveAppIconDisplayed(appName) {
        try {
            let removeIconLocator = XPATH.container + XPATH.projectApplicationSelectedOptionByName(appName) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(removeIconLocator, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_proj_wizard_page_remove_icon');
            throw new Error(`Project wizard page - 'remove app' icon should be displayed, screenshot:${screenshot} ` + err);
        }
    }

    async clickOnRemoveApplicationIcon(appName) {
        try {
            let removeIcon = XPATH.container + XPATH.projectApplicationSelectedOptionByName(appName) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(removeIcon, appConst.mediumTimeout);
            await this.clickOnElement(removeIcon);
            return await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_remove_icon');
            throw new Error(`Error during clicking on remove application icon, screenshot: ${screenshot}` + err);
        }
    }

    async clickOnEditProjectConfig(appName) {
        let locator = XPATH.container + lib.PROJECTS.selectedProjectView(appName) + lib.EDIT_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    // check for Accessibility attributes: wizard-toolbar role
    async waitForToolbarRoleAttribute(expectedRole) {
        let locator = XPATH.container + XPATH.toolbar;
        await this.waitForAttributeValue(locator, 'role', expectedRole, appConst.shortTimeout);
    }

    // check for Accessibility attributes: wizard-toolbar aria-label:
    async waitForToolbarAriaLabelAttribute(expectedValue) {
        let locator = XPATH.container + XPATH.toolbar;
        await this.waitForAttributeValue(locator, 'aria-label', expectedValue, appConst.shortTimeout);
    }
}

module.exports = ProjectWizardPanel;
