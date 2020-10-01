/**
 * Created on 29.09.2020.
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
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

describe('layer.contributor.spec - ui-tests for user with layer-contributor role ', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const FOLDER_NAME = studioUtils.generateRandomName("folder");
    const CONTROLLER_NAME = 'main region';
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;
    let USER;
    const PASSWORD = "1q2w3e";

    it(`Precondition 1: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("layer-contributor");
            let roles = [appConstant.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it(`Precondition 2 - parent project with private access mode should be created`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.navigateToContentStudioWithProjects();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //2. Save new project (mode access is Private):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME);
        });

    it("Precondition 3: new site should be created in the parent project",
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
        });

    it("Precondition 4: new layer should be created in the existing project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1. Do Log in with 'SU':
            await studioUtils.navigateToContentStudioWithProjects();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            //2. Click on 'Private' radio button:
            await layerWizard.clickOnAccessModeRadio("Private");
            //3. Select the users in Project Access selector:
            await layerWizard.selectProjectAccessRoles(USER.displayName);
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2328
    //Localize button should be disabled when read-only content is selected
    it("GIVEN user with 'Contributor'-layer role is logged in WHEN 'inherited' site has been selected THEN 'Localize' button should be disabled in the browse toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Do log in with the user-owner and navigate to Content Browse Panel:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //2. Select the site:
            await studioUtils.findAndSelectItem(SITE_NAME);
            //3. Verify that 'Localize' button is disabled:
            await contentBrowsePanel.waitForLocalizeButtonDisabled();

            let browseLayersWidget = await studioUtils.openLayersWidgetInBrowsePanel();
            //5. Verify that 'Localize' button is disabled in the first item:
            await browseLayersWidget.waitForLocalizeButtonDisabled(LAYER_DISPLAY_NAME);
        });

    it("GIVEN user with 'contributor'-layer role is logged in WHEN the user attempts to open existing site in draft THEN expected page should be loaded",
        async () => {
            //1. Do Log in with the user:
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            //2. load existing site from the current layer:
            let url = "http://localhost:8080/admin/site/preview" + `/${LAYER_DISPLAY_NAME}/draft/${SITE_NAME}`;
            await webDriverHelper.browser.url(url);
            //3. Verify that expected site is loaded:
            let actualTitle = await webDriverHelper.browser.getTitle();
            assert.equal(actualTitle, SITE_NAME, "expected site should be loaded");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2337
    //User's Layer is not displayed in Project if the user does not have rights to the parent project
    it("WHEN user contributor navigated to 'Settings Panel' THEN parent project and its layer should not be visible",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await studioUtils.navigateToContentStudioWithProjects(USER.displayName, PASSWORD);
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Verify that the layer is not visible in the grid:
            await settingsBrowsePanel.waitForItemDisplayed(LAYER_DISPLAY_NAME);
            //2. Verify that parent project is displayed:
            await settingsBrowsePanel.waitForItemDisplayed(PROJECT_DISPLAY_NAME);
            //3.Verify that the Default project is not visible for the user with contributor role:
            await settingsBrowsePanel.waitForProjectNotDisplayed("Default");
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("Postconditions: the layer should be deleted",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await studioUtils.navigateToContentStudioWithProjects("su", "password");
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1.Select the layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            //2. Confirm the deleting:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await settingsBrowsePanel.waitForNotificationMessage();
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
