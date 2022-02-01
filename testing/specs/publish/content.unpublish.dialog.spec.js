/**
 * Created on 30.01.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentUnpublishDialog = require('../../page_objects/content.unpublish.dialog');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ConfirmValueDialog = require('../../page_objects/confirm.content.delete.dialog');

describe('content.unpublish.dialog.spec tests for unpublish modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let FOLDER;
    const DIALOG_HEADER = "Unpublish item";
    const DIALOG_SUBHEADER = "Unpublishing selected item(s) will set status back to offline";

    it(`Preconditions: test site and folder should be created and published`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let folderName = appConst.generateRandomName('folder');
            let siteName = appConst.generateRandomName('site');
            FOLDER = contentBuilder.buildFolder(folderName);
            //1. Add new folder
            await studioUtils.doAddReadyFolder(FOLDER);
            //2. Publish the folder:
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            let contentPublishDialog = new ContentPublishDialog();
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            //3. Unselect the folder
            await contentBrowsePanel.clickOnRowByDisplayName(FOLDER.displayName);
            //4. Add new site:
            SITE = contentBuilder.buildSite(siteName, 'test', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddReadySite(SITE);
            //5. Publish the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await contentPublishDialog.waitForNotificationMessage();
        });

    it("GIVEN Unpublish dialog has been opened WHEN 'Esc' key has been pressed THEN the dialog should be closed",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            //1. Select a site and open Unpublish dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            //2. Verify the header and subheader:
            let header = await contentUnpublishDialog.getDialogHeader();
            let subheader = await contentUnpublishDialog.getDialogSubheader();
            assert.equal(header, DIALOG_HEADER, "Expected header should be displayed");
            assert.isTrue(subheader.includes(DIALOG_SUBHEADER), "Expected subheader should be displayed");
            //3. Verify that 'Show Dependent items' link should be displayed by default:
            await contentUnpublishDialog.waitForShowDependentItemsLinkDisplayed();
            //4. Press ESC key and verify that Unpublish dialog is closed:
            await contentBrowsePanel.pressEscKey();
            await contentUnpublishDialog.waitForDialogClosed();
        });

    //verifies issue https://github.com/enonic/app-contentstudio/issues/4168
    //Unpublish item dialog remains visible after clicking on Cancel button in Confirm dialog #4168
    it("GIVEN Unpublish dialog has been opened WHEN 'Unpublish' button has been pressed THEN ConfirmValueDialog dialog should be loaded",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            //1. Select a site and open Unpublish dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            //2. Click on Unpublish button in the dialog:
            await contentUnpublishDialog.clickOnUnpublishButton();
            //3. Verify that ConfirmValueDialog is loaded:
            await confirmValueDialog.waitForDialogOpened();
            await confirmValueDialog.waitForConfirmButtonDisabled();
            //4. Type the required number of items:
            await confirmValueDialog.typeNumberOrName(2)
            await confirmValueDialog.waitForConfirmButtonEnabled();
            //5. Press 'ESC' key and verify that ConfirmValueDialog and Unpublish dialog are closed:
            await contentBrowsePanel.pressEscKey();
            await confirmValueDialog.waitForDialogClosed();
            //TODO uncomment it , verifies issue https://github.com/enonic/app-contentstudio/issues/4168
            //await contentUnpublishDialog.waitForDialogClosed();
        });

    it("GIVEN published site is selected WHEN Unpublish dialog has been opened THEN 'Show dependant items' link should be displayed in the dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await studioUtils.findAndSelectItem(SITE.displayName);
            //1. Select a site and open Unpublish dialog:
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            //2. Verify that only one item should be present in the items list:
            let items = await contentUnpublishDialog.getItemDisplayName();
            assert.equal(items.length, 1, "One items should be present in the items list");
            //3. Click on 'Show dependent items' link
            await contentUnpublishDialog.clickOnShowDependentItemsLink();
            await studioUtils.saveScreenshot("unpublish_hide_dependent_items");
            //4. Verify that 'Hide dependent items' link gets visible:
            await contentUnpublishDialog.waitForHideDependentItemsLinkDisplayed();
            //5. Verify the child item in the dependent block:
            let dependentItems = await contentUnpublishDialog.getDependentItemsPath();
            assert.equal(dependentItems.length, 1, "One item should be present in the dependent list");
            assert.isTrue(dependentItems[0].includes("_templates"), "Templates folder should be present in the dependent list");
        });

    it("GIVEN published folder and site are selected WHEN Unpublish dialog has been opened THEN two items and one dependent item should be present in the dialog",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentUnpublishDialog = new ContentUnpublishDialog();
            await studioUtils.findContentAndClickCheckBox(SITE.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER.displayName);
            //1. Select existing site and folder and open Unpublish dialog:
            await contentBrowsePanel.clickOnUnpublishButton();
            await contentUnpublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot("unpublish_2_items");
            //2. Verify that two items should be present in the items list:
            let items = await contentUnpublishDialog.getItemDisplayName();
            assert.equal(items.length, 2, "Two items should be present in the items list");
            assert.isTrue(items.includes(FOLDER.displayName), "Expected folder-name should be in the items list");
            assert.isTrue(items.includes(SITE.displayName), "Expected site-name should be in the items list");
            //3. Verify the label in Unpublish button - 3 items should be unpublished (site, _templates, test-folder)
            let result = await contentUnpublishDialog.getNumberInUnpublishButton();
            assert.equal(result, 3, "3 items should be displayed in the 'Unpublish' button");
            //4. Verify that 'Show dependent items' link is displayed in the dialog:
            await contentUnpublishDialog.waitForShowDependentItemsLinkDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
