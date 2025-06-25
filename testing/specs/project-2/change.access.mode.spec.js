/**
 * Created on 01.06.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const appConst = require('../../libs/app_const');

describe('change.access.mode.spec - Update Access Mode in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER;
    const TEST_FOLDER_NAME = studioUtils.generateRandomName('folder');
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`Preconditions: new project with 'Private' access mode should be added`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Save new project (mode access is Private):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'test description', null, null, 'Private');
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
            // 1.Open existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Click on 'Public' radio and confirm the changes:
            await projectWizard.clickOnAccessModeRadio('Public');
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 3. Save the changes:
            await projectWizard.waitAndClickOnSave();
            let actualMessages = await projectWizard.waitForNotificationMessages();
            // 4. Verify that 2  notification messages appear: 'Project is modified' and 'Permissions are applied'
            await studioUtils.saveScreenshot('project_access_mode_updated');
            assert.equal(actualMessages[1], appConst.projectModifiedMessage(PROJECT_DISPLAY_NAME));
            assert.ok(actualMessages[0].includes('Permissions'), 'Permissions are applied - the second expected notification message');
            assert.ok(actualMessages[0].includes('have been applied'), 'Permissions have been applied - the second expected notification message');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/1889
    // Project Wizard - access mode is not updated after the mode change has been confirmed
    it("GIVEN existing project was switched to 'Public' mode WHEN the project has been reopened THEN 'Public' Access Mode (radio button) should be selected",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await studioUtils.openSettingsPanel();
            // 1. reopen the project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Verify that 'Public' radio is selected:
            let isSelected = await projectWizard.isAccessModeRadioSelected('Public');
            assert.ok(isSelected, "'Public' radio button should be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            assert.ok(isSelected === false, "'Private' radio button should not be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Custom");
            assert.ok(isSelected === false, "'Custom' radio button should not be selected");
        });

    it(`GIVEN existing project's context is selected WHEN existing folder has been clicked THEN 'Everyone can read this item' header should be displayed in Access Widget`,
        async () => {
            let userAccessWidget = new UserAccessWidget();
            // 1. Select the project in 'Select Context' dialog
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Select existing folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 3. Verify that Widget Access is updated:
            await studioUtils.openBrowseDetailsPanel();
            await studioUtils.saveScreenshot('project_access_mode_updated_widget');
            let actualHeader = await userAccessWidget.getHeader();
            assert.equal(actualHeader, appConst.ACCESS_WIDGET_HEADER.EVERYONE_CAN_READ,
                "'Everyone can read this item' - header should be displayed");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
