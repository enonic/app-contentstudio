/**
 * Created on 23.07.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const SubprojectWizard = require('../../page_objects/project/subproject.wizard.panel');

describe('subproject.in.public.project.spec - ui-tests for subproject in existing project', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();


    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const SUBPROJECT_DISPLAY_NAME = studioUtils.generateRandomName("sub");
    const TEST_DESCRIPTION = "test description";

    it(`Preconditions: new project(with Norsk (no) language) and 'Private' access mode should be added`,
        async () => {
            //1. Navigate to Settings Panel:
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            //1. Save new project (mode access is Public):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME, TEST_DESCRIPTION, appConstant.LANGUAGES.NORSK_NO, null, "Public");
        });

    it("GIVEN select 'public' project and open wizard for new subproject WHEN 'Private' radio has been clicked and name input filled in THEN 'Copy Access mode' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'public' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard(PROJECT_DISPLAY_NAME);
            await subprojectWizard.typeDisplayName("test subproject1");
            //2. Click on 'Private' radio button:
            await subprojectWizard.clickOnAccessModeRadio("Private");
            //3. Verify that 'Copy Access mode from parent' button gets enabled:
            await subprojectWizard.waitForCopyAccessModeFromParentEnabled();
            //4. Verify that 'Copy language from parent' button is enabled:
            await subprojectWizard.waitForCopyLanguageFromParentEnabled();
            //And 'Copy roles from parent' is disabled
            await subprojectWizard.waitForCopyRolesFromParentDisabled();
        });

    it("GIVEN Buttons: 'Copy language from parent' has been clicked and 'Save' pressed WHEN subproject's context has been switched THEN expected language should be displayed in the project context",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'public' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard(PROJECT_DISPLAY_NAME);
            await subprojectWizard.typeDisplayName(SUBPROJECT_DISPLAY_NAME);
            //2. Click on 'Private' radio button:
            await subprojectWizard.clickOnAccessModeRadio("Private");
            //3. Click on 'Copy language from parent' button:
            await subprojectWizard.clickOnCopyLanguageFromParent();
            await subprojectWizard.waitForNotificationMessage();
            //4. Save the subproject:
            await subprojectWizard.waitAndClickOnSave();
            await subprojectWizard.waitForNotificationMessage();
            await subprojectWizard.pause(500);
            //5. Switch to Content Mode:
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            //6. Open modal dialog and select the subproject's context:
            await contentBrowsePanel.selectContext(SUBPROJECT_DISPLAY_NAME);
            //7. Verify that expected language is copied from the parent project:
            let actualLanguage = await contentBrowsePanel.getContextLanguage();
            assert.equal(actualLanguage, "(no)", "Expected language should be displayed in the App Bar")
        });

    it("GIVEN existing subproject is opened WHEN the language has ben updated THEN expected language should be displayed in the project's context",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let subprojectWizard = new SubprojectWizard();
            //1.Open the subproject:
            await settingsBrowsePanel.clickOnRowByDisplayName(SUBPROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await subprojectWizard.waitForLoaded();
            //2. Update the language:
            await subprojectWizard.clickOnRemoveLanguage();
            await subprojectWizard.selectLanguage(appConstant.LANGUAGES.EN);
            await subprojectWizard.waitAndClickOnSave();
            await subprojectWizard.waitForNotificationMessage();
            //3. Switch to content mode and select the context:
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            await contentBrowsePanel.selectContext(SUBPROJECT_DISPLAY_NAME);
            //4. Verify that language is updated in the browse panel - App Bar
            let actualLanguage = await contentBrowsePanel.getContextLanguage();
            assert.equal(actualLanguage, "(en)", "Expected language should be displayed in the App Bar")
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
