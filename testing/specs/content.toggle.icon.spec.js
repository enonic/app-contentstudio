/**
 * Created on 05.01.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');

describe('content.toggle.icon.spec: tests for expand/collapse icon', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let PARENT_FOLDER;
    let CHILD_FOLDER_1;
    let CHILD_FOLDER_2;
    const PARENT_FOLDER_NAME = appConst.generateRandomName('parent');
    const CHILD_FOLDER_NAME_1 = appConst.generateRandomName('folder');
    const CHILD_FOLDER_NAME_2 = appConst.generateRandomName('folder');

    it(`Preconditions: create a folder`,
        async () => {
            PARENT_FOLDER = contentBuilder.buildFolder(PARENT_FOLDER_NAME);
            await studioUtils.doAddFolder(PARENT_FOLDER);
        });

    it(`GIVEN existing folder is selected WHEN child folder has been created THEN the parent folder should be collapsed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            CHILD_FOLDER_1 = contentBuilder.buildFolder(CHILD_FOLDER_NAME_1);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 1. Select existing folder and add a child folder:
            await studioUtils.doAddFolder(CHILD_FOLDER_1);
            // 2. Verify that the parent folder is collapsed
            let isExpanded = await contentBrowsePanel.isContentExpanded(PARENT_FOLDER.displayName);
            assert.ok(isExpanded === false, "Parent folder should be collapsed");
            // 3. Click on the toggle icon and expand the folder:
            await contentBrowsePanel.clickOnExpanderIcon(PARENT_FOLDER.displayName);
            isExpanded = await contentBrowsePanel.isContentExpanded(PARENT_FOLDER.displayName);
            assert.ok(isExpanded, "Parent folder should be expanded");
            // 4. Verify that the child folder is visible now:
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER_1.displayName);
        });

    it(`GIVEN existing folder is selected and expanded WHEN one more child folder has been created THEN the parent folder remains expanded`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            CHILD_FOLDER_2 = contentBuilder.buildFolder(CHILD_FOLDER_NAME_2);
            // 1. Select the parent folder and expand it:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await contentBrowsePanel.clickOnExpanderIcon(PARENT_FOLDER.displayName);
            // 2. Add a child folder:
            await studioUtils.doAddFolder(CHILD_FOLDER_2);
            await studioUtils.saveScreenshot("parent_should_be_expanded");
            // 3. Verify that the parent folder remains expanded:
            let isExpanded = await contentBrowsePanel.isContentExpanded(PARENT_FOLDER.displayName);
            assert.ok(isExpanded, "Parent folder should be expanded");
            // 4. Verify that the child folder is visible
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER_2.displayName);
        });

    it(`GIVEN existing parent folder with child content WHEN child content have been deleted THEN the parent content should be displayed without toggle icon`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            // 1. Select the parent folder and expand it:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await contentBrowsePanel.clickOnExpanderIcon(PARENT_FOLDER.displayName);
            // 2. Both child folders have been deleted:
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(CHILD_FOLDER_1.displayName);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(CHILD_FOLDER_2.displayName);
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.clickOnDeleteMenuItem();
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.typeNumberOrName(2);
            await confirmValueDialog.clickOnConfirmButton();
            // 3. Verify that both folders are not displayed:
            await contentBrowsePanel.waitForContentNotDisplayed(CHILD_FOLDER_1.displayName);
            await contentBrowsePanel.waitForContentNotDisplayed(CHILD_FOLDER_2.displayName);
            await studioUtils.saveScreenshot('toggle_icon_content_deleted');
            // 4. Verify that the parent folder does not have 'toggle button', child items were removed:
            await contentBrowsePanel.waitForExpandToggleNotDisplayed(PARENT_FOLDER.displayName);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
