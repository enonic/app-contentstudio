/**
 * Created on 31.01.2024 updated on 07.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ProjectWizardDialogApplicationsStep = require('../../page_objects/project/project-wizard-dialog/project.wizard.applications.step');
const LanguageAndParentProjectStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.parent.project.step");
const ProjectWizardDialogNameAndIdStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.name.id.step");
const ProjectWizardDialogAccessModeStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.access.mode.step");
const ProjectWizardDialogPermissionsStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.permissions.step");
const ProjectWizardDialogSummaryStep = require("../../page_objects/project/project-wizard-dialog/project.wizard.summary.step");

describe('layer.owner.multi.inheritance.spec - ui-tests for user with layer-owner role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('proj');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const MULTI_PROJECTS = [PROJECT_DISPLAY_NAME, 'Default'];

    it(`Precondition 1: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('layer-owner');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
        });

    it(`Precondition 2 - parent project with private access mode should be created`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 2. Save the new project (mode access is Private):
            //await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, null, null, null, null, appConst.APP_CONTENT_TYPES);
            await projectUtils.saveTestProject({
                name: PROJECT_DISPLAY_NAME,
                accessMode: appConst.PROJECT_ACCESS_MODE.PRIVATE,
                applications: appConst.APP_CONTENT_TYPES
            });
        });

    it('Precondition 3: new site should be created in the parent project',
        async () => {
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            // 2. Select the new user context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, null, [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("Precondition 4: new layer with 2 parent projects should be added, 'Default' is the secondary inherited project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let languageAndParentProjectStep = new LanguageAndParentProjectStep();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.openSettingsPanel();
            // 2. Open Project Wizard Dialog:
            await settingsBrowsePanel.openProjectWizardDialog();
            // 3. Select parent projects in the first step:
            await projectUtils.fillLanguageAndMultiParentProjectStep(null, MULTI_PROJECTS);
            await languageAndParentProjectStep.waitForLoaded();
            await languageAndParentProjectStep.clickOnNextButton();

            let nameAndIdStep = new ProjectWizardDialogNameAndIdStep();
            await nameAndIdStep.waitForLoaded();
            await projectUtils.fillNameAndDescriptionStep(LAYER_DISPLAY_NAME);
            await nameAndIdStep.clickOnNextButton();

            // 5. Select 'Private' access mode in the step:
            let accessModeStep = new ProjectWizardDialogAccessModeStep();
            await accessModeStep.waitForLoaded();
            await projectUtils.fillAccessModeStep(appConst.PROJECT_ACCESS_MODE.PRIVATE);
            await accessModeStep.clickOnNextButton();

            let permissionsStep = new ProjectWizardDialogPermissionsStep();
            await permissionsStep.waitForLoaded();
            // 6. Select the user with default role:
            await projectUtils.fillPermissionsStep(USER.displayName);
            // 7. Update the default role to "Owner"
            await permissionsStep.updateUserAccessRole(USER.displayName, appConst.PROJECT_ROLES.OWNER);
            await permissionsStep.clickOnNextButton();

            let applicationsStep = new ProjectWizardDialogApplicationsStep();
            if (await applicationsStep.isLoaded()) {
                await applicationsStep.clickOnNextButton();
            }

            let summaryStep = new ProjectWizardDialogSummaryStep();
            await summaryStep.waitForLoaded();
            await summaryStep.clickOnCreateProjectButton();
            await summaryStep.waitForDialogClosed();
            await settingsBrowsePanel.waitForNotificationMessage();
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with 'Owner'-layer role is logged in WHEN navigated to 'Settings' panel AND click on the layer THEN 'Edit' button should be enabled in the browse toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.closeProjectSelectionDialog();
            // 2. Go to Settings Browse Panel:
            await studioUtils.openSettingsPanel();
            // 3. Select the user's layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            // 4. Verify that 'Edit' button is enabled, because the user has owner role
            await settingsBrowsePanel.waitForEditButtonEnabled();
        });

    // bug Project context from the previous user session persists after login #10766
    // https://github.com/enonic/app-contentstudio/issues/10766
    it("GIVEN user with 'Owner' role is logged in WHEN site that is 'inherited' from the primary project has been selected THEN 'Localise' button should be enabled in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // Verify that Project Selection dialog is loaded, then close it
            //await studioUtils.closeProjectSelectionDialog();
            // 2. Select the site from the primary-inherited project:
            await studioUtils.findContentAndClickCheckBox(SITE_NAME);
            // 3. Verify that 'Localise' button gets visible and enabled :
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNextTab();
            // 4. Verify that the content is opened in the browser-tab:
            await contentWizard.waitForOpened();
            await contentWizard.clickOnLocalizeButton();
            // 'Inherited content is localized' - message should appear
            let message = await contentWizard.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.INHERITED_CONTENT_LOCALIZED,
                "'Inherited content has been localized' - message should appear");
        });

    // Unable to reset content that was inherited from non-primary parent project #7244
    it.skip("GIVEN user with 'Owner'-layer role is logged in WHEN content that is 'inherited' from the secondary project has been selected THEN 'Localize' button should be enabled in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard()
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            // 2. Select the content from the secondary-inherited project:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME);
            // 3. Verify that 'Localize' button gets  enabled :
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.doSwitchToNextTab();
            await contentWizard.waitForOpened();
            await contentWizard.clickOnLocalizeButton();
            let message = await contentWizard.waitForNotificationMessage();
            assert.equal(message, appConst.NOTIFICATION_MESSAGES.INHERITED_CONTENT_LOCALIZED,
                "'Inherited content has been localized' - message should appear");
        });

    it("WHEN user-owner navigated to 'Settings Panel' THEN parent project and its layer should be visible",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            // 1.Verify that the layer is visible in the grid:
            await settingsBrowsePanel.waitForItemDisplayed(LAYER_DISPLAY_NAME);
            // 2. Verify that parent project is displayed:
            await settingsBrowsePanel.waitForItemDisplayed(PROJECT_DISPLAY_NAME);
            // 3.Verify that the Default project is not visible for the user with Owner role:
            await settingsBrowsePanel.waitForProjectNotDisplayed('Default');
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndNavigateToHome();
            await studioUtils.doLogout();
        });

    it('Post conditions: the layer should be deleted',
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.navigateToContentStudioApp('su', 'password');
            await studioUtils.openSettingsPanel();
            // 1. Select and delete the layer:
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.pause(1000);
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
        });

    afterEach(async () => {
        let title = await studioUtils.getBrowser().getTitle();
        if (title.includes(appConst.CONTENT_STUDIO_TITLE) || title.includes('Users') || title.includes(appConst.TAB_TITLE_PART)) {
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
