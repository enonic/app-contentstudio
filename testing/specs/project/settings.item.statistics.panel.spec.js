/**
 * Created on 03.04.2020.  updated on 26.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const SettingsItemStatisticsPanel = require('../../page_objects/project/settings.item.statistics.panel');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const EditProjectDefaultLanguageStep = require('../../page_objects/project/project-wizard-dialog/edit.project.default.language.step');
const EditProjectNameStep = require('../../page_objects/project/project-wizard-dialog/edit.project.name.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogSummaryStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.summary.step');

describe('settings.item.statistics.panel.spec - verify an info in item statistics panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const NEW_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const DESCRIPTION = 'Test description';

    it(`WHEN existing 'Projects' folder has been highlighted THEN 'Projects Graph' should be loaded AND graphic element for 'Default' project should be displayed in statistics panel`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the row. This row should be highlighted:
        await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
        // 2. Wait for the graphic element for 'Default' project is displayed in Projects Graph:
        await studioUtils.saveScreenshot('project_item_statistics');
        await settingsItemStatisticsPanel.waitForGraphicElementDisplayed('Default');
    });

    it(`WHEN 'Projects' folder has been highlighted THEN the card for 'Default' project should show its identifier in 'Projects Graph'`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the row with 'Projects' folder:
        await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
        await settingsItemStatisticsPanel.waitForProjectsGraphDisplayed();
        // 2. Verify the identifier of 'Default' project in its card:
        let identifier = await settingsItemStatisticsPanel.getGraphicElementId('Default');
        assert.equal(identifier, 'default', `'default' identifier should be displayed in the card`);
        // 3. Verify that 'Default' project is present in the graph:
        let displayNames = await settingsItemStatisticsPanel.getGraphicElementsDisplayNames();
        assert.ok(displayNames.includes('Default'), `'Default' project should be present in the graph`);
        // 4. Every card in the graph has a display name:
        let numberOfCards = await settingsItemStatisticsPanel.countGraphicElements();
        assert.equal(numberOfCards, displayNames.length, 'Every card in the graph should have a display name');
    });

    it(`GIVEN 'Projects Graph' is loaded WHEN zoom buttons have been pressed THEN the zoom value should be updated`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the row with 'Projects' folder:
        await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
        await settingsItemStatisticsPanel.waitForProjectsGraphDisplayed();
        // 2. Click on 'Reset zoom' button, the graph gets the initial 100% zoom:
        await settingsItemStatisticsPanel.clickOnGraphControlButton('Reset zoom');
        let zoomValue = await settingsItemStatisticsPanel.getProjectsGraphZoomValue();
        assert.equal(zoomValue, '100%', `'100%' zoom should be displayed after resetting the zoom`);
        // 3. Click on 'Zoom in' button, the zoom step is 1.25:
        await settingsItemStatisticsPanel.clickOnGraphControlButton('Zoom in');
        zoomValue = await settingsItemStatisticsPanel.getProjectsGraphZoomValue();
        assert.equal(zoomValue, '125%', `'125%' zoom should be displayed after zooming in`);
        // 4. Click on 'Zoom out' button, the zoom returns to the previous value:
        await settingsItemStatisticsPanel.clickOnGraphControlButton('Zoom out');
        zoomValue = await settingsItemStatisticsPanel.getProjectsGraphZoomValue();
        assert.equal(zoomValue, '100%', `'100%' zoom should be displayed after zooming out`);
        // 5. 'Fit to view' does not break the graph, the card for 'Default' remains displayed:
        await settingsItemStatisticsPanel.clickOnGraphControlButton('Fit to view');
        await settingsItemStatisticsPanel.waitForGraphicElementDisplayed('Default');
    });

    it(`GIVEN 'Projects Graph' is loaded WHEN the card for 'Default' project has been clicked THEN the project should be selected in statistics panel`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the row with 'Projects' folder:
        await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
        await settingsItemStatisticsPanel.waitForProjectsGraphDisplayed();
        // 2. Click on the card for 'Default' project:
        await settingsItemStatisticsPanel.clickOnGraphicElement('Default');
        // 3. Verify that the project is selected and its statistics is displayed instead of the graph:
        let displayName = await settingsItemStatisticsPanel.getItemDisplayName();
        assert.equal(displayName, 'Default', `'Default' project should be selected after clicking on its card`);
        await settingsItemStatisticsPanel.waitForProjectsGraphNotDisplayed();
    });

    // https://github.com/enonic/app-contentstudio/issues/7432
    // Project Graph is not shown after selecting Projects-checkbox #7432
    it(`WHEN the the checkbox for row with 'Projects' folder has been clicked THEN 'Projects Graph' should be loaded AND graphic element for 'Default' project should be displayed in statistics panel`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the Projects-checkbox:
        await settingsBrowsePanel.clickOnProjectsFolderCheckbox();
        // 2. Wait for the graphic element for 'Default' project is displayed in 'Projects Graph':
        await studioUtils.saveScreenshot('project_item_statistics');
        await settingsItemStatisticsPanel.waitForGraphicElementDisplayed('Default');
    });

    it(`GIVEN new project is saved WHEN the project has been selected THEN expected description should appear in statistics panel`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Save new project:
        await projectUtils.saveTestProject({
            name: PROJECT_DISPLAY_NAME,
            description: DESCRIPTION,
            accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
            language: appConst.LANGUAGES.EN,
        });
        // 2.Click on the row with the project. This row should be highlighted:
        await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
        // 3. Wait for expected description block appears in statistics panel:
        let actualDescription = await settingsItemStatisticsPanel.getDescription();
        await studioUtils.saveScreenshot('project_item_statistics');
        // 4. Verify that the description:
        assert.equal(actualDescription, DESCRIPTION, 'Expected description should be displayed');
        // 5. Verify access mode:
        let actualAccessMode = await settingsItemStatisticsPanel.getAccessMode();
        assert.equal(
            actualAccessMode,
            appConst.PROJECT_ACCESS_MODE.PRIVATE,
            'Private mode should be displayed in Statistics panel.',
        );
        // 6. Verify the language:
        let actualLanguage = await settingsItemStatisticsPanel.getLanguage();
        assert.equal(
            actualLanguage,
            appConst.LANGUAGES.EN,
            'Expected language should be displayed in Statistics panel.',
        );
    });

    it(`GIVEN new project is saved WHEN 'Projects' folder has been highlighted THEN the card for the new project should appear in 'Projects Graph'`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the row with 'Projects' folder:
        await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
        await settingsItemStatisticsPanel.waitForProjectsGraphDisplayed();
        // 2. Verify that the card for the new project is displayed in the graph:
        await settingsItemStatisticsPanel.waitForGraphicElementDisplayed(PROJECT_DISPLAY_NAME);
        // 3. Verify the identifier and the language in the card:
        let identifier = await settingsItemStatisticsPanel.getGraphicElementId(PROJECT_DISPLAY_NAME);
        //assert.equal(
        //   identifier,
        //    `${PROJECT_DISPLAY_NAME} (en)`,
        //    'Identifier and language of the project should be displayed in the card',
        //);
    });

    // multiInheritance = false
    it(`GIVEN 2 projects have been checked in Settings panel WHEN new project wizard modal dialog has been opened THEN only the second selected project should be displayed in the dialog`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let parentProjectStep = new ProjectWizardDialogParentProjectStep();
        // 1. Select 2 checkboxes in Settings browse panel:
        await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName(PROJECT_DISPLAY_NAME);
        await settingsBrowsePanel.clickOnCheckboxAndSelectRowByName('Default');
        // 2. Press 'New' button in the toolbar:
        await settingsBrowsePanel.clickOnNewButton();
        await parentProjectStep.waitForLoaded();
        // 3. Verify that only the second selected project is displayed in the Step:(multiInheritance = false)
        await studioUtils.saveScreenshot('project_apps_step_selected_app');
        let selectedProjects = await parentProjectStep.getSelectedProjects();
        assert.equal(selectedProjects[0], 'Default', 'Default project should be selected in the parent step');
    });

    // Verifies:  Item Statistics panel is not refreshed after updating an item in wizard. #1493
    // https://github.com/enonic/lib-admin-ui/issues/1493
    it('GIVEN existing project is checked WHEN the project has been opened and updated THEN the project should be updated in Statistics Panel', async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1.Click on the checkbox, select and open the project:
        await settingsBrowsePanel.checkProjectAndClickOnEditButton(PROJECT_DISPLAY_NAME);
        let editProjectDefaultLanguageStep = new EditProjectDefaultLanguageStep();
        await editProjectDefaultLanguageStep.waitForLoaded();
        await editProjectDefaultLanguageStep.clickOnNextButton();
        let editProjectNameStep = new EditProjectNameStep();
        await editProjectNameStep.waitForLoaded();
        await editProjectNameStep.clearDisplayName();
        // 2. Update the display name:
        await editProjectNameStep.typeDisplayName(NEW_DISPLAY_NAME);
        await editProjectNameStep.clickOnNextButton();

        let projectWizardDialogAccessModeStep = new ProjectWizardDialogAccessModeStep();
        await projectWizardDialogAccessModeStep.waitForLoaded();
        await projectWizardDialogAccessModeStep.clickOnNextButton();
        let permissionsStep = new ProjectWizardDialogPermissionsStep();
        await permissionsStep.waitForLoaded();
        await permissionsStep.clickOnNextButton();
        let applicationStep = new ProjectWizardDialogApplicationsStep();
        if (await applicationStep.isLoaded()) {
            await applicationStep.clickOnNextButton();
        }

        let projectWizardDialogSummaryStep = new ProjectWizardDialogSummaryStep();
        await projectWizardDialogSummaryStep.waitForLoaded();
        await projectWizardDialogSummaryStep.clickOnUpdateProjectButton();
        await projectWizardDialogSummaryStep.waitForDialogClosed();
        await settingsItemStatisticsPanel.pause(1000);
        // 3. Verify that the displayName is updated in Statistics Panel:
        let displayName = await settingsItemStatisticsPanel.getItemDisplayName();
        await studioUtils.saveScreenshot('project_item_statistics');
        // 4. Verify that the text:
        assert.equal(displayName, NEW_DISPLAY_NAME, 'Expected display name should be present');
    });

    it('GIVEN existing project is selected WHEN the project has been deleted THEN statistics panel should be cleared', async () => {
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
        await confirmValueDialog.waitForDialogClosed();
        // 2. Description block gets not visible in the statistics panel:
        await settingsItemStatisticsPanel.waitForDescriptionNotDisplayed();
        await studioUtils.saveScreenshot('project_item_statistics_description_not_displayed');
    });

    it(`GIVEN the project has been deleted WHEN 'Projects' folder has been highlighted THEN the card for the deleted project should not be present in 'Projects Graph'`, async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let settingsItemStatisticsPanel = new SettingsItemStatisticsPanel();
        // 1. Click on the row with 'Projects' folder:
        await settingsBrowsePanel.clickOnRowByDisplayName('Projects');
        await settingsItemStatisticsPanel.waitForProjectsGraphDisplayed();
        // 2. Verify that the card for the deleted project is not displayed:
        await settingsItemStatisticsPanel.waitForGraphicElementNotDisplayed(NEW_DISPLAY_NAME);
        // 3. 'Default' project remains in the graph:
        await settingsItemStatisticsPanel.waitForGraphicElementDisplayed('Default');
    });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
