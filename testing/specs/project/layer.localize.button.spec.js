/**
 * Created on 03.08.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('layer.localize.button.spec - checks Localize button in browse toolbar and Layers widget', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const LAYER_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const FOLDER_NAME = studioUtils.generateRandomName('folder');
    const FOLDER_2_NAME = studioUtils.generateRandomName('folder');

    it("Precondition 1 - layer(in Default) with 'Norsk(no)' language should be created",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            await studioUtils.closeProjectSelectionDialog();
            await studioUtils.openSettingsPanel();
            // 1.'Default' project should be loaded after closing the 'Select project' dialog, then open wizard for new layer:
            await projectUtils.selectParentAndOpenProjectWizardDialog("Default");
            let layer = projectUtils.buildLayer("Default", appConst.LANGUAGES.NORSK_NO, appConst.PROJECT_ACCESS_MODE.PUBLIC, null,
                null, LAYER_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("Precondition 2 - two new folders should be added in 'Default' context",
        async () => {
            // Default project should be loaded automatically when SU is logged in the second time.
            // 1. folder1 - status is 'work in progress'
            let folder = contentBuilder.buildFolder(FOLDER_NAME);
            await studioUtils.doAddFolder(folder);
            // 2. folder2 - status is 'Ready to Publish'
            let folder2 = contentBuilder.buildFolder(FOLDER_2_NAME);
            await studioUtils.doAddReadyFolder(folder2);
        });

    it("GIVEN layer context is switched WHEN a content that is inherited from a parent has been selected THEN 'Localize' button gets visible and enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Default project is loaded by default, so need to select the layer's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(LAYER_DISPLAY_NAME);
            // Wait for content is inherited from the parent project:
            await contentBrowsePanel.pause(5000);
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await studioUtils.saveScreenshot('localize_button_browse_panel_enabled');
            // 2. Verify that Localize button is enabled in the browse toolbar
            await contentBrowsePanel.waitForLocalizeButtonEnabled();
        });

    it("GIVEN content that is inherited from a parent has been opened WHEN 'Save' button has been pressed THEN 'Localize' button should be replaced with 'Edit' button",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizardPanel = new ContentWizard();
            // layer's context should be loaded by default now!
            // 1. Select the folder:
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            // 2. Click on `Localize` button and open it:
            await contentBrowsePanel.clickOnLocalizeButton();
            await studioUtils.doSwitchToNextTab();
            await contentWizardPanel.waitForOpened();
            let localizedMes = await contentWizardPanel.waitForNotificationMessage();
            // Expected Message: Inherited content was localized:
            assert.equal(localizedMes, appConst.NOTIFICATION_MESSAGES.INHERITED_CONTENT_LOCALIZED,
                "'Inherited content has been localized' message should appear after the content has been opened");
            // 4. 'Save' button should be disabled:
            await contentWizardPanel.waitForSaveButtonDisabled();
        });

    it('Precondition 3: content has been deleted in the parent context',
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.selectContext('Default');
            await studioUtils.doDeleteContent(FOLDER_NAME);
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/3132
    // Hide "Reset" button in the Content Wizard if content item doesn't have a parent #3132
    it("WHEN content does not have corresponding item in parent project THEN 'Reset' button should not be displayed in the wizard toolbar",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizardPanel = new ContentWizard();
            // 1. Switch to the layer's context:
            await contentBrowsePanel.selectContext(LAYER_DISPLAY_NAME);
            // 2. Select the folder and click on Edit:
            await studioUtils.selectAndOpenContentInWizard(FOLDER_NAME);
            await studioUtils.saveScreenshot('reset_button_parent_deleted');
            // 3. Verify that 'Reset' button is not displayed:
            await contentWizardPanel.waitForResetButtonNotDisplayed();
        });

    it('Post conditions: the layer should be deleted',
        async () => {
            await studioUtils.openSettingsPanel();
            await projectUtils.selectAndDeleteProject(LAYER_DISPLAY_NAME);
        });

    beforeEach(async () => {
        return await studioUtils.navigateToContentStudioWithProjects();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
