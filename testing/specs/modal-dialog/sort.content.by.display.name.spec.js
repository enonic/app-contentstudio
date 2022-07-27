/**
 * Created on 16.02.2022
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

describe('sort.content.by.display.name.spec, tests for ascending/descending order', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN 'Sort Content' dialog is opened WHEN 'Display name' menu item has been clicked THEN the sort order should be updated`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            //1. Select the existing folder with children and open Sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            //2. Expand the sort menu
            await sortContentDialog.clickOnMenuButton();
            //3. 'Display name-ascending' menu item has been clicked:
            await sortContentDialog.doSort("Display name", appConst.SORT_ORDER.ASCENDING);
            await studioUtils.saveScreenshot("display_name_ascending");
            let result = await sortContentDialog.getContentName();
            assert.isTrue(result[0] === "book", "Ascending Order should be in the dialog's grid");

            await sortContentDialog.clickOnMenuButton();
            //4. 'Display name-descending' menu item has been clicked:
            await sortContentDialog.doSort("Display name", appConst.SORT_ORDER.DESCENDING);
            await studioUtils.saveScreenshot("display_name_descending");
            //5. Verify that the order is descending:
            result = await sortContentDialog.getContentName();
            assert.isTrue(result[0] === "whale", "Descending Order should be in the dialog's grid");
        });

    it(`GIVEN existing sorted folder is selected WHEN 'Versions Widget' has been opened THEN the 'Sorted' version item should appears in the widget`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentBrowseDetailsPanel = new ContentBrowseDetailsPanel();
            let browseVersionsWidget = new BrowseVersionsWidget();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            //1. Select the existing sorted folder:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            //3. open Versions Panel
            await contentBrowseDetailsPanel.openVersionHistory();
            //4. Verify that 'Sorted' version item is present in the versions widget:
            await browseVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.SORTED, 0);
            //5. Revert button is displayed in the expanded sorted-item:
            await browseVersionsWidget.waitForRevertButtonDisplayed();
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
