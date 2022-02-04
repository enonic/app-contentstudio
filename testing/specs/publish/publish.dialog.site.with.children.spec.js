/**
 * Created on 21.01.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.dialog.site.with.children.spec - Select a site with not valid child and try to publish it', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let TEST_FOLDER;

    it("Precondition: ready for publishing site with invalid child folder should be added",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //Add invalid child folder
            await studioUtils.openContentWizard(appConstant.contentTypes.FOLDER);
            await studioUtils.doCloseWizardAndSwitchToGrid();
        });

    it("GIVEN existing site with invalid child is selected AND 'Publish wizard' is opened WHEN 'Include children' has been clicked THEN 'Exclude all' link should appear in the dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select an existing folder with not valid child and open Publish wizard:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            //2. Click on 'Include children' button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //3. Verify that dependent items are expanded, because a not valid item is present:
            await contentPublishDialog.waitForHideDependentItemsDisplayed();
            //4. Verify that "Exclude invalid items" button gets visible
            await contentPublishDialog.waitForExcludeInvalidItemsButtonDisplayed();
            //5. Verify that 'Publish Now' button is disabled in the dialog:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    it("GIVEN Publish wizard is opened AND 'Include children' has been clicked WHEN 'Exclude all' invalid items has been clicked THEN 'Exclude all' button gets not visible",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select an existing site with not valid child and open Publish wizard:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            //2. Click on Include children button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //3. Click on Exclude invalid items button:
            await contentPublishDialog.clickOnExcludeInvalidItemsButton();
            //4. Verify that 'Exclude all'  invalid items button gets not visible:
            await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
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
            //2. Click on Include children button
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await studioUtils.saveScreenshot("include_children_clicked");
            //3. Exclude all invalid items:
            await contentPublishDialog.clickOnExcludeInvalidItemsButton();
            await studioUtils.saveScreenshot("exclude_work_in_pr");
            //4. Exclude all 'work in progress' items:
            await contentPublishDialog.clickOnExcludeWorkInProgressItemsButton();
            //5. Verify that 'Exclude all' buttons get not visible:
            await contentPublishDialog.waitForExcludeInvalidItemsButtonNotDisplayed();
            await contentPublishDialog.waitForExcludeWorkInProgressItemsButtonNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });

});
