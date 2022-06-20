/**
 * Created on 03.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const SettingsItemStatisticsPanel = require('../../page_objects/project/settings.item.statistics.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');

describe('settings.item.statistics.panel.spec - verify an info in item statistics panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let NEW_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let DESCRIPTION = "Test description";

    it(`WHEN existing 'Projects' folder has been highlighted THEN expected description and title should appear in statistics panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            //1.Click on the row. This row should be highlighted:
            await settingsBrowsePanel.clickOnRowByDisplayName("Projects");
            //2. Wait for expected description in statistics panel:
            let actualDescription = await settingsItemStatisticsPanel.getDescription();
            studioUtils.saveScreenshot("project_item_statistics");
            //3. Verify the text of the description:
            assert.equal(actualDescription, "Manage projects and layers", "Expected description should be displayed");
            let actualDisplayName = await settingsItemStatisticsPanel.getFolderDisplayName();
            //3. Verify the display name in statistics panel:
            assert.equal(actualDisplayName, "Projects", "Expected display name should be displayed");
        });

    it(`GIVEN new project is saved WHEN the project has been selected THEN expected description should appear in statistics panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            //1. Save new project:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, DESCRIPTION, appConstant.LANGUAGES.EN, null, "Private");
            //2.Click on the row with the project. This row should be highlighted:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Wait for expected description block appears in statistics panel:
            let actualDescription = await settingsItemStatisticsPanel.getDescription();
            studioUtils.saveScreenshot("project_item_statistics");
            //4. Verify that the description:
            assert.equal(actualDescription, DESCRIPTION, "Expected description should be displayed");
            //5. Verify access mode:
            let actualAccessMode = await settingsItemStatisticsPanel.getAccessMode();
            assert.equal(actualAccessMode, appConstant.PROJECT_ACCESS_MODE.PRIVATE,
                "Private mode should be displayed in Statistics panel.");
            //6. Verify the language:
            let actualLanguage = await settingsItemStatisticsPanel.getLanguage();
            assert.equal(actualLanguage, appConstant.LANGUAGES.EN, "Expected language should be displayed in Statistics panel.");
        });

    it("GIVEN user-contributor is added in Roles WHEN the project has been selected THEN this user should appear in statistics panel",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            let projectWizard = new ProjectWizard();
            //1. Open the project and add a contributor in roles:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            //2. Click on 'close-icon' button and close the wizard:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME);
            //3. Wait for contributor appears in Roles:
            let contributors = await settingsItemStatisticsPanel.getContributors();
            assert.equal(contributors[0], appConstant.systemUsersDisplayName.SUPER_USER, "New added contributor is displayed in Roles");
        });
    //Verifies:  Item Statistics panel is not refreshed after updating an item in wizard. #1493
    //https://github.com/enonic/lib-admin-ui/issues/1493
    it("GIVEN existing project is checked WHEN the project has been opened and updated THEN the project should be updated in Statistics Panel",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            //1.Click on the checkbox, select and open the project:
            let projectWizard = await settingsBrowsePanel.checkAndOpenProjectByDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.typeDisplayName(NEW_DISPLAY_NAME);
            //2. Update the displayName and save the project
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            await projectWizard.pause(700);
            await settingsBrowsePanel.clickOnCloseIcon(NEW_DISPLAY_NAME);
            await projectWizard.waitForWizardClosed();
            //3. Verify that the displayName is updated in Statistics Panel:
            let displayName = await settingsItemStatisticsPanel.getItemDisplayName();
            studioUtils.saveScreenshot("project_item_statistics");
            //4. Verify that the text:
            assert.equal(displayName, NEW_DISPLAY_NAME, "Expected display name should be present");
        });

    it("GIVEN existing project is selected WHEN the project has been deleted THEN statistics panel should be cleared",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Select an existing project then delete it:
            await settingsBrowsePanel.clickOnRowByDisplayName(NEW_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            //Type the Identifier of the project
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            //2.Description block gets not visible in the statistics panel:
            await settingsItemStatisticsPanel.waitForDescriptionNotDisplayed();
            studioUtils.saveScreenshot("project_item_statistics_description_not_displayed");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
