/**
 * Created on 31.05.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentDuplicateDialog = require('../page_objects/content.duplicate.dialog');
const contentBuilder = require("../libs/content.builder");
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ConfirmValueDialog = require('../page_objects/confirm.content.delete.dialog');
const appConst = require('../libs/app_const');

describe('site.duplicate.exclude.child.spec:  tests for Duplicate and Confirm Value dialogs', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CHILD_FOLDER;
    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN existing site is selected WHEN 'Confirm Value' dialog is opened THEN 'Enter 2 in the field and click Confirm' message should be displayed",
        async () => {
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select existing site and open 'Delete Content Dialog':
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForSpinnerNotVisible();
            // 2. Click on 'Delete' menu item:
            await deleteContentDialog.clickOnDeleteMenuItem();
            // 3. Verify that Confirm Value dialog appears:
            await confirmValueDialog.waitForDialogOpened();
            // 4. Verify that Message "Enter 2 in the field and click Confirm:" is displayed in the dialog
            let actualNumber = await confirmValueDialog.getSuggestedNumberToDelete();
            assert.equal(actualNumber, '2', 'Expected suggested number should be displayed');
            // 5. Verify that 'Confirm' button is disabled
            await confirmValueDialog.waitForConfirmButtonDisabled();
        });

    it("GIVEN 'Confirm Value' dialog is opened WHEN incorrect number to delete has been typed THEN 'Confirm' button remains disabled",
        async () => {
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select existing site and open 'Delete Content Dialog':
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForSpinnerNotVisible();
            // 2. Click on 'Delete' menu item:
            await deleteContentDialog.clickOnDeleteMenuItem();
            await confirmValueDialog.waitForDialogOpened();
            // 3. Type not correct number to delete:
            await confirmValueDialog.typeNumberOrName(7);
            await confirmValueDialog.pause(1000);
            await studioUtils.saveScreenshot('number_to_delete_incorrect');
            // 5. Verify that 'Confirm' button is disabled
            await confirmValueDialog.waitForConfirmButtonDisabled();
            // 6. Close the dialog:
            await confirmValueDialog.clickOnCancelButton();
            await confirmValueDialog.waitForDialogClosed();
            await deleteContentDialog.waitForDialogClosed();
        });

    it(`Preconditions child folder should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let folderName = contentBuilder.generateRandomName('folder');
            CHILD_FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.doAddFolder(CHILD_FOLDER);
            await studioUtils.typeNameInFilterPanel(CHILD_FOLDER.displayName);
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER.displayName);
        });

    it(`GIVEN existing site is selected AND 'Duplicate dialog' is opened WHEN site has been duplicated THEN the site should be copied with its children`,
        async () => {
            let contentDuplicateDialog = new ContentDuplicateDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select existing site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            // 2. open Duplicate dialog and click on 'Duplicate' button:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
            // 3. Verify that the site has been copied with its children:
            await studioUtils.findAndSelectItem(SITE.displayName + '-copy');
            await studioUtils.saveScreenshot('site_and_children_duplicated');
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName + '-copy');
            await contentBrowsePanel.waitForContentDisplayed('_templates');
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER.displayName);
        });

    it(`GIVEN existing site is selected AND Duplicate dialog is opened WHEN 'exclude child' icon has been clicked THEN copy of the site should be displayed without expand-toggle button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            // 1. Select the site and open Duplicate dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            // 2. Click on the toggler and exclude child items:
            await contentDuplicateDialog.clickOnIncludeChildToggler();
            await studioUtils.saveScreenshot('issue_duplicate_dlg');
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
            // 3. Verify that site does not have expander icon:
            // TODO  Verify the issue  https://github.com/enonic/app-contentstudio/issues/7071
            await studioUtils.findAndSelectItem(SITE.displayName + '-copy-2');
            await studioUtils.saveScreenshot('site_duplicated_no_child');
            // 4. Verify - 'Site should be displayed without expand-toggle, because the site has no child items'
            await contentBrowsePanel.waitForExpandToggleNotDisplayed(SITE.displayName + '-copy-2');
        });

    it("GIVEN 'Confirm Value' dialog is opened WHEN required number to delete has been typed THEN 'Confirm' button gets enabled",
        async () => {
            let deleteContentDialog = new DeleteContentDialog();
            let confirmValueDialog = new ConfirmValueDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the existing site and open Delete Content Dialog:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForSpinnerNotVisible();
            // 2. Click on 'Delete' menu item:
            await deleteContentDialog.clickOnDeleteMenuItem();
            await confirmValueDialog.waitForDialogOpened();
            // 3. Insert the required number of content:
            await confirmValueDialog.typeNumberOrName(3);
            // 4. Verify that 'Confirm' button gets disabled
            await confirmValueDialog.waitForConfirmButtonEnabled();
            // 5. Click on 'Confirm' button and verify the message:
            await confirmValueDialog.clickOnConfirmButton();
            let actualMessage = await contentBrowsePanel.waitForNotificationMessage();
            assert.equal(actualMessage, '3 items have been deleted.', 'Expected notification message should be displayed');
        });

    it("WHEN the original site has been deleted THEN the copy of the site should not be deleted",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the copy of deleted site and expand this site:
            await studioUtils.findAndSelectItem(SITE.displayName + '-copy');
            // 2. Verify that the copy of the site and its children are present:
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName + '-copy');
            await studioUtils.saveScreenshot('site_copy_expanded');
            await contentBrowsePanel.waitForContentDisplayed('_templates');
            await contentBrowsePanel.waitForContentDisplayed(CHILD_FOLDER.displayName);
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
