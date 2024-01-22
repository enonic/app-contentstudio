/**
 * Created on 22.01.2024
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

describe('layer.contributor.multi.inheritance.spec - ui-tests for user with layer-contributor role', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const CONTROLLER_NAME = 'main region';
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;
    let USER;
    const PASSWORD = appConst.PASSWORD.MEDIUM;
    const MULTI_PROJECTS = [PROJECT_DISPLAY_NAME, 'Default'];

    it(`Precondition 1: new system user should be created`,
        async () => {
            // Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName('layer-contributor');
            let roles = [appConst.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`Precondition 2 - parent project with private access mode should be created`,
        async () => {
            // 1. Navigate to Settings Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 2. Save the new project (mode access is Private):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, null, null, null, null, appConst.APP_CONTENT_TYPES);
        });

    it('Precondition 3: new site should be created in the parent project',
        async () => {
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            // 2. Select the new user context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("Precondition 4: new layer with 2 parent projects should be added, 'Default' is the secondary inherited project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            await settingsBrowsePanel.openProjectWizardDialog();
            let layer = projectUtils.buildLayer(MULTI_PROJECTS, null, appConst.PROJECT_ACCESS_MODE.PRIVATE, USER.displayName, null,
                LAYER_DISPLAY_NAME, null, null);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with 'Contributor'-layer role is logged in WHEN site that is 'inherited' from the primary project has been selected THEN 'Open' button should be enabled in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard()
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            // Verify that Project Selection dialog is loaded, then close it
            await studioUtils.closeProjectSelectionDialog();
            // 2. Select the site from the primary-inherited project:
            await studioUtils.findAndSelectItem(SITE_NAME);
            // 3. Verify that 'Open' button gets visible and enabled :
            await contentBrowsePanel.waitForOpenButtonEnabled();
            // 4. Verify the issue
            // #6767 Layer-contributor user - error after clicking on Open button in Browse panel
            await contentBrowsePanel.clickOnOpenButton();
            //await studioUtils.doSwitchToNextTab();
            //await contentWizard.waitForOpened();
        });

    it("GIVEN user with 'Contributor'-layer role is logged in WHEN content that is 'inherited' from the secondary project has been selected THEN 'Open' button should be enabled in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard()
            // 1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            // Verify that Project Selection dialog is loaded, then close it
            //await studioUtils.closeProjectSelectionDialog();
            // 2. Select the content from the secondary-inherited project:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            // 3. Verify that 'Open' button gets visible and enabled :
            await contentBrowsePanel.waitForOpenButtonEnabled();
            // 4. Verify the issue
            // #6767 Layer-contributor user - error after clicking on Open button in Browse panel
            await contentBrowsePanel.clickOnOpenButton();
            //await studioUtils.doSwitchToNextTab();
            //await contentWizard.waitForOpened();
        });

    it("WHEN user contributor navigated to 'Settings Panel' THEN parent project and its layer should be visible",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            await studioUtils.openSettingsPanel();
            // 1.Verify that the layer is visible in the grid:
            await settingsBrowsePanel.waitForItemDisplayed(LAYER_DISPLAY_NAME);
            // 2. Verify that parent project is displayed:
            await settingsBrowsePanel.waitForItemDisplayed(PROJECT_DISPLAY_NAME);
            // 3.Verify that the Default project is not visible for the user with contributor role:
            await settingsBrowsePanel.waitForProjectNotDisplayed('Default');
            // Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it('Post conditions: the layer should be deleted',
        async () => {
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog('su', 'password');
            await studioUtils.openSettingsPanel();
            // 1.Select and delete the layer:
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME)
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
