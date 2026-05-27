/**
 * Created on 05.08.2022
 */
const {COMMON, PROJECTS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Name your project')]]",
};
const DESCRIPTION = "Give the new project a name and a unique identifier";

class ProjectWizardDialogNameAndIdStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    get projectIdentifierInput() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Identifier") + "//input";
    }

    get projectIdentifierValidationMessage() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Identifier") +
               "//div[contains(@class,'text-error')]";
    }
    get projectNameValidationMessage() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Display Name") +
               "//div[contains(@class,'text-error')]";
    }

    get displayNameInput() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Display Name") + "//input";
    }

    get descriptionInput() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Description") + "//input";
    }

    async typeDisplayName(name) {
        await this.waitForElementDisplayed(this.displayNameInput);
        return await this.typeChars(this.displayNameInput, name);
    }

    async clearIdInput() {
        await this.clearInputText(this.projectIdentifierInput);
    }

    async waitForIdentifierInputEnabled() {
        await this.waitForElementDisplayed(this.projectIdentifierInput);
        return this.waitForElementEnabled(this.projectIdentifierInput);
    }

    async typeDescription(description) {
        return await this.typeChars(this.descriptionInput, description);
    }

    getDescription() {
        return this.getTextInInput(this.descriptionInput);
    }

    getProjectIdentifier() {
        return this.getTextInInput(this.projectIdentifierInput);
    }

    async addTextInProjectIdentifierInput(text) {
        await this.waitForIdentifierInputEnabled();
        return await this.addTextInInput(this.projectIdentifierInput, text);
    }

    async typeTextInProjectIdentifierInput(text) {
        await this.waitForIdentifierInputEnabled();
        await this.typeChars(this.projectIdentifierInput, text);
        return await this.pause(200);
    }

    async getProjectIdentifierValidationMessage() {
        await this.waitForElementDisplayed(this.projectIdentifierValidationMessage, appConst.shortTimeout);
        return await this.getText(this.projectIdentifierValidationMessage);
    }

    async getProjectNameValidationMessage() {
        await this.waitForElementDisplayed(this.projectNameValidationMessage, appConst.shortTimeout);
        return await this.getText(this.projectIdentifierValidationMessage);
    }

    async waitForProjectIdentifierValidationMessageNotVisible() {
        return await this.waitForElementNotDisplayed(this.projectIdentifierValidationMessage);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError('Project Wizard Dialog, name and id step was not loaded', 'err_name_id_step', err);
        }
    }
}

module.exports = ProjectWizardDialogNameAndIdStep;
