/**
 * Created on 10.10.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const appConst = require('../../libs/app_const');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('publish.wizard.complex.dependencies.spec - tests for config with non required dependencies', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CHILD_FOLDER;
    const SHORTCUT_NAME = studioUtils.generateRandomName('shortcut');
    const SHORTCUT_NAME_2 = studioUtils.generateRandomName('shortcut');
    const EXPECTED_NUMBER_ALL = 'All (2)';

    const SHORTCUT_NAME_3 = contentBuilder.generateRandomName('shortcut');
    let TEST_FOLDER;
    const FOLDER_DISPLAY_NAME_2 = appConst.generateRandomName('folder');

    it("Precondition: site with child folder should be added",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES],
                appConst.CONTROLLER_NAME.MAIN_REGION);
            await studioUtils.doAddSite(SITE);
            let folderName = contentBuilder.generateRandomName('child-folder');
            CHILD_FOLDER = contentBuilder.buildFolder(folderName);
            // Select the site and add a child folder:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.doAddReadyFolder(CHILD_FOLDER);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/6931
    // Incorrect behaviour of apply selection in Publish Wizard #6931
    it("GIVEN site's child folder has been selected in the shortcut wizard WHEN checkbox for the child-item has been selected in dependant block THEN new dependant item should appears for the parent site",
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open shortcut-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            // 2. Select the folder in the target selector:
            await shortcutForm.filterOptionsAndSelectTarget(CHILD_FOLDER.displayName);
            // 3. Click on 'Mark as ready' button and open 'Publish wizard':
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that 'Hide Excluded' Items button is displayed:
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 5. Verify that only child-item is displayed in the dependant block:
            let items = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.ok(items[0].includes(CHILD_FOLDER.displayName), 'Only child-item should be displayed in the dependant block');
            assert.equal(items.length, 1, 'Only one dependent-item should be displayed in the block');
            // 6. Click on the checkbox:  dependent item for the child folder
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 7. Click on 'Apply selection' button:
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_wizard_with_selected_parent_item');
            // 8. Verify that item for the parent site gets visible and disabled
            let isEnabled = await contentPublishDialog.isDependantCheckboxEnabled(SITE.displayName);
            assert.ok(isEnabled === false, 'The parent-item should be disabled in the dependant block');
            let isSelected = await contentPublishDialog.isDependantCheckboxSelected(SITE.displayName);
            assert.ok(isSelected, 'The parent-item should be selected in the dependant block');
            isSelected = await contentPublishDialog.isDependantCheckboxSelected(CHILD_FOLDER.displayName);
            // 9. Verify that item for the child folder should be selected as well:
            assert.ok(isSelected, 'The child-item should be selected in the dependant block');
            // 10. Verify that 'Publish now' button gets disabled, because the just selected site is 'work in progress'
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            // 11. Verify that 'Mark as ready' button gets visible in the modal dialog, 'work in progress' item is selected now:
            await contentPublishDialog.waitForMarkAsReadyButtonDisplayed();
        });

    it("GIVEN wizard for new shortcut is opened AND site's child folder has been selected in the target selector WHEN checkbox for the child-item has been selected in Publish Wizard THEN 'Hide Excluded' Items button gets hidden",
        async () => {
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open shortcut-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_NAME_2);
            // 2. Select the folder in the target selector:
            await shortcutForm.filterOptionsAndSelectTarget(CHILD_FOLDER.displayName);
            // 3. Click on 'Mark as ready' button and open  'Publish wizard':
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that Hide Excluded Items button is displayed(the child folder is not required):
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 5. Select the item for the child folder:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 6. Click on 'Apply selection' button:
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_wizard_with_selected_child_item');
            // 7. Verify the number of items in the All-checkbox:
            let actualNumber = await contentPublishDialog.getNumberInAllCheckbox();
            assert.equal(actualNumber, EXPECTED_NUMBER_ALL, "'All (2)' should be displayed in the checkbox");
            // 12. Verify that Hide/Show Excluded Items buttons are hidden:
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
        });

    it("GIVEN checkbox for 'work in progress' item has been selected in 'dependent block' WHEN 'mark as ready button' has been clicked in the dialog THEN 'Publish Now' button gets enabled",
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open the existing content:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_NAME_2);
            let contentBrowsePanel = new ContentBrowsePanel();
            // 2. Click on 'PUBLISH...' button and open  'Publish wizard':
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 3. Select the item for the child folder:
            await contentPublishDialog.clickOnCheckboxInDependentItem(CHILD_FOLDER.displayName);
            // 4. Click on 'Apply selection' button:
            await contentPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('publish_wizard_with_selected_parent_item_2');
            // 5. Verify that 'Mark as ready' button is displayed on the modal dialog, click on it:
            await contentPublishDialog.clickOnMarkAsReadyButton();
            // 6. Verify that 'Hide Excluded' Items button is hidden, all dependent items are selected now
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            // 7. Verify that 'Publish now' gets enabled, because Mark as ready button was clicked:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            // 8. Click on 'Publish now' button:
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            // 9. Close the wizard and switch to Browse panel:
            await studioUtils.doCloseWindowTabAndSwitchToBrowsePanel();
            // 10. Verify that the parent site is published:
            await studioUtils.findAndSelectItem(SITE.displayName);
            let status = await contentBrowsePanel.getContentStatus(SITE.displayName);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, "the parent site should be with 'Published' status");
            // 11. Verify that the child folder is published as well:
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            assert.equal(status, appConst.CONTENT_STATUS.ONLINE, "the child folder should be with 'Published' status");
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/6997
    //  Dependencies section is displayed in the Publishing Wizard when all dependencies are published
    it("GIVEN published shortcut has been modified WHEN 'Mark as ready' button has been pressed THEN 'Hide/Show Excluded' button should not be visible",
        async () => {
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open the existing shortcut:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_NAME_2);
            // 2. Modify the shortcut - add a parameter:
            await shortcutForm.clickOnAddParametersButton();
            await shortcutForm.typeParameterName('par1');
            await shortcutForm.typeParameterValue('value1');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 3. Click on 'Mark as ready' button, open Publish Wizard:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('shortcut_publish_wizard_issue_6997');
            // 4. Verify that Show/Hide excluded buttons are not displayed:
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
        });

    it("Precondition: modified folder should be added",
        async () => {
            let folderName = appConst.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(folderName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 1. Publish the folder:
            await studioUtils.openDialogAndPublishSelectedContent();

            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            // 2. Update the folder(gets modified):
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.switchToContentTabWindow(TEST_FOLDER.displayName);
            await contentWizard.waitForOpened();
            await contentWizard.typeDisplayName(FOLDER_DISPLAY_NAME_2);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    // Verify - Modified dependencies are not displayed in the Publishing Wizard #7005
    // https://github.com/enonic/app-contentstudio/issues/7005
    it(`GIVEN existing 'modified' folder has been selected in the shortcut form WHEN 'Publish wizard' has been opened THEN modified dependency should be displayed in the Publish Wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            let contentPublishDialog = new ContentPublishDialog();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            // 1. Fill in the name input:
            await contentWizard.typeDisplayName(SHORTCUT_NAME_3);
            // 2. select the target:
            await shortcutForm.filterOptionsAndSelectTarget(FOLDER_DISPLAY_NAME_2);
            // 3. Click on 'Mark as ready' button and open Publish Wizard
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that 'Hide excluded' button is displayed
            await contentPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 5. Verify that 'Modified' content is displayed in the dependencies list
            let actualItems = await contentPublishDialog.getDisplayNameInDependentItems();
            assert.equal(actualItems.length, 1, "One item should be present in the list");
            assert.ok(actualItems[0].includes(TEST_FOLDER.displayName),
                "Expected folder-name(path) should be present in the dependencies list");
        });

    it(`GIVEN existing 'published' folder is selected in the shortcut form WHEN 'Publish wizard' has been opened THEN 'published' dependency should not be displayed in the Publish Wizard`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(TEST_FOLDER.displayName);
            // 1. Publish the folder:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            // 2. Open the shortcut:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_NAME_3);
            // 3. Click on 'Publish' button and open Publish Wizard
            await contentWizard.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            // 4. Verify that 'Hide excluded' button is not displayed
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            await contentPublishDialog.waitForDependantsBlockNotDisplayed();
            // 5. Verify Publish button is enabled:
            await contentPublishDialog.waitForPublishNowButtonEnabled();
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
