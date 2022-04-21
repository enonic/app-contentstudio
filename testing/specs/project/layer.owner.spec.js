/**
 * Created on 14.08.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');

describe('layer.owner.spec - ui-tests for user with layer-Owner role ', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const FOLDER_NAME = studioUtils.generateRandomName("folder");
    const CONTROLLER_NAME = 'main region';
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;
    let USER;
    const PASSWORD = appConstant.PASSWORD.MEDIUM;

    it(`Precondition 1: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("layer-owner");
            let roles = [appConstant.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`Precondition 2 - parent project with private access mode should be created`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //2. Save new project (mode access is Private):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME);
        });

    it("Precondition 3: new site should be created by the SU in the parent project",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            //2. Select the new user's context:
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            //3. SU adds new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it("Precondition 4: new layer should be created in the existing project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.openSettingsPanel();
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            //2. Click on 'Private' radio button:
            await layerWizard.clickOnAccessModeRadio("Private");
            //3. Select the users in Project Access selector:
            await layerWizard.selectProjectAccessRoles(USER.displayName);
            //4. Set 'Owner' role to the user:
            await layerWizard.updateUserAccessRole(USER.displayName, appConstant.PROJECT_ROLES.OWNER);
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    //Verifies - https://github.com/enonic/app-contentstudio/issues/2144
    //Localize button should be displayed in browse toolbar after selecting a content in a layer
    it("GIVEN user with 'Owner'-layer role is logged in WHEN 'inherited' site has been selected THEN 'Localize' button should appear in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //Verify that Project Selection dialog is loaded, then close it
            await studioUtils.closeProjectSelectionDialog();
            //2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            //3. Verify that 'Localize' button appears in the browse toolbar:
            await contentBrowsePanel.waitForLocalizeButtonEnabled();
            //4. Verify that workflow state the same as in the parent project:
            let actualWorkflow = await contentBrowsePanel.getWorkflowState(SITE_NAME);
            assert.equal(actualWorkflow, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });

    //Verifies - https://github.com/enonic/app-contentstudio/issues/2309
    //Incorrect default action for inherited content #2309
    it("GIVEN user with 'Owner'-layer role is logged in WHEN 'inherited' site has been selected THEN 'Localize' button should appear in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //user's context should be loaded by default now!
            //2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            //3. Verify that 'Mark as Ready' is default action in Publish Menu
            await contentBrowsePanel.waitForDefaultAction(appConstant.PUBLISH_MENU.MARK_AS_READY);
        });

    it("GIVEN user with 'Owner'-layer role is logged in WHEN the user attempts to open existing site in draft THEN expected page should be loaded",
        async () => {
            //1. Do Log in with the user:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //user's context should be loaded by default now!
            //2. load existing site from the current layer:
            let url = "http://localhost:8080/admin/site/preview" + `/${LAYER_DISPLAY_NAME}/draft/${SITE_NAME}`;
            await webDriverHelper.browser.url(url);
            //3. Verify that expected site is loaded:
            let actualTitle = await webDriverHelper.browser.getTitle();
            assert.equal(actualTitle, SITE_NAME, "expected site should be loaded");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("Precondition: Existing site has been marked as ready in the parent project",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioWithProjects();
            //2. the  user's context should be loaded by default, so need to switch to Default project
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            await studioUtils.findAndSelectItem(SITE_NAME);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN user with 'Owner'-layer role is logged in WHEN 'inherited' site was marked as ready in the parent project THEN workflow in child layer should be 'Ready for publishing'",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioCloseProjectSelectionDialog(USER.displayName, PASSWORD);
            //2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            //3. Verify that 'Localize' button appears in the browse toolbar:
            await contentBrowsePanel.waitForLocalizeButtonEnabled();
            //4. Verify that workflow state the same as in the parent project:
            let actualWorkflow = await contentBrowsePanel.getWorkflowState(SITE_NAME);
            assert.equal(actualWorkflow, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });

    afterEach(async () => {
        let title = await webDriverHelper.browser.getTitle();
        //Do not close the Login page:
        if (title.includes("Content Studio") || title.includes("Users") || title.includes("/ Home")) {
            return await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        }
    });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
