/**
 * Created on 05.08.2022
 */
const ProjectWizardDialog = require('./project.wizard.dialog');
const PrincipalSelector = require('../../components/selectors/principal.combobox.dropdown');

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Grant project roles')]]",
};
const DESCRIPTION = "Give access to manage the project and its content";

class ProjectWizardDialogPermissionsStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    // Adds a user with the default role (Contributor) in Roles step form:
    async selectProjectAccessRole(principalDisplayName) {
        let principalSelector = new PrincipalSelector(XPATH.container);
        await principalSelector.doFilterItem(principalDisplayName);
        await principalSelector.clickOnOptionByDisplayName(principalDisplayName);
        await principalSelector.clickOnApplySelectionButton();
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
        let principalSelector = new PrincipalSelector(XPATH.container);
        return await principalSelector.updateUserAccessRole(userDisplayName, newRole);
    }

    //clicks on remove icon and  remove a user from Roles form:
    async removeProjectAccessItem(principalName) {
        let principalSelector = new PrincipalSelector(XPATH.container);
        return await principalSelector.clickOnRemoveButton(principalName);
    }

    //gets selected options - return names of selected principals:
    async getSelectedPrincipalOptions() {
        try {
            const itemLocator = this.container +
                                "//div[@data-component='GridList.Row']//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold') and not(ancestor::span[@data-component='Avatar.Root'])]";
            return await this.getTextInElements(itemLocator);
        } catch (err) {
            await this.handleError(`Principal Selector, selected options...`, 'err_project_', err);
        }
    }
}

module.exports = ProjectWizardDialogPermissionsStep;

