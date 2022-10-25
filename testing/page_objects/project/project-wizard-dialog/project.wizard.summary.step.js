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
    createProjectButton: "//button[contains(@id,'DialogButton') and child::span[text()='Create Project']]",
    projectNameXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Project name/id']]/following-sibling::div[contains(@id,'SummaryValueContainer')]/h6",
    accessModeValueXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Access mode']]/following-sibling::div[contains(@id,'AccessValueContainer')]/h6",
    parentProjectNameXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Parent Project']]/following-sibling::div[contains(@id,'SummaryValueContainer')]/h6",
    defaultLanguageXpath: "//div[contains(@id,'SummaryNameContainer') and child::h6[text()='Default language']]/following-sibling::div[contains(@id,'LanguageValueContainer')]//h6[contains(@class,'main-name')]",
};
const DESCRIPTION = "View summary of a new project";


class ProjectWizardDialogSummaryStep extends ProjectWizardDialog {

    get accessMode() {
        return XPATH.container + XPATH.accessModeValueXpath;
    }

    get defaultLanguage() {
        return XPATH.container + XPATH.defaultLanguageXpath;
    }

    get projectName() {
        return XPATH.container + XPATH.projectNameXpath;
    }

    get parentProjectName() {
        return XPATH.container + XPATH.parentProjectNameXpath;
    }

    get createProjectButton() {
        return XPATH.container + XPATH.createProjectButton;
    }

    async clickOnCreateProjectButton() {
        await this.waitForElementDisplayed(this.createProjectButton, appConst.mediumTimeout);
        await this.clickOnElement(this.createProjectButton);
    }

    async getAccessMode() {
        try {
            await this.waitForElementDisplayed(this.accessMode, appConst.mediumTimeout);
            return await this.getText(this.accessMode);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_summary_step");
            await this.saveScreenshot(screenshot);
            throw new Error("Summary step, access mode, screenshot:" + screenshot + "  " + err);
        }
    }

    async getParentProjectName() {
        try {
            await this.waitForElementDisplayed(this.parentProjectName, appConst.mediumTimeout);
            return await this.getText(this.parentProjectName);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_summary_step");
            await this.saveScreenshot(screenshot);
            throw new Error("Summary step, parent project name, screenshot:" + screenshot + "  " + err);
        }
    }

    async getDefaultLanguage() {
        try {
            await this.waitForElementDisplayed(this.defaultLanguage, appConst.mediumTimeout);
            return await this.getText(this.defaultLanguage);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_summary_step");
            await this.saveScreenshot(screenshot);
            throw new Error("Summary step, parent project name, screenshot:" + screenshot + "  " + err);
        }
    }

    async getProjectName() {
        try {
            await this.waitForElementDisplayed(this.projectName, appConst.mediumTimeout);
            return await this.getText(this.projectName);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_summary_step");
            await this.saveScreenshot(screenshot);
            throw new Error("Summary step, project name, screenshot:" + screenshot + "  " + err);
        }
    }

    async waitForLoaded() {
        await this.getBrowser().waitUntil(async () => {
            let actualDescription = await this.getStepDescription();
            return actualDescription.includes(DESCRIPTION);
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Project Wizard Dialog, step 6 is not loaded"});
    }
}

module.exports = ProjectWizardDialogSummaryStep;
