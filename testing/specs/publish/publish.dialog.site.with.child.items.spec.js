/**
 * Created on 21.01.2019.  updated on 19.11.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require('../../libs/content.builder');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');

describe('publish.dialog.site.with.child.items.spec - Select a site with invalid child and try to publish it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEST_FOLDER;
    const UNNAMED_FOLDER = 'Unnamed Folder';

    it('Precondition: site should be added and marked as ready in the Publish dialog, then invalid child folder should be added', async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        let displayName = contentBuilder.generateRandomName('site');
        SITE = contentBuilder.buildSite(displayName, null, [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
        await studioUtils.doAddSite(SITE);
        // 1. Select the 'Work in progress' site and click on 'Publish...' button in the browse-toolbar
        // ('Mark as ready' is no longer offered in the toolbar):
        await studioUtils.findAndSelectItem(SITE.displayName);
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on 'Mark as ready' in the Publish dialog:
        await contentPublishDialog.clickOnMarkAsReadyButton();
        await contentPublishDialog.waitForMarkAsReadyButtonNotDisplayed();
        // 3. Close 'Publish Wizard':
        await contentPublishDialog.clickOnCloseButton();
        await contentPublishDialog.waitForDialogClosed();
        // 4. Add invalid child folder:
        await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
        await studioUtils.doCloseWizardAndSwitchToGrid();
    });

    it("GIVEN existing site with invalid child is selected AND 'Publish wizard' is opened WHEN 'Include children' has been clicked THEN child items should appear in the main list AND 'Exclude invalid items' button should appear", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select an existing folder with invalid child and open Publish wizard:
        await studioUtils.findAndSelectItem(SITE.displayName);
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on 'Include children' button
        await contentPublishDialog.clickOnIncludeChildrenCheckbox();
        // 3. Verify that the site and its 2 child items are in the main list:
        await contentPublishDialog.waitForNumberOfMainItems(3);
        // 4. Verify that "Exclude invalid items" button should be visible
        await contentPublishDialog.waitForExcludeInvalidItemsButtonDisplayed();
        // 5. Verify that 'Publish Now' button is disabled in the dialog:
        await contentPublishDialog.waitForPublishNowButtonDisabled();
    });

    it("GIVEN existing site with invalid child item is selected AND 'Publish wizard' is opened WHEN invalid child item has been unselected THEN 'Publish now' button gets enabled in the dialog", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select an existing folder with invalid child and open Publish wizard:
        await studioUtils.findAndSelectItem(SITE.displayName);
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on 'Include children' button
        await contentPublishDialog.clickOnIncludeChildrenCheckbox();
        // 3. Unselect the checkbox for 'unnamed' (invalid) folder:
        await contentPublishDialog.clickOnCheckboxInMainItem(UNNAMED_FOLDER);
        // 4. Apply the selection:
        await contentPublishDialog.clickOnApplyButton();
        // 5. Verify that 'Exclude invalid items' button gets not visible:
        await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
        // 6. Verify that 'Publish Now' button is enabled in the dialog, because of the valid child item has been excluded:
        await contentPublishDialog.waitForPublishNowButtonEnabled();
        // 7. Verify that the excluded child item remains in the main list, unselected:
        let isSelected = await contentPublishDialog.isMainItemCheckboxSelected(UNNAMED_FOLDER);
        assert.ok(isSelected === false, 'The excluded child item should be unselected');
        // 8. Verify that 'Content is ready for publishing' record is displayed:
        await contentPublishDialog.waitForReadyForPublishingTextDisplayed();
    });

    it("GIVEN Publish wizard is opened AND 'Include children' has been clicked WHEN 'Exclude all' invalid items has been clicked THEN 'Exclude all' button gets not visible", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select an existing site with invalid child and open Publish wizard:
        await studioUtils.findAndSelectItem(SITE.displayName);
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on Include children button
        await contentPublishDialog.clickOnIncludeChildrenCheckbox();
        await contentPublishDialog.waitForExcludeInvalidItemsButtonDisplayed();
        // The site and its 2 child items should be in the main list:
        await contentPublishDialog.waitForNumberOfMainItems(3);
        // 3. Click on 'Exclude invalid' items button:
        await contentPublishDialog.clickOnExcludeInvalidItemsButton();
        // 4. Verify that 'Exclude invalid items' button gets not visible:
        await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
        // 5. The excluded invalid item remains in the main list, unselected:
        await contentPublishDialog.waitForNumberOfMainItems(3);
        let isSelected = await contentPublishDialog.isMainItemCheckboxSelected(UNNAMED_FOLDER);
        assert.ok(isSelected === false, 'The excluded invalid item should be unselected');
    });

    it("Precondition 2: 'work in progress' folder should be added in the site", async () => {
        let folderName = contentBuilder.generateRandomName('folder');
        TEST_FOLDER = contentBuilder.buildFolder(folderName);
        await studioUtils.findAndSelectItem(SITE.displayName);
        await studioUtils.doAddFolder(TEST_FOLDER);
    });

    it("GIVEN Publish wizard is opened AND 'Include children' has been clicked WHEN exclude invalid and exclude 'work in progress' items have been clicked THEN both 'Exclude all' buttons get not visible", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        //1. Select an existing site with not valid child and open Publish wizard:
        await studioUtils.findAndSelectItem(SITE.displayName);
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on 'Include children' button
        await contentPublishDialog.clickOnIncludeChildrenCheckbox();
        await contentPublishDialog.waitForExcludeInvalidItemsButtonDisplayed();
        // The site and its 3 child items should be in the main list:
        await contentPublishDialog.waitForNumberOfMainItems(4);
        await studioUtils.saveScreenshot('include_children_clicked');
        // 3. Click on 'Exclude invalid items':
        await contentPublishDialog.clickOnExcludeInvalidItemsButton();
        // 'Publish now' button remains disabled after excluding invalid items:
        await contentPublishDialog.waitForPublishNowButtonDisabled();
        await studioUtils.saveScreenshot('exclude_work_in_pr');
        // 4. Exclude all 'work in progress' items:
        await contentPublishDialog.clickOnExcludeItemsInProgressButton();
        // 5. Verify that 'Exclude items in progress' buttons get not visible:
        await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
        await contentPublishDialog.waitForExcludeItemsInProgressButtonNotDisplayed();
        // 6. The excluded items remain in the main list, unselected:
        await contentPublishDialog.waitForNumberOfMainItems(4);
        let isSelected = await contentPublishDialog.isMainItemCheckboxSelected(TEST_FOLDER.displayName);
        assert.ok(isSelected === false, "The excluded 'work in progress' item should be unselected");
        // 7. There are no dependencies, so the 'Hide excluded' button should not be displayed:
        await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
        // 8. Publish Now button should be enabled now:
        await contentPublishDialog.waitForPublishNowButtonEnabled();
    });

    it("GIVEN invalid and 'work in progress' child items have been excluded WHEN the invalid item has been selected again THEN 'Apply' button gets visible AND 'Publish now' gets disabled", async () => {
        let contentBrowsePanel = new ContentBrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        // 1. Select an existing site with not valid child and open Publish wizard:
        await studioUtils.findAndSelectItem(SITE.displayName);
        await contentBrowsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        // 2. Click on 'Include children' checkbox
        await contentPublishDialog.clickOnIncludeChildrenCheckbox();
        // 3. Click on 'Exclude invalid items':
        await contentPublishDialog.clickOnExcludeInvalidItemsButton();
        // 4. Exclude all 'work in progress' items:
        await contentPublishDialog.clickOnExcludeItemsInProgressButton();
        await contentPublishDialog.waitForPublishNowButtonEnabled();
        // 5. The excluded items remain in the main list after the site:
        let mainItems = await contentPublishDialog.waitForNumberOfMainItems(4);
        assert.equal(mainItems[0], SITE.displayName, 'The site should be the first item in the main list');
        await studioUtils.saveScreenshot('excluded_child_items');
        // 6. Select the invalid item again:
        await contentPublishDialog.clickOnCheckboxInMainItem(UNNAMED_FOLDER);
        // 7. Verify that 'Apply' button gets visible and 'Publish Now' button gets disabled:
        await contentPublishDialog.waitForApplySelectionButtonDisplayed();
        await contentPublishDialog.waitForPublishNowButtonDisabled();
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
