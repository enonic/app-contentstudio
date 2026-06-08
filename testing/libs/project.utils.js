/**
 * Created on 20.08.2022
 */
const SettingsBrowsePanel = require('../page_objects/project/settings.browse.panel');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');
const LanguageAndParentProjectStep = require('../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
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
    normalizeSaveProjectArgs(...args) {
        if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
            const {
                name,
                description = null,
                language = null,
                permissions = null,
                accessMode = null,
                applications = null,
                identifier = null,
                parents = null
            } = args[0];

            if (!name) {
                throw new Error('saveTestProject: `name` is required');
            }

            return {name, description, language, permissions, accessMode, applications, identifier, parents};
        }

        const [name, description, language, permissions, accessMode, applications, identifier, parents] = args;

        if (!name) {
            throw new Error('saveTestProject: `name` is required');
        }

        return {name, description, language, permissions, accessMode, applications, identifier};
    },
    async saveTestProject(...args) {
        const options = this.normalizeSaveProjectArgs(...args);
        let languageAndParentProjectStep = new LanguageAndParentProjectStep();
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnNewButton();

        const project = this.buildProject(
            options.language,
            options.accessMode,
            options.permissions,
            options.applications,
            options.name,
            options.identifier,
            options.description,
            options.parents
        );
        //await this.fillFormsWizard(project);

        await languageAndParentProjectStep.waitForLoaded();
        await this.fillLanguageAndParentProjectStep(project.language, project.parents);
        await languageAndParentProjectStep.clickOnNextButton();

        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        await nameAndIdStep.waitForLoaded();
        await this.fillNameAndDescriptionStep(project.name, project.identifier, project.description);
        await nameAndIdStep.clickOnNextButton();

        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        await accessModeStep.waitForLoaded();
        await accessModeStep.clickOnAccessModeRadio(project.accessMode);
        await accessModeStep.clickOnNextButton();

        let permissionsStep = new ProjectWizardDialogPermissionsStep();
        await permissionsStep.waitForLoaded();
        await this.fillPermissionsStep(project.principalsToAccess);
        await permissionsStep.clickOnNextButton();

        let applicationStep = new ProjectWizardDialogApplicationsStep();
        if (await applicationStep.isLoaded()) {
            if (project.applications) {
                await this.fillApplicationStep(project.applications);
            }
            await applicationStep.clickOnNextButton();
        }

        let summaryStep = new ProjectWizardDialogSummaryStep();
        await summaryStep.waitForLoaded();
        await summaryStep.clickOnCreateProjectButton();
        await summaryStep.waitForDialogClosed();
        return await settingsBrowsePanel.pause(500);
    },
    // for multiInheritance = true
    async selectParentProjectsByName(parents) {
        try {
            let parentProjectStep = new LanguageAndParentProjectStep();
            parents = [].concat(parents);
            let selectedItems = await parentProjectStep.getSelectedProjects();
            for (let name of parents) {
                if (selectedItems.length === 0 || this.isProjectSelected(selectedItems, name)) {
                    // select a project and click on Apply button
                    await parentProjectStep.selectParentProjectMulti(name);
                }
            }
        } catch (err) {
            await this.handleError('Tried to select parent projects by name', 'err_parent_proj_step', err);
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

    async fillAccessModeStep(accessMode) {
        try {
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            if (accessMode) {
                await accessModeStep.clickOnAccessModeRadio(accessMode);
            } else {
                //set the default access mode for ui-tests:
                await accessModeStep.clickOnAccessModeRadio('Private');
            }
        } catch (err) {
            await this.handleError('Project wizard - access mode step', 'err_access_mode_step', err);
        }
    },
    async fillPermissionsStep(principalsToAccess) {
        let permissionsStep = new ProjectWizardDialogPermissionsStep();
        if (principalsToAccess) {
            if (Array.isArray(principalsToAccess)) {
                await permissionsStep.addPrincipalsInRolesForm(principalsToAccess);
            } else {
                await permissionsStep.selectProjectAccessRole(principalsToAccess);
            }
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
            //await applicationsStep.clickOnNextButton();
        }
        return new ProjectWizardDialogNameAndIdStep();
    },
    async fillNameAndDescriptionStep(name, identifier, description,) {
        try {
            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            if (name) {
                await nameAndIdStep.typeDisplayName(name);
            }
            if (description) {
                await nameAndIdStep.typeDescription(description);
            }
            if (identifier) {
                await nameAndIdStep.clearIdInput()
                await nameAndIdStep.typeTextInProjectIdentifierInput(identifier);
            }
            await nameAndIdStep.pause(500);
        } catch (err) {
            await this.handleError('Tried to fill in the Name and Description step', 'err_name_desc_step', err);
        }
    },
    // multiInheritance = true
    async fillLanguageAndMultiParentProjectStep(language, parents) {
        try {
            const step = new LanguageAndParentProjectStep();

            if (language) {
                await step.selectLanguage(language);
            }

            // 1) If parents are not provided, keep the auto-selected items from the grid unchanged.
            const requestedParents = this.normalizeParents(parents);
            if (requestedParents.length === 0) {
                return;
            }
            // 2) Read the current state of the selector (it may already contain pre-selected items).
            const selectedRaw = await step.getSelectedProjects().catch(() => []);
            const selectedNormalized = selectedRaw.map((name) => this.normalizeSelectedProjectName(name));
            // 3) Multi mode: Add only missing parent items.
            for (const target of requestedParents) {
                if (!this.hasSelectedProject(selectedNormalized, target)) {
                    await step.selectParentProjectMulti(target);
                    selectedNormalized.push(this.normalizeSelectedProjectName(target));
                }
            }

        } catch (err) {
            await this.handleError(
                'Tried to fill in the Language and Parent Project step',
                'err_multi_parent_step',
                err
            );
        }
    },
    // multiInheritance = false
    async fillLanguageAndParentProjectStep(language, parents) {
        try {
            const step = new LanguageAndParentProjectStep();

            if (language) {
                await step.selectLanguage(language);
            }

            // 1)If parents are not provided, keep the auto-selected items from the grid as they are.
            const requestedParents = this.normalizeParents(parents);
            if (requestedParents.length === 0) {
                return;
            }

            const selectedRaw = await step.getSelectedProjects().catch(() => []);
            const selectedNormalized = selectedRaw.map((name) => this.normalizeSelectedProjectName(name));

            if (requestedParents.length === 1) {
                const target = requestedParents[0];
                if (!this.hasSelectedProject(selectedNormalized, target)) {
                    await step.selectParentProject(target);
                }
                return;
            }
        } catch (err) {
            await this.handleError(
                'Tried to fill in the Language and Parent Project step',
                'err_lang_parent_step',
                err
            );
        }
    },

    normalizeParents(parents) {
        if (!parents) {
            return [];
        }

        return (Array.isArray(parents) ? parents : [parents])
            .map((item) => String(item).trim())
            .filter(Boolean);
    },

    normalizeSelectedProjectName(name) {
        return String(name).replace(/\s*\([^)]*\)\s*$/, '').trim();
    },

    hasSelectedProject(selectedList, targetName) {
        const normalizedTarget = this.normalizeSelectedProjectName(targetName).toLowerCase();
        return selectedList.some((item) => this.normalizeSelectedProjectName(item).toLowerCase() === normalizedTarget);
    },
    async fillFormsWizard(project) {
        try {
            let languageAndParentProjectStep = new LanguageAndParentProjectStep();
            await this.fillLanguageAndParentProjectStep(project.language, project.parents);
            await languageAndParentProjectStep.clickOnNextButton();

            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            await this.fillNameAndDescriptionStep(project.name, project.identifier, project.description);
            await this.saveScreenshot(project.name);
            await nameAndIdStep.clickOnNextButton();

            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            await accessModeStep.waitForLoaded();
            await accessModeStep.clickOnAccessModeRadio(project.accessMode);
            await accessModeStep.clickOnNextButton();

            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            await permissionsStep.waitForLoaded();
            await this.fillPermissionsStep(project.principalsToAccess);
            await permissionsStep.clickOnNextButton();
            let applicationStep = new ProjectWizardDialogApplicationsStep();

            if (await applicationStep.isLoaded()) {
                if (project.applications) {
                    await this.fillApplicationStep(project.applications);
                }
                await applicationStep.clickOnNextButton();
            }

            let projectWizardDialogSummaryStep = new ProjectWizardDialogSummaryStep();
            await projectWizardDialogSummaryStep.waitForLoaded();
            await projectWizardDialogSummaryStep.pause(1000);

        } catch (err) {
            if (err && err.isHandledError) {
                throw err;
            }
            await this.handleError('Tried to fill in the project wizard steps', 'err_ave_proj', err);
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
        //1. Select the layer:
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
        let languageAndParentProjectStep = new LanguageAndParentProjectStep();
        await languageAndParentProjectStep.waitForLoaded();
        return languageAndParentProjectStep;
    },

    async clickOnNewAndOpenProjectWizardDialog() {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        await settingsBrowsePanel.clickOnNewButton();
        let languageAndParentProjectStep = new LanguageAndParentProjectStep();
        await languageAndParentProjectStep.waitForLoaded();
        return languageAndParentProjectStep;
    },
    async handleError(errorMessage, screenshotName, error) {
        let screenshot = await this.saveScreenshotUniqueName(screenshotName);
        const wrappedError = new Error(`${errorMessage}, screenshot: ${screenshot} ` + error);
        wrappedError.isHandledError = true;
        throw wrappedError;
    },
    async saveScreenshot(name, that) {
        try {
            let screenshotsDir = path.join(__dirname, '/../build/reports/screenshots/');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, {recursive: true});
            }
            await this.getBrowser().saveScreenshot(screenshotsDir + name + '.png');
            console.log('screenshot is saved ' + name);
        } catch (err) {
            return console.log('screenshot was not saved ' + err);
        }
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
