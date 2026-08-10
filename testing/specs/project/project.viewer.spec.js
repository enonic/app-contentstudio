/**
 * Created on 19.06.2020. updated on 10.08.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const contentBuilder = require('../../libs/content.builder');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const projectUtils = require('../../libs/project.utils');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const ProjectWizardDialogAccessModeStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step');
const ProjectWizardDialogPermissionsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step');
const LanguageAndParentProjectStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step');
const ProjectWizardDialogNameAndIdStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step');
const ProjectWizardDialogSummaryStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.summary.step');

describe('project.viewer.spec - ui-tests for user with Viewer role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    let TEST_FOLDER;
    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    let USER;
    let PASSWORD = appConst.PASSWORD.MEDIUM;

    it(`Preconditions: new system user should be created`, async () => {
        // Do Log in with 'SU', navigate to 'Users' and create new user:
        await studioUtils.navigateToUsersApp();
        let userName = builder.generateRandomName('viewer');
        let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
        USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
        await studioUtils.addSystemUser(USER);
    });

    it('GIVEN SU is logged in AND new project wizard is opened WHEN existing user has been added as Viewer THEN expected user should be selected in Custom Access form', async () => {
        let settingsBrowsePanel = new SettingsBrowsePanel();
        let applicationsStep = new ProjectWizardDialogApplicationsStep();
        // 1. Do Log in with 'SU':
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.openSettingsPanel();
        // 2. Open Project Wizard Dialog:
        await projectUtils.clickOnNewAndOpenProjectWizardDialog();
        let languageAndParentProjectStep = new LanguageAndParentProjectStep();
        await languageAndParentProjectStep.waitForLoaded();
        await languageAndParentProjectStep.clickOnNextButton();
        let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
        await nameAndIdStep.waitForLoaded();
        await nameAndIdStep.typeDisplayName(PROJECT_DISPLAY_NAME);
        await nameAndIdStep.clickOnNextButton();
        let accessModeStep = new ProjectWizardDialogAccessModeStep();
        await accessModeStep.waitForLoaded();
        // 4. Select 'Private' access mode in the fours step:
        await accessModeStep.clickOnAccessModeRadio('Private');
        await accessModeStep.clickOnNextButton();
        let permissionsStep = new ProjectWizardDialogPermissionsStep();
        await permissionsStep.waitForLoaded();
        // 6. Select the user with default role:
        await permissionsStep.selectProjectAccessRole(USER.displayName);
        // 8. Click on Next button
        await permissionsStep.clickOnNextButton();
        if (await applicationsStep.isLoaded()) {
            await applicationsStep.clickOnNextButton();
        }
        let summaryStep = new ProjectWizardDialogSummaryStep();
        await summaryStep.waitForLoaded();
        await summaryStep.clickOnCreateProjectButton();
        await summaryStep.waitForDialogClosed();
        await settingsBrowsePanel.waitForNotificationMessage();
    });

    it('Precondition 2: ready for publishing folder should be created in the just created project', async () => {
        TEST_FOLDER = contentBuilder.buildFolder(FOLDER_NAME);
        // 1. Do Log in with 'SU' and navigate to 'Settings':
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
        await studioUtils.doAddReadyFolder(TEST_FOLDER);
        // SU is logged out:
        await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
        await studioUtils.doLogout();
    });

    it('GIVEN user with Viewer role is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled', async () => {
        // 1. Do log in with the user and navigate to 'Settings':
        await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
        await studioUtils.openSettingsPanel();
        let settingsBrowsePanel = new SettingsBrowsePanel();
        // 2.Click(select) on existing project:
        await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
        // 3. Verify that all button are disabled in the project-toolbar:
        await studioUtils.saveScreenshot('project_viewer_1');
        await settingsBrowsePanel.waitForNewButtonDisabled();
        await settingsBrowsePanel.waitForEditButtonDisabled();
        await settingsBrowsePanel.waitForDeleteButtonDisabled();
    });

    it('GIVEN user with Viewer role is logged in WHEN required context is loaded THEN New... button should be disabled for Viewer role', async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Do log in with the user-viewer and navigate to Content Browse Panel:
        await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
        // 2. Verify that 'New' button is disabled for users with Viewer role
        await contentBrowsePanel.waitForNewButtonDisabled();
    });

    it("GIVEN user with 'Viewer' role is logged in WHEN existing folder has been selected THEN 'Publish' menu item should be disabled for users with Viewer role", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Do log in with the user-viewer and navigate to Content Browse Panel:
        await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
        // 2. Select existing folder:
        await studioUtils.findAndSelectItem(FOLDER_NAME);
        // 3. Verify that Open button is enabled
        await contentBrowsePanel.waitForOpenButtonEnabled();
        // 4. Verify that, New, Delete... buttons are disabled:
        await contentBrowsePanel.waitForDeleteButtonDisabled();
        await contentBrowsePanel.waitForNewButtonDisabled();
        await contentBrowsePanel.waitForDuplicateButtonDisabled();
        // 5. Open Publish Menu:
        await contentBrowsePanel.openPublishMenu();
        await studioUtils.saveScreenshot('project_viewer_3');
        //5. Verify that 'Create Task' and 'Request Publishing' menu items are enabled for Viewer role:
        await contentBrowsePanel.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.CREATE_ISSUE);
        await contentBrowsePanel.waitForRequestPublishingButtonDisplayed();
    });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        //Do not close the Login page:
        if (
            title.includes(appConst.CONTENT_STUDIO_TITLE) ||
            title.includes('Users') ||
            title.includes(appConst.TAB_TITLE_PART)
        ) {
            return await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
        }
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
