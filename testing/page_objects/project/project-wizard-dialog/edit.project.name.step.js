/**
 * Created on 22.05.2026
 */
const {PROJECTS, COMMON} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const LocaleSelectorDropdown = require("../../components/selectors/locale.selector.dropdown");
const ProjectWizardDialog = require("./project.wizard.dialog");

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Name your project')]]",
    // On the edit step the identifier is a read-only value rendered as a sibling span next to the "Identifier *" label.
    identifierValue: PROJECTS.PROJECT_STEP_COMPONENT +
                     "//span[contains(@class,'font-semibold') and contains(.,'Identifier')]/following-sibling::span",
};
const TITLE = "Name your project";

class EditProjectNameStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    get descriptionInput() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Description") + "//input";
    }

    get displayNameInput() {
        return PROJECTS.PROJECT_STEP_COMPONENT + COMMON.INPUTS.dataComponentInputByLabel("Display Name") + "//input";
    }

    async getDisplayName() {
        await this.waitForElementDisplayed(this.displayNameInput);
        return await this.getTextInInput(this.displayNameInput);
    }

    async getIdentifier() {
        await this.waitForElementDisplayed(XPATH.identifierValue);
        return await this.getText(XPATH.identifierValue);
    }

    async getDescription() {
        await this.waitForElementDisplayed(this.descriptionInput);
        return await this.getTextInInput(this.descriptionInput);
    }

    async typeDescription(description) {
        return await this.typeChars(this.descriptionInput, description);
    }

    async typeDisplayName(name) {
        await this.waitForElementDisplayed(this.displayNameInput);
        return await this.typeChars(this.displayNameInput, name);
    }

    async clearDisplayName() {
        await this.waitForElementDisplayed(this.displayNameInput);
        return await this.clearInputText(this.displayNameInput);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError("Project Wizard Dialog, name step is not loaded", 'err_name_step', err);
        }
    }

}

module.exports = EditProjectNameStep;

