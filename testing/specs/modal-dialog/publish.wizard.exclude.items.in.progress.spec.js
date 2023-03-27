/**
 * Created on 03.01.2023.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.wizard.exclude.items.in.progress.spec - tests for  Exclude items in progress', function () {

    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    it(`Precondition: parent and child folders should be added`,
        async () => {
            let parentFolder = contentBuilder.generateRandomName('parent');
            let childFolderName = contentBuilder.generateRandomName('child');
            PARENT_FOLDER = contentBuilder.buildFolder(parentFolder);
            CHILD_FOLDER = contentBuilder.buildFolder(childFolderName);
            await studioUtils.doAddFolder(PARENT_FOLDER);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/5669
    // "Exclude" links in the Publishing wizard should only exclude dependent items #5669
    it("WHEN 'Exclude items in progress' button has been pressed in the 'Publishing Wizard' THEN only dependent items should be excluded",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Verify that number (2) is displayed for in-progress items
            let actualResult = await contentPublishDialog.getInProgressEntryText();
            assert.equal(actualResult, '(2)', "(2) should be displayed in 'In progress' label");
            // 4. Click on 'Exclude items in progress'
            await contentPublishDialog.clickOnExcludeItemsInProgressButton();
            await studioUtils.saveScreenshot('exclude_items_in_progress_clicked');
            // 5. Verify that 'Exclude items in progress' button gets not visible
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            // 6. Verify that number of item in progress is reduced:
            actualResult = await contentPublishDialog.getInProgressEntryText();
            assert.equal(actualResult, '(1)', "(1) should be displayed in 'In progress' label");
            let note = await contentPublishDialog.waitForExcludedNote();
            assert.equal(note, 'All dependencies are excluded and hidden.', 'Expected note gets visible');
            // 7. Verify that 'Show excluded items'  button gets visible:
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            // 8. Verify that 'Publish now' button remains disabled
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            await contentPublishDialog.markAsReadyButtonDisplayed();
            // 9. 'Dependent block' should be visible:
            await contentPublishDialog.waitForDependantsBlockDisplayed();
            // But all items are excluded:
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.isTrue(depItems.length === 0, 'Dependent items should be hidden');
        });

    it("GIVEN Publish Wizard is opened WHEN 'Exclude child items' icon has been clicked THEN 'Exclude items in progress' button gets not visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'Include children' toggler and exclude children items:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await studioUtils.saveScreenshot('exclude_items_in_progress_toggled');
            // 4. Verify that 'Exclude items in progress' button gets not visible
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            let actualResult = await contentPublishDialog.getInProgressEntryText();
            assert.equal(actualResult, '(1)', "(1) should be displayed in 'In progress' label");
            // 5. Verify that 'Publish now' button remains disabled
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            await contentPublishDialog.markAsReadyButtonDisplayed();
        });

    it("GIVEN parent folder is ready for publishing AND Publish Wizard is opened WHEN checkbox for 'work in progress' item has been unselected THEN 'Publish now' button gets enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Unselect the checkbox for 'work in progress' child item:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_w_work_in_progress_unselected');
            // 4. Verify that Publish Now button gets enabled:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            await contentPublishDialog.waitForReadyForPublishingTextDisplayed();
        });

    it("GIVEN Publish Wizard is opened WHEN checkbox for 'work in progress' item has been selected then 'Apply selection' has been pressed THEN 'Publish now' button gets disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder(ready for publishing):
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            await contentPublishDialog.clickOnApplySelectionButton();
            // 3. Click on 'Show excluded items' and select the checkbox for 'work in progress' item
            await contentPublishDialog.clickOnShowExcludedButtonItems();
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 4. Click on 'Apply selection':
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_w_work_in_progress_selected');
            // 5. Verify that 'Exclude items in progress' button gets not visible
            await contentPublishDialog.waitForExcludeItemsInProgressButtonDisplayed();
            // 6. 'Show Excluded items' button gets hidden now:
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            // 7. 'Mark as ready' button gets visible:
            await contentPublishDialog.markAsReadyButtonDisplayed();
            // 8. 'Publish now' button remains disabled after clicking on 'Apply' selection button:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    it("GIVEN Publish Wizard is opened WHEN 'mark as ready' button has been pressed THEN the dependent item gets ready for publishing AND 'Publish now' button gets enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder(ready for publishing):
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Child item has been marked as ready:
            await contentPublishDialog.clickOnMarkAsReadyButton();
            await studioUtils.saveScreenshot('child_item_marked_as_ready');
            // 4. Verify that 'Exclude items in progress' button gets not visible
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            // 5. 'Show Excluded items' button should not be displayed:
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            // 6. 'Mark as ready' button gets not visible:
            await contentPublishDialog.markAsReadyButtonNotDisplayed();
            // 7. 'Publish now' button gets enabled:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            // 8. 'All' checkbox remains visible and selected:
            await contentPublishDialog.waitForAllDependantsCheckboxEnabled();
            let isSelected = await contentPublishDialog.isAllDependantsCheckboxSelected();
            assert.isTrue(isSelected, "'All' checkbox should be visible and selected");
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
