/**
 * Created on 05.07.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');

describe('sort.dialog.sorticon.spec, sorts a folder(with children) and checks the sort-icon in the grid`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    //verifies https://github.com/enonic/app-contentstudio/issues/608
    //Sort icon menu is not updated after a sorting-type has been changed in modal dialog
    it(`GIVEN existing folder is selected AND 'Sort Content' dialog is opened WHEN 'Manually sorted' menu item has been selected THEN expected icon should appear in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            //1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            await sortContentDialog.clickOnMenuButton();
            //2. 'Manually sorted' menu item has been clicked:
            await sortContentDialog.selectSortMenuItem(appConst.sortMenuItem.MANUALLY_SORTED);
            await studioUtils.saveScreenshot('sort_menu_item_clicked');
            //3. Save the sorting and close the dialog:
            await sortContentDialog.clickOnSaveButton();
            await studioUtils.saveScreenshot('manually_sorted');
            //4. The folder is selected, get sorting-type in grid:
            let sortingType = await contentBrowsePanel.getSortingIcon(appConst.TEST_FOLDER_WITH_IMAGES);
            assert.equal(sortingType, appConst.sortMenuItem.MANUALLY_SORTED,
                "expected icon for Manually sorted folder should appear in grid");
        });

    it.skip(
        `GIVEN existing folder is selected AND 'Sort Content' dialog is opened WHEN 2 items have been swapped THEN Manually sorted icon should be displayed in grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            //1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            await sortContentDialog.pause(2000);
            await sortContentDialog.swapItems("cape", "renault");
            //2. 'Manually sorted' menu item has been clicked:
            await studioUtils.saveScreenshot('sort_dialog_items_swapped');
            //3. Save the sorting and close the dialog:
            await sortContentDialog.clickOnSaveButton();
            await studioUtils.saveScreenshot('manually_sorted');
            //4. The folder is selected, get sorting-type in grid:
            let sortingType = await contentBrowsePanel.getSortingIcon(appConst.TEST_FOLDER_WITH_IMAGES);
            assert.equal(sortingType, appConst.sortMenuItem.MANUALLY_SORTED, "expected icon for Manually sorted folder should appear");
        });

    it(`GIVEN existing folder is selected AND 'Published date' order has been set in modal dialog WHEN sort dialog is reopened THEN expected order should be present in the selected option`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.pause(1000);
            //1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            //2. Expand the menu:
            await sortContentDialog.clickOnMenuButton();
            //3. 'Published date' sorted menu item has been clicked
            await sortContentDialog.selectSortMenuItem(appConst.sortMenuItem.PUBLISHED_DATE, 'ascending');
            await sortContentDialog.clickOnSaveButton();
            await contentBrowsePanel.pause(1000);
            //4. reopen sort dialog:
            await contentBrowsePanel.clickOnSortButton();
            let sortingType = await sortContentDialog.getSelectedOrder();
            let expected = appConst.sortOrderTitle(appConst.sortMenuItem.PUBLISHED_DATE, 'ascending');
            assert.equal(sortingType, expected, "expected sorting order should be present on the dialog");
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
