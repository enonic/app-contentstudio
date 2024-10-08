/**
 * Created on 20.08.2022
 */
const SettingsBrowsePanel = require('../page_objects/project/settings.browse.panel');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');
const ProjectWizardDialogParentProjectStep = require('../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogLanguageStep = require('../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogAccessModeStep = require('../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogNameAndIdStep = require('../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');
const ProjectWizardDialogSummaryStep = require('../page_objects/project/project-wizard-dialog/project.wizard.summary.step');
const appConst = require("./app_const");
const path = require('path');
const fs = require('fs');
const webDriverHelper = require('./WebDriverHelper');

module.exports = {
    getBrowser() {
        if (typeof browser !== 'undefined') {
            return browser;
        } else {
            return webDriverHelper.browser;
        }
    },
    async saveTestProject(name, description, language, permissions, accessMode, applications, identifier) {
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let summaryStep = new ProjectWizardDialogSummaryStep();
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnNewButton();
        await parentProjectStep.waitForLoaded();
        let project = this.buildProject(language, accessMode, permissions, applications, name, identifier, description);
        await this.fillFormsWizard(project);
        await summaryStep.waitForLoaded();
        await summaryStep.clickOnCreateProjectButton();
        await summaryStep.waitForDialogClosed();
        return await settingsBrowsePanel.pause(500);
    },
    async fillParentNameStep(parents) {
        try {
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            parents = [].concat(parents);
            let selectedItems = await parentProjectStep.getSelectedProjects();
            for (let name of parents) {
                if (selectedItems.length === 0 || this.isProjectSelected(selectedItems, name)) {
                    // TODO slickgrid - uncomment this string
                    await parentProjectStep.selectParentProject(name);
                    //await parentProjectStep.selectParentProjectById(name);
                }
            }
            await parentProjectStep.clickOnNextButton();
            return new ProjectWizardDialogLanguageStep();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_parent_proj_step');
            throw new Error(`Error occurred in parent project step, screenshot:${screenshot} ` + err);
        }
    },
    isProjectSelected(arr, text) {
        arr.find((item) => {
            if (item.includes(text)) {
                return true;
            }
        });
        return false;
    },
    async fillLanguageStep(language) {
        let languageStep = new ProjectWizardDialogLanguageStep();
        if (language) {
            await languageStep.selectLanguage(language);
            await languageStep.clickOnNextButton();
        } else {
            await languageStep.clickOnSkipButton();
        }
        return new ProjectWizardDialogAccessModeStep();
    },
    async fillAccessModeStep(accessMode) {
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        if (accessMode) {
            await accessModeStep.clickOnAccessModeRadio(accessMode);
        } else {
            //set the default access mode for ui-tests:
            await accessModeStep.clickOnAccessModeRadio("Private");
        }
        await accessModeStep.clickOnNextButton();
        return new ProjectWizardDialogPermissionsStep();
    },
    async fillPermissionsStep(principalsToAccess) {
        let permissionsStep = new ProjectWizardDialogPermissionsStep();
        if (principalsToAccess) {
            if (Array.isArray(principalsToAccess)) {
                await permissionsStep.addPrincipalsInRolesForm(principalsToAccess);
            } else {
                await permissionsStep.selectProjectAccessRole(principalsToAccess);
            }
            await permissionsStep.clickOnNextButton();
        } else {
            await permissionsStep.clickOnSkipButton();
        }
    },
    async fillApplicationStep(applications) {
        let applicationsStep = new ProjectWizardDialogApplicationsStep();

        if (applications) {
            if (Array.isArray(applications)) {
                await applicationsStep.addApplications(applications);
            } else {
                await applicationsStep.expandDropdownListAndSelectApplication(applications);
            }
            await applicationsStep.clickOnNextButton();
        } else {
            await applicationsStep.clickOnSkipButton();
        }
        return new ProjectWizardDialogNameAndIdStep();
    },
    async fillNameAndDescriptionStep(name, identifier, description,) {
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        if (name) {
            await nameAndIdStep.typeDisplayName(name);
        }
        if (description) {
            await nameAndIdStep.typeDescription(description);
        }
        if (identifier) {
            await nameAndIdStep.typeTextInProjectIdentifierInput(identifier);
        }
        await nameAndIdStep.pause(800);
        await nameAndIdStep.clickOnNextButton();
        return new ProjectWizardDialogSummaryStep();
    },
    async fillFormsWizard(project) {
        try {
            if (!project.parents) {
                let parentProjectStep = new ProjectWizardDialogParentProjectStep();
                await parentProjectStep.clickOnSkipButton();
            } else {
                let languageStep = await this.fillParentNameStep(project.parents);
                await languageStep.waitForLoaded();
            }
            let accessModeStep = await this.fillLanguageStep(project.language);
            await accessModeStep.waitForLoaded();
            let permissionsStep = await this.fillAccessModeStep(project.accessMode);
            await permissionsStep.waitForLoaded();
            await this.fillPermissionsStep(project.principalsToAccess);
            let applicationStep = new ProjectWizardDialogApplicationsStep();

            if (await applicationStep.isLoaded()) {
                if (project.applications) {
                    await this.fillApplicationStep(project.applications);
                } else {
                    await applicationStep.clickOnSkipButton();
                }
            }
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            let projectWizardDialogSummaryStep = await this.fillNameAndDescriptionStep(project.name, project.identifier,
                project.description);
            await projectWizardDialogSummaryStep.pause(1000);
            await projectWizardDialogSummaryStep.waitForLoaded();
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_save_proj');
            throw new Error("Error during creating the project, screenshot:" + screenshot + "  " + err);
        }
    },
    async saveScreenshotUniqueName(namePart) {
        let screenshotName = appConst.generateRandomName(namePart);
        await this.saveScreenshot(screenshotName);
        return screenshotName;
    },
    async waitForElementDisplayed(locator, ms) {
        let element = await this.getBrowser().$(locator);
        return await element.waitForDisplayed(ms);
    },
    async fillFormsWizardAndClickOnCreateButton(project) {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let summaryStep = new ProjectWizardDialogSummaryStep();
        await this.fillFormsWizard(project);
        await summaryStep.clickOnCreateProjectButton();
        await summaryStep.waitForDialogClosed();
        await settingsBrowsePanel.waitForSpinnerNotVisible();
        return await settingsBrowsePanel.pause(500);
    },
    async selectAndDeleteProject(projectName, identifier) {
        let confirmValueDialog = new ConfirmValueDialog();
        let settingsBrowsePanel = new SettingsBrowsePanel();
        //1.Select the layer:
        await settingsBrowsePanel.clickOnRowByDisplayName(projectName);
        await settingsBrowsePanel.clickOnDeleteButton();
        //2. Confirm the deleting:
        await confirmValueDialog.waitForDialogOpened();
        if (identifier) {
            await confirmValueDialog.typeNumberOrName(identifier);
        } else {
            await confirmValueDialog.typeNumberOrName(projectName);
        }

        await confirmValueDialog.clickOnConfirmButton();
        await confirmValueDialog.waitForDialogClosed();
        return await settingsBrowsePanel.waitForNotificationMessage();
    },
    async selectParentAndOpenProjectWizardDialog(parentName) {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnRowByDisplayName(parentName);
        await settingsBrowsePanel.clickOnNewButton();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        await parentProjectStep.waitForLoaded();
        return parentProjectStep;
    },

    async clickOnNewAndOpenProjectWizardDialog() {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnNewButton();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        await parentProjectStep.waitForLoaded();
        return parentProjectStep;
    },

    saveScreenshot(name, that) {
        let screenshotsDir = path.join(__dirname, '/../build/reports/screenshots/');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, {recursive: true});
        }
        return this.getBrowser().saveScreenshot(screenshotsDir + name + '.png').then(() => {
            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    },
    buildProject(language, accessMode, principalsToAccess, applications, name, identifier, description) {
        return {
            language: language,
            accessMode: accessMode,
            applications: applications,
            name: name,
            identifier: identifier,
            description: description,
            principalsToAccess: principalsToAccess
        };
    },
    buildLayer(parents, language, accessMode, principalsToAccess, applications, name, identifier, description) {
        return {
            language: language,
            parents: parents,
            accessMode: accessMode,
            applications: applications,
            name: name,
            identifier: identifier,
            description: description,
            principalsToAccess: principalsToAccess
        };
    },
};
