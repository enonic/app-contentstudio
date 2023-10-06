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
            // 1. Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Verify that number (2) is displayed for in-progress items
            let actualResult = await contentPublishDialog.getNumberOfInProgressItems();
            assert.equal(actualResult, '(2)', "(2) should be displayed in 'In progress' label");
            // 4. Click on 'Exclude items in progress'
            await contentPublishDialog.clickOnExcludeItemsInProgressButton();
            await studioUtils.saveScreenshot('exclude_items_in_progress_clicked');
            // 5. Verify that 'Exclude items in progress' button gets not visible
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            // 6. Verify that number of item in progress is reduced:
            actualResult = await contentPublishDialog.getNumberOfInProgressItems();
            assert.equal(actualResult, '(1)', "(1) should be displayed in 'In progress' label");
            // 7. Verify that 'Hide excluded'  button is visible:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 8.  Verify that 'Publish now' button remains disabled
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            await contentPublishDialog.markAsReadyButtonDisplayed();
            // 9. 'Dependent block' should be visible:
            await contentPublishDialog.waitForDependantsBlockDisplayed();
            // one item should be present in the 'Dependent block':
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.isTrue(depItems[0].includes(CHILD_FOLDER.displayName), "Expected dependent's display name should be present in the block");
            assert.isTrue(depItems.length === 1, 'One dependent items should be present in the block');
        });

    it("GIVEN Publish Wizard is opened WHEN 'Exclude child items' icon has been clicked THEN 'Exclude items in progress' button gets not visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'Include children' toggler and exclude children items:
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await studioUtils.saveScreenshot('exclude_items_in_progress_toggled');
            // 4. Verify that 'Exclude items in progress' button gets not visible
            await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
            let actualResult = await contentPublishDialog.getNumberOfInProgressItems();
            assert.equal(actualResult, '(1)', "(1) should be displayed in 'In progress' label");
            // 5. Verify that 'Publish now' button remains disabled
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            await contentPublishDialog.markAsReadyButtonDisplayed();
        });

    it("GIVEN parent folder is ready for publishing AND Publish Wizard is opened WHEN checkbox for 'work in progress' item has been unselected THEN 'Publish now' button gets enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder then click on Mark as ready button:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Verify that 'Publish now' button is disabled, because of 'work in progress' child item:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 4. Unselect the checkbox for 'work in progress' child item:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            await contentPublishDialog.clickOnApplySelectionButton();
            //await contentPublishDialog.waitForAllDependantsCheckboxNotDisplayed();
            await studioUtils.saveScreenshot('publish_w_work_in_progress_unselected');
            // 4. Verify that 'Publish Now' button gets enabled after excluding 'work in progress' child item:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
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
            // 3. unselect the checkbox for 'ready for publishing' child item:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            await contentPublishDialog.clickOnApplySelectionButton();
            // 4. Verify that 'Hide excluded' button remains visible
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 5. Select the checkbox for 'work in progress' child item:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 6. 'Publish now' button should be disabled if Apply selection button is present
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 7. Click on 'Apply selection':
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_w_work_in_progress_selected');
            // 8. Verify that 'Exclude items in progress' button should be visible now
            await contentPublishDialog.waitForExcludeItemsInProgressButtonDisplayed();
            // 9. 'Show Excluded' button gets hidden now:
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            // 10. 'Hide Excluded' button should not be visible:
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            // 11. 'Mark as ready' button gets visible:
            await contentPublishDialog.markAsReadyButtonDisplayed();
            // 12. 'Publish now' button should be disabled after re-selecting the work in progress item:
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
            // 5. 'Show Excluded' button should not be displayed:
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            // 6. 'Mark as ready' button gets not visible:
            await contentPublishDialog.waitForMarkAsReadyButtonNotDisplayed();
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
