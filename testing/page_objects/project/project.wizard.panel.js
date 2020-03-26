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
    selectedAccessItems: "//div[contains(@id,'ProjectACESelectedOptionsView')]",
    projectAccessControlComboBox: "//div[contains(@id,'ProjectAccessControlComboBox')]",
    accessItemByName:
        name => `//div[contains(@id,'PrincipalContainerSelectedOptionView') and descendant::p[contains(@class,'sub-name') and contains(.,'${name}')]]`,

};

class ProjectWizardPanel extends Page {
    get projectNameInput() {
        return XPATH.container + lib.formItemByLabel("Project name") + lib.TEXT_INPUT;
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

    async waitAndClickOnSave() {
        await this.waitForSaveButtonEnabled();
        await this.clickOnElement(this.saveButton);
        return await this.pause(200);
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(this.descriptionInput, appConst.TIMEOUT_2).catch(err => {
            this.saveScreenshot('err_open_insert_anchor_dialog');
            throw new Error('Project Wizard was not loaded!' + err);
        });
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.TIMEOUT_2);
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

    async selectAccessItem(principalDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(principalDisplayName, XPATH.container);
        console.log("Project Wizard, principal is selected: " + principalDisplayName);
        return await this.pause(300);
    }

    async getSelectedAccessItems() {
        let selector = XPATH.container + XPATH.selectedAccessItems + lib.H6_DISPLAY_NAME;
        let isDisplayed = await this.isElementDisplayed(XPATH.container + XPATH.selectedAccessItems);
        if (isDisplayed) {
            return await this.getTextInElements(selector);
        } else {
            return [];
        }
    }

    async removeAccessItem(principalName) {
        try {
            let selector = XPATH.container + XPATH.accessItemByName(principalName) + lib.REMOVE_ICON;
            await this.clickOnElement(selector);
            return await this.pause(300);
        } catch (err) {
            this.saveScreenshot("err_remove_access_entry");
            throw new Error("Error when trying to remove project Access Item " + err);
        }
    }

    clickOnDeleteButton() {
        return this.clickOnElement(this.deleteButton);
    }

    hotKeyClose() {
        return this.getBrowser().keys(['Alt', 'w']);
    }
};
module.exports = ProjectWizardPanel;
