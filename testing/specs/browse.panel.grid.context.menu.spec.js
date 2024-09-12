/**
 * Created on 03.01.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('browse.panel.grid.context.menu.spec - Tests for grid context menu', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER_1;
    let TEST_FOLDER_2;

    it(`WHEN do right click on an existing folder(New) THEN expected menu items should be shown`,
        async () => {
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER_1 = contentBuilder.buildFolder(displayName, null, appConst.LANGUAGES.EN);
            await studioUtils.doAddFolder(TEST_FOLDER_1);
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select an existing folder:
            await studioUtils.findAndSelectItem(TEST_FOLDER_1.displayName);
            // 2. Do the right click on the folder:
            await contentBrowsePanel.rightClickOnItemByDisplayName(TEST_FOLDER_1.displayName);
            // 3.Verify that New, Archive, Edit, Move, Publish, Duplicate  menu items are enabled in the context menu:
            await studioUtils.saveScreenshot('folder-context-menu-1');
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.ARCHIVE);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.NEW);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.EDIT);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.MOVE);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.PUBLISH);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.DUPLICATE);
            // 4.Verify that Preview, Sort  menu items are disabled in the context menu:
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.PREVIEW);
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.SORT);
        });

    it(`GIVEN two folders are selected WHEN do right click on the selected items THEN New, Sort, Preview menu items should be disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER_2 = contentBuilder.buildFolder(displayName, null, appConst.LANGUAGES.EN);
            await studioUtils.doAddFolder(TEST_FOLDER_2);
            // 1. Select 2 folders:
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_2.displayName);
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_1.displayName);
            // 2. Do right-click on the selected folders:
            await contentBrowsePanel.rightClickOnItemByDisplayName(TEST_FOLDER_1.displayName);
            // 3.Verify that Archive, Edit, Move, Publish, Duplicate  menu items are enabled in the context menu:
            await studioUtils.saveScreenshot('folder-context-menu-2');
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.ARCHIVE);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.EDIT);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.MOVE);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.PUBLISH);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.DUPLICATE);
            // 4.Verify that New, Preview, Sort  menu items are disabled in the context menu:
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.NEW);
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.PREVIEW);
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.SORT);
        });

    it(`GIVEN existing folder is published WHEN do right click on the folder THEN Unpublish menu item appears in the context menu `,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select a folder and click on Mark as Ready button:
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_1.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            // 2. Do the right click on the selected folder and click on Publish menu item :
            await contentBrowsePanel.rightClickOnItemByDisplayName(TEST_FOLDER_1.displayName);
            await contentBrowsePanel.clickOnMenuItem(appConst.GRID_CONTEXT_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'Publish Now' button:
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await contentBrowsePanel.waitForNotificationMessage();
            // 4. Do right click on the selected folder
            await contentBrowsePanel.rightClickOnItemByDisplayName(TEST_FOLDER_1.displayName);
            await studioUtils.saveScreenshot('folder-context-menu-3');
            // 5.Verify that 'Unpublish'  menu item gets visible and enabled in the context menu:
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.UNPUBLISH);
            // 6. Verify that 'Publish' menu item is not displayed now
            await contentBrowsePanel.waitForContextMenuItemNotDisplayed(appConst.GRID_CONTEXT_MENU.PUBLISH);
        });

    it(`GIVEN one published and one new folders are selected WHEN do right click on the selected items THEN Publish and Unpublish menu items should be enabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select 2 folders:
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_1.displayName);
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_2.displayName);
            // 2. Do the right click on the selected folders:
            await contentBrowsePanel.rightClickOnItemByDisplayName(TEST_FOLDER_2.displayName);
            // 3.Verify that Publish, Unpublish  menu items are enabled in the context menu:
            await studioUtils.saveScreenshot("folder-context-menu-4");
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.PUBLISH);
            await contentBrowsePanel.waitForContextMenuItemEnabled(appConst.GRID_CONTEXT_MENU.UNPUBLISH);
        });

    it(`GIVEN existing folder is selected WHEN 'Edit' menu item has been clicked in the context menu THEN this content should be loaded in the new browser tab`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select a folder:
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_1.displayName);
            // 2. Do the right click on the selected folder then click on 'Edit' menu item:
            await contentBrowsePanel.rightClickOnItemByDisplayName(TEST_FOLDER_1.displayName);
            await contentBrowsePanel.clickOnMenuItem(appConst.GRID_CONTEXT_MENU.EDIT);
            await contentBrowsePanel.pause(1000);
            await studioUtils.doSwitchToNextTab();
            // 3.verify that the content is opened in the new browser tab
            await studioUtils.saveScreenshot('folder-context-menu-5');
            let contentWizard = new ContentWizard();
            let displayName = await contentWizard.getDisplayName();
            assert.equal(displayName, TEST_FOLDER_1.displayName, 'Expected and actual display name should be equal');
        });

    it(`WHEN do right click on an existing image THEN 'Preview','New', 'Sort' menu items should be disabled in the context menu`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select an image:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.RENAULT);
            // 2. Do the right click on the image:
            await contentBrowsePanel.rightClickOnItemByDisplayName(appConst.TEST_IMAGES.RENAULT);
            // 3.Verify that New, Preview, Sort  menu items are disabled in the context menu:
            await studioUtils.saveScreenshot('image-context-menu-1');
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.PREVIEW);
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.NEW);
            await contentBrowsePanel.waitForContextMenuItemDisabled(appConst.GRID_CONTEXT_MENU.SORT);
            // 4. Verify that Img element gets visible in the Item Preview Panel:
            await contentItemPreviewPanel.waitForImageDisplayed();
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
