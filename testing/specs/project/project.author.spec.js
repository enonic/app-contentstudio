/**
 * Created on 11.06.2020.
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
const PropertiesWidget = require('../../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');

describe('project.author.spec - ui-tests for user with Author role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const CONTROLLER_NAME = 'main region';
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;

    it(`Precondition 1: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('author');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN new project wizard is opened WHEN existing user has been added as 'Author' THEN expected user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 2.Open new project wizard dialog:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 3. Click on Skip in the parent step:
            await parentProjectStep.clickOnSkipButton();
            // 4. Skip the language step:
            await languageStep.clickOnSkipButton();
            // 5. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 6. Select the user with default role:
            await permissionsStep.selectProjectAccessRole(USER.displayName);
            // 7. Update the default role to "Author"
            await permissionsStep.updateUserAccessRole(USER.displayName, appConst.PROJECT_ROLES.AUTHOR);
            // 8. Click on Next button in permissions step:
            await permissionsStep.clickOnNextButton();
            if(await applicationsStep.isLoaded()){
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
            await studioUtils.saveScreenshot('project_author_1');
            // 12. Verify that expected user is present in selected options (Roles dropdown selector):
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, "expected user should be selected in Project Roles form");
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("Precondition 2: new site should be created in the just created project",
        async () => {
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            // 2. Select the user's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with 'Author' role is logged in WHEN the user attempts to open existing site in draft THEN expected page should be loaded",
        async () => {
            // 1. Do Log in with the user:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            // 2. load existing site from the current project:
            let url = "http://localhost:8080/admin/site/preview" + `/${PROJECT_DISPLAY_NAME}/draft/${SITE_NAME}`;
            await studioUtils.getBrowser().url(url);
            // 3. Verify that expected site is loaded:
            let actualTitle = await studioUtils.getBrowser().getTitle();
            assert.equal(actualTitle, SITE_NAME, 'expected site should be loaded');
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN user with 'Author' role is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            // 1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. Verify that all button are disabled in the toolbar:
            await studioUtils.saveScreenshot('project_author_1');
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    it("WHEN user with 'Author' role opened the site THEN Edit icon in applications selector should not be displayed, PCV should not be locked",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select the site and click on 'Edit' button
            await studioUtils.selectAndOpenContentInWizard(SITE_NAME);
            // 3. Verify that Edit icon for Site Configurator is not displayed
            await siteFormPanel.waitForEditApplicationIconNotDisplayed(appConst.APP_CONTENT_TYPES);
            // 4. PCV is not locked in the wizard step form:
            await pageComponentsWizardStepForm.waitForNotLocked();
        });

    it("GIVEN user with Author role is logged in WHEN New Content dialog is opened THEN creating of Folder and Shortcut are allowed for Author role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.waitForNewButtonEnabled();
            // 2. Click on 'New...' button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            let items = await newContentDialog.getItems();
            await studioUtils.saveScreenshot('project_author_3');
            // 3. Verify that only 'Folders' and 'Shortcut' are allowed for Author role
            assert.equal(items.length, 2, 'Two items should be available for Author');
            assert.ok(items.includes('Folder'), 'Folder is allowed for creating');
            assert.ok(items.includes('Shortcut'), 'Shortcut is allowed for creating');
        });

    // Verify that user with Author role can not select a language or owner in Wizard, but can make a content ready for publishing( Mark as Ready)
    it("GIVEN user with 'Author' role is logged in WHEN new folder has been saved THEN 'Mark as Ready' should be as default action in Publish Menu",
        async () => {
            let contentWizard = new ContentWizard();
            let propertiesWidgetItemView = new PropertiesWidget();
            // 1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Open folder-wizard and save new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            await studioUtils.saveScreenshot('project_author_4');
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('project_author_5');
            // 3. Verify that 'Mark as Ready' button is available in the wizard:
            await contentWizard.waitForMarkAsReadyButtonVisible();
            // Verify that 'Edit Settings' button is not visible for users with 'Author' role:
            await propertiesWidgetItemView.waitForEditSettingsButtonNotDisplayed();
        });

    // Verify that 'Author' can not publish content:
    it("GIVEN user with 'Author' role is logged in WHEN existing folder has been marked as ready THEN Publish menu item should be disabled for an user with Author role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. The folder has been 'Marked as ready' in browse panel:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await studioUtils.saveScreenshot('project_author_6');
            // 3. Open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('project_author_7');
            // 4. Verify that Create Issue and Request Publishing menu items are enabled for Author role:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            // 5. Verify that Publish menu item is disabled:
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
        });

    // Verifies - issue#1920 User with author role - Last stage in publishing workflow for Project gives user option to "Publish Now"
    // https://github.com/enonic/app-contentstudio/issues/1920
    it("GIVEN user with 'Author' role is logged in WHEN existing folder has been selected and Publish Request has been created THEN 'Publish Now' button should be disabled on the last stage",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
            let issueListDialog = new IssueListDialog();
            // 1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select the folder and open Request wizard:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput('author request');
            // 3. Click on 'Create Request' button:
            await createRequestPublishDialog.clickOnCreateRequestButton();
            // 4. Verify that Create Request dialog closes:
            await publishRequestDetailsDialog.waitForClosed();
            await contentBrowsePanel.waitForNotificationMessage()
            // 5. Click on issue-button and open the request:
            await contentBrowsePanel.clickOnShowIssuesListButton();
            await issueListDialog.waitForDialogOpened();
            await issueListDialog.clickOnIssue('author request');
            // 6. Verify that 'Request Details' dialog is loaded:
            await publishRequestDetailsDialog.waitForTabLoaded();
            // 7. Verify that 'Publish Now' button is disabled:
            await studioUtils.saveScreenshot('project_author_8');
            await publishRequestDetailsDialog.waitForPublishNowButtonDisabled();
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        if (title.includes(appConst.CONTENT_STUDIO_TITLE) || title.includes("Users") || title.includes(appConst.TAB_TITLE_PART)) {
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
