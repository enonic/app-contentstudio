/**
 * Created on 15.06.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const contentBuilder = require('../../libs/content.builder');
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const SourceCodeDialog = require('../../page_objects/wizardpanel/html.source.code.dialog');
const TextComponentCke = require('../../page_objects/components/text.component');
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');

describe("project.editor.spec - ui-tests for an user with 'Editor' role", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    let SITE;
    let SITE_NAME = appConst.generateRandomName('site');

    it(`Preconditions: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('editor');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN new project wizard dialog is opened WHEN existing user has been added as Editor THEN expected user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 2. Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 3. click on Skip button:
            await parentProjectStep.clickOnSkipButton();
            // 4. Skip the language step:
            await languageStep.clickOnSkipButton();
            // 5. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 6. Select the user with default role:
            await permissionsStep.selectProjectAccessRole(USER.displayName);
            // 7. Update the default role to "Editor"
            await permissionsStep.updateUserAccessRole(USER.displayName, appConst.PROJECT_ROLES.EDITOR);
            // 8. Click on Next button in permissions step:
            await permissionsStep.clickOnNextButton();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnSkipButton();
            }
            // 9. Fil in the name input:
            let summaryStep = await projectUtils.fillNameAndDescriptionStep(PROJECT_DISPLAY_NAME);
            await summaryStep.waitForLoaded();
            // 10. click On Create button:
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            // 11. Open the project
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            await studioUtils.saveScreenshot('project_editor_1');
            // 12. Verify that expected user is present in selected options:
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, 'expected user should be selected in Project Roles form');
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("Precondition 2: new site should be created by the SU in the parent project",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            // 2. Select the new user's context:
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            // 3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES], appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    // Verifies Project selector button should not be clickable if current user has access to only one project #2089
    it("WHEN current user has access to only one project THEN ProjectViewer button should not be clickable",
        async () => {
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(500);
            await studioUtils.saveScreenshot('select_project_button_not_clickable');
            // Verify that 'Select project' button is not clickable on the browse toolbar:
            let isClickable = await contentBrowsePanel.isProjectViewerClickable();
            assert.ok(isClickable === false, 'ProjectViewer button should not be clickable');
        });

    it("GIVEN user with Editor role is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            // 1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. Verify that all button are disabled in the toolbar:
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            await studioUtils.saveScreenshot('project_editor_2');
        });

    it("GIVEN user with Editor role is logged in WHEN New Content Dialog has been opened THEN only Folder and Shortcut types are allowed for Editor role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.waitForNewButtonEnabled();
            // 2. Click on New... button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            let items = await newContentDialog.getItems();
            await studioUtils.saveScreenshot('project_editor_3');
            // 3. Verify that only 'Folders' and 'Shortcut' are allowed for Editor role
            assert.equal(items.length, 2, 'Two items should be available for Editor');
            assert.ok(items.includes('Folder'), 'Folder is allowed for creating');
            assert.ok(items.includes('Shortcut'), 'Shortcut is allowed for creating');
        });

    // Verify that user-editor can select a language:
    it("GIVEN user with Editor role is logged in WHEN new folder has been saved THEN 'Mark as Ready' should be as default action in Publish Menu",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Open folder-wizard and save new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            await studioUtils.saveScreenshot('project_editor_4');
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await editSettingsDialog.waitForClosed();
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('project_editor_5');
            // 3. Verify that 'Mark as Ready' button is available in the wizard:
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    // Verify that 'user-editor' can publish content:
    it("GIVEN user with 'Editor' role is logged in WHEN existing folder(work in progress) has been published THEN the folder gets Published",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. The folder has been 'Marked as ready' in browse panel(Publish wizard loads automatically):
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await studioUtils.saveScreenshot('project_editor_6');
            // 3. The folder has been published in browse panel:
            await studioUtils.doPublish();
            await studioUtils.saveScreenshot('project_editor_7');
            await contentBrowsePanel.waitForNotificationMessage();
            // 4. Verify that status of thr folder is Published:
            let status = await contentBrowsePanel.getContentStatus(FOLDER_NAME);
            assert.equal(status, appConst.CONTENT_STATUS.PUBLISHED, "The folder should be 'Published'");
        });

    // Users with Owner and Editor roles don't have access to HTML source in the editor #8526
    // https://github.com/enonic/app-contentstudio/issues/8526
    it("GIVEN user with 'Editor' role is logged in WHEN existing folder(work in progress) has been published THEN the folder gets Published",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-editor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            let htmlAreaForm = new HtmlAreaForm();
            let sourceCodeDialog = new SourceCodeDialog();
            // 1. Open wizard for new content with htmlArea:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.showToolbar();
            await studioUtils.saveScreenshot('text_component_editor_role_source_button_1');
            // 2. Verify that 'Source' button is displayed in the htmlArea toolbar
            await htmlAreaForm.clickOnSourceButton();
            await htmlAreaForm.switchToParentFrame();
            await sourceCodeDialog.waitForDialogLoaded();
            await sourceCodeDialog.clickOnCancelButton();
        });

    // Users with Owner and Editor roles don't have access to HTML source in the editor #8526
    // https://github.com/enonic/app-contentstudio/issues/8526
    it("GIVEN user with 'Editor' role is logged in WHEN new text component has been inserted THEN 'Source' button should be displayed in the htmlArea toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            let sourceCodeDialog = new SourceCodeDialog();
            // 1. Open the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNextTab();
            await contentWizard.waitForOpened();
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Insert a text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await studioUtils.saveScreenshot('text_component_editor_role_source_button_2');
            await textComponentCke.switchToLiveEditFrame();
            // 3. Verify that Source button is clickable on the component-toolbar:
            await textComponentCke.clickOnSourceButton();
            await textComponentCke.switchToParentFrame();
            await sourceCodeDialog.waitForDialogLoaded();
            await sourceCodeDialog.clickOnCancelButton();
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        if (title.includes(appConst.CONTENT_STUDIO_TITLE) || title.includes('Users') || title.includes(appConst.TAB_TITLE_PART)) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
