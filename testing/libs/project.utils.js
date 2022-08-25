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

module.exports = {

    async saveTestProject(name, description, language, permissions, accessMode) {
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        let summaryStep = new ProjectWizardDialogSummaryStep();
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnNewButton();
        await parentProjectStep.waitForLoaded();
        let project = this.buildProject(null, language, accessMode, permissions, null, name, null, description);
        await this.fillFormsWizard(project);
        await summaryStep.waitForLoaded();
        await summaryStep.clickOnCreateProjectButton();
        await summaryStep.waitForDialogClosed();
        return await settingsBrowsePanel.pause(500);
    },
    async fillParentNameStep(parentName) {
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        if (await parentProjectStep.isSelectedParentProjectDisplayed()) {
            await parentProjectStep.clickOnNextButton();
        } else if (parentName) {
            await parentProjectStep.selectParentProject(parentName);
            await parentProjectStep.clickOnNextButton();
        } else {
            await parentProjectStep.clickOnSkipButton();
        }
        return new ProjectWizardDialogLanguageStep();
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
            await applicationsStep.selectApplication(applications);
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
        await nameAndIdStep.clickOnNextButton();
        return new ProjectWizardDialogSummaryStep();
    },
    async fillFormsWizard(project) {
        let languageStep = await this.fillParentNameStep(project.parentName);
        await languageStep.waitForLoaded();
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
        let projectWizardDialogSummaryStep = await this.fillNameAndDescriptionStep(project.name, null, project.description);
        await projectWizardDialogSummaryStep.waitForLoaded();
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
    buildProject(parentName, language, accessMode, principalsToAccess, applications, name, identifier, description) {
        return {
            language: language,
            parentName: parentName,
            accessMode: accessMode,
            applications: applications,
            name: name,
            identifier: identifier,
            description: description,
            principalsToAccess: principalsToAccess
        };
    },
};
