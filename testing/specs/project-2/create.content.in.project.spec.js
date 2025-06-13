/**
 * Created on 21.04.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const BrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const ContentWidgetView = require('../../page_objects/browsepanel/detailspanel/content.widget.item.view');
const EditPermissionsGeneralStep = require('../../page_objects/permissions/edit.permissions.general.step');
const UserAccessWidget = require('../../page_objects/browsepanel/detailspanel/user.access.widget.itemview');
const appConst = require('../../libs/app_const');

describe('create.content.in.project.spec - create new content in the selected context and verify a language in wizards', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER_NAME = studioUtils.generateRandomName('folder');

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    let TEST_DESCRIPTION = 'test description';

    it(`Preconditions: new project(with Norsk (no) language) and 'Private' access mode should be added`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Save new project (mode access is Private):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConst.LANGUAGES.NORSK_NO);
        });

    it(`WHEN existing project has been clicked in 'Select Context' dialog THEN empty grid should be loaded`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the project in 'Select Context' dialog
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Verify that 'No open issues' - this label should be in Issues Button:
            let actualLabel = await settingsBrowsePanel.getTextInShowIssuesButton();
            assert.equal(actualLabel, appConst.SHOW_ISSUES_BUTTON_LABEL.NO_OPEN_ISSUES, "'No open issues' should be displayed");
            // Verify that the grid is empty:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 0, 'Browse Panel should not contain content');
            // 3. Verify the current project:
            let actualDisplayName = await contentBrowsePanel.getCurrentProjectDisplayName();
            assert.equal(actualDisplayName, PROJECT_DISPLAY_NAME,
                'Expected name should be displayed in the project selected option(App Bar)');
        });

    it(`GIVEN existing context is selected WHEN new folder wizard has been opened THEN expected language should be automatically set in the wizard step`,
        async () => {
            let contentWizardPanel = new ContentWizardPanel();
            // 1. Select the project's context in 'Select Context' dialog
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await studioUtils.saveScreenshot('project_default_language');
            // 3. Verify the language in the wizard:
            let actualLanguage = await editSettingsDialog.getSelectedLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.NORSK_NO, 'Expected language should be selected in the wizard step form');
            // 4. Verify that expected project display name is present in the wizard-toolbar:
            let actualProjectName = await contentWizardPanel.getProjectDisplayName();
            assert.equal(actualProjectName, PROJECT_DISPLAY_NAME + '(no)', 'Actual and expected display name should be equal');
        });

    it(`WHEN new folder wizard has been saved THEN expected project-ACL entries should be present in Access form`,
        async () => {
            let editPermissionsGeneralStep = new EditPermissionsGeneralStep();
            let contentWizardPanel = new ContentWizardPanel();
            let userAccessWidget = new UserAccessWidget();
            // 1. Select the project's context in 'Select Context' dialog
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Open new folder wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizardPanel.typeDisplayName(TEST_FOLDER_NAME);
            await contentWizardPanel.waitAndClickOnSave();
            await contentWizardPanel.pause(1000);
            // 3. Open Edit Permissions Dialog:
            await userAccessWidget.clickOnEditPermissionsLink();
            await editPermissionsGeneralStep.waitForLoaded();
            // 4. Open Edit Permissions Dialog
            let result = await editPermissionsGeneralStep.getDisplayNameOfSelectedPrincipals();
            assert.ok(result.includes(PROJECT_DISPLAY_NAME + ' - Owner'), 'Expected Acl should be present');
            assert.ok(result.includes(PROJECT_DISPLAY_NAME + ' - Editor'), 'Expected Acl should be present');
            assert.ok(result.includes(PROJECT_DISPLAY_NAME + ' - Author'), 'Expected Acl should be present');
            assert.ok(result.includes(PROJECT_DISPLAY_NAME + ' - Viewer'), 'Expected Acl should be present');
            assert.ok(result.includes(PROJECT_DISPLAY_NAME + ' - Contributor'), 'Expected Acl should be present');
            assert.equal(result.length, 7, 'Total number of ACL entries should be 7');
        });

    it("GIVEN project with 'Private' access mode is selected AND existing folder is selected WHEN Details Panel has been opened THEN 'Restricted access to item' should be in Access Widget",
        async () => {
            let userAccessWidget = new UserAccessWidget();
            // 1. Select the project in 'Select Context' dialog:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Select the folder and open details panel
            await studioUtils.findAndSelectItem(TEST_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            let actualHeader = await userAccessWidget.getHeader();
            assert.equal(actualHeader, appConst.ACCESS_WIDGET_HEADER.RESTRICTED_ACCESS,
                "'Restricted access to item' - header should be displayed");

        });

    // verifies the issue: Details Panel should be reset after switching to another project #1570
    // https://github.com/enonic/app-contentstudio/issues/1570
    it(`GIVEN existing folder in current project is selected WHEN switch to 'Default' project THEN Details Panel should be reset and this content should not be searchable`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let browseDetailsPanel = new BrowseDetailsPanel();
            let contentWidget = new ContentWidgetView();
            // 1. Select the project in 'Select Context' dialog:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Select the folder and open details panel
            await studioUtils.findAndSelectItem(TEST_FOLDER_NAME);
            await studioUtils.openBrowseDetailsPanel();
            let contentName = await contentWidget.getContentName();
            assert.equal(contentName, TEST_FOLDER_NAME, 'Expected name should be displayed in the widget(details panel)');
            // 3. Switch to 'Default' project:
            await contentBrowsePanel.selectContext('Default');
            // 4.Verify that 'Details Panel' is cleared
            await browseDetailsPanel.waitForDetailsPanelCleared();
            // 5. Verify that the content is not searchable in the 'Default' context:
            await studioUtils.typeNameInFilterPanel(TEST_FOLDER_NAME);
            await studioUtils.saveScreenshot('switch_to_default_context');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 0, 'Filtered grid should be empty');
        });

    it('Post conditions: the project should be deleted',
        async () => {
            await studioUtils.openSettingsPanel();
            //1.Select and delete the layer:
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
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
