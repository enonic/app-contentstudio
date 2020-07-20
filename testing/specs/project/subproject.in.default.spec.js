/**
 * Created on 17.07.2020.
 */

const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');

describe('subproject.in.default.spec - ui-tests for subproject with Default parent project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();


    it("GIVEN Default project is selected WHEN wizard for new subproject is opened THEN expected parent project should be displayed",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            //2. Verify that copy buttons are displayed and disabled:
            await subprojectWizard.waitForCopyLanguageFromParentDisabled();
            await subprojectWizard.waitForCopyAccessModeFromParentDisabled();
            await subprojectWizard.waitForCopyRolesFromParentDisabled();
            //3. Verify that Default is parent project:
            let actualParent = await subprojectWizard.getParentProjectName();
            assert.equal(actualParent, "Default", "Default project should be parent");
        });

    it("GIVEN wizard for new subproject in Default is opened WHEN 'Public' radio has been clicked and name input filled in THEN 'Copy Access mode' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.clickOnAccessModeRadio("Public");
            await subprojectWizard.typeDisplayName("test subproject");
            //2. Verify that copy Access mode button gets enabled:
            await subprojectWizard.waitForCopyAccessModeFromParentEnabled();

            await subprojectWizard.waitForCopyLanguageFromParentDisabled();
            await subprojectWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN wizard for new subproject in Default is opened WHEN 'Private' radio has been clicked and name input filled in THEN 'Copy Access mode' button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.typeDisplayName("test subproject");
            await subprojectWizard.clickOnAccessModeRadio("Private");
            //2. Verify that copy Access mode button gets enabled:
            await subprojectWizard.waitForCopyAccessModeFromParentDisabled();

            await subprojectWizard.waitForCopyLanguageFromParentDisabled();
            await subprojectWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN wizard for new subproject in Default is opened WHEN a language has been selected THEN 'Copy language' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.clickOnAccessModeRadio("Private");
            await subprojectWizard.selectLanguage(appConstant.LANGUAGES.EN);
            await subprojectWizard.typeDisplayName("test subproject");
            //2. Verify that copy language button gets enabled:
            await subprojectWizard.waitForCopyLanguageFromParentEnabled();

            await subprojectWizard.waitForCopyAccessModeFromParentDisabled();
            await subprojectWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN wizard for new subproject in Default is opened WHEN item in Roles has been selected THEN 'Copy roles' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.clickOnAccessModeRadio("Private");
            await subprojectWizard.typeDisplayName("test subproject");
            await subprojectWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            //2. Verify that copy roles button gets enabled:
            await subprojectWizard.waitForCopyRolesFromParentEnabled();

            await subprojectWizard.waitForCopyLanguageFromParentDisabled();
            await subprojectWizard.waitForCopyAccessModeFromParentDisabled();
        });

    it("GIVEN new item has been added in Roles selector WHEN 'Copy roles from parent' has been clicked THEN 'Copy roles from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.clickOnAccessModeRadio("Private");
            await subprojectWizard.typeDisplayName("test subproject");
            await subprojectWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            //2. Click on 'Copy roles from parent':
            await subprojectWizard.waitForCopyRolesFromParentEnabled();
            await subprojectWizard.clickOnCopyRolesFromParent();
            //3. Verify that notification message appears
            await subprojectWizard.waitForNotificationMessage();
            //4. Verify that 'Copy roles from parent' gets disabled
            await subprojectWizard.waitForCopyRolesFromParentDisabled();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioApp();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
