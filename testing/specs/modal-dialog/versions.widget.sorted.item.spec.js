/**
 * Created on 27.07.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const ContentBrowseDetailsPanel = require('../../page_objects/browsepanel/detailspanel/browse.details.panel');
const BrowseVersionsWidget = require('../../page_objects/browsepanel/detailspanel/browse.versions.widget');
const contentBuilder = require("../../libs/content.builder");
const CompareContentVersionsDialog = require('../../page_objects/compare.content.versions.dialog');

describe('tests for Sorted versions item', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
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

    it(`GIVEN existing sorted folder has been sorted WHEN 'Versions Widget' has been opened THEN 'Sorted' version item should be displayed with 'Active version' button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let sortContentDialog = new SortContentDialog();
            //1. Select the existing folder with children and open Sort-dialog:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            //2. Expand the sort menu in the modal dialog:
            await sortContentDialog.clickOnMenuButton();
            //3. 'Display name-ascending' menu item has been clicked:
            await sortContentDialog.doSort("Display name", appConst.SORT_ORDER.ASCENDING);
            await sortContentDialog.clickOnSaveButton();
            await sortContentDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot("folder_sorted_1");
            //4. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            //5. Expand the first 'sorted' item:
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 0);
            //6.'Active version' button is present in the expanded version item:
            await browseVersionsWidget.waitForActiveVersionButtonDisplayed();
        });

    it(`GIVEN existing sorted folder is selected WHEN 'Compare with current version' has been clicked in the previous item THEN 'Sorted' version item should be displayed with 'Active version' button`,
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            //1. Select the existing sorted folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            //2. open Versions Panel:
            await contentBrowseDetailsPanel.openVersionHistory();
            //3. Click on 'Compare with current version' in the previous edited-item:
            await browseVersionsWidget.clickOnCompareWithCurrentVersionButtonByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            //4.Verify that the modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot("compare_versions_dlg_sorted_1");
            let result = await compareContentVersionsDialog.getChildOrderProperty();
            assert.isTrue(result.includes("\"displayname ASC\""),
                "Expected current order should be displayed in the dialog -  'displayname ASC'");
        });

    it(`GIVEN existing sorted folder is selected WHEN edited-version has been reverted THEN 'Sort' icon gets not visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. Select the sorted folder :
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await contentBrowsePanel.waitForSortIconDisplayed(PARENT_FOLDER.displayName);
            //3. open Versions Panel:
            await contentBrowseDetailsPanel.openVersionHistory();
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            //4. Revert the first 'Edited' version item:
            await browseVersionsWidget.clickOnRevertButton();
            await browseVersionsWidget.waitForNotificationMessage();
            await studioUtils.saveScreenshot("not_sorted_version_reverted");
            //5. Verify that sort-icon gets not visible after reverting the version:
            await contentBrowsePanel.waitForSortIconNotDisplayed(PARENT_FOLDER.displayName);
        });

    it(`GIVEN existing folder is selected WHEN sorted-version has been reverted THEN 'Sort' icon gets visible again`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            //1. Select the existing not sorted folder, sorted version is not active:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            //2. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            //3. Expand and revert the second 'Sorted' version item - displayname ASC:
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 1);
            await browseVersionsWidget.clickOnRevertButton();
            await browseVersionsWidget.waitForNotificationMessage();
            await studioUtils.saveScreenshot("sorted_version_reverted");
            //4. Verify that sort-icon is visible again:
            await contentBrowsePanel.waitForSortIconDisplayed(PARENT_FOLDER.displayName);
            //5. Verify that 3 sorted items are displayed:
            let numberOfSortedItems = await browseVersionsWidget.countSortedItems();
            assert.equal(numberOfSortedItems, 3, "Three sorted items should be present in the versions widget");
        });

    it(`GIVEN existing folder is selected AND 'Compare versions' dialog is opened WHEN left dropdown selector has been expanded THEN options with 'sorted' icon should be present in the list`,
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            //1. folder that was sorted is selected:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            //2. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            //3. Click on 'Compare with current versions' button in the previous edit-item:
            await browseVersionsWidget.clickOnCompareWithCurrentVersionButtonByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 0);
            await compareContentVersionsDialog.waitForDialogOpened();
            //4. Click on the left dropdown handle:
            await compareContentVersionsDialog.clickOnLeftDropdownHandle();
            await studioUtils.saveScreenshot("compare_versions_dlg_sorted_options");
            //5. Verify that options with the 'sorted' icon should be present in the dropdown list:
            let result = await compareContentVersionsDialog.getSortedOptionsInDropdownList();
            assert.equal(result.length, 4, "4 sorted items should be present in the selector options");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
