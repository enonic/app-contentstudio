/**
 * Created on 05.08.2022
 */
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Summary')]]",
    createProjectButton: "//button[contains(@id,'DialogButton') and child::span[text()='Create Project']]",
    projectNameXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Project name/id']]/following-sibling::div[contains(@id,'SummaryValueContainer')]/h6",
    accessModeValueXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Access mode']]/following-sibling::div[contains(@id,'AccessValueContainer')]/h6",
    parentProjectNameXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Parent project']]/following-sibling::div[contains(@id,'ProjectsValueContainer')]/h6",
    defaultLanguageXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Default language']]/following-sibling::div[contains(@id,'LanguageValueContainer')]//h6[contains(@class,'main-name')]",
};
const DESCRIPTION = 'View summary of a new project';


class ProjectWizardDialogSummaryStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    get accessMode() {
        return XPATH.container + XPATH.accessModeValueXpath;
    }

    get defaultLanguage() {
        return XPATH.container + XPATH.defaultLanguageXpath;
    }

    get projectName() {
        return XPATH.container + XPATH.projectNameXpath;
    }

    get parentProjectName() {
        return XPATH.container + XPATH.parentProjectNameXpath;
    }

    get createProjectButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Create Project');
    }

    get updateProjectButton() {
        return XPATH.container + BUTTONS.buttonAriaLabel('Update Project');
    }
    async clickOnCreateProjectButton() {
        await this.waitForElementDisplayed(this.createProjectButton);
        await this.clickOnElement(this.createProjectButton);
    }

    async clickOnUpdateProjectButton() {
        await this.waitForElementDisplayed(this.updateProjectButton);
        await this.clickOnElement(this.updateProjectButton);
    }

    async getAccessMode() {
        try {
            await this.waitForElementDisplayed(this.accessMode, appConst.mediumTimeout);
            return await this.getText(this.accessMode);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_summary_step');
            throw new Error("Summary step, access mode, screenshot:" + screenshot + "  " + err);
        }
    }

    async getParentProjectName() {
        try {
            await this.waitForElementDisplayed(this.parentProjectName, appConst.mediumTimeout);
            return await this.getText(this.parentProjectName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_summary_step');
            throw new Error("Summary step, parent project name, screenshot:" + screenshot + "  " + err);
        }
    }

    async getDefaultLanguage() {
        try {
            await this.waitForElementDisplayed(this.defaultLanguage, appConst.mediumTimeout);
            return await this.getText(this.defaultLanguage);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_summary_step');
            throw new Error("Summary step, parent project name, screenshot:" + screenshot + "  " + err);
        }
    }

    async getProjectName() {
        try {
            await this.waitForElementDisplayed(this.projectName, appConst.mediumTimeout);
            return await this.getText(this.projectName);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_summary_step');
            throw new Error("Summary step, project name, screenshot:" + screenshot + "  " + err);
        }
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError("Project Wizard Dialog, Summary step was not loaded", 'err_name_step', err);
        }
    }
}

module.exports = ProjectWizardDialogSummaryStep;
