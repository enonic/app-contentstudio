/**
 * Created on 08.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');

describe('new.content.dialog.spec:  test for New Content Dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it("GIVEN New Content Dialog is opened WHEN 'Esc' has been pressed THEN the modal dialog should be closed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            // 'Alt'+ 'n' have been pressed:
            await contentBrowsePanel.hotKeyNew();
            // 'New Content Dialog should be loaded:
            await newContentDialog.waitForOpened();
            // Press 'Esc' key
            await newContentDialog.pressEscKey();
            // Verify that the dialog is closed:
            await newContentDialog.waitForClosed();
        });

    it(`GIVEN no selections in the grid WHEN 'New Content Dialog' is opened THEN upload button should be present in the dialog`,
        async () => {
            let newContentDialog = new NewContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open New Content Dialog
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 2. Verify the Upload button
            await newContentDialog.waitForUploaderButtonDisplayed();
            // 3.  Most popular block should be displayed
            await newContentDialog.waitForMostPopularBlockDisplayed();
        });

    it(`GIVEN New Content Dialog is opened WHEN 'Cancel top' button has been pressed THEN the dialog should be closed`,
        async () => {
            let newContentDialog = new NewContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open New Content Dialog
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 2. Click on Cancel Top button
            await newContentDialog.clickOnCancelButtonTop();
            await newContentDialog.waitForClosed();
        });

    it(`GIVEN New Content Dialog is opened WHEN non existing type has been typed THEN list of items should be empty`,
        async () => {
            let newContentDialog = new NewContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open New Content Dialog
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 2. type 'test123' text in the search input
            await newContentDialog.typeSearchText("test123");
            await newContentDialog.pause(500);
            // 3. Verify the list of items
            let items = await newContentDialog.getItems();
            await studioUtils.saveScreenshot("new_content_dialog_filtered_2");
            assert.equal(items.length, 0, "list of items should be empty");
        });

    it(`GIVEN no selections in the grid AND 'Folder' text has been typed in Search Input WHEN Search Input has been cleared THEN the initial state should be reverted in the dialog`,
        async () => {
            let newContentDialog = new NewContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open New Content Dialog
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 2. type 'folder' text in the search input
            await newContentDialog.typeSearchText("folder");
            await newContentDialog.pause(500);
            // 3. Verify the filtered item
            let items = await newContentDialog.getItems();
            await studioUtils.saveScreenshot('new_content_dialog_filtered');
            assert.equal(items.length, 1, "One item should be in the filtered dialog");
            assert.equal(items[0], "Folder", "Expect display name of the type should be displayed");
            // 4. Clear  the filter input:
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await studioUtils.doPressBackspace();
            await newContentDialog.pause(1500);
            // 5. Verify items:
            items = await newContentDialog.getItems();
            await studioUtils.saveScreenshot("new_content_dialog_not_filtered");
            assert.equal(items.length, 3, "One item should be in the filtered dialog");
            assert.ok(items.includes("Folder"), "Folder type should be displayed");
            assert.ok(items.includes("Shortcut"), "Shortcut type should be displayed");
            assert.ok(items.includes("Site"), "Site type should be displayed");
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
