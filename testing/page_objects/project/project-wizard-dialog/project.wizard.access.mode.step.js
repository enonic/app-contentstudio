/**
 * Created on 05.08.2022
 */
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');
const ExtendedPrincipalComboBox = require('../../components/projects/extended.principal.combobox');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectReadAccessWizardStepForm: "//div[contains(@id,'ProjectReadAccessFormItem')]",
    radioButtonByDescription: description => XPATH.projectReadAccessWizardStepForm +
                                             `//span[contains(@id,'RadioButton') and descendant::label[contains(.,'${description}')]]`,
};
const DESCRIPTION = "Select default read permissions for a new content in the project";

class ProjectWizardDialogAccessModeStep extends ProjectWizardDialog {

    async clickOnAccessModeRadio(mode) {
        let selector = XPATH.radioButtonByDescription(mode) + "/input[@type='radio']";
        await this.waitForElementEnabled(XPATH.radioButtonByDescription(mode), appConst.shortTimeout);
        await this.pause(200);
        return await this.clickOnElement(selector);
    }
    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 3 is not loaded"});
    }

    async selectUserInCustomReadAccessSelector(principalDisplayName) {
        let extendedPrincipalComboBox = new ExtendedPrincipalComboBox();
        await extendedPrincipalComboBox.clickOnFilteredByDisplayNameUserAndClickOnApply(principalDisplayName, XPATH.container);
        console.log("Project Wizard, principal is selected: " + principalDisplayName);
        return await this.pause(300);
    }
}

module.exports = ProjectWizardDialogAccessModeStep;

