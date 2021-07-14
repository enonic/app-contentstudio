/**
 * Created on 28.05.2018.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');

describe('Browse panel selections spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it("WHEN one row with content has been clicked THEN the row gets highlighted AND 'Selection Toggler' should not be visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. click on existing folder(the row gets highlighted):
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.pause(900);
            await studioUtils.saveScreenshot('row_clicked_1');
            let actualName = await contentBrowsePanel.getNameInHighlightedRow();
            //2. expected content should be highlighted:
            assert.equal(actualName, appConstant.TEST_FOLDER_WITH_IMAGES, "expected content should be highlighted");
            let number = await contentBrowsePanel.getNumberOfSelectedRows();
            assert.equal(number, 1, "One row should be highlighted");
            //3. But there are no any checked rows:
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 0, "the number of checked rows is 0");
            let isVisible = await contentBrowsePanel.waitForSelectionTogglerVisible();
            assert.isFalse(isVisible, "'Selection Toggler' should not be visible on the toolbar");
        });

    it("WHEN one row with content has been checked THEN the row gets checked AND 'Selection Toggler' gets visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1500);
            //1. Click on the checkbox and select the row:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            let number1 = await contentBrowsePanel.getNumberOfSelectedRows();
            await studioUtils.saveScreenshot('one_row_checked');
            assert.equal(number1, 0, "no one row should be highlighted");
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.isTrue(number2 === 1, "One row should be checked");
            let isVisible = await contentBrowsePanel.waitForSelectionTogglerVisible();
            assert.isTrue(isVisible, "Selection Toggler should appear in the toolbar");
        });

    it("GIVEN one row is checked WHEN one more row has been checked THEN 2 rows should be checked AND 0 rows should be highlighted",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on two checkboxes:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConstant.TEST_FOLDER_2_DISPLAY_NAME);
            await contentBrowsePanel.pause(500);
            let number = await contentBrowsePanel.getNumberOfSelectedRows();
            await studioUtils.saveScreenshot('two_rows_checked');
            assert.equal(number, 0, "the number of highlighted rows should be 0");
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 2, "Two rows should be checked");
        });

    it("GIVEN one row is highlighted WHEN the row has been clicked THEN the row gets unselected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the row(row gets highlighted)
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.pause(1000);
            //2. Click on the row again:
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.pause(1000);
            let numberOfHighlighted = await contentBrowsePanel.getNumberOfSelectedRows();
            await studioUtils.saveScreenshot('check_row_unselected');
            assert.equal(numberOfHighlighted, 0, "number of highlighted rows should be 0");
            let numberOfChecked = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(numberOfChecked, 0, "number of checked rows should be 0");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
