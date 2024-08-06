/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectsComboBox = require('../../components/projects/projects.comboBox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectSelectedOptionView: "//div[contains(@id,'ProjectSelectedOptionView')]",
    parentProjectComboboxDiv: "//div[contains(@id,'ProjectsSelector')]",
};
const DESCRIPTION = "To set up synchronization of a content with another project, select it here (optional)";

class ProjectWizardDialogParentProjectStep extends ProjectWizardDialog {

    get projectOptionsFilterInput() {
        return XPATH.container + lib.OPTION_FILTER_INPUT;
    }

    waitForProjectOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.projectOptionsFilterInput, appConst.mediumTimeout);
    }

    waitForProjectOptionsFilterInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.projectOptionsFilterInput, appConst.mediumTimeout);
    }

    async selectParentProject(projectDisplayName) {
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.selectFilteredByDisplayNameAndClickOnOk(projectDisplayName);
        console.log("Project Wizard, parent project is selected: " + projectDisplayName);
        return await this.pause(400);
    }

    async selectParentProjectById(projectId) {
        let projectsComboBox = new ProjectsComboBox();
        await projectsComboBox.selectFilteredByIdAndClickOnOk(projectId);
        return await this.pause(400);
    }

    async getSelectedProjects() {
        try {
            let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.H6_DISPLAY_NAME;
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_proj_parent_step');
            throw new Error("Project Wizard, parent step, screenshot: " + screenshot + "  " + err);
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
            await projectsComboBox.selectFilteredByDisplayNameAndClickOnOk(optionLocator);
            return await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('parent_proj_combobox');
            throw new Error("Error occurred in Projects Combobox, during clicking on the filtered option:" + screenshot + ' ' + err);
        }
    }

    // Clicks on OK button in the Projects Combobox:
    async clickOnOKButtonInProjectsDropdown() {
        try {
            let projectsComboBox = new ProjectsComboBox();
            return await projectsComboBox.clickOnApplySelectionButton();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('parent_proj_combobox');
            throw new Error("Error occurred in Projects Combobox, screenshot:" + screenshot + ' ' + err);
        }
    }

    async clickOnRemoveSelectedProjectIcon() {
        let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
    }

    async getSelectedProject() {
        let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getText(locator);
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 1 is not loaded"});
    }

    async isSelectedParentProjectDisplayed() {
        return this.isElementDisplayed(XPATH.container + XPATH.projectSelectedOptionView);
    }
}

module.exports = ProjectWizardDialogParentProjectStep;

