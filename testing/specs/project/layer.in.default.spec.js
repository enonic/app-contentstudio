/**
 * Created on 17.07.2020.
 */

const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');

describe('layer.in.default.spec - ui-tests for creating a layer in Default project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();


    it("GIVEN Default project is selected WHEN wizard for new layer is opened THEN expected parent project should be displayed",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            //2. Verify that copy buttons are displayed and disabled:
            await layerWizard.waitForCopyLanguageFromParentDisabled();
            await layerWizard.waitForCopyAccessModeFromParentDisabled();
            await layerWizard.waitForCopyRolesFromParentDisabled();
            //3. Verify that Default is parent project:
            let actualParent = await layerWizard.getParentProjectName();
            assert.equal(actualParent, "Default", "Default project should be parent");
        });

    it("GIVEN wizard for new layer in Default project is opened WHEN 'Public' radio has been clicked and name input filled in THEN 'Copy Access mode' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName("test layer");
            //2. Verify that copy Access mode button gets enabled:
            await layerWizard.waitForCopyAccessModeFromParentEnabled();

            await layerWizard.waitForCopyLanguageFromParentDisabled();
            await layerWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN wizard for new layer in Default is opened WHEN 'Private' radio has been clicked and name input filled in THEN 'Copy Access mode' button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.typeDisplayName("test layer");
            await layerWizard.clickOnAccessModeRadio("Private");
            //2. Verify that 'Copy Access mode' button gets disabled:
            await layerWizard.waitForCopyAccessModeFromParentDisabled();

            await layerWizard.waitForCopyLanguageFromParentDisabled();
            await layerWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN wizard for new layer in Default is opened WHEN a language has been selected THEN 'Copy language' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Private");
            await layerWizard.selectLanguage(appConstant.LANGUAGES.EN);
            await layerWizard.typeDisplayName("test layer");
            //2. Verify that copy language button gets enabled:
            await layerWizard.waitForCopyLanguageFromParentEnabled();

            await layerWizard.waitForCopyAccessModeFromParentDisabled();
            await layerWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN wizard for new layer in Default is opened WHEN item in Roles has been selected THEN 'Copy roles' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Private");
            await layerWizard.typeDisplayName("test layer");
            await layerWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            //2. Verify that copy roles button gets enabled:
            await layerWizard.waitForCopyRolesFromParentEnabled();

            await layerWizard.waitForCopyLanguageFromParentDisabled();
            await layerWizard.waitForCopyAccessModeFromParentDisabled();
        });

    it("GIVEN new item has been added in Roles selector WHEN 'Copy roles from parent' has been clicked THEN 'Copy roles from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Private");
            await layerWizard.typeDisplayName("test layer");
            await layerWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            //2. Click on 'Copy roles from parent':
            await layerWizard.clickOnCopyRolesFromParent();
            //3. Verify that notification message appears
            await layerWizard.waitForNotificationMessage();
            //4. Verify that 'Copy roles from parent' gets disabled
            await layerWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN language in layer-wizard is selected WHEN 'Copy language' button has been pressed THEN 'Copy language from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Private");
            await layerWizard.selectLanguage(appConstant.LANGUAGES.EN);
            await layerWizard.typeDisplayName("test layer");
            //2. Click on 'Copy language from parent':
            await layerWizard.clickOnCopyLanguageFromParent();
            //3. Verify that notification message appears:
            await layerWizard.waitForNotificationMessage();
            //4. Verify that 'Copy language from parent' button gets disabled:
            studioUtils.saveScreenshot("copy_language_from_parent");
            await layerWizard.waitForCopyLanguageFromParentDisabled();
            //5. Verify that locale options filter gets visible and enabled:
            let isClickable = await layerWizard.isLocaleOptionsFilterInputClickable();
            assert.isTrue(isClickable, "locale options filter gets visible and enabled");
        });

    it("GIVEN 'Public access mode' in layer wizard is selected WHEN 'Copy Access Mode' button has been pressed THEN 'Copy access mode from parent' button gets disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new layer:
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard("Default");
            await layerWizard.clickOnAccessModeRadio("Public");
            await layerWizard.typeDisplayName("test layer");
            //2. Click on 'Copy access mode from parent':
            await layerWizard.clickOnCopyAccessModeFromParent();
            await layerWizard.waitForNotificationMessage();
            //3. Verify that 'Copy access mode from parent' button gets disabled:
            studioUtils.saveScreenshot("copy_access_mode_from_parent");
            await layerWizard.waitForCopyAccessModeFromParentDisabled();
            //4. Verify that access mode changed to 'Private':
            let isSelected = await layerWizard.isAccessModeRadioSelected("Private");
            assert.isTrue(isSelected, "Private radio button gets selected now");
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioWithProjects();
        await studioUtils.closeProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
