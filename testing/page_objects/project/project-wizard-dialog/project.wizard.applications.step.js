/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ComboBox = require('../../components/loader.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectApplicationsComboBox: "//div[contains(@id,'ProjectApplicationsComboBox')]",
    selectedProjectView: displayName => `//div[contains(@id,'ProjectApplicationSelectedOptionView') and descendant::h6[text()='${displayName}']]`,
    selectedApplications: "//div[contains(@id,'ProjectApplicationSelectedOptionView') ]",
};
const DESCRIPTION = "Select applications for the project content";

class ProjectWizardDialogApplicationsStep extends ProjectWizardDialog {

    get appSelectorDropDownHandler() {
        return XPATH.container + XPATH.projectApplicationsComboBox + lib.DROP_DOWN_HANDLE;
    }

    //types an application name and click on the filtered option
    async selectApplication(appName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(appName, XPATH.container + XPATH.projectApplicationsComboBox);
        return await this.pause(500);
    }

    //expand the dropdown and click on an option
    async expandDropdownListAndSelectApplication(appName) {
        await this.waitForElementDisplayed(this.appSelectorDropDownHandler, appConst.shortTimeout);
        await this.clickOnElement(this.appSelectorDropDownHandler);
        let optionXpath = lib.slickRowByDisplayName(XPATH.container, appName);
        await this.waitForElementDisplayed(optionXpath, appConst.shortTimeout);
        await this.clickOnElement(optionXpath);
        return await this.pause(500);
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 5 is not loaded"});
    }

    async isLoaded() {
        let locator = `//p[@class='xp-admin-common-sub-name' and contains(.,'${DESCRIPTION}')]`;
        return await this.isElementDisplayed(locator);
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

    async removeApplication(appName) {
        try {
            let locator = XPATH.container + XPATH.selectedProjectView(appName) + lib.REMOVE_ICON;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.clickOnElement(locator);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_remove_app");
            await this.saveScreenshot(screenshot);
            throw new Error("error after pressing the remove button, screenshot: " + screenshot + "  " + err);
        }
    }

    async getSelectedApplications() {
        let locator = XPATH.container + XPATH.selectedApplications + lib.H6_DISPLAY_NAME;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        return await this.getTextInDisplayedElements(locator);
    }
}

module.exports = ProjectWizardDialogApplicationsStep;

