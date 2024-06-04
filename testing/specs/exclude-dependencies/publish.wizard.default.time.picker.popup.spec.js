/**
 * Created on 04.04.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const DateTimePickerPopup = require('../../page_objects/wizardpanel/time/date.time.picker.popup');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectNotAvailableDialog = require('../../page_objects/project/project.not.available.dialog');
const projectUtils = require('../../libs/project.utils');

describe('publish.wizard.dialog.time.picker.popup.spec - tests for configured time in Picker Popup', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const CONFIGURED_TIME_IN_POPUP = '16:00';
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it("Precondition: click on 'Start Wizard' button then create a project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            // 1. Project Not Available Dialog should be loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
            // 2. Click on Start button in the modal dialog:
            await projectNotAvailableDialog.clickOnStartWizardButton();
            // 3. Skip the language step
            await languageStep.waitForLoaded();
            await languageStep.clickOnSkipButton();
            // 4. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 5. skip the permissions step:
            await permissionsStep.clickOnSkipButton();
            // 6. Skip the applications step
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            // 7. Fill in the name input
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(PROJECT_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            // 8. Click on 'Create Project' button and wait for the dialog is closed:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it(`Precondition: ready for publishing folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(FOLDER);
        });

    it(`WHEN DatePicker popup has been opened THEN config time in the 'Online From datetime picker will be set to the value of the config property('16:00')`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateTimePickerPopup = new DateTimePickerPopup();
            // 1. Select existing 'ready' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Add schedule' button:
            await contentPublishDialog.clickOnAddScheduleIcon();
            // 3. Open Oline from Picker popup:
            await contentPublishDialog.showOnlineFormPickerPopup();
            // 4. Verify the time from the popup:
            let actualTime = await dateTimePickerPopup.getTimeInOnlineFrom();
            assert.equal(actualTime, CONFIGURED_TIME_IN_POPUP,
                'The configured time (16:00) should be displayed in the online from Picker Popup');
        });

    it("Post condition - test project should be deleted",
        async () => {
            // 1. Open Setting panel
            await studioUtils.openSettingsPanel();
            // 2. Select and delete the project:
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
            let projectNotAvailableDialog = new ProjectNotAvailableDialog();
            await projectUtils.saveScreenshot('the_only_one_project_deleted_3');
            // 3. Verify that Project Not Available modal Dialog is automatically loaded
            await projectNotAvailableDialog.waitForDialogLoaded();
        });

    beforeEach(() => studioUtils.navigateToContentStudioWithProjects());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
