/**
 * Created on 09.09.2020.
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const projectUtils = require('../../libs/project.utils.js');
const SettingsBrowsePanel = require('../../page_objects/project/settings.browse.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../../libs/content.builder");
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');
const appConst = require('../../libs/app_const');

describe('layers.content.tree.dialog.spec - tests for Layers Content Tree modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TEST_FOLDER_DISPLAY_NAME = studioUtils.generateRandomName('folder');
    const PROJECT_DISPLAY_NAME = studioUtils.generateRandomName('project');
    const LAYER1_DISPLAY_NAME = studioUtils.generateRandomName('layer');
    const LAYER2_DISPLAY_NAME = studioUtils.generateRandomName('layer');

    it("Preconditions: new project with folder should be added",
        async () => {
            // 1. Navigate to Settings Panel and save new project:
            await projectUtils.saveTestProject(PROJECT_DISPLAY_NAME, 'description', null, null);
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.switchToContentMode();
            await contentBrowsePanel.selectContext(PROJECT_DISPLAY_NAME);
            let folder = contentBuilder.buildFolder(TEST_FOLDER_DISPLAY_NAME);
            await studioUtils.doAddFolder(folder);
        });

    it("Precondition 1 - the first layer(En) should be added in Default project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1. Select 'Default' project and open wizard for new layer:
            await settingsBrowsePanel.openProjectWizardDialog();
            let layer = projectUtils.buildLayer(PROJECT_DISPLAY_NAME, appConst.LANGUAGES.EN, appConst.PROJECT_ACCESS_MODE.PUBLIC, null,
                null, LAYER1_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);
            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("Precondition 2 - the second layer(Norsk no) should be added in Default project",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Select the just created layer and create one more layer:
            // let layerWizard = await settingsBrowsePanel.selectParentAndOpenNewLayerWizard(LAYER1_DISPLAY_NAME);
            await settingsBrowsePanel.openProjectWizardDialog();
            let layer = projectUtils.buildLayer(LAYER1_DISPLAY_NAME, appConst.LANGUAGES.NORSK_NO, appConst.PROJECT_ACCESS_MODE.PUBLIC,
                null, null, LAYER2_DISPLAY_NAME);
            await projectUtils.fillFormsWizardAndClickOnCreateButton(layer);

            await settingsBrowsePanel.waitForNotificationMessage();
        });

    it("WHEN layer, that has child layer, have been selected THEN 'Delete' button should be disabled",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            // 1.Verify that layer with child layer can not be deleted:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER1_DISPLAY_NAME);
            await studioUtils.saveScreenshot('layers_tree_toolbar_1');
            await settingsBrowsePanel.waitForDeleteButtonDisabled();
            // 2. Verify that layer without child can be deleted:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER2_DISPLAY_NAME);
            await studioUtils.saveScreenshot('layers_tree_toolbar_2');
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    it("WHEN children layers have been sequentially removed THEN parent project can be deleted",
        async () => {
            let settingsBrowsePanel = new SettingsBrowsePanel();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. Delete the first layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER2_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER2_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await settingsBrowsePanel.waitForNotificationMessage();
            // 2. Delete the second layer:
            await settingsBrowsePanel.clickOnRowByDisplayName(LAYER1_DISPLAY_NAME);
            await settingsBrowsePanel.clickOnDeleteButton();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(LAYER1_DISPLAY_NAME);
            await confirmValueDialog.clickOnConfirmButton();
            await settingsBrowsePanel.waitForNotificationMessage();
            // 3. Verify that Delete button gets enabled after selecting the parent project
            await settingsBrowsePanel.clickOnRowByDisplayName(PROJECT_DISPLAY_NAME);
            await studioUtils.saveScreenshot('layers_tree_toolbar_3');
            await settingsBrowsePanel.waitForDeleteButtonEnabled();
        });

    beforeEach(async () => {
        await studioUtils.navigateToContentStudioCloseProjectSelectionDialog();
        return await studioUtils.openSettingsPanel();
    });
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
