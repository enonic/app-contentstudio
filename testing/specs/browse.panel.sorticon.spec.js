/**
 * Created on 05.07.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../libs/studio.utils.js');

describe('browse.panel.sorticon.spec, do sort a folder and check a sort-icon in the grid`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    //verifies https://github.com/enonic/app-contentstudio/issues/608
    //Sort icon menu is not updated after a sorting-type has been changed in modal dialog
    it(`GIVEN existing folder is selected AND 'Sort Content' dialog is opened WHEN 'Manually sorted' menu item has been selected THEN expected icon should appear in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible(appConstant.mediumTimeout);
            //1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.clickOnMenuButton();
            //2. 'Manually sorted' menu item has been clicked:
            await sortContentDialog.selectSortMenuItem(appConstant.sortMenuItem.MANUALLY_SORTED);
            studioUtils.saveScreenshot('sort_menu_item_clicked');
            //3. Save the sorting and close the dialog:
            await sortContentDialog.clickOnSaveButton();
            studioUtils.saveScreenshot('manually_sorted');
            //4. The folder is selected, get sorting-type in grid:
            let sortingType = await contentBrowsePanel.getSortingIcon(appConstant.TEST_FOLDER_WITH_IMAGES);
            assert.equal(sortingType, appConstant.sortMenuItem.MANUALLY_SORTED, "expected icon for Manually sorted folder should appear");
        });

    it(`GIVEN existing folder is selected AND 'Published date' order has been set in modal dialog WHEN sort dialog is reopened THEN expected order should be present in the selected option`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            //1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            //2. Expand the menu:
            await sortContentDialog.clickOnMenuButton();
            //3. 'Published date' sorted menu item has been clicked
            await sortContentDialog.selectSortMenuItem(appConstant.sortMenuItem.PUBLISHED_DATE, 'ascending');
            await sortContentDialog.clickOnSaveButton();
            await contentBrowsePanel.pause(1000);
            //4. reopen sort dialog:
            await contentBrowsePanel.clickOnSortButton();
            let sortingType = await sortContentDialog.getSelectedOrder();
            let expected = appConstant.sortOrderTitle(appConstant.sortMenuItem.PUBLISHED_DATE, 'ascending');
            assert.equal(sortingType, expected, "expected sorting order should be present on the dialog");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
