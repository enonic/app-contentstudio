/**
 * Created on 05.08.2022
 */
const { BUTTONS } = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');
const ProjectApplicationsCombobox = require('../../components/projects/project.applications.combobox');
const ProjectApplicationConfigDialog = require('./project.application.config.dialog');

// Selected applications render in a GridList that is a sibling of the ApplicationSelector combobox.
const SELECTED_APPS_GRID =
    "//div[@data-component='ApplicationSelector']/following-sibling::div[@data-component='SortableGridList']";

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Project scope applications')]]",
    // All selected-app display-name spans, used by getSelectedApplications.
    selectedAppDisplayNameSpan:
        SELECTED_APPS_GRID +
        "//div[@data-component='ListItem']//div[@data-component='ItemLabel']//span[contains(@class,'font-semibold')]",
    // The selected-app row (ListItem) for a given app display name.
    selectedAppRowByDisplayName: (displayName) =>
        SELECTED_APPS_GRID +
        `//div[@data-component='ListItem' and descendant::div[@data-component='ItemLabel']//span[contains(@class,'font-semibold') and contains(.,'${displayName}')]]`,
    // The remove (X) IconButton for a given app display name.
    removeAppIconByDisplayName: (displayName) =>
        XPATH.selectedAppRowByDisplayName(displayName) + BUTTONS.BUTTON_REMOVE_ICON,
    // The edit (pencil) IconButton for a given app display name. Rendered only for apps that have a config form.
    editAppIconByDisplayName: (displayName) =>
        XPATH.selectedAppRowByDisplayName(displayName) + BUTTONS.BUTTON_EDIT_ICON,
    // The note shown instead of config editing while a project is being created.
    configsDisabledNote: "//p[contains(.,'Application configs are disabled during project creation')]",
};
const DESCRIPTION = 'Select applications for the project content';

class ProjectWizardDialogApplicationsStep extends ProjectWizardDialog {
    // The applications dropdown of this step. Stateless (holds only the container xpath), so one instance is enough.
    #applicationsCombobox = new ProjectApplicationsCombobox(XPATH.container);

    get container() {
        return XPATH.container;
    }

    //types an application name and click on the filtered option
    async selectApplication(appName) {
        await this.#applicationsCombobox.clickFilteredByAppNameItemAndClickOnOk(appName);
    }

    //expand the dropdown and click on an option
    async expandDropdownListAndSelectApplication(appName) {
        try {
            await this.#applicationsCombobox.clickOnDropdownHandle();
            await this.#applicationsCombobox.clickOnOptionByDisplayName(appName);
            await this.#applicationsCombobox.clickOnApplySelectionButton();
        } catch (err) {
            await this.handleError(
                'Project Wizard Dialog, error while selecting an application in dropdown',
                'err_select_app_dropdown',
                err,
            );
        }
    }

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container);
        } catch (err) {
            await this.handleError('Project Wizard Dialog, app step was not loaded', 'err_name_step', err);
        }
    }

    async isLoaded() {
        return await this.isElementDisplayed(XPATH.container);
    }

    addApplications(appDisplayNames) {
        let result = Promise.resolve();
        appDisplayNames.forEach((displayName) => {
            result = result.then(() => {
                return this.selectApplication(displayName);
            });
        });
        return result;
    }

    // Inherited apps (layers) are listed without the remove icon
    async waitForRemoveAppIconNotDisplayed(appName) {
        const removeIconLocator = XPATH.container + XPATH.removeAppIconByDisplayName(appName);
        await this.waitForElementNotDisplayed(removeIconLocator);
    }

    async waitForRemoveAppIconDisplayed(appName) {
        const removeIconLocator = XPATH.container + XPATH.removeAppIconByDisplayName(appName);
        await this.waitForElementDisplayed(removeIconLocator);
    }

    async removeApplication(appName) {
        try {
            const removeIconLocator = XPATH.container + XPATH.removeAppIconByDisplayName(appName);
            await this.waitForRemoveAppIconDisplayed(appName);
            return await this.clickOnElement(removeIconLocator);
        } catch (err) {
            await this.handleError(
                `Error after clicking on the remove icon for '${appName}'`,
                'err_click_remove_app_icon',
                err,
            );
        }
    }

    async waitForEditAppIconDisplayed(appName) {
        const locator = XPATH.container + XPATH.editAppIconByDisplayName(appName);
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async waitForEditAppIconNotDisplayed(appName) {
        const locator = XPATH.container + XPATH.editAppIconByDisplayName(appName);
        await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }

    // Edit icon is disabled during project creation: app configs can be edited only for an existing project
    async waitForEditAppIconDisabled(appName) {
        try {
            await this.waitForEditAppIconDisplayed(appName);
            const locator = XPATH.container + XPATH.editAppIconByDisplayName(appName);
            await this.waitForElementDisabled(locator, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Edit icon for '${appName}' should be disabled`, 'err_edit_app_icon_disabled', err);
        }
    }

    async waitForEditAppIconEnabled(appName) {
        try {
            await this.waitForEditAppIconDisplayed(appName);
            const locator = XPATH.container + XPATH.editAppIconByDisplayName(appName);
            await this.waitForElementEnabled(locator);
        } catch (err) {
            await this.handleError(`Edit icon for '${appName}' should be enabled`, 'err_edit_app_icon_enabled', err);
        }
    }

    // Clicks on the Edit icon of the selected app and waits for the application config dialog to be loaded
    async clickOnEditAppIcon(appName) {
        try {
            await this.waitForEditAppIconEnabled(appName);
            const locator = XPATH.container + XPATH.editAppIconByDisplayName(appName);
            await this.clickOnElement(locator);
            const configDialog = new ProjectApplicationConfigDialog();
            await configDialog.waitForDialogOpened();
            return configDialog;
        } catch (err) {
            await this.handleError(
                `Error after clicking on Edit icon for '${appName}'`,
                'err_click_edit_app_icon',
                err,
            );
        }
    }

    async waitForConfigsDisabledNoteDisplayed() {
        const locator = XPATH.container + XPATH.configsDisabledNote;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
    }

    async waitForConfigsDisabledNoteNotDisplayed() {
        const locator = XPATH.container + XPATH.configsDisabledNote;
        await this.waitForElementNotDisplayed(locator);
    }

    // Returns the display names of all selected applications. Returns [] when none are selected
    // (the GridList is not rendered until at least one app is added).
    async getSelectedApplications() {
        const locator = XPATH.container + XPATH.selectedAppDisplayNameSpan;
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ProjectWizardDialogApplicationsStep;
