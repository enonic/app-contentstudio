/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');
const PrincipalSelector = require('../../components/selectors/principal.combobox.dropdown');

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Grant project roles')]]",
};
const DESCRIPTION = "Give access to manage the project and its content";

class ProjectWizardDialogPermissionsStep extends ProjectWizardDialog {

    // Adds a user with the default role (Contributor) in Roles step form:
    async selectProjectAccessRole(principalDisplayName) {
        let principalSelector = new PrincipalSelector(XPATH.container);
        await principalSelector.doFilterItem(principalDisplayName);
        await principalSelector.clickOnFilteredByDisplayNameItemAndClickOnApply(principalDisplayName);
        await this.pause(300);
    }

    addPrincipalsInRolesForm(memberDisplayNames) {
        let result = Promise.resolve();
        memberDisplayNames.forEach(displayName => {
            result = result.then(() => this.selectProjectAccessRole(displayName));
        });
        return result;
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError("Project Wizard, Grant project roles, name step is not loaded", 'err_name_step', err);
        }
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

