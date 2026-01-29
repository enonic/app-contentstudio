/**
 * Created on 16.07.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const appConst = require('../libs/app_const');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');
const BrowseContextWindow = require('../page_objects/browsepanel/detailspanel/browse.context.window.panel');
const ContentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');

describe('Browse panel, toolbar spec. Check state of buttons on the grid-toolbar after closing a wizard page', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER_NAME;
    let FOLDER
    let CHILD_FOLDER;

    let SITE;
    // verifies https://github.com/enonic/app-contentstudio/issues/645
    // Buttons on toolbar are not correctly updated after closing a content-wizard
    it(`GIVEN existing site is selected AND new child folder has been saved and the wizard closed THEN toolbar-buttons should be in expected state`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            FOLDER_NAME = appConst.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(FOLDER_NAME);
            // opens folder-wizard, types a name and saves it then closes the wizard.
            await studioUtils.doAddFolder(folder);
            //'Publish' button should be displayed on the toolbar after closing a wizard with child content
            await contentBrowsePanel.waitForPublishButtonVisible();
            //'Edit' button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            //'Archive' button should be enabled
            await contentBrowsePanel.waitForDeleteButtonEnabled();
            //'Move' button should be enabled
            await contentBrowsePanel.waitForMoveButtonEnabled();
        });

    it("GIVEN one row is checked WHEN hold down 'Shift' key AND press Arrow down key 3 times THEN 3 content items get checked",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentFilterPanel = new ContentFilterPanel();
            // 1. Open Filter Panel and filter by 'Images' content type:
            await studioUtils.openFilterPanel();
            await contentFilterPanel.clickOnCheckboxInContentTypesBlock(appConst.FILTER_PANEL_AGGREGATION_BLOCK.IMAGE);
            // 2. Click on the first row - highlight the first item
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.BOOK);
            // 3. hold down Shift key and press Arrow down key 3 times:
            await contentBrowsePanel.holdDownShiftAndPressArrowDown(3);
            await studioUtils.saveScreenshot('hold_down_shift_and_click');
            // 4. Verify that 5 content items get checked:
            let numberCheckedRows = await contentBrowsePanel.getNumberOfCheckedRows();
            assert.equal(numberCheckedRows, 3, '3 rows should be checked in Browse Panel');
        });

    // TODO remove the test
    it.skip(`GIVEN existing folder is selected WHEN widget dropdown selector has been clicked THEN expected 4 options should be displayed in the dropdown list`,
        async () => {
            let browseContextWindow = new BrowseContextWindow();
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await browseContextWindow.waitForWidgetSelected(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
            let selectedOption = await browseContextWindow.getSelectedOptionsDisplayName();
            assert.equal(items.length, 1, 'The only one item should be selected in the ListBox');
            assert.equal(selectedOption, appConst.WIDGET_SELECTOR_OPTIONS.DETAILS, "'Details' option item should be selected in the ListBox");

            // 1. Click on the dropdown handler:
            await browseContextWindow.clickOnWidgetSelectorDropdownHandle();
            let actualOptions = await browseContextWindow.getWidgetSelectorDropdownOptions();
            await studioUtils.saveScreenshot('details_panel_widget_options');
            await browseContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.VERSION_HISTORY);
            assert.ok(true);
        });

    ///

    // Verify "Move" action is disabled in the search view #4035
    it(`WHEN a folder has been selected THEN Move button should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await studioUtils.saveScreenshot('content_in_filtered_grid');
            //'Publish' button should be displayed on the toolbar after closing a wizard with child content
            await contentBrowsePanel.waitForMarkAsReadyButtonVisible();
            //'Edit' button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            //'Archive' button should be enabled
            await contentBrowsePanel.waitForDeleteButtonEnabled();
            //'Move' button should be enabled
            await contentBrowsePanel.waitForMoveButtonEnabled();
            await contentBrowsePanel.waitForDuplicateButtonEnabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
        });

    it(`WHEN a folder has been selected THEN 'Preview' button should be disabled and 'Automatic' option should be selected in preview widget`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await studioUtils.saveScreenshot('folder_preview_panel_toolbar');
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget()
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
            let actualSize = await contentItemPreviewPanel.getSelectedOptionInEmulatorDropdown()
            assert.equal(actualSize, appConst.EMULATOR_RESOLUTION_VALUE.FULL_SIZE,
                '100% should be selected in emulator dropdown by default');
        });

    it(`WHEN a folder and 'Enonic rendering' have been selected THEN 'Preview' button should be disabled`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(FOLDER_NAME);
            await studioUtils.saveScreenshot('folder_preview_panel_toolbar');
            await contentItemPreviewPanel.waitForPreviewButtonDisabled();
            let actualOption = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget()
            assert.equal(actualOption, appConst.PREVIEW_WIDGET.AUTOMATIC,
                'Automatic option should be selected in preview widget by default');
        });

    it(`GIVEN existing site is selected WHEN the site (children are not included) has been published THEN 'Publish Tree' button should appear on the toolbar`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            // do publish the site(children are not included)
            await studioUtils.openDialogAndPublishSelectedContent();
            // 'Publish tree' button  gets visible
            await contentBrowsePanel.waitForPublishTreeButtonVisible();
        });

    it(`WHEN no selected content THEN all buttons on the toolbar should be in expected state`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await contentBrowsePanel.waitForNewButtonEnabled();
            await contentBrowsePanel.waitForEditButtonDisabled();
            await contentBrowsePanel.waitForDeleteButtonDisabled();
            await contentBrowsePanel.waitForDuplicateButtonDisabled();
            await contentBrowsePanel.waitForMoveButtonDisabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            await contentBrowsePanel.waitForCreateIssueButtonDisplayed();
            await contentBrowsePanel.waitForHideContextWindowButtonDisplayed();
            // 'Preview' button and Preview Panel Toolbar should not be displayed, because no content is selected
            await contentItemPreviewPanel.waitForToolbarNotDisplayed();
        });

    it(`WHEN an image is selected (not allowing children) THEN 'Sort' and 'New' buttons should be  disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.HAND);
            // 'Edit' button should be enabled
            await contentBrowsePanel.waitForEditButtonEnabled();
            await contentBrowsePanel.waitForSortButtonDisabled();
            // 'New' button should be disabled, because children are not allowed for images.
            await contentBrowsePanel.waitForNewButtonDisabled();
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            // 'Preview' button should be enabled for an image and Media option
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            //  <img> element should be displayed in the iframe
            await contentItemPreviewPanel.waitForImageElementDisplayed();
        });

    it(`GIVEN new folder is added WHEN the folder has been selected THEN 'Sort' buttons should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.waitForEditButtonEnabled();
            // 'Sort' button should be disabled, because this folder is empty!
            await contentBrowsePanel.waitForSortButtonDisabled();
            // 'New' button should be enabled, because children are allowed for folder-content.
            await contentBrowsePanel.waitForNewButtonEnabled();
        });

    it(`GIVEN single folder is selected WHEN a child folder has been added THEN 'Sort' buttons gets enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('child');
            CHILD_FOLDER = contentBuilder.buildFolder(displayName);
            // 1. Select a folder and add a child folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            // 2.  'Sort' button gets enabled, because child folder was added:
            await contentBrowsePanel.waitForSortButtonEnabled();
            await contentBrowsePanel.waitForEditButtonEnabled();
            await contentBrowsePanel.waitForMoveButtonEnabled();
        });

    it(`GIVEN the parent folder is selected WHEN child folder has been deleted THEN 'Sort' buttons should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            // 1. Click on the child folder:
            await contentBrowsePanel.clickOnExpanderIcon(FOLDER.displayName);
            await contentBrowsePanel.clickOnRowByName(CHILD_FOLDER.displayName);
            // 2. delete the child folder:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogClosed();
            await contentBrowsePanel.waitForNotificationMessage();
            // 3. select the parent folder:
            await contentBrowsePanel.clickOnRowByName(FOLDER.displayName);
            // 4. Verify that 'Sort' button should be disabled, because child folder has been deleted:
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
