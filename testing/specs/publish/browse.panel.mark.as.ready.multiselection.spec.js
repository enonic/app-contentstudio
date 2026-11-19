/**
 * Created on 05.09.2019.  updated on 19.11.2026
 * 'Mark as ready' is removed from the browse-toolbar publish button (#11791),
 * so several selected items are marked as ready in the Publish dialog, without the confirmation dialog.
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('browse.panel.mark.as.ready.multiselection.spec - select 2 folders and do Mark as Ready action in the Publish dialog`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER1;
    let TEST_FOLDER2;

    it(`GIVEN 2 'Work in progress' folders are selected AND 'Publish...' button has been pressed WHEN 'Mark as ready' has been clicked in the Publish dialog THEN 'Publish Now' button gets enabled`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        let name1 = contentBuilder.generateRandomName('folder');
        let name2 = contentBuilder.generateRandomName('folder');
        TEST_FOLDER1 = contentBuilder.buildFolder(name1);
        TEST_FOLDER2 = contentBuilder.buildFolder(name2);
        // 1. Two folders have been added:
        await studioUtils.doAddFolder(TEST_FOLDER1);
        await studioUtils.doAddFolder(TEST_FOLDER2);
        // 2. Click on checkboxes and select both folders:
        await studioUtils.findContentAndClickCheckBox(name1);
        await studioUtils.findContentAndClickCheckBox(name2);
        // 3. 'Publish...' should be the default action in the browse-toolbar, click on it:
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 4. Verify that 'Mark as ready' button is displayed and 'Publish Now' is disabled in the dialog:
        await contentPublishDialog.waitForMarkAsReadyButtonDisplayed();
        await contentPublishDialog.waitForPublishNowButtonDisabled();
        // 5. Click on 'Mark as ready' button in the dialog (confirmation dialog should not appear):
        await contentPublishDialog.clickOnMarkAsReadyButton();
        await studioUtils.saveScreenshot('mark_as_ready_multiselection');
        // 6. Verify that 'Mark as ready' button gets not visible and 'Publish Now' gets enabled:
        await contentPublishDialog.waitForMarkAsReadyButtonNotDisplayed();
        await contentPublishDialog.waitForPublishNowButtonEnabled();
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
