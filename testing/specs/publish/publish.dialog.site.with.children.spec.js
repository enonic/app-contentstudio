/**
 * Created on 21.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');

describe('publish.dialog.site.with.children.spec - Select a site with not valid child and try to publish it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEST_FOLDER;

    it("Precondition: ready for publishing site with invalid child folder should be added",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            // Close 'Publish Wizard':
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // Add invalid child folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await studioUtils.doCloseWizardAndSwitchToGrid();
        });

    it("GIVEN existing site with invalid child is selected AND 'Publish wizard' is opened WHEN 'Include children' has been clicked THEN 'Exclude all' link should appear in the dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select an existing folder with invalid child and open Publish wizard:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Include children' button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 3. Verify that 'All' checkbox is displayed and enabled:
            await contentPublishDialog.waitForAllDependantsCheckboxDisplayed();
            await contentPublishDialog.waitForAllDependantsCheckboxEnabled();
            // 4. Verify that "Exclude invalid items" button should be visible
            await contentPublishDialog.waitForExcludeInvalidItemsButtonDisplayed();
            // 5. Verify that 'Publish Now' button is disabled in the dialog:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    it("GIVEN Publish wizard is opened AND 'Include children' has been clicked WHEN 'Exclude all' invalid items has been clicked THEN 'Exclude all' button gets not visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select an existing site with not valid child and open Publish wizard:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on Include children button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 2, 'Two dependent items should be displayed');
            //3. Click on 'Exclude invalid' items button:
            await contentPublishDialog.clickOnExcludeInvalidItemsButton();
            // 4. Verify that 'Exclude invalid items' button gets not visible:
            await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
            depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'Number of dependent items should be reduced');
            // 5. 'Show excluded items' button gets visible:
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
        });

    it("Precondition 2: 'work in progress' folder should be added in the site",
        async () => {
            let folderName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.doAddFolder(TEST_FOLDER);
        });

    it("GIVEN Publish wizard is opened AND 'Include children' has been clicked WHEN exclude invalid and exclude 'work in progress' items have been clicked THEN both 'Exclude all' buttons get not visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select an existing site with not valid child and open Publish wizard:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Include children' button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 3, 'Three dependent items should be displayed');
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
            // 6. 'Show excluded items' button gets visible:
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            // 7. The number of displayed dependant items should be reduced:
            depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'Number of displayed dependent items should be reduced');
            // 8. Publish Now button should be enabled now:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
        });


    it("WHEN 'Show excluded items' button has been clicked THEN the number of dependant items should be increased",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select an existing site with not valid child and open Publish wizard:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Click on 'Include children' button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 3. Click on 'Exclude invalid items':
            await contentPublishDialog.clickOnExcludeInvalidItemsButton();
            // 4. Exclude all 'work in progress' items:
            await contentPublishDialog.clickOnExcludeItemsInProgressButton();
            // 5. 'Show Excluded items' button should be visible:
            await contentPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            await contentPublishDialog.clickOnShowExcludedButtonItems();
            // 6. The number of dependant items should be increased:
            let depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 3, 'Three dependent items should be displayed');
            await studioUtils.saveScreenshot('hide_excluded_items');
            // 7. Verify that 'Hide excluded items' button gets visible:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 8. Click on 'Hide Excluded items' button:
            await contentPublishDialog.clickOnHideExcludedItemsButton();
            // 9. Excluded items should be hidden now:
            depItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(depItems.length, 1, 'One dependent items should be displayed');
            assert.isTrue(depItems[0].includes('_templates'), 'Expected item-name should be displayed in the dependant list');
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
