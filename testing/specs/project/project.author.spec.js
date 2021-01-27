/**
 * Created on 11.06.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const contentBuilder = require("../../libs/content.builder");
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');

describe('project.author.spec - ui-tests for user with Author role', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const FOLDER_NAME = studioUtils.generateRandomName("folder");
    let USER;
    const PASSWORD = "1q2w3e";
    const CONTROLLER_NAME = 'main region';
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;

    it(`Precondition 1: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("author");
            let roles = [appConstant.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN new project wizard is opened WHEN existing user has been added as 'Author' THEN expected user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioWithProjects();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();

            //2.Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            let result = await projectWizard.isDescriptionInputClickable();
            //3. Select the user in roles, assign Author role him:
            await projectWizard.selectProjectAccessRoles(USER.displayName);
            await projectWizard.updateUserAccessRole(USER.displayName, appConstant.PROJECT_ROLES.AUTHOR);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_author_1");
            //4. Verify that expected user is present in selected options:
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, "expected user should be selected in Project Roles form");
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("Precondition 2: new site should be created in the just created project",
        async () => {
            let projectSelectionDialog = new ProjectSelectionDialog();
            //1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioWithProjects();
            await projectSelectionDialog.waitForDialogLoaded();
            //2. Select the new user context:
            await projectSelectionDialog.selectContext(PROJECT_DISPLAY_NAME);
            //3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with 'Author' role is logged in WHEN the user attempts to open existing site in draft THEN expected page should be loaded",
        async () => {
            //1. Do Log in with the user:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //2. load existing site from the current project:
            let url = "http://localhost:8080/admin/site/preview" + `/${PROJECT_DISPLAY_NAME}/draft/${SITE_NAME}`;
            await webDriverHelper.browser.url(url);
            //3. Verify that expected site is loaded:
            let actualTitle = await webDriverHelper.browser.getTitle();
            assert.equal(actualTitle, SITE_NAME, "expected site should be loaded");

            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });


    it("GIVEN user with 'Author' role is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            //1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that all button are disabled in the toolbar:
            studioUtils.saveScreenshot("project_author_1");
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    it("GIVEN user with Author role is logged in WHEN New Content dialog is opened THEN creating of Folder and Shortcut are allowed for Author role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            //1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            await contentBrowsePanel.waitForNewButtonEnabled();
            //2. Click on 'New...' button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            let items = await newContentDialog.getItems();
            studioUtils.saveScreenshot("project_author_3");
            //3. Verify that only 'Folders' and 'Shortcut' are allowed for Author role
            assert.equal(items.length, 2, "Two items should be available for Author");
            assert.isTrue(items.includes("Folder"), "Folder is allowed for creating");
            assert.isTrue(items.includes("Shortcut"), "Shortcut is allowed for creating");
        });

    //Verify that user with Author role can not select a language or owner in Wizard, but can make a content ready for publishing( Mark as Ready)
    it("GIVEN user with 'Author' role is logged in WHEN new folder has been saved THEN 'Mark as Ready' should be as default action in Publish Menu",
        async () => {
            let contentWizard = new ContentWizard();
            let settingsStepForm = new SettingsStepForm();
            //1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //2. Open folder-wizard and save new folder:
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            studioUtils.saveScreenshot("project_author_4");
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot("project_author_5");
            //3. Verify that 'Mark as Ready' button is available in the wizard:
            await contentWizard.waitForMarkAsReadyButtonVisible();
            let isVisible = await settingsStepForm.isLanguageOptionsFilterVisible();
            assert.isFalse(isVisible, "Language comboBox should not be visible for Author role");
            isVisible = await settingsStepForm.isOwnerOptionsFilterVisible();
            assert.isFalse(isVisible, "Owner comboBox should not be visible for Author role");
        });

    //Verify that 'Author' can not publish content:
    it("GIVEN user with 'Author' role is logged in WHEN existing folder has been marked as ready THEN Publish menu item should be disabled for an user with Author role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            //2. The folder has been 'Marked as ready' in browse panel:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            studioUtils.saveScreenshot("project_author_6");
            //3. Open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            studioUtils.saveScreenshot("project_author_7");
            //4. Verify that Create Task and Request Publishing menu items are enabled for Author role:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.CREATE_TASK);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConstant.PUBLISH_MENU.REQUEST_PUBLISH);
            //5. Verify that Publish menu item is disabled:
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConstant.PUBLISH_MENU.PUBLISH);
        });

    //Verifies - issue#1920 User with author role - Last stage in publishing workflow for Project gives user option to "Publish Now"
    //https://github.com/enonic/app-contentstudio/issues/1920
    it("GIVEN user with 'Author' role is logged in WHEN existing folder has been selected and Publish Request has been created THEN 'Publish Now' button should be disabled on the last stage",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
            //1. Do log in with the user-author and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            //2. Select the folder and open Request wizard:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await contentBrowsePanel.openPublishMenuSelectItem(appConstant.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput("author's request");
            //3. Click on 'Create Request' button:
            await createRequestPublishDialog.clickOnCreateRequestButton();
            //4. Verify that 'Request Details' dialog is loaded:
            await publishRequestDetailsDialog.waitForTabLoaded();
            //5. Verify that 'Publish Now' button is disabled:
            studioUtils.saveScreenshot("project_author_8");
            await publishRequestDetailsDialog.waitForPublishNowButtonDisabled();
        });

    afterEach(async () => {
        let title = await webDriverHelper.browser.getTitle();
        if (title.includes("Content Studio") || title.includes("Users")) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });

});
