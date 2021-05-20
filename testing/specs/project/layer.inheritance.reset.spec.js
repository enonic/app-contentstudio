/**
 * Created on 16.11.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectSelectionDialog = require('../../page_objects/project/project.selection.dialog');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');

describe('layer.inheritance.reset.spec - tests for Reset button in wizard toolbar', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName("project");
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName("layer");
    const FOLDER_NAME = studioUtils.generateRandomName("folder");
    const CONTROLLER_NAME = 'main region';
    const SITE_NAME = contentBuilder.generateRandomName('site');
    let SITE;


    it(`Precondition 1 - parent project with private access mode should be created`,
        async () => {
            await studioUtils.openSettingsPanel();
            //1. Save new project (mode access is Private):
            await studioUtils.saveTestProject(PROJECT_DISPLAY_NAME);
        });

    it("Precondition 2: new site should be created in existing parent project",
        async () => {
            //1. Select the project's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            //2. Create new site:
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("Precondition 3: new layer(English (en)) should be created in the existing project",
        async () => {
            await studioUtils.openSettingsPanel();
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(PROJECT_DISPLAY_NAME);
            await layerWizard.typeDisplayName(LAYER_DISPLAY_NAME);
            await layerWizard.selectLanguage(appConstant.LANGUAGES.EN);
            //2. Click on 'Private' radio button:
            await layerWizard.clickOnAccessModeRadio("Private");
            await layerWizard.waitAndClickOnSave();
            await layerWizard.waitForNotificationMessage();
        });

    it("GIVEN site is selected AND 'Localize' button has been pressed WHEN 'Save' button has been pressed THEN 'Reset' button should appear in the wizard toolbar",
        async () => {
            //1. Select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            //2. Click on Localize and save the changes in the site:
            let contentWizard = await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //3. Verify that Reset button gets visible in the wizard toolbar
            await contentWizard.waitForResetButtonDisplayed();
        });

    it("GIVEN 'Reset' button has been pressed AND Confirmation dialog is opened WHEN 'No' button has been clicked THEN the site remains localized",
        async () => {
            let settingsStepForm = new SettingsStepForm();
            let contentWizard = new ContentWizard();
            //1. layer's context should be loaded automatically.
            //2. Open the localized site:
            await studioUtils.selectContentAndOpenWizard(SITE_NAME);
            //3. Click on Reset button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            //4. Click on No button in confirmation dialog:
            await confirmationDialog.clickOnNoButton();
            let language = await settingsStepForm.getSelectedLanguage();
            studioUtils.saveScreenshot("reset_not_confirmed");
            //5. Verify that site is not reverted to initial inherited state:
            assert.equal(language, appConstant.LANGUAGES.EN, "layer's data should not be reset");
            //6. Verify that Reset button still displayed in the wizard toolbar:
            await contentWizard.waitForResetButtonDisplayed();
        });

    it("GIVEN 'Reset' button has been pressed AND Confirmation dialog is opened WHEN 'Yes' button has been clicked THEN the site should be reverted to the inherited state",
        async () => {
            let settingsStepForm = new SettingsStepForm();
            let contentWizard = new ContentWizard();
            //layer's context should be loaded automatically.
            //1. Open the localized site:
            await studioUtils.selectContentAndOpenWizard(SITE_NAME);
            //2. Click on Reset button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            //3. Click on 'Yes' button in confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            let language = await settingsStepForm.getSelectedLanguage();
            studioUtils.saveScreenshot("reset_confirmed");
            //4. Verify that content is reverted to initial inherited state:
            assert.equal(language, appConstant.LANGUAGES.EN, "layer's language should be reset");
            //5. Verify that 'Reset' button is not displayed in the wizard toolbar:
            await contentWizard.waitForResetButtonNotDisplayed();
            //6. Verify that language is not selected in the settings form:
            await settingsStepForm.waitForSelectedLanguageNotDisplayed();
        });

    //Verifies https://github.com/enonic/xp/issues/8547
    //"Reset inheritance" action won't reset workflow state #8547
    it("GIVEN not localized site has been marked as ready WHEN 'Reset' button has been clicked THEN the site's workflow state should be reverted to Work in progress",
        async () => {
            let contentWizard = new ContentWizard();
            //layer's context should be loaded automatically.
            //2. Open the inherited site(not localized):
            await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            //2. Press 'Mark as Ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            //3. Click on 'Reset' button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            //4. Click on 'Yes' button in confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            await contentWizard.pause(1500);
            studioUtils.saveScreenshot("reset_confirmed_w_status");
            let actualStatus = await contentWizard.getIconWorkflowState();
            //5. Verify that workflow status is 'work in progress' ( initial inherited state):
            assert.equal(actualStatus, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS,
                "'Work in progress' status should be after the resetting");
            //6. Verify that 'Reset' button is not displayed in the wizard toolbar:
            await contentWizard.waitForResetButtonNotDisplayed();
        });

    //Verifies: https://github.com/enonic/app-contentstudio/issues/2604
    it("GIVEN controller has been selected in the inherited site WHEN 'Reset' button has been pressed THEN the site should be reverted to the inherited state",
        async () => {
            //1. layer's context should be loaded automatically.
            //2. Open the inherited site and select the controller - click on 'Localize' button:
            let contentWizard = await studioUtils.selectContentAndClickOnLocalize(SITE_NAME);
            await contentWizard.selectPageDescriptor("main region");
            //3. Click on Reset button:
            let confirmationDialog = await contentWizard.clickOnResetAndWaitForConfirmationDialog();
            //4. Click on 'Yes' button in confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            //Verify that 'Saved' button is disabled:
            await contentWizard.waitForSavedButtonVisible();
            //5. Verify that option filter input for controller gets visible:
            await contentWizard.waitForControllerOptionFilterInputVisible();
            //6. Verify that Show Components View button gets not visible after the resetting
            //TODO uncomment it when #2604 will be fixed:
            //await contentWizard.waitForShowComponentVewTogglerNotVisible();
        });

    it("Postconditions: the project should be deleted",
        async () => {
            await studioUtils.openSettingsPanel();
            await studioUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
            await studioUtils.selectAndDeleteProject(PROJECT_DISPLAY_NAME);
        });


    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
