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
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('settings.item.statistics.panel.spec - verify an info in item statistics panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
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
            let actualDisplayName = await settingsItemStatisticsPanel.getItemDisplayName();
            //3. Verify the display name in statistics panel:
            assert.equal(actualDisplayName, "Projects", "Expected display name should be displayed");
        });

    it(`GIVEN new project is saved WHEN the project has been selected THEN expected description should appear in statistics panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            //1. Save new project:
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, DESCRIPTION);
            //2.Click on the row with the project. This row should be highlighted:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Wait for expected description block appears in statistics panel:
            let actualDescription = await settingsItemStatisticsPanel.getDescription();
            studioUtils.saveScreenshot("project_item_statistics");
            //4. Verify that the text:
            assert.equal(actualDescription, DESCRIPTION, "Expected description should be displayed");
        });

    it(`GIVEN existing project is selected WHEN the project has been deleted THEN statistics panel should be cleared`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Select an existing project then delete it:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            //2.Description block gets not visible in the statistics panel:
            await settingsItemStatisticsPanel.waitForDescriptionNotDisplayed();
            studioUtils.saveScreenshot("project_item_statistics_description_not_displayed");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
