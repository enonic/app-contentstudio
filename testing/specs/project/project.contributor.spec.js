/**
 * Created on 09.06.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const builder = require('../../libs/content.builder');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');

describe('project.contributor.spec - ui-tests for user with Contributor role', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    let USER;
    let PASSWORD = "1q2w3e";

    it(`Preconditions: new system user should be created`,
        async () => {
            //Do Log in with 'SU', navigate to 'Users' and create new user:
            await studioUtils.navigateToUsersApp();
            let userName = builder.generateRandomName("user");
            await studioUtils.showLauncherPanel();
            await studioUtils.navigateToUsersApp();
            let roles = [appConstant.SYSTEM_ROLES.ADMIN_CONSOLE];
            USER = builder.buildUser(userName, PASSWORD, builder.generateEmail(userName), roles);
            await studioUtils.addSystemUser(USER);
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN new project wizard is opened WHEN existing user has been added as contributor THEN expected user should be selected in Project Roles form",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1. Do Log in with 'SU' and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();

            //2.Open new project wizard:
            await settingsBrowsePanel.openProjectWizard();
            await projectWizard.typeDisplayName(PROJECT_DISPLAY_NAME);
            await projectWizard.clickOnAccessModeRadio("Private");
            let result = await projectWizard.isDescriptionInputClickable();
            //3. Select the user in roles, assign Contributor role him:
            await projectWizard.selectProjectAccessRoles(USER.displayName);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot("project_contributor_created_1");
            //4. Verify that expected user is present in selected options:
            let projectAccessItems = await projectWizard.getSelectedProjectAccessItems();
            assert.equal(projectAccessItems[0], USER.displayName, "expected user should be selected in Project Roles form");
            //Do log out:
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            await studioUtils.doLogout();
        });

    it("GIVEN contributor user is logged in WHEN existing project has been opened THEN all inputs should be disabled",
        async () => {
            //1. Do Log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Double click on the project:
            await settingsBrowsePanel.doubleClickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that the project is opened:
            await projectWizard.waitForLoaded();
            //4. Verify that all inputs in the project page are disabled for contributor:
            let isPageDisabled = await projectWizard.isNoModify();
            assert.isTrue(isPageDisabled, "Wizard page should be disabled for contributor");
            let result = await projectWizard.isDescriptionInputClickable();
            assert.isFalse(result, "Description input should not be clickable");
            result = await projectWizard.isLocaleOptionsFilterInputClickable();
            assert.isFalse(result, "Locale input should not be clickable");
            result = await projectWizard.isDisplayNameInputClickable();
            assert.isFalse(result, "Display Name input should not be clickable");
            await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        });

    it("GIVEN contributor user is logged in WHEN existing project has been selected THEN New...,Edit, Delete buttons should be disabled",
        async () => {
            //1. Do log in with the user and navigate to 'Settings':
            await studioUtils.navigateToContentStudioApp(USER.displayName, PASSWORD);
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            await settingsBrowsePanel.clickOnExpanderIcon(appConstant.PROJECTS.ROOT_FOLDER_DESCRIPTION);
            //2.Click(select) on existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //3. Verify that all button are disabled in the toolbar:
            await settingsBrowsePanel.waitForNewButtonDisabled();
            await settingsBrowsePanel.waitForEditButtonDisabled();
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
        });

    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
