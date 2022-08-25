/**
 * Created on 05.08.2022
 */
const Page = require('../../page');
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ComboBox = require('../../components/loader.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectApplicationsComboBox: "//div[contains(@id,'ProjectApplicationsComboBox')]",
};
const DESCRIPTION = "Select applications for the project content";

class ProjectWizardDialogApplicationsStep extends ProjectWizardDialog {

    async selectApplication(appName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(appName, XPATH.container + XPATH.projectApplicationsComboBox);
        return await this.pause(500);
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription === DESCRIPTION;
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 5 is not loaded"});
    }

    async isLoaded() {
        let locator = `//p[@class='xp-admin-common-sub-name' and text()='${DESCRIPTION}']`;
        return await this.isElementDisplayed(locator);
    }
}

module.exports = ProjectWizardDialogApplicationsStep;

