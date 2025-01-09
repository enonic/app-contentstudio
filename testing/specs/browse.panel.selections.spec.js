/**
 * Created on 28.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const appConst = require('../libs/app_const');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('browse.panel.selections.spec - tests for selection items in Browse Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const BROWSE_TOOLBAR_ROLE = 'toolbar';
    const CONTENT_APP_BAR_ROLE_BANNER = 'banner';

    // Verify Accessibility attributes in Browse Panel(toolbar role, aria-label):
    it("WHEN browse panel is loaded THEN role and aria-label attributes should be set correctly",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Verify that <html> element has lang="en" attribute:
            await contentBrowsePanel.waitForLangAttribute('en');
            // 2. Verify that Browse-Toolbar is a div with role="toolbar".
            await contentBrowsePanel.waitForBrowseToolbarRoleAttribute(BROWSE_TOOLBAR_ROLE);
            // 3. Verify that Browse-Toolbar is a div with expected 'aria-label' attribute
            await contentBrowsePanel.waitForBrowseToolbarAriaLabelAttribute();
            // 4. Verify that ContentAppBar is a div with role="banner".
            await contentBrowsePanel.waitForContentAppBarRoleAttribute(CONTENT_APP_BAR_ROLE_BANNER);
            // 5. Verify aria-label attribute for ContentAppBar :
            await contentBrowsePanel.waitForContentAppBarAriaLabelAttribute();
            // 6. Verify that 'Project Viewer' has aria-haspopup attribute set to 'dialog':
            await contentBrowsePanel.waitForProjectViewerAriaHasPopupAttribute('dialog');
            // 7. ProjectViewer button has the attribute: role=button
            await contentBrowsePanel.waitForProjectViewerRoleAttribute('button');
            // 8. Verify that 'Show Issues' button has aria-haspopup attribute set to 'dialog':
            await contentBrowsePanel.waitForShowIssuesButtonAriaHasPopupAttribute('dialog');
            // 9. Verify the accessibility attribute 'presentation'
            await contentBrowsePanel.waitForPublishMenuRoleAttribute('presentation');
        });

    it("GIVEN unnamed content are selected WHEN the content hav been deleted THEN modal dialog should be closed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            await studioUtils.typeNameInFilterPanel('unnamed');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            if (result.length <= 1) {
                return;
            }
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await confirmValueDialog.waitForDialogOpened();
            let number = await confirmValueDialog.getSuggestedNumberToDelete();
            await confirmValueDialog.typeNumberOrName(number);
            await confirmValueDialog.clickOnConfirmButton();
            await confirmValueDialog.waitForDialogClosed();
        });

    it("GIVEN folder with child items is checked WHEN 'Arrow Right'/Arrow Left key has been pressed THEN the folder gets expanded/collapsed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1000);
            await studioUtils.typeNameInFilterPanel(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            // 1. Click on the checkbox:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot('before_arrow_right');
            let isExpanded = await contentBrowsePanel.isContentExpanded(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.ok(isExpanded === false, "The folder should be collapsed");
            // 2. Press the 'Arrow Right' key
            await contentBrowsePanel.pressArrowRight();
            await studioUtils.saveScreenshot('after_arrow_right');
            // 3. Verify that the  folder gets expanded:
            isExpanded = await contentBrowsePanel.isContentExpanded(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.ok(isExpanded === true, 'The folder gets expanded');
            // 4. Press the 'Arrow Left' key:
            await contentBrowsePanel.pressArrowLeft();
            await studioUtils.saveScreenshot('after_arrow_left');
            // 5. Verify that the  folder gets collapsed:
            isExpanded = await contentBrowsePanel.isContentExpanded(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.ok(isExpanded === false, 'The folder gets collapsed');
        });

    it("GIVEN one row is highlighted WHEN 'Arrow Down' key has been pressed THEN the next row should be highlighted",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1500);
            // 1. Click on the row(row gets highlighted)
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await studioUtils.saveScreenshot('before_arrow_down');
            await contentBrowsePanel.pause(1000);
            let displayName1 = await contentBrowsePanel.getNameInHighlightedRow();
            // 2. Press the 'Arrow Down' key
            await contentBrowsePanel.pressArrowDown();
            await studioUtils.saveScreenshot('after_arrow_down');
            // 3. Verify that the next content is highlighted:
            let displayName2 = await contentBrowsePanel.getNameInHighlightedRow();
            assert.notEqual(displayName1, displayName2, "Highlighted item should be updated");
        });

    it("GIVEN one checkbox has been clicked in the grid WHEN 'white space' key has been pressed THEN the row gets unselected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Click on the checkbox and select the row
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot('before_white_space');
            await contentBrowsePanel.pause(1000);
            // 2. Verify that only one row is selected:
            let number1 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number1, 1, 'One row should be selected');
            // 3. Click on 'white space' key:
            await contentBrowsePanel.pressWhiteSpace();
            await studioUtils.saveScreenshot('after_white_space');
            // 2. Verify that no selected rows now: (the row gets unselected)
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 0, "expected - no selected rows in grid");
        });

    it("GIVEN existing content is selected WHEN 'Refresh' button in the grid toolbar has been clicked THEN the row remains selected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(2000);
            // 1. Click on the checkbox and select the row
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot('before_refresh');
            await contentBrowsePanel.pause(1000);
            // 2. Click on Refresh button on the grid toolbar:
            await contentBrowsePanel.clickOnRefreshButton();
            await studioUtils.saveScreenshot('after_refresh');
            // 3. Verify that the row remains selected:
            let number = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number, 1, 'One row should be selected');
        });

    it("GIVEN one checkbox has been clicked in the grid WHEN 'Selection Controller' checkbox has been clicked THEN the row gets unselected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(2000);
            // 1. Click on the checkbox and select the row
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await studioUtils.saveScreenshot('before_sel_controller');
            await contentBrowsePanel.pause(1000);
            // 2. Verify that only one row is selected:
            let number1 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number1, 1, 'One row should be selected');
            // 3. Click on 'Selection Controller' checkbox:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await studioUtils.saveScreenshot('after_sel_controller');
            // 4. Verify that no selected rows now: (the row gets unselected)
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 0, 'There should be no selected rows');
            // 5. Verify that Selection toggle(circle) gets not visible:
            await contentBrowsePanel.waitForSelectionTogglerNotVisible();
        });

    it("GIVEN a content is highlighted WHEN the content unhighlighted THEN grid toolbar returns to the initial state",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await contentBrowsePanel.pause(2000);
            // 1. The folder is highlighted:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await studioUtils.saveScreenshot('folder_highlighted_1');
            // 2. Click on the row again
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            // 3. Verify that grid toolbar returns to the initial state
            await contentBrowsePanel.waitForNewButtonEnabled();
            await contentBrowsePanel.waitForArchiveButtonDisabled();
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
            // PreviewPanel toolbar gets not visible!
            await contentItemPreviewPanel.waitForPreviewToolbarNotDisplayed();
            await contentBrowsePanel.waitForSortButtonDisabled();
            await contentBrowsePanel.waitForMoveButtonDisabled();
            await contentBrowsePanel.waitForEditButtonDisabled();
        });

    it("WHEN 'Selection Controller' checkbox has been clicked THEN 'New' button should be disabled and 'Archive', 'Duplicate' are enabled",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(2000);
            // 1. Click on Selection Controller checkbox:
            await contentBrowsePanel.clickOnSelectionControllerCheckbox();
            await studioUtils.saveScreenshot('all_grid_items_selected');
            // 2. Verify that New button is disabled and Archive, Duplicate are enabled:
            await contentBrowsePanel.waitForNewButtonDisabled();
            await contentBrowsePanel.waitForArchiveButtonEnabled();
            await contentBrowsePanel.waitForDuplicateButtonEnabled();
        });

    it("WHEN one row with content has been clicked THEN the row gets highlighted AND 'Selection Toggler' should not be visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1500);
            // 1. click on existing folder(the row gets highlighted):
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.pause(700);
            await studioUtils.saveScreenshot('row_clicked_1');
            let actualName = await contentBrowsePanel.getNameInHighlightedRow();
            // 2. expected content should be highlighted:
            assert.equal(actualName, appConst.TEST_FOLDER_WITH_IMAGES, "expected content should be highlighted");
            let number = await contentBrowsePanel.getNumberOfSelectedRows();
            assert.equal(number, 1, "One row should be highlighted");
            // 3. But there are no any checked rows:
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 0, "the number of checked rows is 0");
            let isVisible = await contentBrowsePanel.waitForSelectionTogglerVisible();
            assert.ok(isVisible === false, "'Selection Toggler' should not be visible in the toolbar");
        });

    it("WHEN one row with content has been checked THEN the row gets checked AND 'Selection Toggler' gets visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1500);
            // 1. Click on the checkbox and select the row:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            let number1 = await contentBrowsePanel.getNumberOfSelectedRows();
            await studioUtils.saveScreenshot('one_row_checked');
            assert.equal(number1, 0, "no one row should be highlighted");
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.ok(number2 === 1, "One row should be checked");
            let isVisible = await contentBrowsePanel.waitForSelectionTogglerVisible();
            assert.ok(isVisible, "Selection Toggle should appear in the toolbar");
        });

    it("GIVEN one row is checked WHEN one more row has been checked THEN 2 rows should be checked AND 0 rows should be highlighted",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1500);
            // 1. Click on two checkboxes:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES_2);
            await contentBrowsePanel.pause(500);
            let number = await contentBrowsePanel.getNumberOfSelectedRows();
            await studioUtils.saveScreenshot('two_rows_checked');
            assert.equal(number, 0, 'the number of highlighted rows should be 0');
            let number2 = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(number2, 2, 'Two rows should be checked');
        });

    it("GIVEN one row is highlighted WHEN the row has been clicked THEN the row gets unselected",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.pause(1500);
            // 1. Click on the row(row gets highlighted)
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.pause(700);
            // 2. Click on the row again:
            await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.pause(1000);
            let numberOfHighlighted = await contentBrowsePanel.getNumberOfSelectedRows();
            await studioUtils.saveScreenshot('check_row_unselected');
            assert.equal(numberOfHighlighted, 0, 'number of highlighted rows should be 0');
            let numberOfChecked = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(numberOfChecked, 0, "number of checked rows should be 0");
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
