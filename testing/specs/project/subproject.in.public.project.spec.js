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
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');

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

    it("GIVEN existing subproject is opened WHEN the language has been updated THEN expected language should be displayed in the subproject's context",
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
            assert.equal(actualLanguage, "(en)", "Expected language should be displayed in the App Bar");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child subprojects.
    it("WHEN existing parent project is selected THEN Delete button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //2. Verify that 'Delete' button is disabled
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            //3. Parent project should be with 'expander-icon'
            let result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.isTrue(result, "Expander icon should be displayed in the parent project");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child subprojects.
    it("WHEN existing parent project(with child subproject) is opened THEN 'Delete' button should be disabled in the wizard-toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that 'Delete' button is disabled:
            await projectWizard.waitForDeleteButtonDisabled();
        });

    //Verifies issue https://github.com/enonic/app-contentstudio/issues/2091
    //Content Browse Panel - The closest allowed context should be loaded after a subproject is deleted
    it("GIVEN existing subproject has been deleted WHEN content mode has been switched THEN Default context should be loaded",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let contentBrowsePanel = await studioUtils.switchToContentMode();
            //1. Switch to supbprojects's context:
            await contentBrowsePanel.selectContext(SUBPROJECT_DISPLAY_NAME);
            let actualSubProjectName1 = await contentBrowsePanel.getSelectedProjectDisplayName();
            await studioUtils.openSettingsPanel();

            //2. Switch to Settings and delete the subproject:
            await settingsBrowsePanel.clickOnRowByDisplayName(SUBPROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            let message = await settingsBrowsePanel.waitForNotificationMessage();

            //3. Switch to content mode and verify that parent project's context is loaded:
            await studioUtils.switchToContentMode();
            let expectedMessage = appConstant.projectDeletedMessage(SUBPROJECT_DISPLAY_NAME);
            assert.equal(message, expectedMessage, "'Project is deleted' this message should appear");
            let actualSubProjectName2 = await contentBrowsePanel.getSelectedProjectDisplayName();
            assert.equal(actualSubProjectName1, SUBPROJECT_DISPLAY_NAME,
                "Subproject's context should be loaded before the deleting of the subproject");
            assert.equal(actualSubProjectName2, PROJECT_DISPLAY_NAME, "Parent context should be loaded after deleting of the subproject");
        });

    it("GIVEN new subproject is created WHEN the subproject has been deleted in the wizard THEN subproject should not be present in grid",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            //1.Select 'public' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard(PROJECT_DISPLAY_NAME);
            //2. Save new subproject:
            await subprojectWizard.typeDisplayName(SUBPROJECT_DISPLAY_NAME);
            await subprojectWizard.clickOnAccessModeRadio("Private");
            await subprojectWizard.waitAndClickOnSave();
            await subprojectWizard.waitForNotificationMessage();
            await subprojectWizard.pause(500);
            //3. Click on 'Delete' button and confirm the deleting:
            await subprojectWizard.clickOnDeleteButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await settingsBrowsePanel.waitForGridLoaded(appConstant.shortTimeout);
            //4. Verify that the subproject is deleted:
            await settingsBrowsePanel.waitForProjectNotDisplayed(SUBPROJECT_DISPLAY_NAME);
            //5. Verify that expander-icon gets not visible in the parent project
            let result = await settingsBrowsePanel.isExpanderIconPresent(PROJECT_DISPLAY_NAME);
            assert.isFalse(result, "Expander icon gets not displayed in the parent project");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child subprojects.
    it("GIVEN subproject was deleted WHEN the parent project is opened THEN 'Delete' button gets enabled in the wizard-toolbar",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            //1.Open the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            //2. Verify that Delete button is enabled now:
            await projectWizard.waitForDeleteButtonEnabled();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2105
    //Do not allow deletion of a project if it has child subprojects.
    it("GIVEN subproject was deleted WHEN the parent project is selected THEN 'Delete' button gets enabled after deleting the subproject",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select the parent project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            //2. Verify that 'Delete' button is enabled after deleting the supbroject
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
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
