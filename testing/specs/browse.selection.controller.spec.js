/**
 * Created on 15.05.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');
const appConst = require('../libs/app_const');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('Browse panel selection controller spec. Tests for Selection Controller checkBox and Show/Hide selection toggler', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    // Verifies https://github.com/enonic/lib-admin-ui/issues/1790
    // Selection checkboxes are not working in the Show Selection mode
    it("GIVEN two items have been checked AND switched to Show Selection mode WHEN one item has been unchecked THEN one item remains visible in the filtered grid",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Click on checkboxes and select 2 folders:
            await studioUtils.typeNameInFilterPanel(appConst.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_NAME);
            await studioUtils.typeNameInFilterPanel(appConst.TEST_FOLDER_2_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_2_NAME);
            // 2. Click on 'Selection Toggle' (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(500);
            // 3. Verify that 2 items are displayed in the filtered grid:
            let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(displayNames.length, 2, '2 items should be present in the filtered grid');
            let result = await contentBrowsePanel.isSelectionControllerSelected();
            assert.ok(result, 'Selection Controller checkBox should be selected');
            // 4. Verify that checkboxes are clickable: Unselect one item in the filtered grid:
            await contentBrowsePanel.clickOnCheckboxByName(appConst.TEST_FOLDER_2_NAME);
            await contentBrowsePanel.pause(500);
            await studioUtils.saveScreenshot('filtered_grid_one_item_unselected');
            // 5. Verify that only one item remains visible in the filtered grid now:
            displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(displayNames.length, 1, 'Only one item should be present in the filtered grid');
        });

    // Verifies: https://github.com/enonic/lib-admin-ui/issues/1266 Incorrect behavior of 'Show selection' when a single content is highlighted
    //          https://github.com/enonic/lib-admin-ui/issues/1201 Selection filter doesn't work when an item is highlighted in the Content Grid #1201
    it("GIVEN existing folder is highlighted WHEN highlighted row has been checked AND 'Show Selection' clicked THEN 'Selection Controller' checkbox gets selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Click on the row :
            await contentBrowsePanel.clickOnRowByName(appConst.TEST_FOLDER_NAME);
            //2. Click on checkbox in the highlighted row:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_NAME);
            //3. Click on Selection Toggle (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            await studioUtils.saveScreenshot('highlighted_row_checked_show_selection_clicked');
            //4. Verify that the grid is filtered:
            let displayNames = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(displayNames.length, 1, 'Only one item should be present in the filtered grid');
            let result = await contentBrowsePanel.isSelectionControllerSelected();
            assert.ok(result, 'Selection Controller checkBox should be selected');
        });

    it("GIVEN Selection Controller checkbox is selected (All items are checked) WHEN Selection Controller checkbox has been unselected THEN 'Preview' button should be disabled AND 'New' is enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. 'Selection Controller' checkbox is selected (All items are checked):
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            // 2. 'Selection Controller' checkbox has been unselected:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await contentBrowsePanel.pause(1000);
            // 3. Verify that  Edit  and Archive buttons are disabled:
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForArchiveButtonDisabled();
            // 4. New... button should be enabled
            await contentBrowsePanel.waitForNewButtonEnabled();
            // 5. Verify that 'Preview Panel'  toolbar should not be displayed:
            await contentItemPreviewPanel.waitForPreviewToolbarNotDisplayed();
        });

    it("GIVEN 2 selected images in filtered grid WHEN Selection Toggle(Show Selection) has been clicked THEN 'Selection Controller' checkbox gets selected",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.openFilterPanel();
            // 1. Click on 'Image' checkbox in Filter Panel:
            await contentFilterPanel.clickOnCheckboxInContentTypesBlock('Image');
            // 2. Select 2 images:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.BOOK);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            // "Selection Controller checkbox shows that the selection is partial"
            await contentBrowsePanel.waitForSelectionControllerPartial();
            // 3. Click on Selection Toggle (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            // 4. Verify 'Selection Controller' checkBox is selected:
            await studioUtils.saveScreenshot('selection_toggle_clicked_checkbox_selected');
            let result = await contentBrowsePanel.isSelectionControllerSelected();
            assert.ok(result, "'Selection Controller' checkBox should be selected");
            // 5. Verify that two items should be present in the filtered grid;
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(items.length, 2, 'Two items should be in the filtered grid');
            // 6. Number 2  should be displayed in the selection toggle circle:
            let number = await contentBrowsePanel.getNumberInSelectionToggler();
            assert.equal(number, '2', '2 should be displayed in the circle');
        });

    it("WHEN 'Show Selection' and 'Hide Selection' sequentially clicked in filtered grid THEN 'Selection Controller' checkbox gets partial AND initial state of the grid is restored",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.openFilterPanel();
            // 1. Click on 'Image' checkbox in Filter Panel:
            await contentFilterPanel.clickOnCheckboxInContentTypesBlock('Image');
            // 2. Select 2 images:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.BOOK);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            // 3. Click on Selection Toggle (circle, Show Selection),grid gets filtered:
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            // 4. Click on Selection Toggle (circle, Hide Selection), initial state of thr grid is restored:
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(500);
            await studioUtils.saveScreenshot('selection_toggle_checkbox_partial');
            // 5. Verify 'Selection Controller' checkBox shows that the selection is partial:
            await contentBrowsePanel.waitForSelectionControllerPartial();
        });

    // Verifies https://github.com/enonic/lib-admin-ui/issues/1287
    // selecting/deselecting hidden or collapsed nodes spawns error
    it("GIVEN 'Show Selection' and 'Hide Selection' sequentially clicked in filtered grid WHEN 'Selection Controller' checkbox has been clicked THEN the checkbox gets unselected",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.openFilterPanel();
            // 1. Click on 'Image' checkbox in Filter Panel:
            await contentFilterPanel.clickOnCheckboxInContentTypesBlock('Image');
            // 2. Select 2 images:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.BOOK);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            // 3. Click on Selection Toggle (circle, Show Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await contentBrowsePanel.pause(1000);
            // 4. Verify that only 2 images are present in  the grid
            let result1 = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result1.length, 2, 'Two items should be present in the grid');
            // 5. Click on 'Selection Toggle' (circle, Hide Selection):
            await contentBrowsePanel.clickOnSelectionToggler();
            await studioUtils.saveScreenshot('selection_toggle_hide_selection');
            // 6. Click on 'Selection Controller' checkbox:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await contentBrowsePanel.pause(1000);
            // 7. Verify that initial grid is loaded:
            await studioUtils.saveScreenshot('selection_toggle_initial_grid_restored');
            let result2 = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(result2.length > result1.length);
            // 8. Verify that Selection Controller checkBox gets unselected:
            let isSelected = await contentBrowsePanel.isSelectionControllerSelected();
            assert.ok(isSelected === false, "'Selection Controller' checkbox should be unselected");
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
