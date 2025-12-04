/**
 * Created on 09.06.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const PropertiesWidget = require('../../page_objects/browsepanel/detailspanel/properties.widget.itemview');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const IssueListDialog = require('../../page_objects/issue/issue.list.dialog');

describe('project.contributor.spec - ui-tests for user with Contributor role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    let USER;
    let PASSWORD = appConst.PASSWORD.MEDIUM;
    let FOLDER_WORK_IN_PROGRESS;
    let FOLDER_READY_TO_PUBLISH;
    let FOLDER_NAME_1 = studioUtils.generateRandomName('folder');
    let FOLDER_NAME_2 = studioUtils.generateRandomName('folder');
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;

    it(`Preconditions: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('contributor');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN new project wizard dialog is opened WHEN existing user has been added as contributor THEN expected user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();

            // 2.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            let project = projectUtils.buildProject( null, appConst.PROJECT_ACCESS_MODE.PRIVATE, USER.displayName,
                null, PROJECT_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(project);
            await projectWizard.waitForNotificationMessage(PROJECT_DISPLAY_NAME);
            await studioUtils.saveScreenshot('project_contributor_created_1');
            // 3. Select the project and click on Edit button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 4. Verify that expected user is present in selected options:
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, 'expected user should be selected in Project Roles form');
        });

    it("Precondition 2: 'Work in Progress' and Ready folders should be created in the just created project",
        async () => {
            FOLDER_WORK_IN_PROGRESS = contentBuilder.buildFolder(FOLDER_NAME_1);
            FOLDER_READY_TO_PUBLISH = contentBuilder.buildFolder(FOLDER_NAME_2);
            // 1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            await studioUtils.doAddFolder(FOLDER_WORK_IN_PROGRESS);
            await studioUtils.doAddReadyFolder(FOLDER_READY_TO_PUBLISH);

            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/1925
    // Page Controller should be disabled when an user has no permissions in a project (Contributor) #1925
    it("GIVEN user with 'Contributor' role is logged in WHEN existing site(controller is not selected) is opened THEN Page Controller should be disabled",
        async () => {
            let contentWizardPanel = new ContentWizardPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            await contentBrowsePanel.pause(1000);
            // 2. Open existing site(controller is not selected yet):
            await contentBrowsePanel.doubleClickOnRowByDisplayName(SITE.displayName);
            await studioUtils.doSwitchToNewWizard();
            await contentWizardPanel.pause(1000);
            // 3. Verify that Page Controller is disabled (not clickable):
            let result = await contentWizardPanel.isPageControllerFilterInputClickable();
            assert.ok(result === false, 'Page Controller selector should be disabled for user with contributor role')
        });

    it("GIVEN contributor user is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            // 1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 2. Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. Verify that all buttons are disabled in the toolbar:
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    // Verifies Compare Versions dialog - Revert button should be disabled for users with no modify permissions #1934
    // https://github.com/enonic/app-contentstudio/issues/1934
    it.skip("GIVEN user -'Contributor' is logged in WHEN existing folder has been selected  AND versions panel opened THEN 'Revert' button should be disabled",
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select existing folder:
            await studioUtils.findAndSelectItem(FOLDER_WORK_IN_PROGRESS.displayName);
            // 3. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            // 4. Click on the first item in versions widget:
            await browseVersionsWidget.clickAndExpandVersionItemByHeader('Created');
            await studioUtils.saveScreenshot('revert_button_should_be_disabled1');
            // 5. Verify that Revert button in browse versions panel is disabled:
            await browseVersionsWidget.waitForRestoreButtonDisabled();
        });

    // Verifies Compare Versions dialog - Revert button should be disabled for users with no modify permissions #1934
    // https://github.com/enonic/app-contentstudio/issues/1934
    it.skip("GIVEN user -'Contributor' is logged in WHEN existing folder has been opened AND versions panel opened THEN 'Revert' button should be disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizardPanel();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Open existing folder:
            await contentBrowsePanel.doubleClickOnRowByDisplayName(FOLDER_READY_TO_PUBLISH.displayName);
            await studioUtils.doSwitchToNewWizard();
            // 3. open Versions Panel
            await contentWizard.openVersionsHistoryPanel();
            await studioUtils.saveScreenshot('revert_button_should_be_disabled2');
            // 4. Click on the first item in versions widget:
            await wizardVersionsWidget.clickAndExpandVersionItemByHeader('Created');
            // 5. Verify that 'Revert' button in wizard-versions panel is disabled:
            await wizardVersionsWidget.waitForRestoreButtonDisabled();
        });

    it("GIVEN user with 'Contributor' role is logged in WHEN existing folder(Ready to publish) has been selected THEN 'Publish' menu item should be disabled for users with 'Contributor' role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select existing folder(ready to publish):
            await studioUtils.findAndSelectItem(FOLDER_READY_TO_PUBLISH.displayName);
            // 3. Verify that Edit, New, Archive... buttons are disabled:
            await contentBrowsePanel.waitForOpenButtonEnabled();
            await contentBrowsePanel.waitForArchiveButtonDisabled();
            await contentBrowsePanel.waitForNewButtonDisabled();
            // 4. Open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('project_contributor_3');
            // 5. Verify that 'Create Issue' and 'Request Publishing' menu items are enabled for Contributor role:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            // 6. Verify that 'Publish' menu item is disabled:
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH);
        });

    // Verifies - https://github.com/enonic/app-contentstudio/issues/1984
    // Request Publishing menu item should be disabled for contributor (content's status  is 'Work in progress')
    it("GIVEN user with 'Contributor' role is logged in WHEN existing folder(Work in Progress) has been selected THEN 'Publish', 'Request Publishing' menu items should be disabled for users with 'Contributor' role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select existing folder(ready to publish):
            await studioUtils.findAndSelectItem(FOLDER_WORK_IN_PROGRESS.displayName);
            // 3. Verify that New, Archive buttons are disabled:
            await contentBrowsePanel.waitForOpenButtonEnabled();
            await contentBrowsePanel.waitForArchiveButtonDisabled();
            await contentBrowsePanel.waitForNewButtonDisabled();
            // 4. Open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('project_contributor_10');
            // 5. Verify that 'Create Issue' and 'Request Publishing' menu items are enabled for Contributor role:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            // 6. verify issue#1984 - 'Request Publish' menu item should be disabled
            //await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            // 7. Verify that 'Publish' menu item is disabled:
            let menuItems = await contentBrowsePanel.getPublishMenuItems();
            assert.ok(menuItems.includes(appConst.PUBLISH_MENU.PUBLISH) === false, 'Publish menu item should not be present');
        });

    it("GIVEN user with 'Contributor' role is logged in WHEN double click on an existing folder THEN the folder should be opened in the new browser tab AND all inputs should be disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizardPanel = new ContentWizardPanel();
            let propertiesWidgetItem = new PropertiesWidget();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.pause(1000);
            // 2. Do a Double click on existing folder(ready to publish):
            await contentBrowsePanel.doubleClickOnRowByDisplayName(FOLDER_READY_TO_PUBLISH.displayName);
            await studioUtils.doSwitchToNewWizard();
            // 3. Verify that Archive..., Duplicate.. buttons are disabled:
            await contentWizardPanel.waitForArchiveButtonDisabled();
            await contentWizardPanel.waitForDuplicateButtonDisabled();
            // 4. Verify that display name input is not clickable:
            let isClickable = await contentWizardPanel.isDisplayNameInputClickable();
            assert.ok(isClickable === false, 'Name Input should be not clickable');
            await propertiesWidgetItem.waitForEditSettingsButtonNotDisplayed();
        });

    // Verifies - https://github.com/enonic/app-contentstudio/issues/1984
    // Improvement: Request Publishing menu item should be disabled for contributor (content's status  is 'Work in progress')
    it.skip(
        "GIVEN user with 'Contributor' role is logged in WHEN double click on an existing folder THEN 'Create Issue' default action should be present in publish-menu",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizardPanel = new ContentWizardPanel();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.pause(1000);
            // 2. Do a Double click on existing folder(status is Work in progress):
            await contentBrowsePanel.doubleClickOnRowByDisplayName(FOLDER_WORK_IN_PROGRESS.displayName);
            await studioUtils.doSwitchToNewWizard();
            await contentWizardPanel.pause(1000);
            //TODO this assert temporarily skipped
            // 3. Verify that Create Issue is default action in publish menu:
            await contentWizardPanel.waitForCreateIssueButtonDisplayed();
        });

    it("GIVEN user with 'Contributor' role is logged in WHEN existing folder(Ready to publish) has been selected and Publish Request has been created THEN 'Publish Now' button should be disabled on the last stage",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
            let issueListDialog = new IssueListDialog();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select the folder and open Request wizard:
            await studioUtils.findAndSelectItem(FOLDER_READY_TO_PUBLISH.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput('contributor request');
            // 3. Click on 'Create Request' button:
            await createRequestPublishDialog.clickOnCreateRequestButton();
            // 4. Verify that Create Request dialog closes:
            await publishRequestDetailsDialog.waitForClosed();
            // 5. Click on issue-button and open the request:
            await contentBrowsePanel.clickOnShowIssuesListButton();
            await issueListDialog.waitForDialogOpened();
            await issueListDialog.clickOnIssue('contributor request');
            // 6. Verify that 'Request Details' dialog is loaded:
            await publishRequestDetailsDialog.waitForTabLoaded();
            // 7. Verify that 'Publish Now' button is disabled:
            await studioUtils.saveScreenshot('project_contributor_4');
            await publishRequestDetailsDialog.waitForPublishNowButtonDisabled();
        });

    //Verifies - User with contributor role - Duplicate button gets enabled after selecting 2 items in grid #1922
    //https://github.com/enonic/app-contentstudio/issues/1922
    it("GIVEN user with 'Contributor' role is logged in WHEN 2 folders have been selected THEN 'Duplicate' button should be disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do log in with the user-contributor and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select 2 folders:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(FOLDER_READY_TO_PUBLISH.displayName);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(FOLDER_WORK_IN_PROGRESS.displayName);
            // 3. Verify that 'Duplicate' button is disabled:
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        //Do not close the Login page:
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
