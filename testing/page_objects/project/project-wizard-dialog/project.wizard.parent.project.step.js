/**
 * Created on 05.08.2022
 */
const lib = require('../../../libs/elements');
const appConst = require('../../../libs/app_const');
const ComboBox = require('../../components/loader.combobox');
const ProjectWizardDialog = require('./project.wizard.dialog');

const XPATH = {
    container: "//div[contains(@id,'ProjectWizardDialog')]",
    projectSelectedOptionView: "//div[contains(@id,'ProjectSelectedOptionView')]",
    parentProjectComboboxDiv: "//div[contains(@id,'ProjectsSelector')]",
};
const DESCRIPTION = "To set up synchronization of a content with another project, select it here (optional)";

class ProjectWizardDialogParentProjectStep extends ProjectWizardDialog {

    get projectOptionsFilterInput() {
        return XPATH.container + lib.COMBO_BOX_OPTION_FILTER_INPUT;
    }

    get projectRadioButton() {
        return XPATH.container + lib.radioButtonByLabel("Project");
    }

    get layerRadioButton() {
        return XPATH.container + lib.radioButtonByLabel("Layer");
    }

    async clickOnProjectRadioButton() {
        try {
            await this.waitForElementDisplayed(this.projectRadioButton, appConst.mediumTimeout);
            await this.clickOnElement(this.projectRadioButton);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_project_radio');
            throw new Error("Error after clicking on project radio. screenshot: " + screenshot + "  " + err);
        }
    }

    waitForLayerRadioButtonDisplayed() {
        return this.waitForElementDisplayed(this.layerRadioButton, appConst.mediumTimeout);
    }

    waitForProjectRadioButtonDisplayed() {
        return this.waitForElementDisplayed(this.projectRadioButton, appConst.mediumTimeout);
    }

    async clickOnLayerRadioButton() {
        try {
            await this.waitForLayerRadioButtonDisplayed();
            await this.clickOnElement(this.layerRadioButton);
            await this.pause(400);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_layer_radio');
            throw new Error("Error after clicking on layer radio. screenshot: " + screenshot + "  " + err);
        }
    }

    waitForProjectOptionsFilterInputDisplayed() {
        return this.waitForElementDisplayed(this.projectOptionsFilterInput, appConst.mediumTimeout);
    }

    waitForProjectOptionsFilterInputNotDisplayed() {
        return this.waitForElementNotDisplayed(this.projectOptionsFilterInput, appConst.mediumTimeout);
    }

    async selectParentParentProjects(names) {
        for (let name of names) {
            await this.selectParentProject(name);
        }
    }

    async selectParentProject(projectDisplayName) {
        let comboBox = new ComboBox();
        await comboBox.typeTextAndSelectOption(projectDisplayName, XPATH.container + XPATH.parentProjectComboboxDiv);
        console.log("Project Wizard, parent project is selected: " + projectDisplayName);
        return await this.pause(400);
    }

    async typeTextInOptionFilterInputAndSelectOption(text, projectDisplayName) {
        let comboBox = new ComboBox();
        await this.typeTextInInput(this.projectOptionsFilterInput, text);
        await this.pause(300);
        await comboBox.selectOption(projectDisplayName, XPATH.container + XPATH.parentProjectComboboxDiv);
        console.log("Project Wizard, parent project is selected: " + projectDisplayName);
        return await this.pause(400);
    }

    async clickOnRemoveSelectedProjectIcon(displayName) {
        let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.itemByDisplayName(displayName) + '/../..' + lib.REMOVE_ICON;
        await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
        await this.clickOnElement(locator);
        await this.pause(500);
    }

    async getSelectedProjects() {
        try {
            let locator = XPATH.container + XPATH.projectSelectedOptionView + lib.H6_DISPLAY_NAME;
            await this.waitForElementDisplayed(locator, appConst.mediumTimeout);
            return await this.getTextInDisplayedElements(locator);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_proj_parent_step');
            throw new Error("Project Wizard, parent step, screenshot: " + screenshot + "  " + err);
        }
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.shortTimeout, timeoutMsg: "Project Wizard Dialog, step 1 is not loaded"});
    }

    async isSelectedParentProjectDisplayed() {
        return this.isElementDisplayed(XPATH.container + XPATH.projectSelectedOptionView);
    }
}

module.exports = ProjectWizardDialogParentProjectStep;

