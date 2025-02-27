/**
 * Created on 16.11.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('layer.inheritance.reset.spec - tests for Reset button in wizard toolbar', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;

    it(`Precondition 1 - parent project with private access mode should be created`,
        async () => {
            await studioUtils.openSettingsPanel();
            //1. Save new project (mode access is Private):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME);
        });

    it('Precondition 2: new site should be created in existing parent project',
        async () => {
            // 1. Select the project's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Create new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("Precondition 3: new layer(English (en)) should be created in the existing project",
        async () => {
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Create new layer in the just created project:
            await projectUtils.selectParentAndOpenProjectWizardDialog(PROJECT_DISPLAY_NAME);
            let layer = projectUtils.buildLayer(PROJECT_DISPLAY_NAME, appConst.LANGUAGES.EN, appConst.PROJECT_ACCESS_MODE.PRIVATE, null,
                null, LAYER_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("GIVEN site is selected AND 'Localize' button has been pressed WHEN 'Save' button has been pressed THEN 'Reset' button should appear in the wizard toolbar",
        async () => {
            // 1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            // 2. Click on 'Localize' button then save the changes in the opened site:
            let contentWizard = await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            await contentWizard.waitForNotificationMessage();
            // 3. Verify that Save button is disabled, because when pressing 'Localize' button update language first and then open wizard
            await contentWizard.waitForSaveButtonDisabled();
            // 4. Verify that 'Reset' button gets visible in the wizard toolbar
            await contentWizard.waitForResetButtonDisplayed();
        });

    it("GIVEN 'Reset' button has been pressed AND Confirmation dialog is opened WHEN 'No' button has been clicked THEN the site remains localized",
        async () => {
            let contentWizard = new ContentWizard();
            //1. layer's context should be loaded automatically.
            //2. Open the localized site:
            await studioUtils.selectContentAndOpenWizard(SITE_NAME);
            //3. Click on Reset button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            // 4. Click on No button in confirmation dialog:
            await confirmationDialog.clickOnNoButton();
            await confirmationDialog.waitForDialogClosed();
            // 2. Open 'Edit Setting' modal dialog:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            let language = await editSettingsDialog.getSelectedLanguage();
            await editSettingsDialog.clickOnCancelButton();
            await studioUtils.saveScreenshot('reset_not_confirmed');
            // 5. Verify that site is not reverted to initial inherited state:
            assert.equal(language, appConst.LANGUAGES.EN, "layer's data should not be reset");
            // 6. Verify that Reset button still displayed in the wizard toolbar:
            await contentWizard.waitForResetButtonDisplayed();
        });

    it("GIVEN 'Reset' button has been pressed AND Confirmation dialog is opened WHEN 'Yes' button has been clicked THEN the site should be reverted to the inherited state",
        async () => {
            let contentWizard = new ContentWizard();
            // layer's context should be loaded automatically.
            // 1. Open the localized site:
            await studioUtils.selectContentAndOpenWizard(SITE_NAME);
            // 2. Click on 'Reset' button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            // 3. Click on 'Yes' button in confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.pause(3000);
            // 4. Open 'Edit Details' modal dialog:
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await studioUtils.saveScreenshot('reset_language_confirmed');
            // 5. Verify that  content is reverted to the inherited state (no languages is selected in the parent project):
            await editSettingsDialog.waitForSelectedLanguageNotDisplayed();
            await editSettingsDialog.clickOnCancelButton();
            await editSettingsDialog.waitForClosed();
            // 6. Verify that 'Reset' button is not displayed in the wizard toolbar:
            await contentWizard.waitForResetButtonNotDisplayed();
        });

    // Verifies https://github.com/enonic/xp/issues/8547
    // "Reset inheritance" action won't reset workflow state #8547
    it("GIVEN not localized site has been marked as ready WHEN 'Reset' button has been clicked THEN the site's workflow state should be reverted to Work in progress",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            //layer's context should be loaded automatically.
            // 1. Open the inherited site(not localized):
            await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            // 2. Press 'Mark as Ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 3. Click on 'Reset' button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            // 4. Click on 'Yes' button in confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            await contentWizard.pause(1500);
            await studioUtils.saveScreenshot('reset_confirmed_w_status');
            let actualStatus = await contentWizard.getContentWorkflowState();
            // 5. Verify that workflow status is 'work in progress' ( initial inherited state):
            assert.equal(actualStatus, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS,
                "'Work in progress' status should be after the resetting");
            // 6. Verify that 'Reset' button is not displayed in the wizard toolbar:
            await contentWizard.waitForResetButtonNotDisplayed();
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/2604
    it("GIVEN controller has been selected in the inherited site WHEN 'Reset' button has been pressed THEN the site should be reverted to the inherited state",
        async () => {
            // 1. layer's context should be loaded automatically.
            // 2. Open the inherited site and select the controller - click on 'Localize' button:
            let contentWizard = await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            await contentWizard.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await contentWizard.selectPageDescriptor(appConst.CONTROLLER_NAME.MAIN_REGION);
            // 3. Click on Reset button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            // 4. Click on 'Yes' button in confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            // Verify that 'Save' button is disabled:
            await contentWizard.waitForSaveButtonDisabled()
            // 5. Verify that option filter input for controller gets visible:
            await contentWizard.waitForControllerOptionFilterInputVisible();
        });

    it("Post conditions: the project should be deleted",
        async () => {
            await studioUtils.openSettingsPanel();
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
            await projectUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
