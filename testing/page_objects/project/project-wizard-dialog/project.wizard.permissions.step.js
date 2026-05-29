/**
 * Created on 05.08.2022
 */
const ProjectWizardDialog = require('./project.wizard.dialog');
const PrincipalSelector = require('../../components/selectors/principal.combobox.dropdown');
const {TREE_GRID} = require('../../../libs/elements');

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

    async getRoleInSelectedPrincipal(principalDisplayName) {
        const locator = this.container + TREE_GRID.gridListRowByDisplayName(principalDisplayName) +
                        "//span[@data-component='Selector.Value']";
        return await this.getText(locator);
    }

    // Clicks on the role selector (combobox) button for the given principal and opens the menu with available roles.
    async expandPrincipalRoleMenu(principalDisplayName) {
        try {
            const triggerLocator = this.container + TREE_GRID.gridListRowByDisplayName(principalDisplayName) +
                                   "//button[@data-component='Selector.Trigger']";
            await this.waitForElementDisplayed(triggerLocator);
            await this.clickOnElement(triggerLocator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Principal Selector, tried to expand role menu for: ${principalDisplayName}`, 'err_expand_role_menu', err);
        }
    }

    // Returns the role display names listed in the currently open role selector (combobox) listbox.
    // Note: the popover is rendered at the document root (fixed positioning), so it is not scoped to the principal row.
    async getRolesInExpandedRoleMenu() {
        const optionsLocator =
            "//div[@data-component='Selector.Content' and @data-state='open']//span[@data-component='Selector.ItemText']";
        await this.waitForElementDisplayed(optionsLocator);
        await this.pause(200);
        return await this.getTextInDisplayedElements(optionsLocator);
    }

    // Clicks on a role by its display name (e.g. 'Owner') in the currently open role selector listbox.
    async clickOnRoleInExpandedMenu(roleDisplayName) {
        try {
            const optionLocator =
                `//div[@data-component='Selector.Content' and @data-state='open']` +
                `//div[@data-component='Selector.Item' and descendant::span[@data-component='Selector.ItemText' and text()='${roleDisplayName}']]`;
            await this.waitForElementDisplayed(optionLocator);
            await this.clickOnElement(optionLocator);
            return await this.pause(300);
        } catch (err) {
            await this.handleError(`Principal Selector, tried to click on the role: ${roleDisplayName}`, 'err_click_role_option', err);
        }
    }
}

module.exports = ProjectWizardDialogPermissionsStep;

