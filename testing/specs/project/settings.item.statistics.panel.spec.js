/**
 * Created on 03.04.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const SettingsItemStatisticsPanel = require('../../page_objects/project/settings.item.statistics.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');

describe('settings.item.statistics.panel.spec - verify an info in item statistics panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const NEW_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const DESCRIPTION = 'Test description';

    it(`WHEN existing 'Projects' folder has been highlighted THEN 'Projects Graph' should be loaded AND graphic element for 'Default' project should be displayed in statistics panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            // 1. Click on the row. This row should be highlighted:
            await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
            // 2. Wait for the graphic element for 'Default' project is displayed in Projects Graph:
            await studioUtils.saveScreenshot('project_item_statistics');
            await settingsItemStatisticsPanel.waitForGraphicElementDisplayed('Default');
        });

    // https://github.com/enonic/app-contentstudio/issues/7432
    // Project Graph is not shown after selecting Projects-checkbox #7432
    it(`WHEN the the checkbox for row with 'Projects' folder has been clicked THEN 'Projects Graph' should be loaded AND graphic element for 'Default' project should be displayed in statistics panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            // 1. Click on the Projects-checkbox:
            await settingsBrowsePanel.clickOnProjectsFolderCheckbox();
            // 2. Wait for the graphic element for 'Default' project is displayed in 'Projects Graph':
            await studioUtils.saveScreenshot('project_item_statistics');
            await settingsItemStatisticsPanel.waitForGraphicElementDisplayed('Default');
        });

    it(`GIVEN new project is saved WHEN the project has been selected THEN expected description should appear in statistics panel`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            // 1. Save new project:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, DESCRIPTION, appConst.LANGUAGES.EN, null, "Private");
            // 2.Click on the row with the project. This row should be highlighted:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. Wait for expected description block appears in statistics panel:
            let actualDescription = await settingsItemStatisticsPanel.getDescription();
            await studioUtils.saveScreenshot("project_item_statistics");
            // 4. Verify that the description:
            assert.equal(actualDescription, DESCRIPTION, "Expected description should be displayed");
            // 5. Verify access mode:
            let actualAccessMode = await settingsItemStatisticsPanel.getAccessMode();
            assert.equal(actualAccessMode, appConst.PROJECT_ACCESS_MODE.PRIVATE,
                "Private mode should be displayed in Statistics panel.");
            // 6. Verify the language:
            let actualLanguage = await settingsItemStatisticsPanel.getLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, "Expected language should be displayed in Statistics panel.");
        });

    it(`GIVEN 2 projects have been checked in Settings panel WHEN new project wizard modal dialog has been opened THEN only the second selected project should be displayed in the dialog`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            // 1. Select 2 checkboxes in Settings browse panel:
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName('Default');
            // 2. Press 'New' button in the toolbar:
            await settingsBrowsePanel.clickOnNewButton();
            await parentProjectStep.waitForLoaded();
            // 3. Verify that only the second selected project is displayed in the Step:
            await studioUtils.saveScreenshot('project_apps_step_selected_app');
            let selectedProjects = await parentProjectStep.getSelectedProjects();
            assert.equal(selectedProjects[1], 'Default', 'Default project should be selected in the parent step');
        });

    it("GIVEN user-contributor is added in Roles WHEN the project has been selected THEN this user should appear in statistics panel",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            let projectWizard = new ProjectWizard();
            // 1. Open the project and add a contributor in roles:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await projectWizard.selectProjectAccessRoles(appConst.systemUsersDisplayName.SUPER_USER);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            // 2. Click on 'close-icon' button and close the wizard:
            await settingsBrowsePanel.clickOnCloseIcon(PROJECT_DISPLAY_NAME);
            // 3. Wait for contributor appears in Roles:
            let contributors = await settingsItemStatisticsPanel.getContributors();
            assert.equal(contributors[0], appConst.systemUsersDisplayName.SUPER_USER, "New added contributor is displayed in Roles");
        });
    // Verifies:  Item Statistics panel is not refreshed after updating an item in wizard. #1493
    // https://github.com/enonic/lib-admin-ui/issues/1493
    it("GIVEN existing project is checked WHEN the project has been opened and updated THEN the project should be updated in Statistics Panel",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            // 1.Click on the checkbox, select and open the project:
            let projectWizard = await settingsBrowsePanel.checkAndOpenProjectByDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.typeDisplayName(NEW_DISPLAY_NAME);
            // 2. Update the displayName and save the project
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            await projectWizard.pause(700);
            await settingsBrowsePanel.clickOnCloseIcon(NEW_DISPLAY_NAME);
            await projectWizard.waitForWizardClosed();
            // 3. Verify that the displayName is updated in Statistics Panel:
            let displayName = await settingsItemStatisticsPanel.getItemDisplayName();
            await studioUtils.saveScreenshot("project_item_statistics");
            // 4. Verify that the text:
            assert.equal(displayName, NEW_DISPLAY_NAME, "Expected display name should be present");
        });

    it("GIVEN existing project is selected WHEN the project has been deleted THEN statistics panel should be cleared",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. Select an existing project then delete it:
            await settingsBrowsePanel.clickOnRowByDisplayName(NEW_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            // Type the Identifier of the project
            await confirmValueDialog.typeNumberOrName(PROJECT_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            // 2.Description block gets not visible in the statistics panel:
            await settingsItemStatisticsPanel.waitForDescriptionNotDisplayed();
            await studioUtils.saveScreenshot("project_item_statistics_description_not_displayed");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
