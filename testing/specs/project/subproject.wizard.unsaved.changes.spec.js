/**
 * Created on 30.07.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const SubprojectWizard = require('../../page_objects/project/subproject.wizard.panel');

describe('subproject.wizard.unsaved.changes.spec - checks unsaved changes in subproject wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const SUBPROJECT_DISPLAY_NAME = studioUtils.generateRandomName("sub");

    it("GIVEN existing subproject with roles is saved WHEN 'Copy roles from parent' has been clicked THEN 'Save' button gets enabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            //1.Select 'Default' project and open wizard for new subproject:
            let subprojectWizard = await settingsBrowsePanel.selectParentAndOpenNewSubprojectWizard("Default");
            await subprojectWizard.clickOnAccessModeRadio("Public");
            await subprojectWizard.typeDisplayName(SUBPROJECT_DISPLAY_NAME);
            await subprojectWizard.selectProjectAccessRoles(appConstant.systemUsersDisplayName.SUPER_USER);
            await subprojectWizard.selectLanguage(appConstant.LANGUAGES.EN);
            //2. Save the subproject:
            await subprojectWizard.waitAndClickOnSave();
            await subprojectWizard.waitForNotificationMessage();
            await subprojectWizard.waitForSaveButtonDisabled();
            //3. Click on 'Copy roles from parent':
            await subprojectWizard.clickOnCopyRolesFromParent();
            await subprojectWizard.waitForNotificationMessage();
            //4. Verify that 'Save' button gets enabled after removing the selected item in the Roles form:
            await subprojectWizard.waitForSaveButtonEnabled();
        });

    it("GIVEN existing subproject with roles is opened WHEN 'Copy roles from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let subprojectWizard = new SubprojectWizard();
            //1.Open the subproject:
            await settingsBrowsePanel.clickOnRowByDisplayName(SUBPROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await subprojectWizard.waitForLoaded();
            //2. Click on Copy Roles from parent:
            await subprojectWizard.clickOnCopyRolesFromParent();
            await subprojectWizard.waitForNotificationMessage();
            //4. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(SUBPROJECT_DISPLAY_NAME);
            studioUtils.saveScreenshot("subproject_wizard_unsaved_changes_1");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("GIVEN existing subproject is opened WHEN 'Copy access mode from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let subprojectWizard = new SubprojectWizard();
            //1.Open the subproject:
            await settingsBrowsePanel.clickOnRowByDisplayName(SUBPROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await subprojectWizard.waitForLoaded();
            await subprojectWizard.clickOnCopyAccessModeFromParent();
            //2. Confirm the coping:
            await confirmationDialog.clickOnYesButton();
            await subprojectWizard.waitForNotificationMessage();
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(SUBPROJECT_DISPLAY_NAME);
            studioUtils.saveScreenshot("subproject_wizard_unsaved_changes_2");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("GIVEN existing subproject with 'En' language is opened WHEN 'Copy language mode from parent' has been clicked AND close icon pressed THEN Confirmation Dialog should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let subprojectWizard = new SubprojectWizard();
            //1.Open the subproject:
            await settingsBrowsePanel.clickOnRowByDisplayName(SUBPROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await subprojectWizard.waitForLoaded();
            //2. Click on Copy button:
            await subprojectWizard.clickOnCopyLanguageFromParent();
            await subprojectWizard.waitForNotificationMessage();
            //3. Click on 'close' icon:
            await settingsBrowsePanel.clickOnCloseIcon(SUBPROJECT_DISPLAY_NAME);
            studioUtils.saveScreenshot("subproject_wizard_unsaved_changes_3");
            await confirmationDialog.waitForDialogOpened();
            let actualMessage = await confirmationDialog.getWarningMessage();
            assert.equal(actualMessage, appConstant.PROJECT_UNSAVED_CHANGES_MESSAGE);
        });

    it("WHEN existing subproject selected and  has been deleted THEN expected notification message should appear",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            let subprojectWizard = new SubprojectWizard();
            //1.Open the subproject:
            await settingsBrowsePanel.clickOnRowByDisplayName(SUBPROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            //2. Confirm the deleting:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await settingsBrowsePanel.waitForNotificationMessage();
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
