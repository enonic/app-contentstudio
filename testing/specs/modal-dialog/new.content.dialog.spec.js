/**
 * Created on 08.09.2021 updated on 17.10.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('new.content.dialog.spec: tests for New Content modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const DIALOG_TITLE = 'Create content in location:';
    const ROOT_PATH = '/';
    const FILTER_HINT = 'Start typing to filter the list';
    const UPLOAD_HINT = 'Click here or drop files to upload';
    const NOT_FOUND_MESSAGE = 'No content types found';
    const BASE_CONTENT_TYPES = ['Folder', 'Shortcut', 'Site'];

    it(`GIVEN no selections in the grid WHEN 'New Content Dialog' is opened THEN the header, the tabs and the footer hint should be displayed`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await studioUtils.saveScreenshot('new_content_dialog_elements');
        // 2. Verify the title and the path of the parent:
        let title = await newContentDialog.getHeaderText();
        assert.equal(title, DIALOG_TITLE, `'${DIALOG_TITLE}' should be displayed in the header`);
        let path = await newContentDialog.getDialogPathText();
        assert.equal(path, ROOT_PATH, 'Root path should be displayed in the header');
        // 3. Verify that Close button is displayed:
        await newContentDialog.waitForCloseButtonDisplayed();
        // 4. Verify that all three tabs are displayed and enabled:
        assert.ok(
            await newContentDialog.isElementDisplayed(newContentDialog.allButton),
            "'All' tab should be displayed",
        );
        assert.ok(
            await newContentDialog.isElementDisplayed(newContentDialog.suggestedButton),
            "'Suggested' tab should be displayed",
        );
        await newContentDialog.waitForMediaTabButtonEnabled();
        // 5. 'All' tab should be selected by default:
        await newContentDialog.waitForTabSelected('All');
        await newContentDialog.waitForAllTabDisplayed();
        // 6. Verify the footer hint:
        let hint = await newContentDialog.getFooterHintText();
        assert.equal(hint, FILTER_HINT, `'${FILTER_HINT}' should be displayed in the footer`);
        // 7. The search input is hidden until the first character is typed:
        await newContentDialog.waitForSearchInputNotDisplayed();
    });

    it(`GIVEN no selections in the grid WHEN 'New Content Dialog' is opened THEN expected content types should be displayed in 'All' tab`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        // 2. Verify the items in 'All' tab:
        let items = await newContentDialog.getItemsInAllTab();
        assert.equal(items.length, BASE_CONTENT_TYPES.length, 'Three content types should be displayed in the root');
        BASE_CONTENT_TYPES.forEach((type) => assert.ok(items.includes(type), `'${type}' type should be displayed`));
    });

    it(`GIVEN a folder is selected WHEN 'New Content Dialog' is opened THEN the path of the selected folder should be displayed in the header`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Select the existing folder:
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        // 2. Open New Content dialog:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await studioUtils.saveScreenshot('new_content_dialog_parent_path');
        // 3. Verify that the path of the selected folder is displayed in the header:
        let path = await newContentDialog.getDialogPathText();
        assert.equal(
            path,
            `/${appConst.TEST_FOLDER_NAME}/`,
            'Path of the selected folder should be displayed in the header',
        );
    });

    it(`GIVEN 'New Content Dialog' is opened WHEN 'Suggested' tab has been clicked THEN the tab should be selected AND the footer hint remains displayed`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        // 2. Click on 'Suggested' tab:
        await newContentDialog.clickOnSuggestedButton();
        await studioUtils.saveScreenshot('new_content_dialog_suggested_tab');
        // 3. Verify that the tab is selected and its panel is displayed:
        await newContentDialog.waitForTabSelected('Suggested');
        await newContentDialog.waitForSuggestedTabDisplayed();
        // 4. 'All' tab panel should not be displayed:
        await newContentDialog.waitForAllTabNotDisplayed();
        // 5. The footer hint should remain displayed in this tab:
        await newContentDialog.waitForFooterHintDisplayed();
    });

    it(`GIVEN 'New Content Dialog' is opened WHEN 'Media' tab has been clicked THEN the drop zone should be displayed AND the footer hint gets hidden`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        // 2. Click on 'Media' tab:
        await newContentDialog.clickOnMediaButton();
        await studioUtils.saveScreenshot('new_content_dialog_media_tab');
        // 3. Verify that the tab is selected and the drop zone is displayed:
        await newContentDialog.waitForTabSelected('Media');
        await newContentDialog.waitForDropZoneDisplayed();
        // 4. Verify the hint in the drop zone:
        let uploadHint = await newContentDialog.getUploadHintText();
        assert.equal(uploadHint, UPLOAD_HINT, `'${UPLOAD_HINT}' should be displayed in the drop zone`);
        // 5. Neither the footer hint nor the search input should be displayed in 'Media' tab:
        await newContentDialog.waitForFooterHintNotDisplayed();
        await newContentDialog.waitForSearchInputNotDisplayed();
    });

    it(`GIVEN 'New Content Dialog' is opened WHEN 'folder' text has been typed THEN the search input with 'Clear' button should appear instead of the footer hint`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        // 2. Type 'folder' text:
        await newContentDialog.typeSearchText('folder');
        await newContentDialog.pause(500);
        await studioUtils.saveScreenshot('new_content_dialog_filtered');
        // 3. Verify that the search input is displayed and contains the typed text:
        await newContentDialog.waitForSearchInputDisplayed();
        let value = await newContentDialog.getTextInInput(newContentDialog.searchInput);
        assert.equal(value, 'folder', 'The typed text should be displayed in the search input');
        // 4. 'Clear' button should appear in the search input:
        await newContentDialog.waitForClearSearchButtonDisplayed();
        // 5. The footer hint should not be displayed when the search input is not empty:
        await newContentDialog.waitForFooterHintNotDisplayed();
        // 6. Verify the filtered item:
        let items = await newContentDialog.getItemsInAllTab();
        assert.equal(items.length, 1, 'One item should be displayed in the filtered dialog');
        assert.equal(items[0], 'Folder', "'Folder' type should be displayed in the filtered dialog");
    });

    it(`GIVEN 'folder' text has been typed in the search input WHEN 'Clear' button has been pressed THEN the initial state should be reverted in the dialog`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root and filter the list:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        await newContentDialog.typeSearchText('folder');
        await newContentDialog.pause(500);
        // 2. Click on 'Clear' button:
        await newContentDialog.clickOnClearSearchButton();
        await studioUtils.saveScreenshot('new_content_dialog_search_cleared');
        // 3. All content types should be displayed again:
        let items = await newContentDialog.getItemsInAllTab();
        assert.equal(items.length, BASE_CONTENT_TYPES.length, 'All content types should be displayed again');
        // 4. The search input gets hidden and the footer hint is displayed again:
        await newContentDialog.waitForSearchInputNotDisplayed();
        await newContentDialog.waitForFooterHintDisplayed();
    });

    it(`GIVEN 'folder' text has been typed in the search input WHEN the text has been removed by 'Backspace' THEN the initial state should be reverted in the dialog`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root and filter the list:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        await newContentDialog.typeSearchText('folder');
        await newContentDialog.pause(500);
        // 2. Clear the search input by pressing 'Backspace' 6 times:
        for (let i = 0; i < 6; i++) {
            await studioUtils.doPressBackspace();
        }
        await newContentDialog.pause(1500);
        // 3. All content types should be displayed again:
        let items = await newContentDialog.getItemsInAllTab();
        await studioUtils.saveScreenshot('new_content_dialog_not_filtered');
        assert.equal(items.length, BASE_CONTENT_TYPES.length, 'All content types should be displayed again');
        // 4. The search input gets hidden and the footer hint is displayed again:
        await newContentDialog.waitForSearchInputNotDisplayed();
        await newContentDialog.waitForFooterHintDisplayed();
    });

    it(`GIVEN 'New Content Dialog' is opened WHEN non existing type has been typed THEN 'No content types found' message should be displayed`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.waitForContentTypesLoaded();
        // 2. Type a non existing type name:
        await newContentDialog.typeSearchText('test123');
        await newContentDialog.pause(500);
        await studioUtils.saveScreenshot('new_content_dialog_filtered_2');
        // 3. Verify the message in 'All' tab:
        let message = await newContentDialog.waitForNoTypesFoundMessage('All');
        assert.equal(message, NOT_FOUND_MESSAGE, `'${NOT_FOUND_MESSAGE}' message should be displayed`);
    });

    it(`GIVEN 'New Content Dialog' is opened by 'Alt+N' WHEN 'Esc' key has been pressed THEN the modal dialog should be closed`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Select the existing folder:
        await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
        // 2. Open New Content dialog by 'Alt' + 'n':
        await contentBrowsePanel.hotKeyNew();
        await newContentDialog.waitForOpened();
        // 3. Press 'Esc' key:
        await newContentDialog.pressEscKey();
        // 4. Verify that the dialog is closed:
        await newContentDialog.waitForClosed();
    });

    it(`GIVEN 'New Content Dialog' is opened WHEN 'Close' button has been pressed THEN the modal dialog should be closed`, async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let newContentDialog = new NewContentDialog();
        // 1. Open New Content dialog in the root:
        await contentBrowsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        // 2. Click on 'Close' button:
        await newContentDialog.clickOnCloseButton();
        // 3. Verify that the dialog is closed:
        await newContentDialog.waitForClosed();
    });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
