/**
 * Created on 30.11.2017.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const appConst = require('../../libs/app_const');

describe('Delete a content that has inbound references.', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SHORTCUT;

    it(`GIVEN existing shortcut with a target WHEN the target-content has been selected AND 'Delete' button pressed THEN expected warning should be displayed in the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let displayName = contentBuilder.generateRandomName('shortcut');
            SHORTCUT = contentBuilder.buildShortcut(displayName, appConst.TEST_IMAGES.WHALE);
            //1. new Shortcut-content has been added and selected:
            await studioUtils.doAddShortcut(SHORTCUT);
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            //2. Delete button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            //3. Verify that expected warning is displayed in the dialog:
            await studioUtils.saveScreenshot('delete_dialog_inbound_ref');
            // 4. Verify that 'Show references' button is displayed in the dialog
            await deleteContentDialog.waitForShowReferencesButtonDisplayed(appConst.TEST_IMAGES.WHALE);
            // 5. Verify that Delete button is disabled:
            await deleteContentDialog.waitForDeleteButtonDisabled();
        });

    it(`GIVEN existing image(target in the shortcut ) is selected AND Delete content dialog is opened WHEN 'Show references' link has been clicked THEN expected inbound dependencies should be filtered in new browser tab`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1.Click on the image, that was selected in the shortcut
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            // 2. 'Archive...' button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            // 3. Click on 'Show references' link:
            await deleteContentDialog.clickOnShowReferencesButton(appConst.TEST_IMAGES.WHALE);
            // switch to the new opened browser tab:
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot('show_ref_filtered');
            // 4. Verify that expected shortcut should be filtered in the grid:
            await contentBrowsePanel.waitForGridLoaded(appConst.longTimeout);
            let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            await studioUtils.saveScreenshot('inbound_ref_shown');
            assert.equal(displayNames[0], SHORTCUT.displayName, "Expected shortcut should be filtered in the grid");
        });

    it(`GIVEN Delete content dialog is opened WHEN 'Ignore inbound references' link has been clicked THEN Archive button gets enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1.Click on the image, that was selected in the shortcut
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            // 2. 'Archive...' button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForDeleteButtonDisabled();
            // 3. Click on 'Ignore inbound references' link:
            await deleteContentDialog.clickOnIgnoreInboundReferences();
            // 4. Verify that Delete button gets enabled:
            await deleteContentDialog.waitForDeleteButtonEnabled();
        });

    it(`GIVEN child item has inbound references WHEN Delete content dialog has been opened for the parent item THEN 'Ignore inbound references' link should be displayed in the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1.Click on the folder with child items, one image is a target in existing shortcut:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            // 2. 'Archive...' button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('parent_folder_ignore_inb_ref');
            // 3. 'Ignore inbound references' link should be displayed in the modal dialog:
            await deleteContentDialog.waitForIgnoreInboundReferencesButtonDisplayed();
            // 4. Verify that 'Delete' button should be disabled:
            await deleteContentDialog.waitForDeleteButtonDisabled();
        });

    it(`GIVEN 'Ignore inbound references' is displayed in Delete content dialog WHEN 'Show references' link has been clicked AND referenced content has been deleted THEN 'Archive' button gets enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1.Click on the image, that was selected in the shortcut
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.WHALE);
            // 2. 'Archive...' button has been clicked:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            // 3. Click on 'Show references' link:
            await deleteContentDialog.clickOnShowReferencesButton(appConst.TEST_IMAGES.WHALE);
            await studioUtils.doSwitchToNextTab();
            // 4. Do delete the referenced content
            await contentBrowsePanel.clickOnRowByName(SHORTCUT.displayName);
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogClosed();
            await contentBrowsePanel.waitForNotificationMessage();
            // 5. switch to the tab with 'Delete content' dialog
            await studioUtils.doSwitchToPrevTab();
            await studioUtils.saveScreenshot('ignore_inbound_ref_gets_not_visible');
            // 6. Verify that 'Archive' button gets enabled, 'Ignore inbound references' gets not visible now:
            await deleteContentDialog.waitForIgnoreInboundReferencesButtonNotDisplayed()
            await deleteContentDialog.waitForDeleteButtonEnabled();
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
