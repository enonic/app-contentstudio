/**
 * Created on 29.07.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('hidden.schedule.icon.spec:  tests for archiving content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let TEST_FOLDER;
    let CHILD_FOLDER

    it(`GIVEN ready to publishing folder is opened WHEN 'Publish' button has been pressed THEN 'Add schedule' calendar-icon should be displayed in the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName = appConst.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.waitForAddScheduleIconDisplayed();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
        });

    // https://github.com/enonic/app-contentstudio/issues/8938
    // When all of the items in the Publish dialog are currently online (that is either Published or Modified or Scheduled), then Schedule icon next to the Publish button should be hidden
    it(`GIVEN the published folder has been modified WHEN Publish Content dialog has been opened THEN 'Add Schedule' icon should not be displayed`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentWizard = new ContentWizard();
            // 1. Open the published folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openDetailsPanel();
            // 2. Select a language
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            await editSettingsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.EN);
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            // 3. Click on 'Mark as Ready' button:
            await contentWizard.clickOnMarkAsReadyButton();
            // 4. Verify that calendar-icon is not displayed in the Publish dialog:
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.waitForAddScheduleIconNotDisplayed();
        });

    it(`Precondition: Ready to publish child folder has been added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('child');
            CHILD_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Select  the parent folder and add a child folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            await studioUtils.doAddReadyFolder(CHILD_FOLDER);
        });

    it(`GIVEN the modified folder (has a new child folder) has been selected WHEN 'Publish Tree...' has been pressed  THEN 'Add Schedule' icon shouldАз be displayed`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the modified folder with 'ready for publishing' child folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 2. Expand the Publish-menu and click on 'Publish Tree...':
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Verify that Add Schedule icon is displayed:
            await contentPublishDialog.waitForAddScheduleIconDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
