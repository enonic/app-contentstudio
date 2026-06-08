/**
 * Created on 01.06.2020.  updated on 06.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const EditProjectDefaultLanguageStep = require("../../page_objects/project/project-wizard-dialog/edit.project.default.language.step");
const ProjectWizardDialogAccessModeStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step");
const EditProjectNameStep = require("../../page_objects/project/project-wizard-dialog/edit.project.name.step");
const ProjectWizardDialogPermissionsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step");
const ProjectWizardDialogApplicationsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.applications.step");
const ProjectWizardDialogSummaryStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.summary.step");
const DetailsWidgetPermissionsSection = require('../../page_objects/browsepanel/detailspanel/details.widget.permissions.section');

describe('change.access.mode.spec - Update Access Mode in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const TEST_FOLDER_NAME = studioUtils.generateRandomName('folder');
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');

    it(`Preconditions: new project with 'Private' access mode should be added`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Save new project (mode access is Private):
            await projectUtils.saveTestProject({
                name: PROJECT_DISPLAY_NAME,
                accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
            });
        });

    it("Precondition: new folder should be added in existing project(Private mode access)",
        async () => {
            // 1. Select the project in 'Select Context' dialog
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. add new folder:
            FOLDER = contentBuilder.buildFolder(TEST_FOLDER_NAME);
            await studioUtils.doAddFolder(FOLDER);
        });

    it("GIVEN existing project(Private access mode) is opened WHEN access mode has been switched to 'Public' THEN Access Mode gets 'Public'",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            await studioUtils.openSettingsPanel();
            // 1. Open existing project with Private access mode:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            // 2. Go to Access mode Step:
            let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
            await editProjectDefaultLanguageStep.waitForLoaded();
            await editProjectDefaultLanguageStep.clickOnNextButton();
            let editProjectNameStep = new EditProjectNameStep();
            await editProjectNameStep.waitForLoaded();
            await editProjectNameStep.clickOnNextButton();
            let projectWizardDialogAccessModeStep = new ProjectWizardDialogAccessModeStep();
            await projectWizardDialogAccessModeStep.waitForLoaded();
            // 3. Change to 'Public' access mode and confirm the changes:
            await projectWizardDialogAccessModeStep.clickOnAccessModeRadio('Public');
            await projectWizardDialogAccessModeStep.clickOnNextButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 4. Go to Summary Step:
            let projectRolesStep = new ProjectWizardDialogPermissionsStep();
            await projectRolesStep.waitForLoaded();
            await projectRolesStep.clickOnNextButton();
            let projectApplications = new ProjectWizardDialogApplicationsStep();
            await projectApplications.waitForLoaded();
            await projectApplications.clickOnNextButton();
            let projectWizardDialogSummaryStep = new ProjectWizardDialogSummaryStep();
            await projectWizardDialogSummaryStep.waitForLoaded();
            // 5.Update the project
            await projectWizardDialogSummaryStep.clickOnUpdateProjectButton();
            let actualMessages = await projectWizard.waitForNotificationMessages();
            // 4. Verify the  notification messages appear: 'Project is modified' /// TODO ??  and 'Permissions are applied'
            await studioUtils.saveScreenshot('project_access_mode_updated');
            assert.ok(actualMessages.includes(appConst.projectModifiedMessage(PROJECT_DISPLAY_NAME)), 'Expected message should appears');
        });

    it(`GIVEN existing project's context is selected WHEN existing folder has been clicked THEN 'Everyone can read this item' header should be displayed in DetailsWidgetPermissionsSection`,
        async () => {
            let detailsWidgetPermissionsSection = new DetailsWidgetPermissionsSection();
            // 1. Select the project in 'Select Context' dialog
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Select existing folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 3. Verify that DetailsWidgetPermissionsSection is updated:
            await studioUtils.openBrowseDetailsPanel();
            await studioUtils.saveScreenshot('project_access_mode_updated_widget');
            let actualDescription = await detailsWidgetPermissionsSection.getPermissionsAccessDescription();
            assert.equal(actualDescription, appConst.ACCESS_WIDGET_HEADER.EVERYONE_CAN_READ,
                "'Everyone can read this item' - header should be displayed");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
