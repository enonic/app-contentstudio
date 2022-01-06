/**
 * Created on 28.05.2018.
 *
 */
const chai = require('chai');
const expect = require('chai').expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');

describe('Browse panel selections spec', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it("GIVEN folder with children is checked WHEN 'Arrow Right'/Arrow Left key has been pressed THEN the folder gets expanded/collapsed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1000);
            await studioUtils.typeNameInFilterPanel(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            //1. Click on the checkbox:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot("before_arrow_right");
            let isExpanded = await contentBrowsePanel.isContentExpanded(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.isFalse(isExpanded, "The folder should be collapsed");
            //2. Press the 'Arrow Right' key
            await contentBrowsePanel.pressArrowRight();
            await studioUtils.saveScreenshot("after_arrow_right");
            //3. Verify that the  folder gets expanded:
            isExpanded = await contentBrowsePanel.isContentExpanded(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.isTrue(isExpanded, "The folder gets expanded");
            //4. Press the 'Arrow Left' key:
            await contentBrowsePanel.pressArrowLeft();
            await studioUtils.saveScreenshot("after_arrow_left");
            //5. Verify that the  folder gets collapsed:
            isExpanded = await contentBrowsePanel.isContentExpanded(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.isFalse(isExpanded, "The folder gets collapsed");
        });

    it("GIVEN one row is highlighted WHEN 'Arrow Down' key has been pressed THEN the next row should be highlighted",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the row(row gets highlighted)
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await studioUtils.saveScreenshot("before_arrow_down");
            await contentBrowsePanel.pause(1000);
            let displayName1 = await contentBrowsePanel.getNameInHighlightedRow();
            //2. Press the 'Arrow Down' key
            await contentBrowsePanel.pressArrowDown();
            await studioUtils.saveScreenshot("after_arrow_down");
            //3. Verify that the next content is highlighted:
            let displayName2 = await contentBrowsePanel.getNameInHighlightedRow();
            expect(displayName1).not.equal(displayName2);
        });

    it("GIVEN one checkbox has been clicked in the grid WHEN 'white space' key has been pressed THEN the row gets unselected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the checkbox and select the row
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot("before_white_space");
            await contentBrowsePanel.pause(1000);
            //2. Verify that only one row is selected:
            let number1 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number1, 1, "One row should be selected");

            //3. Click on 'white space' key:
            await contentBrowsePanel.pressWhiteSpace();
            await studioUtils.saveScreenshot("after_white_space");
            //2. Verify that no selected rows now: (the row gets unselected)
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 0, "There should be no selected rows");
        });

    it("GIVEN existing content is selected WHEN 'Refresh' button in the grid toolbar has been clicked THEN the row remains selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the checkbox and select the row
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot("before_refresh");
            await contentBrowsePanel.pause(1000);
            //2. Click on Refresh button on the grid toolbar:
            await contentBrowsePanel.clickOnRefreshButton();
            await studioUtils.saveScreenshot("after_refresh");
            //3. Verify that the row remains selected:
            let number = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number, 1, "One row should be selected");
        });

    it("GIVEN one checkbox has been clicked in the grid WHEN 'Selection Controller' checkbox has been clicked THEN the row gets unselected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the checkbox and select the row
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConstant.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot("before_sel_controller");
            await contentBrowsePanel.pause(1000);
            //2. Verify that only one row is selected:
            let number1 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number1, 1, "One row should be selected");
            //3. Click on 'Selection Controller' checkbox:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await studioUtils.saveScreenshot("after_sel_controller");
            //2. Verify that no selected rows now: (the row gets unselected)
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 0, "There should be no selected rows");
        });

    it("GIVEN a content is highlighted WHEN the content unhighlighted THEN grid toolbar returns to the initial state",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(2000);
            //1. The folder is highlighted:
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            await studioUtils.saveScreenshot("folder_highlighted_1");
            //2. Click on the row again
            await contentBrowsePanel.clickOnRowByDisplayName(appConstant.TEST_FOLDER_WITH_IMAGES);
            //3. Verify that grid toolbar returns to the initial state
            await contentBrowsePanel.waitForNewButtonEnabled();
            await contentBrowsePanel.waitForArchiveButtonDisabled();
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
            await contentBrowsePanel.waitForPreviewButtonDisabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            await contentBrowsePanel.waitForMoveButtonDisabled();
            await contentBrowsePanel.waitForEditButtonDisabled();
        });

    it("WHEN 'Selection Controller' has been checked THEN 'New' button should be disabled and 'Archive', 'Duplicate' are enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(2000);
            //1. Click on Selection Controller checkbox:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await studioUtils.saveScreenshot("all_selected");
            //2. Verify that New button is disabled and Archive, Duplicate are enabled:
            await contentBrowsePanel.waitForNewButtonDisabled();
            await contentBrowsePanel.waitForArchiveButtonEnabled();
            await contentBrowsePanel.waitForDuplicateButtonEnabled();
        });

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
