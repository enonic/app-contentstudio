/**
 * Created on 05.08.2022
 */
const {DROPDOWN} = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ProjectWizardDialog = require('./project.wizard.dialog');
const ProjectApplicationsComboBox = require('../../components/projects/project.applications.combobox');

const XPATH = {
    container: "//div[@role='dialog' and descendant::h2[contains(.,'Project scope applications')]]",
    projectApplicationsComboBox: "//div[contains(@id,'ProjectApplicationsComboBox')]",
    selectedProjectView: displayName => `//div[contains(@id,'ProjectApplicationSelectedOptionView') and descendant::h6[text()='${displayName}']]`,
    selectedApplications: "//div[contains(@id,'ProjectApplicationSelectedOptionView') ]",
};
const DESCRIPTION = "Select applications for the project content";

class ProjectWizardDialogApplicationsStep extends ProjectWizardDialog {

    get appSelectorDropDownHandler() {
        return XPATH.container + XPATH.projectApplicationsComboBox + DROPDOWN.DROP_DOWN_HANDLE;
    }

    //types an application name and click on the filtered option
    async selectApplication(appName) {
        let projectApplicationsComboBox = new ProjectApplicationsComboBox();
        await projectApplicationsComboBox.clickFilteredByAppNameItemAndClickOnOk(appName, XPATH.container);
        return await this.pause(500);
    }

    //expand the dropdown and click on an option
    async expandDropdownListAndSelectApplication(appName) {
        let projectApplicationsComboBox = new ProjectApplicationsComboBox();
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
        let removeIconLocator = XPATH.container + XPATH.selectedProjectView(appName) + lib.REMOVE_ICON;
        await this.waitForElementNotDisplayed(removeIconLocator, appConst.mediumTimeout);
    }

    async waitForRemoveAppIconDisplayed(appName) {
        let removeIconLocator = XPATH.container + XPATH.selectedProjectView(appName) + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(removeIconLocator, appConst.mediumTimeout);
    }

    async removeApplication(appName) {
        try {
            let removeIconLocator = XPATH.container + XPATH.selectedProjectView(appName) + lib.REMOVE_ICON;
            await this.waitForRemoveAppIconDisplayed(appName);
            return await this.clickOnElement(removeIconLocator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_remove_app');
            throw new Error("error after pressing the remove button, screenshot: " + screenshot + "  " + err);
        }
    }

    async getSelectedApplications() {
        let locator = XPATH.container + XPATH.selectedApplications + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }

    async waitForSelectedApplicationsNotDisplayed() {
        let locator = XPATH.container + XPATH.selectedApplications + lib.H6_DISPLAY_NAME;
        return await this.waitForElementNotDisplayed(locator, appConst.mediumTimeout);
    }
}

module.exports = ProjectWizardDialogApplicationsStep;

