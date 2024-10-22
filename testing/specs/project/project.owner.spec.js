/**
 * Created on 18.06.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PublishRequestDetailsDialog = require('../../page_objects/issue/publish.request.details.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const CreateTaskDialog = require('../../page_objects/issue/create.issue.dialog');
const IssueDetailsDialog = require('../../page_objects/issue/issue.details.dialog');
const IssueDetailsDialogAssigneesTab = require('../../page_objects/issue/issue.details.dialog.assignees.tab');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogLanguageStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.language.step');
const ProjectWizardDialogParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('project.owner.spec - ui-tests for user with Owner role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    const FOLDER_NAME_2 = studioUtils.generateRandomName('folder');
    let USER;
    let FOLDER_ISSUE;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const TASK_TITLE = 'task for owner';

    it(`Preconditions: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('owner');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN SU is logged in AND new project wizard is opened WHEN existing user has been added as Owner THEN the user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let languageStep = new ProjectWizardDialogLanguageStep();
            let parentProjectStep = new ProjectWizardDialogParentProjectStep();
            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            // 1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 2.Open new project wizard:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 3.  click on Skip button:
            await parentProjectStep.clickOnSkipButton();
            // 4. Skip the language step:
            await languageStep.clickOnSkipButton();
            // 5. Select 'Private' access mode in the fours step:
            let permissionsStep = await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await permissionsStep.waitForLoaded();
            // 6. Select the user with default role:
            await permissionsStep.selectProjectAccessRole(USER.displayName);
            // 7. Update the default role to "Owner"
            await permissionsStep.updateUserAccessRole(USER.displayName, appConst.PROJECT_ROLES.OWNER);
            // 8. Click on Next button in permissions step:
            await permissionsStep.clickOnNextButton();
            if(await applicationsStep.isLoaded()){
                await applicationsStep.clickOnSkipButton();
            }
            //9. Fil in the name input:
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
            await projectWizard.clickOnWizardStep('Roles');
            await studioUtils.saveScreenshot('project_owner_1');
            // 12. Verify that expected user is present in selected options:
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, 'expected user should be selected in Project Roles form');
            // 5. Verify that 'Owner' role is assigned to the user
            let role = await projectWizard.getSelectedProjectAccessRole(USER.displayName);
            assert.equal(role[0], appConst.PROJECT_ROLES.OWNER, 'Owner role should be assigned to the user');
        });

    // Verifies https://github.com/enonic/xp/issues/8139  Users with Owner or Editor roles can not be assigned to issues
    it("WHEN SU have created new folder and new task for user-owner THEN expected notification message should appear",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createTaskDialog = new CreateTaskDialog();
            let issueDetailsDialog = new IssueDetailsDialog();
            let issueDetailsDialogAssigneesTab = new IssueDetailsDialogAssigneesTab();
            FOLDER_ISSUE = contentBuilder.buildFolder(FOLDER_NAME_2);
            // 1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp();
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            // 2. Add new folder:
            await studioUtils.doAddReadyFolder(FOLDER_ISSUE);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(FOLDER_NAME_2);
            await contentBrowsePanel.openPublishMenuAndClickOnCreateIssue();
            await createTaskDialog.typeTitle(TASK_TITLE);
            // 3. Select the user with owner role in Assignees selector:
            await createTaskDialog.selectUserInAssignees(USER.displayName);
            await studioUtils.saveScreenshot('project_owner_1_1');
            // 4. Click on 'Create Task' button and create new task:
            await createTaskDialog.clickOnCreateIssueButton();
            let message = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.ISSUE_CREATED_MESSAGE);
            await issueDetailsDialog.clickOnAssigneesTabBarItem();
            await studioUtils.saveScreenshot('project_owner_assignees_tab');
            let actualUsers = await issueDetailsDialogAssigneesTab.getSelectedUsers();
            assert.equal(actualUsers[0], USER.displayName, "Expected user should be present in Assignees tab");
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    // Verifies https://github.com/enonic/xp/issues/8139  Users with Owner or Editor roles can not be assigned to issues
    it("WHEN user with 'Owner' role is logged in  THEN 'Assigned to Me' button should be present in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Do Log in with the user-owner and navigate to 'Content Studio':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.pause(1000);
            await studioUtils.saveScreenshot('has_assigned_issues_icon');
            // 4. Verify that the user has assigned task('Assigned to Me' and red circle should be displayed on the toolbar):
            await contentBrowsePanel.hasAssignedIssues();
        });

    it("GIVEN user with 'Owner' role is logged in WHEN existing project has been opened THEN all inputs should be enabled",
        async () => {
            // 1. Do Log in with the user-owner and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 2. Do Double-click on the project:
            await settingsBrowsePanel.doubleClickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. Verify that the project is opened:
            await projectWizard.waitForLoaded();
            // 4. Verify that all inputs in the project page are enabled for owner:
            let isPageDisabled = await projectWizard.isNoModify();
            assert.ok(isPageDisabled === false, "Wizard page should be enabled for 'Owner' role");
            let result = await projectWizard.isDescriptionInputClickable();
            assert.ok(result, 'Description input should be clickable');
            result = await projectWizard.isLocaleOptionsFilterInputClickable();
            assert.ok(result, 'Locale input should  be clickable');
            result = await projectWizard.isDisplayNameInputClickable();
            assert.ok(result, 'Display Name input should be clickable');
        });

    it("GIVEN user with 'Owner' role is logged in WHEN existing project has been selected THEN New..., Delete buttons should be disabled Edit should be enabled",
        async () => {
            // 1. Do log in with the user-owner and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await studioUtils.saveScreenshot('project_owner_1_2');
            // 3. Verify that 'New' button is disabled in the toolbar:
            await settingsBrowsePanel.waitForNewButtonDisabled();
            // 4. Edit button should be disabled
            await settingsBrowsePanel.waitForEditButtonEnabled();
            // 5. Delete button should be disabled (deleting a project is not allowed for users with Owner role)
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    it("GIVEN user with 'Owner' role is logged in WHEN required context is loaded THEN user with Owner role can create sites",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            //1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await contentBrowsePanel.waitForNewButtonEnabled();
            //2. Click on 'New...' button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            let items = await newContentDialog.getItems();
            await studioUtils.saveScreenshot('project_owner_3');
            //3. Verify that only 'Folders', 'Shortcut' 'Sites' are allowed for Owner role
            assert.equal(items.length, 3, 'Three items should be available for Owner');
            assert.ok(items.includes("Folder"), 'Folder is allowed for creating');
            assert.ok(items.includes("Shortcut"), 'Shortcut is allowed for creating');
            assert.ok(items.includes('Site'), 'Site is allowed for creating');
        });

    // Verify that user with Owner role can not select a language or owner in Wizard, but can make a content ready for publishing( Mark as Ready)
    it("GIVEN user with 'Owner' role is logged in WHEN new folder has been saved THEN 'Mark as Ready' should be as default action in Publish Menu",
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Open folder-wizard and save new folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            await studioUtils.saveScreenshot('project_owner_4');
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('project_owner_5');
            // 3. Verify that 'Mark as Ready' button is available in the wizard:
            await contentWizard.waitForMarkAsReadyButtonVisible();
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            let isVisible = await editSettingsDialog.isLanguageOptionsFilterVisible();
            assert.ok(isVisible, 'Language comboBox should be visible for Owner role');
            let actualOwner = await editSettingsDialog.getSelectedOwner();
            assert.equal(actualOwner, USER.displayName, 'Expected Owner should be selected in Settings form');
        });

    // Verify that 'Owner' can publish content:
    it("GIVEN user with 'Owner' role is logged in WHEN existing folder has been marked as ready THEN 'Publish' menu item should be enabled for users with Owner role",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. The folder has been 'Marked as ready' in browse panel:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('project_owner_6');
            // 3. Open Publish Menu:
            await contentBrowsePanel.openPublishMenu();
            await studioUtils.saveScreenshot('project_owner_7');
            // 4. Verify that 'Create Issue' and 'Request Publishing' menu items are enabled for Owner role:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            // 5. Verify that 'Publish' menu item is enabled:
            await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
            // 6 Verify that 'Publish Tree' menu item is disabled, because the folder has no children:
            await contentBrowsePanel.waitForPublishMenuItemDisabled(appConst.PUBLISH_MENU.PUBLISH_TREE);
        });

    // Verifies that user with Owner role can publish content in 'Publish Request Details' Dialog - "Publish Now" should be enabled in the Last stage.
    // Request Details Dialog - Publish Now button is not displayed when content is ready for publishing #3177
    // https://github.com/enonic/app-contentstudio/issues/3177
    it("GIVEN user with 'Owner' role is logged in WHEN existing folder has been selected and 'Publish Request' has been created THEN 'Publish Now' button should be enabled on the last stage",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let publishRequestDetailsDialog = new PublishRequestDetailsDialog();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select the folder and open new Request wizard:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await createRequestPublishDialog.waitForDialogLoaded();
            await createRequestPublishDialog.clickOnNextButton();
            await createRequestPublishDialog.typeInChangesInput('owner request');
            // 3. Click on 'Create Request' button:
            await createRequestPublishDialog.clickOnCreateRequestButton();
            // 4. Verify that Create Request dialog closes:
            await publishRequestDetailsDialog.waitForClosed();
            // 5. Click on issue-button and open the request:
            await contentItemPreviewPanel.clickOnIssueButtonByName('owner request');
            // 6. Verify that 'Request Details' dialog is loaded:
            await publishRequestDetailsDialog.waitForTabLoaded();
            // 7. Verify that 'Publish Now' button is enabled:
            await studioUtils.saveScreenshot('project_owner_8');
            await publishRequestDetailsDialog.waitForPublishNowButtonEnabled();
            // 8. Click on Publish Now button:
            await publishRequestDetailsDialog.clickOnPublishNowButton();
            // 9. Verify that modal dialog is closed:
            await publishRequestDetailsDialog.waitForClosed();
            await studioUtils.saveScreenshot('project_owner_9');
            let actualStatus = await contentBrowsePanel.getContentStatus(FOLDER_NAME);
            assert.equal(actualStatus, 'Published', "the folder should be 'Published'");
        });

    //Verify that Owner can manage the project settings. (Select a language)
    it("GIVEN user with 'Owner' role is logged in AND existing project has been opened WHEN language has been selected THEN the language should be present in selected options",
        async () => {
            // 1. Do Log in with the user-owner and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 2. Do double click on the project item:
            await settingsBrowsePanel.doubleClickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            // 3. wait for the project is opened:
            await projectWizard.waitForLoaded();
            // 4. Select a language in the wizard page:
            await projectWizard.selectLanguage(appConst.LANGUAGES.EN);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            let actualLanguage = await projectWizard.getSelectedLanguage();
            assert.equal(actualLanguage, appConst.LANGUAGES.EN, "expected and actual language should be equal");
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
