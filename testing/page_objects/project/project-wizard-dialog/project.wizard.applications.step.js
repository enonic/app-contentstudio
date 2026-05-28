/**
 * Created on 05.08.2022
 */
const {DROPDOWN, TREE_GRID, BUTTONS} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');
const ProjectApplicationsCombobox = require('../../components/projects/project.applications.combobox');

// Selected applications render in a GridList that is a sibling of the ApplicationSelector combobox.
const SELECTED_APPS_GRID =
    "//div[@data-component='ApplicationSelector']/following-sibling::div[@data-component='SortableGridList']";

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Project scope applications')]]",
    projectApplicationsComboBox: "//div[contains(@id,'ProjectApplicationsComboBox')]",
    // All selected-app display-name spans, used by getSelectedApplications.
    selectedAppDisplayNameSpan:
        SELECTED_APPS_GRID +
        "//div[@data-component='ListItem']//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold')]",
    // The remove (X) IconButton for a given app display name. Empty aria-label means we key on data-component.
    removeAppIconByDisplayName: displayName =>
        SELECTED_APPS_GRID +
        `//div[@data-component='ListItem' and descendant::div[@data-component='ItemLabel']//span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]` +
        "//button[@data-component='IconButton']",
};
const DESCRIPTION = "Select applications for the project content";

class ProjectWizardDialogApplicationsStep extends ProjectWizardDialog {

    get container() {
        return XPATH.container;
    }

    get appSelectorDropDownHandler() {
        return XPATH.container + XPATH.projectApplicationsComboBox + DROPDOWN.DROP_DOWN_HANDLE;
    }

    //types an application name and click on the filtered option
    async selectApplication(appName) {
        let projectApplicationsCombobox = new ProjectApplicationsCombobox(XPATH.container);
        await projectApplicationsCombobox.clickFilteredByAppNameItemAndClickOnOk(appName);
        return await this.pause(500);
    }

    //expand the dropdown and click on an option
    async expandDropdownListAndSelectApplication(appName) {
        let projectApplicationsComboBox = new ProjectApplicationsCombobox();
        await projectApplicationsComboBox.clickOnDropdownHandle(XPATH.container);
        await projectApplicationsComboBox.clickOnOptionByDisplayName(appName, XPATH.container);
        await projectApplicationsComboBox.clickOnApplySelectionButton(XPATH.container);
        return await this.pause(500);
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError("Project Wizard Dialog, app step was not loaded", 'err_name_step', err);
        }
    }

    async isLoaded() {
        return await this.isElementDisplayed(XPATH.container);
    }

    addApplications(appDisplayNames) {
        let result = Promise.resolve();
        appDisplayNames.forEach((displayName) => {
            result = result.then(() => {
                return this.selectApplication(displayName)
            });
        });
        return result;
    }

    async waitForRemoveAppIconNotDisplayed(appName) {
        const removeIconLocator = XPATH.container + TREE_GRID.gridListRowByDisplayName(appName) + BUTTONS.BUTTON_REMOVE_ICON;//XPATH.removeAppIconByDisplayName(appName);
        await this.waitForElementNotDisplayed(removeIconLocator, appConst.mediumTimeout);
    }

    async waitForRemoveAppIconDisplayed(appName) {
        const removeIconLocator = XPATH.container + XPATH.removeAppIconByDisplayName(appName);
        await this.waitForElementDisplayed(removeIconLocator, appConst.mediumTimeout);
    }

    async removeApplication(appName) {
        try {
            const removeIconLocator = XPATH.container + XPATH.removeAppIconByDisplayName(appName);
            await this.waitForRemoveAppIconDisplayed(appName);
            return await this.clickOnElement(removeIconLocator);
        } catch (err) {
            const screenshot = await this.saveScreenshotUniqueName('err_remove_app');
            throw new Error('error after pressing the remove button, screenshot: ' + screenshot + '  ' + err);
        }
    }

    // Returns the display names of all selected applications. Returns [] when none are selected
    // (the GridList is not rendered until at least one app is added).
    async getSelectedApplications() {
        const locator = XPATH.container + XPATH.selectedAppDisplayNameSpan;
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForSelectedApplicationsNotDisplayed() {
        const locator = XPATH.container + XPATH.selectedAppDisplayNameSpan;
        return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = ProjectWizardDialogApplicationsStep;

