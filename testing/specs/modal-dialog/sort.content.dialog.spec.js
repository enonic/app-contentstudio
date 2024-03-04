/**
 * Created on 04.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../../libs/studio.utils.js');

describe('sort.dialog.spec, tests for sort content dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const DIALOG_TITLE = 'Sort items';

    it(`GIVEN sort dialog is opened WHEN 'Cancel' button has been clicked THEN the modal dialog should be closed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let sortContentDialog = new SortContentDialog();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select the folder with children an open sort-dialog:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnSortButton();
            await sortContentDialog.waitForDialogVisible();
            // 2. Verify the dialog's title:
            let title = await sortContentDialog.getDialogTitle();
            assert.equal(title, DIALOG_TITLE, "Expected title should be displayed");
            // 3. Verify that 'Save' button is disabled:
            await sortContentDialog.waitForSaveButtonDisabled();
            // 4.Click on 'Cancel' button
            await sortContentDialog.clickOnCancelButton();
            await sortContentDialog.waitForDialogClosed();
        });

    it("GIVEN 'Sort' dialog is opened WHEN dropdown handle button has been clicked THEN five menu items get visible",
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
            await studioUtils.saveScreenshot("sort_dlg_menu_items");
            // 3. Verify the menu items in dropdown selector:
            let items = await sortContentDialog.getMenuItems();
            assert.equal(items.length, 5, "Five options should be present in the selector");
            // 4. Click on the dropdown handle and close the selector:
            await sortContentDialog.clickOndropDownHandle();
            // 5. Press 'ESC' key:
            await sortContentDialog.pressEscKey();
            // 6. Verify that the modal dialog is closed:
            await sortContentDialog.waitForDialogClosed();
        });

    it("WHEN two folders in Root have been selected THEN 'Sort' button should be disabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.waitForSpinnerNotVisible();
            // 1. Select 2 folders:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            await studioUtils.saveScreenshot("sort_button_2_items");
            // 2. Verify that 'Sort' button is disabled:
            await contentBrowsePanel.waitForSortButtonDisabled();
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
