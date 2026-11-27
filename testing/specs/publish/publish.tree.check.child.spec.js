/**
 * Created on 23.09.2019.  updated on 30.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.tree.check.child.spec - Publish Tree action - publish a content with child', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    it(`Precondition: parent and child folders should be added`, async () => {
        let parentFolder = contentBuilder.generateRandomName('parent');
        let childFolderName = contentBuilder.generateRandomName('child');
        PARENT_FOLDER = contentBuilder.buildFolder(parentFolder);
        CHILD_FOLDER = contentBuilder.buildFolder(childFolderName);
        await studioUtils.doAddReadyFolder(PARENT_FOLDER);
        await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
        await studioUtils.doAddReadyFolder(CHILD_FOLDER);
    });

    //verifies XP-4754 Publish Dialog - Lazy loader stops loading items after turning "Include child items" off and on again
    it(`GIVEN 'Publish Tree' has been clicked AND the 'Publishing Wizard' has been closed WHEN 'Publishing Wizard' has been reopened THEN child items should be loaded in the dialog`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select the parent folder:
        await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
        // 2. Click on the 'Publish Tree' menu item
        await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
        await contentPublishDialog.waitForDialogOpened();
        // 3. The parent folder and its child should be in the main list:
        let items1 = await contentPublishDialog.waitForNumberOfMainItems(2);
        // 4. Close the modal dialog
        await contentPublishDialog.clickOnCloseButton();
        await contentPublishDialog.waitForDialogClosed();
        // 5. Click on the 'Publish Tree' menu item and reopen the modal dialog:
        await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
        await contentPublishDialog.waitForDialogOpened();
        // 6. Get the main items:
        let items2 = await contentPublishDialog.waitForNumberOfMainItems(2);
        // 7. Verify that the child item is loaded in both cases:
        assert.ok(items1[1].includes(CHILD_FOLDER.displayName), 'The child item should be in the main list');
        assert.equal(items1[1], items2[1], 'Display name of items should be equal');
    });

    it(`GIVEN existing folder with child WHEN parent folder has been published THEN PUBLISH TREE  should be default action for the parent folder`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        // 1. Select the parent folder
        await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
        // 2. open 'Publish dialog' and click on 'Publish Now' button:(Children items are not included by default in Publish dialog)
        await studioUtils.openDialogAndPublishSelectedContent();
        // 3. Verify - PUBLISH TREE should be default action now:
        await contentBrowsePanel.waitForPublishTreeButtonVisible();
        await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
        let status = await contentBrowsePanel.getContentStatus(CHILD_FOLDER.displayName);
        assert.equal(status, appConst.CONTENT_STATUS.OFFLINE, "Content's status should be 'Offline'");
    });

    it(`GIVEN existing folder(PUBLISHED) with child(NEW) WHEN 'Publish Tree' button has been pressed THEN Default action  gets 'UNPUBLISH...'`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select the parent folder(published)
        await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
        // 2. Verify that 'Publish Tree' is default action(click on it):
        await contentBrowsePanel.clickOnPublishTreeButton();
        await contentPublishDialog.waitForDialogOpened();
        // 3. Verify that only the child item is in the main list, the published parent has nothing to publish:
        let items = await contentPublishDialog.waitForNumberOfMainItems(1);
        assert.ok(items[0].includes(CHILD_FOLDER.displayName), 'The child item should be in the main list');
        // 4. Click on 'Publish Now' button:
        await contentPublishDialog.clickOnPublishNowButton();
        // 5. Dialog should close
        await contentPublishDialog.waitForDialogClosed();
        // 6. Notification message should appear:
        await contentBrowsePanel.waitForNotificationMessage();
        // 7. Verify - UNPUBLISH... should be default action for the parent folder
        await contentBrowsePanel.waitForUnPublishButtonVisible();
        // 8. Select the folder, verify the status
        await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
        let status = await contentBrowsePanel.getContentStatus(CHILD_FOLDER.displayName);
        assert.equal(status, appConst.CONTENT_STATUS.ONLINE, "Content's status should be 'Online'");
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
