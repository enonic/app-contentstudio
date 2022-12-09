/**
 * Created on 22.07.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');

describe('content.publish.dialog.spec - opens publish modal dialog and checks control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let FOLDER1_NAME;
    let PARENT_FOLDER;
    let CHILD_FOLDER;
    const TEST_IMAGE = "whale";

    //XP-4890 Publishing Wizard - Enable excluding any item from the dependants list if it's not a parent to other items in the list
    it(`GIVEN existing shortcut with selected target WHEN publish dialog has been opened in the wizard THEN the dependent item should be removable`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let shortcutForm = new ShortcutForm();
            //1. Open wizard for new shortcut:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('shortcut'));
            //2. Select a target in the selector:
            await shortcutForm.filterOptionsAndSelectTarget(TEST_IMAGE);
            //3. Open Publish Wizard:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            //4. Click on 'Show dependent items':
            await contentPublishDialog.clickOnShowDependentItems();
            await studioUtils.saveScreenshot("shortcut_publish_dependent_items")
            //5. Verify that the dependent item is removable:
            let isRemovable = await contentPublishDialog.isPublishItemRemovable(TEST_IMAGE);
            assert.isTrue(isRemovable, "The dependent item should be removable");
        });

    it(`GIVEN folder is opened AND 'Marked as ready' is done WHEN publish dialog has been opened THEN 'New' status should be displayed in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            FOLDER1_NAME = contentBuilder.generateRandomName('folder');
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER1_NAME);
            //1. Click on 'MARK AS READY' default action:
            await contentWizard.clickOnMarkAsReadyButton();
            await studioUtils.saveScreenshot("wizard_publish_dialog_single_folder");
            let status = await contentPublishDialog.getContentStatus(FOLDER1_NAME);
            //2. New status should be displayed in the modal dialog:
            assert.equal(status, "New", "'New' status should be displayed in the dialog");
            await contentPublishDialog.waitForAddScheduleIconDisplayed();

            //This item should not be removable:
            let isRemovable = await contentPublishDialog.isPublishItemRemovable(FOLDER1_NAME);
            assert.isFalse(isRemovable, "One publish item should be displayed and it should not be removable");
        });

    it(`GIVEN existing folder(does not have children) is selected WHEN 'Publish' button has been pressed THEN 'New' status should be displayed in the modal dialog`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            //1. Click on 'Publish...' button, open Publish content dialog:
            await contentBrowsePanel.clickOnPublishButton();
            await studioUtils.saveScreenshot("grid_publish_dialog_single_folder");
            //2. Verify the content status:
            let status = await contentPublishDialog.getContentStatus(FOLDER1_NAME);
            assert.equal(status, "New", "'New' status should be displayed in the dialog");
            //3. "Add schedule" button should be displayed:
            await contentPublishDialog.waitForAddScheduleIconDisplayed();
            //4. This publish-item should be removable:
            let isRemovable = await contentPublishDialog.isPublishItemRemovable(FOLDER1_NAME);
            assert.isFalse(isRemovable, "One publish item should be displayed and it should not be removable");
            //5. 'Include Children' toggler should not be displayed, the folder has no children!
            let isDisplayed = await contentPublishDialog.isIncludeChildTogglerDisplayed();
            assert.isFalse(isDisplayed, "Include child icon should not be visible");
        });

    it(`GIVEN existing folder with children is selected WHEN 'Publish' button(browse toolbar) has been pressed THEN expected control elements should be displayed in the dialog`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            //Click on 'Publish...' button
            await contentBrowsePanel.clickOnPublishButton();
            await studioUtils.saveScreenshot("grid_publish_dialog_parent_folder");

            let status = await contentPublishDialog.getContentStatus(appConst.TEST_FOLDER_WITH_IMAGES);
            assert.equal(status, "New", "'New' status should be displayed in the dialog");
            //"Add schedule" button should be displayed:
            await contentPublishDialog.waitForAddScheduleIconDisplayed();

            let isRemovable = await contentPublishDialog.isPublishItemRemovable(appConst.TEST_FOLDER_WITH_IMAGES);
            assert.isFalse(isRemovable, "Parent item should be displayed and it should not be removable");

            //the folder has no children!
            let isDisplayed = await contentPublishDialog.isIncludeChildTogglerDisplayed();
            assert.isTrue(isDisplayed, "Include child icon should be visible");

            //'Publish Now' button should be enabled!
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            //Log message link should be displayed:
            let isLinkDisplayed = await contentPublishDialog.isLogMessageLinkDisplayed();
            assert.isTrue(isLinkDisplayed, "Log message link should be displayed");
        });

    it(`GIVEN folder with children is selected AND Publish wizard is opened WHEN 'Include children' button has been pressed THEN 'Show dependent items' gets visible`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            //Click on 'Publish...' button
            await contentBrowsePanel.clickOnPublishButton();
            //'Include children' has been clicked
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //Verify that 'Show Dependent items' link gets visible!
            await contentPublishDialog.waitForShowDependentItemsButtonDisplayed();

            let items = await contentPublishDialog.getNumberItemsToPublish();
            assert.equal(items, '13', "13 items to publish should be in the dialog");
        });

    it(`GIVEN folder is selected AND Publish dialog is opened WHEN 'Include children' and Show dependent items button have been pressed THEN 'Hide dependent items' gets visible`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            //Click on 'Publish...' button (open Publish Wizard)
            await contentBrowsePanel.clickOnPublishButton();
            //'Include children' has been clicked
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //'Show Dependent items' has been clicked
            await contentPublishDialog.clickOnShowDependentItems();
            //Hide dependant items gets visible.
            await contentPublishDialog.waitForHideDependentItemsDisplayed();
            //child item should be removable.
            let isRemovable = await contentPublishDialog.isPublishItemRemovable(appConst.TEST_IMAGES.BRO);
            assert.isTrue(isRemovable, "Child item should be removable");
        });

    it(`GIVEN 'Content Publish' dialog is opened WHEN cancel button on the bottom has been clicked THEN dialog is closing`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // folder with children is selected and 'Publish' button pressed"
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // "button 'Cancel' on the bottom of dialog has been pressed"
            await contentPublishDialog.clickOnCancelTopButton();
            // "dialog is closing. Otherwise, exception will be thrown after the timeout."
            await contentPublishDialog.waitForDialogClosed();
        });

    it(`GIVEN parent folder with child is selected and 'Publish' button clicked WHEN child has been removed in the dialog THEN dependents item gets not visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName1);
            CHILD_FOLDER = contentBuilder.buildFolder(displayName2);
            await studioUtils.doAddReadyFolder(PARENT_FOLDER);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddReadyFolder(CHILD_FOLDER);

            //Opens Publish Content dialog
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();

            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await contentPublishDialog.clickOnShowDependentItems();
            //Dependent item has been removed on the modal dialog
            await contentPublishDialog.removeDependentItem(CHILD_FOLDER.displayName);
            let result = await contentPublishDialog.getItemsToPublish();
            assert.isTrue(result.length === 1, "Only one item should be present in the dialog");
            assert.equal(result[0], PARENT_FOLDER.displayName, "Parent folder should be in items to publish");
        });

    it(`GIVEN existing parent folder(ready to publish) is selected and 'PublishDialog' is opened WHEN child has been removed AND Publish Now has been pressed THEN only parent folder should be published`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(PARENT_FOLDER.displayName);
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            await contentPublishDialog.clickOnShowDependentItems();
            //Dependent item has been removed on the modal dialog
            await contentPublishDialog.removeDependentItem(CHILD_FOLDER.displayName);
            //click on 'Publish Now'
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            await contentBrowsePanel.pause(1000);
            await studioUtils.saveScreenshot("status_in_browse_panel");
            let parentFolderStatus = await contentBrowsePanel.getContentStatus(PARENT_FOLDER.displayName);
            assert.equal(parentFolderStatus, appConst.CONTENT_STATUS.PUBLISHED, "Parent folder should be 'PUBLISHED'");

            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            let childStatus = await contentBrowsePanel.getContentStatus(CHILD_FOLDER.displayName);
            assert.equal(childStatus, appConst.CONTENT_STATUS.NEW, "child folder should be 'New'");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
