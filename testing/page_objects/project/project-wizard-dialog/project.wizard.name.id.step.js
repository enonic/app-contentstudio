/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectIdStepForm: `//form[contains(@class,'project-id-step')]`,
};
const DESCRIPTION = "Give the new project a name and a unique identifier";

class ProjectWizardDialogNameAndIdStep extends ProjectWizardDialog {

    get projectIdentifierInput() {
        return XPATH.container + XPATH.projectIdStepForm + lib.formItemByLabel("Identifier") + lib.TEXT_INPUT;
    }

    get projectIdentifierValidationMessage() {
        return XPATH.container + XPATH.projectIdStepForm + lib.formItemByLabel("Identifier") +
               "//div[contains(@id,'ValidationRecordingViewer')]//li";
    }

    get displayNameInput() {
        return XPATH.container + XPATH.projectIdStepForm + lib.formItemByLabel("Display Name") + lib.TEXT_INPUT;
    }

    get descriptionInput() {
        return XPATH.container + XPATH.projectIdStepForm + lib.formItemByLabel("Description") + lib.TEXT_INPUT;
    }

    async typeDisplayName(name) {
        await this.waitForElementDisplayed(this.displayNameInput);
        return await this.typeTextInInput(this.displayNameInput, name);
    }

    async waitForIdentifierInputEnabled() {
        await this.waitForElementDisplayed(this.projectIdentifierInput, appConst.mediumTimeout);
        return this.waitForElementEnabled(this.projectIdentifierInput, appConst.mediumTimeout);
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

    async addTextInProjectIdentifierInput(text) {
        await this.waitForIdentifierInputEnabled();
        return await this.addTextInInput(this.projectIdentifierInput, text);
    }

    async typeTextInProjectIdentifierInput(text) {
        await this.waitForIdentifierInputEnabled();
        await this.typeTextInInput(this.projectIdentifierInput, text);
    }

    async getProjectIdentifierValidationMessage() {
        await this.waitForElementDisplayed(this.projectIdentifierValidationMessage, appConst.shortTimeout);
        return await this.getText(this.projectIdentifierValidationMessage);
    }

    async waitForProjectIdentifierValidationMessageNotVisible() {
        return await this.waitForElementNotDisplayed(this.projectIdentifierValidationMessage, appConst.shortTimeout);
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step with project name is not loaded"});
    }
}

module.exports = ProjectWizardDialogNameAndIdStep;
