/**
 * Created on 05.08.2022 updated on 27.05.2026
 */
const {BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');

// Each summary field is rendered as <div class="contents"><dt>Label</dt><dd>Value</dd></div>
// inside a <dl>. Scope to <dl> so we don't accidentally match the same pattern elsewhere.
const SUMMARY_DD_BY_LABEL = label =>
    `//dl//div[contains(@class,'contents') and child::dt[contains(.,'${label}')]]/dd`;

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Summary')]]",
    createProjectButton: "//button[contains(@id,'DialogButton') and child::span[text()='Create Project']]",
    projectNameXpath: SUMMARY_DD_BY_LABEL('Project name/id'),
    accessModeValueXpath: SUMMARY_DD_BY_LABEL('Access Mode'),
    parentProjectNameXpath: SUMMARY_DD_BY_LABEL('Parent project'),
    // Target the <span> directly: the dd also contains a flag icon with an aria-hidden 'en'
    // fallback label that would otherwise leak into getText() output.
    defaultLanguageXpath: SUMMARY_DD_BY_LABEL('Language') + "/span",
    // Multi-value rows: each value is a direct <span> child of the inner <div class="contents">.
    applications: SUMMARY_DD_BY_LABEL('Applications') + "/div[contains(@class,'contents')]/span",
    permissions: SUMMARY_DD_BY_LABEL('Permissions') + "/div[contains(@class,'contents')]/span",
    description: SUMMARY_DD_BY_LABEL('Description') + "/div[contains(@class,'contents')]/span",
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

    get applications() {
        return XPATH.container + XPATH.applications;
    }

    get permissions() {
        return XPATH.container + XPATH.permissions;
    }

    get description() {
        return XPATH.container + XPATH.description;
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
            await this.waitForElementDisplayed(this.accessMode);
            return await this.getText(this.accessMode);
        } catch (err) {
            await this.handleError("Summary step, access mode", 'err_summary_step', err);
        }
    }

    async getParentProjectName() {
        try {
            await this.waitForElementDisplayed(this.parentProjectName, appConst.mediumTimeout);
            return await this.getText(this.parentProjectName);
        } catch (err) {
            await this.handleError("Summary step, Parent project", 'err_summary_step', err);
        }
    }

    async getDefaultLanguage() {
        try {
            await this.waitForElementDisplayed(this.defaultLanguage);
            return await this.getText(this.defaultLanguage);
        } catch (err) {
            await this.handleError("Summary step, default language", 'err_summary_step', err);
        }
    }

    // Returns the display names of all applications listed in the Summary step.
    // Returns [] when no applications are listed.
    async getApplications() {
        return await this.getTextInDisplayedElements(this.applications);
    }

    // Returns the role labels listed in the Permissions row of the Summary step.
    // Returns [] when no permissions are listed.
    async getPermissions() {
        return await this.getTextInDisplayedElements(this.permissions);
    }

    async getDescription() {
        return await this.getTextInDisplayedElements(this.description);
    }


    async getProjectName() {
        try {
            await this.waitForElementDisplayed(this.projectName, appConst.mediumTimeout);
            return await this.getText(this.projectName);
        } catch (err) {
            await this.handleError("Summary step, project name", 'err_summary_step', err);
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
