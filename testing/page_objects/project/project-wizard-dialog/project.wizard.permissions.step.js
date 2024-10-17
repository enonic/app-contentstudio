/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');
const ProjectAccessControlComboBox = require('../../components/projects/project.access.control.combobox');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
};
const DESCRIPTION = "Give access to manage the project and its content";

class ProjectWizardDialogPermissionsStep extends ProjectWizardDialog {

    // Adds a user with the default role (Contributor) in Roles step form:
    async selectProjectAccessRole(principalDisplayName) {
        let projectAccessControlComboBox = new ProjectAccessControlComboBox();
        await projectAccessControlComboBox.clickOnFilteredByDisplayNamePrincipalAndClickOnApply(principalDisplayName, XPATH.container);
    }

    addPrincipalsInRolesForm(memberDisplayNames) {
        let result = Promise.resolve();
        memberDisplayNames.forEach(displayName => {
            result = result.then(() => this.selectProjectAccessRole(displayName));
        });
        return result;
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 4 is not loaded"});
    }

    // click on the role, open menu and select new role for the user:
    async updateUserAccessRole(userDisplayName, newRole) {
        let projectAccessControlComboBox = new ProjectAccessControlComboBox();
        return await projectAccessControlComboBox.updateUserAccessRole(userDisplayName, newRole, XPATH.container);
    }

    //clicks on remove icon and  remove a user from Roles form:
    async removeProjectAccessItem(principalName) {
        let projectAccessControlComboBox = new ProjectAccessControlComboBox();
        return await projectAccessControlComboBox.removeProjectAccessItem(principalName, XPATH.container)
    }

    //gets selected options - return names of selected principals:
    async getSelectedPrincipals() {
        let locator = XPATH.container + "//div[contains(@id,'PrincipalContainerSelectedOptionView')]//h6[contains(@class,'main-name')]"
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ProjectWizardDialogPermissionsStep;

