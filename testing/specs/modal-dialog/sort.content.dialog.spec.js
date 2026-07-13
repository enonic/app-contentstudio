/**
 * Created on 04.02.2022 updated on 09.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowseDetailsPanel = require("../../page_objects/browsepanel/detailspanel/browse.context.window.panel");
const BrowseVersionsWidget = require("../../page_objects/browsepanel/detailspanel/browse.versions.widget");
const CompareContentVersionsDialog = require("../../page_objects/compare.content.versions.dialog");

describe('sort.dialog.spec, tests for sort content dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DISPLAY_NAME_A_Z_FIRST_ITEM = 'book';
    const MODIFIED_DATE_OLD_TO_NEW_FIRST_ITEM = 'monet-004';

    it("GIVEN newly crated folder is selected WHEN Sort content modal dialog is opened THEN default sort order should be displayed in the dropdown",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            let displayName1 = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(displayName1);
            // 1. Open wizard for new folder , fill in the name input and save it:
            await studioUtils.doAddFolder(folder);
            // 2. Select the folder and open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(folder.displayName);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 3. Verify the default sort order:
            let actualOrder = await sortContentDialog.getSelectedOrder();
            assert.equal(actualOrder, appConst.SORTING_ORDER.MODIFIED_DATE_OLD_TO_NEW,
                "'Modified date old to new' should be selected by default");
        });

    it("GIVEN 'Sort' dialog is opened WHEN dropdown handle button has been clicked THEN five menu items get visible in the dropdown",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 2. Click on Dropdown handle button:
            await sortContentDialog.clickOndropDownHandle();
            await studioUtils.saveScreenshot('sort_dlg_menu_items');
            // 3. Verify the menu items in dropdown selector:
            let items = await sortContentDialog.getMenuItems();
            assert.equal(items.length, 9, '9 options should be present in the selector');
            // 4. Click on the dropdown handle and close the selector:
            await sortContentDialog.clickOndropDownHandle();
            // 5. Press 'Close' button:
            await sortContentDialog.clickOnCloseButton();
            // 6. Verify that the modal dialog is closed:
            await sortContentDialog.waitForDialogClosed();
        });

    it(`GIVEN not expanded folder is selected AND dialog is opened WHEN the “Display name (A–Z)” option is clicked THEN the new order should be applied`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await studioUtils.findAndSelectItemByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 2. Select the item in the dropdown:
            await sortContentDialog.clickOndropDownHandle();
            // Set the order - Display name (A-Z)
            await sortContentDialog.clickOnSortItemOption(appConst.SORTING_ORDER.DISPLAY_NAME_A_Z);
            await sortContentDialog.waitForSaveButtonEnabled();
            await sortContentDialog.clickOnSaveButton();
            await sortContentDialog.waitForDialogClosed();
            // 3. Verify that the new order is applied in the Browse Panel:
            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(items[1] === DISPLAY_NAME_A_Z_FIRST_ITEM);
        });

    it(`GIVEN not expanded folder is selected AND dialog is opened WHEN the “Modified date (Old to new)” option is clicked THEN the new order should be applied`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await studioUtils.findAndSelectItemByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 2. Select the item in the dropdown:
            await sortContentDialog.clickOndropDownHandle();
            await sortContentDialog.clickOnSortItemOption(appConst.SORTING_ORDER.MODIFIED_DATE_OLD_TO_NEW);
            await sortContentDialog.waitForSaveButtonEnabled();
            await sortContentDialog.clickOnSaveButton();
            await sortContentDialog.waitForDialogClosed();

            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(items[1] === MODIFIED_DATE_OLD_TO_NEW_FIRST_ITEM);
        });

    it(`GIVEN existing folder is selected WHEN sorted-version item has been clicked THEN 'Restore' button should not be displayed`,
        async () => {
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            // 1. Select the existing not sorted folder, sorted version is not active:
            await studioUtils.findAndSelectItemByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            // 2. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            // 3. Click on 'Sorted' version item :
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 0);
            // 4. Verify that Restore button should not be displayed in the Sorted item:
            await browseVersionsWidget.waitForRestoreButtonNotDisplayed();
        });

    it(`GIVEN sorted folder is selected THEN By Super User  should be displayed in the Versions widget`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let compareContentVersionsDialog = new CompareContentVersionsDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await studioUtils.findAndSelectItemByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowseDetailsPanel.openVersionHistory();
            let numberOfSortedItems = await browseVersionsWidget.countSortedItems();
            assert.equal(numberOfSortedItems, 2, "2 sorted item should be present in the versions widget");
            // 6. Verify that user-name should not be displayed in Sorted version item
            let byUser = await browseVersionsWidget.getUserNameInItemByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 0);
            assert.equal(byUser, 'By Super User', 'user-name should be displayed in Sorted version item');


             await browseVersionsWidget.waitForCompareChangesCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.SORTED,0);
            // 6. Click on 'Compare changes' checkbox in the 'Sorted' item:
            await browseVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 0);
            // 7. lick on 'Compare changes' checkbox in the latest 'Edited' item:
            await browseVersionsWidget.waitForCompareChangesCheckboxDisplayed(appConst.VERSIONS_ITEM_HEADER.SORTED,1);
            await browseVersionsWidget.clickOnCompareChangesCheckboxByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 1);
            // 8. Click on 'Compare Versions' button in the widget:
            await browseVersionsWidget.clickOnShowChangesButton();
            // 9. Verify that the modal dialog is loaded:
            await compareContentVersionsDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('compare_versions_dlg_sorted_1');
            // 5. Verify that 'childOrder' property is displayed in the modal dialog:
            let result = await compareContentVersionsDialog.getChildOrderProperty();
            assert.ok(result.includes(`"modifiedtime DESC"`), `Expected current order should be displayed in the dialog -  'modifiedtime DESC'`);
        });


    // Verify Content grid is not refreshed after content sorting. #10744
    // https://github.com/enonic/app-contentstudio/issues/10744
    it.skip(
        `GIVEN expanded folder is selected AND dialog is opened WHEN the “Display name (A–Z)” option is clicked THEN the new order should be applied`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await studioUtils.findAndSelectItemByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 2. Verify the dialog's title:
            await sortContentDialog.clickOndropDownHandle();
            // Display name (A-Z)
            await sortContentDialog.clickOnSortItemOption(appConst.SORTING_ORDER.DISPLAY_NAME_A_Z);
            await sortContentDialog.waitForSaveButtonEnabled();
            await sortContentDialog.clickOnSaveButton();
            await sortContentDialog.waitForDialogClosed();
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(items[1] === DISPLAY_NAME_A_Z_FIRST_ITEM);
        });

    // Verify Content grid is not refreshed after content sorting. #10744
    // https://github.com/enonic/app-contentstudio/issues/10744
    it.skip(`GIVEN Grid is not filtered AND expanded folder is selected WHEN the “Modified date (Old to new)” option is clicked THEN the new order should be applied in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 2. Verify the dialog's title:
            await sortContentDialog.clickOndropDownHandle();
            // Display name (A-Z)
            await sortContentDialog.clickOnSortItemOption(appConst.SORTING_ORDER.MODIFIED_DATE_OLD_TO_NEW);
            await sortContentDialog.waitForSaveButtonEnabled();
            await sortContentDialog.clickOnSaveButton();
            await sortContentDialog.waitForDialogClosed();
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(items[1] === MODIFIED_DATE_OLD_TO_NEW_FIRST_ITEM);
        });

    it("WHEN two folders in the root  directory have been selected THEN 'Sort' button should be disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select 2 folders:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            await studioUtils.saveScreenshot('sort_button_2_items');
            // 2. Verify that 'Sort' button is disabled:
            await contentBrowsePanel.waitForSortButtonDisabled();
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
