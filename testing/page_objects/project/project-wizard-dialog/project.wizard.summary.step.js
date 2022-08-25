/**
 * Created on 05.08.2022
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ComboBox = require('../../components/loader.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    createProjectButton: "//button[contains(@id,'DialogButton') and child::span[text()='Create Project']]",
};
const DESCRIPTION = "View summary of a new project";

class ProjectWizardDialogSummaryStep extends ProjectWizardDialog {

    get createProjectButton() {
        return XPATH.container + XPATH.createProjectButton;
    }

    async clickOnCreateProjectButton() {
        await this.waitForElementDisplayed(this.createProjectButton, appConst.mediumTimeout);
        await this.clickOnElement(this.createProjectButton);
    }

    async getPermissions() {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(language, XPATH.projectReadAccessWizardStepForm + XPATH.localeComboBoxDiv);
        console.log("Project Wizard, language is selected: " + language);
        return await this.pause(300);
    }
    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription === DESCRIPTION;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 6 is not loaded"});
    }
}

module.exports = ProjectWizardDialogSummaryStep;

