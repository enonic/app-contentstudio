/**
 * Created on 21.04.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const BrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const ContentWidgetView = require('../../page_objects/browsepanel/detailspanel/content.widget.item.view');
const EditPermissionsDialog = require('../../page_objects/edit.permissions.dialog');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');

describe('create.content.in.project.spec - create new content in the selected context and verify a language in wizards', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER_NAME = studioUtils.generateRandomName("folder");

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let TEST_DESCRIPTION = "test description";

    it(`Preconditions: new project(with Norsk (no) language) and 'Private' access mode should be added`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1. Save new project (mode access is Private):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConstant.LANGUAGES.NORSK_NO);
        });

    it(`WHEN existing project has been clicked in 'Select Context' dialog THEN empty grid should be loaded`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //Verify that 'No open issues' - this label should be in Issues Button:
            let actualLabel = await settingsBrowsePanel.getTextInShowIssuesButton();
            assert.equal(actualLabel, appConstant.SHOW_ISSUES_BUTTON_LABEL.NO_OPEN_ISSUES, "'No open issues' should be displayed");
            //Verify that the grid is empty:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 0, "Browse Panel should not contain content");
            let actualDisplayName = await contentBrowsePanel.getSelectedProjectDisplayName();
            assert.equal(actualDisplayName, PROJECT_DISPLAY_NAME,
                "Expected name should be displayed in the project selected option(App Bar)");
        });

    it(`GIVEN existing context is selected WHEN new folder wizard has been opened THEN expected language should be automatically set in the wizard step`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let settingsStepForm = new SettingsStepForm();
            let contentWizardPanel = new ContentWizardPanel();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. Open new folder wizard:
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            studioUtils.saveScreenshot("project_default_language");
            //3. Verify the language in the wizard:
            let actualLanguage = await settingsStepForm.getSelectedLanguage();
            assert.equal(actualLanguage, appConstant.LANGUAGES.NORSK_NO, "Expected language should be selected in the wizard step form");
            //4. Verify that expected project display name is present in the wizard-toolbar:
            let actualProjectName = await contentWizardPanel.getProjectDisplayName();
            assert.equal(actualProjectName, PROJECT_DISPLAY_NAME + "(no)", "Actual and expected display name should be equal");
        });

    it(`WHEN new folder wizard has been saved THEN expected project-ACL entries should be present in Access form`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let editPermissionsDialog = new EditPermissionsDialog();
            let contentWizardPanel = new ContentWizardPanel();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. Open new folder wizard:
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            await contentWizardPanel.typeDisplayName(TEST_FOLDER_NAME);
            await contentWizardPanel.waitAndClickOnSave();
            await contentWizardPanel.pause(1000);
            //3. Open Edit Permissions Dialog:
            await contentWizardPanel.clickOnEditPermissionsButton();
            await editPermissionsDialog.waitForDialogLoaded();
            //3. Open Edit Permissions Dialog
            let result = await editPermissionsDialog.getDisplayNameOfSelectedPrincipals();
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME + " - Owner"), "Expected Acl should be present");
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME + " - Editor"), "Expected Acl should be present");
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME + " - Author"), "Expected Acl should be present");
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME + " - Viewer"), "Expected Acl should be present");
            assert.isTrue(result.includes(PROJECT_DISPLAY_NAME + " - Contributor"), "Expected Acl should be present");
            assert.equal(result.length, 7, "Total number of ACL entries should be 7");
        });

    it("GIVEN project with 'Private' access mode is selected AND existing folder is selected WHEN Details Panel has been opened THEN 'Restricted access to item' should be in Access Widget",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let userAccessWidget = new UserAccessWidget();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog:
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. Select the folder and open details panel
            await studioUtils.findAndSelectItem(TEST_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            let actualHeader = await userAccessWidget.getHeader();
            assert.equal(actualHeader, appConstant.ACCESS_WIDGET_HEADER.RESTRICTED_ACCESS,
                "'Restricted access to item' - header should be displayed");

        });

    //verifies Details Panel should be reset after switching to another project #1570
    //https://github.com/enonic/app-contentstudio/issues/1570
    it(`GIVEN existing folder in current project is selected WHEN switch to 'Default' project THEN Details Panel should be reset and this content should not be searchable`,
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            let browseDetailsPanel = new BrowseDetailsPanel();
            let contentWidget = new ContentWidgetView();
            await projectSelectionDialog.waitForDialogLoaded();
            //1. Select the project in 'Select Context' dialog:
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //2. Select the folder and open details panel
            await studioUtils.findAndSelectItem(TEST_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            let contentName = await contentWidget.getContentName();
            assert.equal(contentName, TEST_FOLDER_NAME, "Expected name should be displayed in the widget(details panel)");
            //3. Switch to 'Default' project:
            await contentBrowsePanel.selectContext("Default");
            //4.Verify that 'Details Panel' is cleared
            await browseDetailsPanel.waitForDetailsPanelCleared();
            //5. Verify that the content is not searchable in the 'Default' context:
            await studioUtils.typeNameInFilterPanel(TEST_FOLDER_NAME);
            studioUtils.saveScreenshot("switch_to_default_context");
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 0, "Filtered grid should be empty");
        });

    it("Postconditions: the project should be deleted",
        async () => {
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Select and delete the layer:
            await studioUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioWithProjects();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
