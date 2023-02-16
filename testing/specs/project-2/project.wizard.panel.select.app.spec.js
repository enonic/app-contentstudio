/**
 * Created on 22.09.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ProjectWizard = require('../../page_objects/project/project.wizard.panel');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const SiteConfiguratorDialog = require('../../page_objects/wizardpanel/site.configurator.dialog');

describe('project.wizard.panel.select.app.spec - Select an application in project wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TEST_NUMBER = '12345';

    let PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');

    it(`GIVEN existing project has been opened WHEN application has been selected THEN expected application should be present in selected options view`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Save new project (mode access is Private):
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'test description', null, null, 'Private');
            // 3. Select the row and click on Edit button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 4. Verify that Applications-step is present in the wizard:
            await projectWizard.clickOnWizardStep('Applications');
            // 5. Select the application:
            await projectWizard.selectApplication(appConst.TEST_APPS_NAME.APP_CONTENT_TYPES);
            await projectWizard.waitAndClickOnSave();
            await projectWizard.waitForNotificationMessages();
            await studioUtils.saveScreenshot('proj_wizard_selected_app');
            // 6. Verify the selected option:
            let actualApplications = await projectWizard.getSelectedApplications();
            assert.equal(actualApplications[0], appConst.APP_CONTENT_TYPES,
                'Expected application should be present in the selected option view');
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/5819
    // Image selector does not contain Upload button
    it(`GIVEN existing project has been opened WHEN 'edit project configurator' button has been clicked THEN expected application should be present in selected options view`,
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Select the row and click on Edit button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 3. Click on Applications-step in the wizard then click on 'Edit' button:
            await projectWizard.clickOnWizardStep('Applications');
            await projectWizard.clickOnEditProjectConfig(appConst.APP_CONTENT_TYPES);
            // 4. Verify that site configurator dialog is loaded:
            await siteConfiguratorDialog.waitForDialogOpened();
            // 5. Verify elements on the dialog:
            //await siteConfiguratorDialog.waitForImageUploadButtonDisplayed();
        });

    it("GIVEN 'edit project configurator' button has been clicked WHEN there are no any changes in the dialog AND 'Apply' button has been pressed THEN Save button remains disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Select the row and click on Edit button:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 3. Click on Applications-step in the wizard then click on 'Edit' button:
            await projectWizard.clickOnWizardStep('Applications');
            await projectWizard.clickOnEditProjectConfig(appConst.APP_CONTENT_TYPES);
            // 4. Verify that site configurator dialog is loaded:
            await siteConfiguratorDialog.waitForDialogOpened();
            // 5. there are no changes in the dialog, click on 'Apply' button:
            await siteConfiguratorDialog.clickOnApplyButton();
            await studioUtils.saveScreenshot('proj_conf_applied_no_changes');
            // 6. Verify that 'Save' button remains disabled in the wizard toolbar:
            await projectWizard.waitForSaveButtonDisabled()
        });

    it("GIVEN some data has been updated in opened configurator dialog WHEN 'Apply' button has been pressed THEN 'Save' button gets enabled after this changes",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            // 1. Navigate to Settings Panel:
            await studioUtils.openSettingsPanel();
            // 2. Open the project in wizard:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 3. Click on Applications-step in the wizard then click on 'Edit' button:
            await projectWizard.clickOnWizardStep('Applications');
            await projectWizard.clickOnEditProjectConfig(appConst.APP_CONTENT_TYPES);
            await siteConfiguratorDialog.waitForDialogOpened();
            // 4. Insert a text in the text-input then click on 'Apply' button:
            await siteConfiguratorDialog.typeTextInNumPostsInput(TEST_NUMBER);
            await siteConfiguratorDialog.clickOnApplyButton();
            await siteConfiguratorDialog.waitForDialogClosed();
            // 5. Verify that Save button gets enabled:
            await projectWizard.waitForSaveButtonEnabled();
            // 6. Reopen the configurator:
            await projectWizard.clickOnEditProjectConfig(appConst.APP_CONTENT_TYPES);
            await siteConfiguratorDialog.waitForDialogOpened();
            // 7. Verify that 'Max posts per page' is correctly saved:
            let actualNumber = await siteConfiguratorDialog.getTextInNumPostsInput();
            assert.equal(actualNumber, TEST_NUMBER, 'Expected number should be present in the number of posts input');
        });

    it("GIVEN project's context with is selected AND no selections in the grid WHEN New content dialog is opened THEN all content types from project's application should be available in the dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Select the project's context:
            await studioUtils.openProjectSelectionDialogAndSelectContext(PROJECT_DISPLAY_NAME);
            // 2. Click on 'New' button
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await newContentDialog.pause(500);
            await studioUtils.saveScreenshot('root_new_content_with_apps_2');
            // 3. Verify that all input types are available for adding new content in root directory:
            let contentTypeItems = await newContentDialog.getItems();
            assert.isTrue(contentTypeItems.includes('all-inputs'), "Expected input type should be displayed in the modal dialog");
            assert.isTrue(contentTypeItems.includes('attachment0_0'), "Expected input type should be displayed in the modal dialog");
            assert.isAbove(contentTypeItems.length, 50, "All types from the application should be present in the modal dialog");
        });

    it("GIVEN existing project(Private access mode) is opened WHEN access mode has been switched to 'Public' THEN Access Mode gets 'Public'",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let projectWizard = new ProjectWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            await studioUtils.openSettingsPanel();
            // 1.Open existing project:
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnEditButton();
            await projectWizard.waitForLoaded();
            // 2. Click on Applications step
            await projectWizard.clickOnWizardStep('Applications');
            // 3. Click on Remove application icon
            await projectWizard.clickOnRemoveApplicationIcon();
            // 4. Save the project:
            await projectWizard.waitAndClickOnSave();
            // 5. Switch to the content grid panel
            await studioUtils.switchToContentMode();
            // 6. Open New Content dialog:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await newContentDialog.pause(500);
            await studioUtils.saveScreenshot('root_new_content_with_apps_3');
            // 3. Verify that only 3 types are available for creating new content in root directory:
            let contentTypeItems = await newContentDialog.getItems();
            assert.isTrue(contentTypeItems.includes('Folder'), 'Folder input type is displayed in the modal dialog');
            assert.isTrue(contentTypeItems.includes('Shortcut'), 'Shortcut input type is displayed in the modal dialog');
            assert.isTrue(contentTypeItems.includes('Site'), 'Site input type is displayed in the modal dialog');
            assert.equal(contentTypeItems.length, 3, '3 items should be present in the modal dialog');
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
