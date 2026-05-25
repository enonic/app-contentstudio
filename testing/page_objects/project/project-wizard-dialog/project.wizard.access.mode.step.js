/**
 * Created on 05.08.2022
 */
const ProjectWizardDialog = require('./project.wizard.dialog');
const {COMMON, TREE_GRID} = require('../../../libs/elements');
const PrincipalSelector = require("../../components/selectors/principal.combobox.dropdown");

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Public or private')]]",
    // Scoped to the accessMode RadioGroup (the buttons all carry an id like '...radio-group-accessMode-radio-<mode>').
    selectedAccessModeRadio: "//button[@data-component='RadioGroup.Item' and contains(@id,'accessMode') and @aria-checked='true']",
    // Selected principals render in a GridList that is a sibling of the PrincipalSelector ("Permissions" combobox).
    // The bold display-name span lives inside the row's ItemLabel.
    selectedUserDisplayNameSpan:
        "//div[@data-component='PrincipalSelector']/following-sibling::div[@data-component='GridList']" +
        "//div[@data-component='GridList.Row']//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold')]",
};
const DESCRIPTION = "Select default read permissions for a new content in the project";

class ProjectWizardDialogAccessModeStep extends ProjectWizardDialog {

    async clickOnAccessModeRadio(mode) {
        let selector = `//button[@data-component='RadioGroup.Item' and @data-registry-id='${String(mode).toLowerCase()}']`;
        await this.waitForElementEnabled(COMMON.INPUTS.dataComponentRadioByLabel(mode));
        await this.pause(200);
        return await this.clickOnElement(selector);
    }

    // Returns the currently selected access mode capitalized to match appConst.PROJECT_ACCESS_MODE ('Public' / 'Private' / 'Custom').
    async getSelectedAccessMode() {
        await this.waitForElementDisplayed(XPATH.selectedAccessModeRadio);
        const registryId = await this.getAttribute(XPATH.selectedAccessModeRadio, 'data-registry-id');
        return registryId.charAt(0).toUpperCase() + registryId.slice(1);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError("Project Wizard Dialog, Access mode step is not loaded", 'err_name_step', err);
        }
    }

    async selectUserInCustomReadAccessSelector(principalDisplayName) {
        let principalSelector = new PrincipalSelector(XPATH.container);
        await principalSelector.doFilterItem(principalDisplayName);
        await principalSelector.clickOnOptionByDisplayName(principalDisplayName);
        await principalSelector.clickOnApplySelectionButton();
    }

    // Returns the display names of users currently selected in the Custom Read Access selector.
    // Returns an empty array when no users are selected (the GridList is not rendered until a user is added).
    async getSelectedUsersInCustomReadAccessSelector() {
        const locator = XPATH.container + XPATH.selectedUserDisplayNameSpan;
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ProjectWizardDialogAccessModeStep;

