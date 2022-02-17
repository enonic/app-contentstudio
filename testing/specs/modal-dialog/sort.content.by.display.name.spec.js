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

describe('sort.content.by.display.name.spec, tests for ascending/descending order', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

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

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
