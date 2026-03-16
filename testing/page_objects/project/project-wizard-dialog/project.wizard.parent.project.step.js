/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectsComboBox = require('../../components/projects/projects.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Optional content layering')]]",
    projectSelectedOptionView: "//div[contains(@id,'ProjectSelectedOptionView')]",
    parentProjectComboboxDiv: "//div[contains(@id,'ProjectsSelector')]",
};
const DESCRIPTION = "To set up synchronization of a content with another project, select it here (optional)";

class ProjectWizardDialogParentProjectStep extends ProjectWizardDialog {

    get container(){
        return XPATH.container;
    }

    async waitForProjectOptionsFilterInputDisplayed() {
        let projectsComboBox = new ProjectsComboBox();
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
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.typeTextInSearchInput(text);
        await projectsComboBox.clickOnFilteredByDisplayNameItem(projectDisplayName, XPATH.container);
        return await this.pause(400);
    }

    // Type a name (description) in the filter input then click on the filtered item
    async selectParentProject(projectDisplayName) {
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.typeTextInSearchInput(projectDisplayName);
        await projectsComboBox.clickOnFilteredByDisplayNameItem(projectDisplayName);
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
        await this.typeTextInInput(this.projectOptionsFilterInput, text);
    }

    // Projects Combobox: selects an option in the dropdown - clicks on the filtered option:
    async clickOnFilteredProjectsOption(projectDisplayName) {
        try {
            let projectsComboBox = new ProjectsComboBox();
            let optionLocator = projectsComboBox.buildLocatorForOptionByDisplayName(projectDisplayName, XPATH.container);
            await projectsComboBox.selectFilteredByDisplayNameAndClickOnApply(optionLocator);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('parent_proj_combobox');
            throw new Error("Error occurred in Projects Combobox, during clicking on the filtered option:" + screenshot + ' ' + err);
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
        await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    async isSelectedParentProjectDisplayed() {
        return this.isElementDisplayed(XPATH.container + XPATH.projectSelectedOptionView);
    }
}

module.exports = ProjectWizardDialogParentProjectStep;

