/**
 * Created on 05.08.2022
 */
const appConst = require('../../../libs/app_const');
const ProjectsComboBox = require('../../components/projects/projects.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');
const LocaleSelectorDropdown = require("../../components/selectors/locale.selector.dropdown");

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Language and content layering')]]",
    projectSelectedOptionView: "//div[contains(@id,'ProjectSelectedOptionView')]",
    parentProjectComboboxDiv: "//div[contains(@id,'ProjectsSelector')]",
};
const DESCRIPTION = "To set up synchronization of a content with another project, select it here (optional)";

class ProjectWizardDialogParentProjectStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    async waitForProjectOptionsFilterInputDisplayed() {
        let projectsComboBox = new ProjectsComboBox(XPATH.container);
        return await projectsComboBox.waitForSearchInputDisplayed();
    }

    //multiInheritance = true
    async selectParentParentProjects(names) {
        for (let name of names) {
            await this.selectParentProjectMulti(name);
        }
    }

    // Type a text (description) in the filter input then click on filtered item then click on 'OK' button and apply selection
    async typeTextInOptionFilterInputAndSelectOption(text, projectDisplayName) {
        try {
            let projectsComboBox = new ProjectsComboBox(XPATH.container);
            await projectsComboBox.typeTextInSearchInput(text);
            await projectsComboBox.clickOnOptionByDisplayName(projectDisplayName);
            await projectsComboBox.clickOnApplySelectionButton();
            return await this.pause(400);
        } catch (err) {
            await this.handleError(
                `Parent project step, search text: ${text} , error occurred during selecting a parent project: ${projectDisplayName}`,
                'err_select_parent_project', err);
        }
    }

    // Type a name (description) in the filter input then click on the filtered item
    async selectParentProject(projectDisplayName) {
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.typeTextInSearchInput(projectDisplayName);
        await projectsComboBox.clickOnOptionByDisplayName(projectDisplayName);
        console.log("Project Wizard, parent project is selected: " + projectDisplayName);
        return await this.pause(400);
    }

    async selectParentProjectMulti(projectDisplayName) {
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.selectFilteredByDisplayNameAndClickOnApply(projectDisplayName);
        console.log("Project Wizard, parent project is selected: " + projectDisplayName);
        return await this.pause(1000);
    }

    async getSelectedProjects() {
        try {
            let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.H6_DISPLAY_NAME;
            await this.pause(1000);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_proj_parent_step_selected_tems');
            throw new Error(`Project Wizard, parent step, screenshot:${screenshot} ` + err);
        }
    }

    // Types a text in Options Filter Input in Projects Combobox:
    async typeTextInProjectsOptionsFilterInput(text) {
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.typeTextInSearchInput(text);
    }

    // Projects Combobox: selects an option in the dropdown - clicks on the filtered option:
    async clickOnFilteredProjectsOption(projectDisplayName) {
        try {
            let projectsComboBox = new ProjectsComboBox(XPATH.container);
            let optionLocator = projectsComboBox.buildLocatorForOptionByDisplayName(projectDisplayName, XPATH.container);
            await projectsComboBox.selectFilteredByDisplayNameAndClickOnApply(optionLocator);
            return await this.pause(400);
        } catch (err) {
            await this.handleError(`Error occurred in Projects Combobox, during clicking on the filtered option: ${projectDisplayName}`,
                'err_click_filtered_option', err);
        }
    }

    // Clicks on Apply button in the Projects Combobox:
    async clickOnApplyButtonInProjectsDropdown() {
        try {
            let projectsComboBox = new ProjectsComboBox();
            return await projectsComboBox.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('parent_proj_combobox');
            throw new Error(`Error occurred in Projects Combobox, screenshot:${screenshot} ` + err);
        }
    }

    async clickOnRemoveSelectedProjectIcon(displayName) {
        let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.itemByDisplayName(displayName) + '/../..' + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        await this.pause(300);
    }

    async getSelectedProject() {
        let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
            await this.pause(1000);
        } catch (err) {
            await this.handleError('Project Wizard Dialog, parent project step was not loaded', 'err_parent_proj_step', err);
        }
    }

    async isSelectedParentProjectDisplayed() {
        return this.isElementDisplayed(XPATH.container + XPATH.projectSelectedOptionView);
    }

    async selectLanguage(language) {
        if (!language) {
            return;
        }
        try {
            let localeSelectorDropdown = new LocaleSelectorDropdown(XPATH.container);
            await localeSelectorDropdown.clickOnFilteredLanguage(language);
            console.log('Project Wizard, language is selected: ' + language);
            return await this.pause(300);
        } catch (err) {
            await this.handleError('Error occurred during selecting a language in parent project step', 'err_select_language', err);
        }
    }

    async waitForLanguageFilterInputDisplayed() {
        let localeSelectorDropdown = new LocaleSelectorDropdown(XPATH.container);
        return await localeSelectorDropdown.waitForOptionFilterInputDisplayed();
    }
}

module.exports = ProjectWizardDialogParentProjectStep;

