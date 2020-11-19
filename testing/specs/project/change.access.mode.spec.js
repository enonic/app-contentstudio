/**
 * Created on 01.06.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const contentBuilder = require("../../libs/content.builder");
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('change.access.mode.spec - Update Access Mode in project wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER;
    let TEST_FOLDER_NAME = studioUtils.generateRandomName("folder");
    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");

    it(`Preconditions: new projects with 'Private' access mode should be added`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1. Save new project (mode access is Private):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, "test description", null, null, "Private");
        });

    it("Precondition: new folder should be added in existing project(Private mode access)",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. add new folder:
            FOLDER = contentBuilder.buildFolder(TEST_FOLDER_NAME);
            await studioUtils.doAddFolder(FOLDER);
        });

    it("GIVEN existing project(Private access mode) is opened WHEN access mode has been switched to 'Public' THEN Access Mode gets 'Public'",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let confirmationDialog = new ConfirmationDialog();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Open existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Click on Public radio and confirm the changes:
            await projectWizard.clickOnAccessModeRadio("Public");
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            //3. Save the changes:
            await projectWizard.waitAndClickOnSave();
            let actualMessages = await projectWizard.waitForNotificationMessages();
            //4. Verify the notification message:
            studioUtils.saveScreenshot("project_access_mode_updated");
            assert.equal(actualMessages[1], appConstant.projectModifiedMessage(PROJECT_DISPLAY_NAME));
            assert.isTrue(actualMessages[0].includes("Permissions"), "Permissions are applied - the second expected notification message");
            assert.isTrue(actualMessages[0].includes("are applied"), "Permissions are applied - the second expected notification message");
        });
    //Verifies https://github.com/enonic/app-contentstudio/issues/1889
    //Project Wizard - access mode is not updated after the mode change has been confirmed
    it("GIVEN existing project was switched to 'Public' mode WHEN the project has been reopened THEN 'Public' Access Mode (radio button) should be selected",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1. reopen the project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that 'Public' radio is selected:
            let isSelected = await projectWizard.isAccessModeRadioSelected("Public");
            assert.isTrue(isSelected, "'Public' radio button should be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Private");
            assert.isFalse(isSelected, "'Private' radio button should not be selected");
            isSelected = await projectWizard.isAccessModeRadioSelected("Custom");
            assert.isFalse(isSelected, "'Custom' radio button should not be selected");
        });

    it(`GIVEN existing project context is selected WHEN existing folder has been clicked THEN 'Everyone can read this item' header should be displayed in Access Widget`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let userAccessWidget = new UserAccessWidget();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. Select existing folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //3. Verify that Widget Access is updated:
            await studioUtils.openBrowseDetailsPanel();
            studioUtils.saveScreenshot("project_access_mode_updated_widget");
            let actualHeader = await userAccessWidget.getHeader();
            assert.equal(actualHeader, appConstant.ACCESS_WIDGET_HEADER.EVERYONE_CAN_READ,
                "'Everyone can read this item' - header should be displayed");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioWithProjects();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
