/**
 * Created on 05.07.2019.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../libs/studio.utils.js');


describe('Browse panel, sort icon spec - checks sort-icon in the grid`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    //verifies https://github.com/enonic/app-contentstudio/issues/608
    //Sort icon menu is not updated after a sorting-type has been changed in modal dialog
    it(`GIVEN existing folder is selected  AND 'Sort Content' dialog is opened WHEN 'Manually sorted' menu item has been selected THEN expected icon should appear in the grid`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            return contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES).then(() => {
                return contentBrowsePanel.clickOnSortButton();
            }).then(() => {
                return sortContentDialog.clickOnMenuButton();
            }).then(() => {
                //Manually sorted menu item has been clicked
                return sortContentDialog.selectSortMenuItem(appConstant.sortMenuItem.MANUALLY_SORTED);
            }).then(() => {
                studioUtils.saveScreenshot('sort_menu_item_clicked');
                return sortContentDialog.clickOnSaveButton();
            }).then(() => {
                studioUtils.saveScreenshot('manually_sorted');
                return contentBrowsePanel.getSortingIcon(appConstant.TEST_FOLDER_WITH_IMAGES)
            }).then(result => {
                assert.equal(result, appConstant.sortMenuItem.MANUALLY_SORTED, "expected icon for Manually sorted folder should appear");
            })
        });

    it(`GIVEN existing folder is selected AND 'Published date' order has been set in modal dialog WHEN sort dialog is re-opened THEN expected order should be present in the selected option`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            return contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES).then(() => {
                return contentBrowsePanel.clickOnSortButton();
            }).then(() => {
                return sortContentDialog.clickOnMenuButton();
            }).then(() => {
                //'Published date' sorted menu item has been clicked
                return sortContentDialog.selectSortMenuItem(appConstant.sortMenuItem.PUBLISHED_DATE, 'ascending');
            }).then(() => {
                return sortContentDialog.clickOnSaveButton();
            }).then(() => {
                return contentBrowsePanel.pause(1000);
            }).then(() => {
                //re-open sort dialog
                return contentBrowsePanel.clickOnSortButton();
            }).then(() => {
                return sortContentDialog.getSelectedOrder();
            }).then(result => {
                let expected = appConstant.sortOrderTitle(appConstant.sortMenuItem.PUBLISHED_DATE, 'ascending');
                assert.equal(result, expected, "expected sorting order should be present on the dialog");
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});