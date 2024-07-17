/**
 * Created on 22.07.2019.
 */
const assert = require('node:assert');
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
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER1_NAME;
    let PARENT_FOLDER;
    let CHILD_FOLDER;
    const PARENT_FOLDER_NAME = appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME;
    const TEST_IMAGE = appConst.TEST_IMAGES.WHALE;

    it(`GIVEN existing shortcut with selected target WHEN publish dialog has been opened in the wizard THEN checkboxe for dependent item should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let shortcutForm = new ShortcutForm();
            // 1. Open wizard for new shortcut:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('shortcut'));
            // 2. Select a target in the selector:
            await shortcutForm.filterOptionsAndSelectTarget(TEST_IMAGE);
            // 3. Open Publish Wizard:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that dependants block with expected title should be present in the dialog:
            await contentPublishDialog.waitForDependantsBlockDisplayed();
            await studioUtils.saveScreenshot('wizard_publish_dialog_all_checkbox_selected');
            // 5. Verify that 'All' checkbox is selected by default:  settings.hideDefaultProject=false
            let isSelected = await contentPublishDialog.isAllDependantsCheckboxSelected();
            assert.ok(isSelected, "'All' checkbox should be selected by default");
            // 6. Verify that the dependant-checkbox is selected and enabled:
            let dependantItem = PARENT_FOLDER_NAME + '/' + TEST_IMAGE;
            isSelected = await contentPublishDialog.isDependantCheckboxSelected(dependantItem);
            assert.ok(isSelected, "The dependant item-checkbox should be selected by default");
            let isEnabled = await contentPublishDialog.isDependantCheckboxEnabled(dependantItem);
            assert.ok(isEnabled, "The dependant item-checkbox should be enabled by default");
        });

    it(`GIVEN a folder is opened AND 'Marked as ready' is done WHEN publish dialog has been opened THEN 'New' status should be displayed in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            FOLDER1_NAME = contentBuilder.generateRandomName('folder');
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER1_NAME);
            // 1. Click on 'MARK AS READY' default action:
            await contentWizard.clickOnMarkAsReadyButton();
            await studioUtils.saveScreenshot('wizard_publish_dialog_single_folder');
            let status = await contentPublishDialog.getContentStatus(FOLDER1_NAME);
            // 2. 'New' status should be displayed in the modal dialog:
            assert.equal(status, appConst.CONTENT_STATUS.NEW, "'New' status should be displayed in the dialog");
            // 3. 'Add Schedule' button should be displayed as well:
            await contentPublishDialog.waitForAddScheduleIconDisplayed();
            // 4. This item should not be removable, remove-icon should be disabled:
            let isEnabled = await contentPublishDialog.isRemoveItemIconEnabled(FOLDER1_NAME);
            assert.ok(isEnabled === false, "This item should not be removable, remove-icon should be disabled");
            // 5. 'Include Children' toggler should not be displayed, the folder has no children!
            let isDisplayed = await contentPublishDialog.isIncludeChildTogglerDisplayed();
            assert.ok(isDisplayed === false, "'Include child' icon should not be visible");
        });


    it(`GIVEN existing folder with children is selected WHEN 'Publish' button(browse toolbar) has been pressed THEN expected control elements should be displayed in the dialog`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select a folder with child items:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            // 2. Click on 'Publish...' button
            await contentBrowsePanel.clickOnPublishButton();
            await studioUtils.saveScreenshot('grid_publish_dialog_parent_folder');
            // 3. Verify that New status is displayed:
            let status = await contentPublishDialog.getContentStatus(appConst.TEST_FOLDER_WITH_IMAGES);
            assert.equal(status, "New", "'New' status should be displayed in the dialog");
            // 4. Verify  that "Add schedule" button should be displayed:
            await contentPublishDialog.waitForAddScheduleIconDisplayed();
            // Remove-icon should be disabled for the Parent item
            let isEnabled = await contentPublishDialog.isRemoveItemIconEnabled(appConst.TEST_FOLDER_WITH_IMAGES);
            assert.ok(isEnabled === false, "Remove icon should be disabled for the Parent item");

            let isDisplayed = await contentPublishDialog.isIncludeChildTogglerDisplayed();
            assert.ok(isDisplayed, "Include child icon should be visible");

            // 'Publish Now' button should be enabled!
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            // Log message link should be displayed:
            let isLinkDisplayed = await contentPublishDialog.isLogMessageLinkDisplayed();
            assert.ok(isLinkDisplayed, "Log message link should be displayed");
        });

    it(`GIVEN folder with children is selected AND Publish... button ahs been pressed WHEN 'Include children' button has been clicked THEN all dependent items with checkboxes gets visible`,
        async () => {
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            // 1. Click on 'Publish...' button
            await contentBrowsePanel.clickOnPublishButton();
            // 2. 'Include children' has been clicked
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 3. 'All' checkbox gets visible:
            await contentPublishDialog.waitForAllDependantsCheckboxDisplayed();
            let isSelected = await contentPublishDialog.isAllDependantsCheckboxSelected();
            assert.ok(isSelected, "'All' checkbox should be selected");
            let items = await contentPublishDialog.getNumberItemsToPublish();
            assert.equal(items, '14', "14 items to publish should be in the dialog");
        });


    it(`GIVEN 'Content Publish' dialog is opened WHEN 'cancel' button on the bottom has been clicked THEN dialog is closing`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. folder with children is selected and 'Publish' button pressed
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 2. Button 'Cancel' in the top of dialog has been pressed:
            await contentPublishDialog.clickOnCancelTopButton();
            // 3. "dialog is closing. Otherwise, exception will be thrown after the timeout."
            await contentPublishDialog.waitForDialogClosed();
        });

    it(`GIVEN 'Publish Tree...' menu item has been clicked THEN 'All' checkbox should be visible and expected items to publish are present`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            PARENT_FOLDER = contentBuilder.buildFolder(displayName1);
            CHILD_FOLDER = contentBuilder.buildFolder(displayName2);
            await studioUtils.doAddReadyFolder(PARENT_FOLDER);
            // 1. Select the parent folder (one child item)
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddReadyFolder(CHILD_FOLDER);

            // 2. Click on 'Publish Tree' menu item:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Verify that All checkbox is displayed:
            await contentPublishDialog.waitForAllDependantsCheckboxDisplayed();
            let isSelected = await contentPublishDialog.isAllDependantsCheckboxSelected();
            assert.ok(isSelected, "'All' checkbox should be selected");
            // 4. Verify items to publish
            let result = await contentPublishDialog.getItemsToPublish();
            assert.ok(result.length === 1, '1 item to publish should be present in the dialog');
            let dependantItems = await contentPublishDialog.getDisplayNameInDependentItems();
            // 5. Verify dependent item to publish:
            assert.ok(dependantItems.length === 1, '1 dependent item should be present in the dialog');
            assert.ok(dependantItems[0].includes(CHILD_FOLDER.displayName), 'Expected dependent item should be displayed');
        });

    it(`GIVEN 'Publish Tree...' menu item has been clicked WHEN 'Exclude child items' has been has been clicked THEN 'All' checkbox gets not visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder (one child item)
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on 'Publish Tree' menu item:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Click on 'Include child items' toggler icon
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 4. Verify that 'All' checkbox gets not visible:
            await contentPublishDialog.waitForAllDependantsCheckboxNotDisplayed();
            await contentPublishDialog.waitForPublishNowButtonEnabled();
        });

    it(`GIVEN 'Publish Wizard' is opened WHEN click on 'All' checkbox and unselect items THEN Apply button gets visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder (one child item)
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on 'Publish Tree' menu item:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Unselect  'All' checkbox
            await contentPublishDialog.clickOnAllDependantsCheckbox();
            // 4. Verify that 'Apply' button gets visible:
            await contentPublishDialog.waitForApplySelectionButtonDisplayed();
            // 5. Verify that 'Publish Now' button gets disabled:
            await contentPublishDialog.waitForPublishNowButtonDisabled();
        });

    it(`GIVEN 'Publish Wizard' is opened WHEN unselect then select all items THEN 'Apply' button should not be visible`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Select the parent folder (one child item)
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            // 2. Click on 'Publish Tree' menu item:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            // 3. Unselect  'All' checkbox
            await contentPublishDialog.clickOnAllDependantsCheckbox();
            // 4. Verify that 'Apply' button gets visible:
            await contentPublishDialog.waitForApplySelectionButtonDisplayed();
            // 5. Select 'All' checkbox again:
            await contentPublishDialog.clickOnAllDependantsCheckbox();
            // 6. Verify that 'Apply' button gets hidden and 'Publish Now' button gets enabled:
            await contentPublishDialog.waitForApplySelectionButtonNotDisplayed();
            await contentPublishDialog.waitForPublishNowButtonEnabled();
        });

    it(`GIVEN existing parent folder(ready to publish) is selected and 'PublishDialog' is opened WHEN child has been removed AND Publish Now has been pressed THEN only parent folder should be published`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let contentWizard = new ContentWizard();
            // 1. Select a parent folder:
            await studioUtils.selectContentAndOpenWizard(PARENT_FOLDER.displayName);
            // 2. OPen Publish Wizard:
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            // 3. Exclude the child item in Dependent block
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 4. Verify that Apply button gets visible then click on it:
            await contentPublishDialog.clickOnApplySelectionButton();
            // 5. click on 'Publish Now'
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            // 6. Go to grid and verify statuses of parent and child content:
            await studioUtils.doCloseWizardAndSwitchToGrid();
            await contentBrowsePanel.pause(1000);
            await studioUtils.saveScreenshot('status_in_browse_panel');
            let parentFolderStatus = await contentBrowsePanel.getContentStatus(PARENT_FOLDER.displayName);
            assert.equal(parentFolderStatus, appConst.CONTENT_STATUS.PUBLISHED, "Parent folder should be 'PUBLISHED'");

            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            let childStatus = await contentBrowsePanel.getContentStatus(CHILD_FOLDER.displayName);
            assert.equal(childStatus, appConst.CONTENT_STATUS.NEW, "child folder should be 'New'");
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
