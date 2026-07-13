/**
 * Created on 07.08.2019.  updated on 09.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('request.publish.dialog.spec - opens request publish modal dialog and checks control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let FOLDER1_NAME = contentBuilder.generateRandomName('folder');

    it(`GIVEN folder is opened AND 'Marked as ready' is done WHEN request publish dialog has been opened THEN 'Next' button AND one item should be present in the dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open new folder-wizard:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER1_NAME);
            // 2. Click on  'mark as ready' then close Publish wizard:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCloseButton();
            await contentPublishDialog.waitForDialogClosed();
            // 3. Expand Publish Menu and select 'Request Publishing' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await studioUtils.saveScreenshot("wizard_publish_dialog_single_folder");
            // 4. Verify that  the status is Offline, New
            let status = await createRequestPublishDialog.getContentStatus(FOLDER1_NAME);
            assert.equal(status, appConst.CONTENT_STATUS.OFFLINE_NEW, "'Offline New' status should be displayed in the dialog");
            let isRemoveIconSDisabled = await createRequestPublishDialog.isRemoveItemIconDisabled(FOLDER1_NAME);
            // 5. Remove icon should be disabled
            assert.ok(isRemoveIconSDisabled, "One item should be displayed on the dialog and it should not be removable");
            await createRequestPublishDialog.waitForCreateRequestButtonDisabled();
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'Include child' icon has been clicked THEN 'All' checkbox should appear`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItemsCheckbox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);

            await studioUtils.saveScreenshot('request_publish_include_children');
            // 4. 'Show dependent items' link should appear, because all children are Ready for publishing
            await createRequestPublishDialog.waitForAllDependantsCheckboxDisplayed();
            let isSelected = await createRequestPublishDialog.isAllDependantsCheckboxSelected();
            assert.ok(isSelected, 'All checkbox should be selected');
            let result = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(result.length, 10, '10 dependent items should be present in the dialog');
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'All' checkbox has been unselected THEN 'Next' button should be disabled`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItemsCheckbox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // 4. Unselect 'All' checkbox
            await createRequestPublishDialog.clickOnAllDependantsCheckbox();
            await studioUtils.saveScreenshot('request_publish_include_all_unselected');
            // 5. Verify that 'Apply selection' button gets visible
            await createRequestPublishDialog.waitForApplySelectionButtonDisplayed();
            await createRequestPublishDialog.waitForCancelSelectionButtonDisplayed();
            // 6. Verify that 'Create' button is disabled:
            await createRequestPublishDialog.waitForCreateRequestButtonDisabled();
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'All' checkbox has been unselected AND 'Apply' button has been clicked THEN 'Hide excluded' button should be displaed`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItemsCheckbox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // 4. Unselect 'All' checkbox
            await createRequestPublishDialog.clickOnAllDependantsCheckbox();
            // 5. Click on 'Apply selection' button:
            //await createRequestPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('request_publish_exclude_items');
            // 6. Verify that 'Hide excluded' button gets visible:
            await createRequestPublishDialog.waitForHideExcludedItemsButtonDisplayed();
            // 7. All Dependent items should be shown:
            let result = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(result.length, 10, 'dependant items should be shown');
            let isSelected = await createRequestPublishDialog.isAllDependantsCheckboxSelected();
            assert.ok(isSelected === false, "'All' checkbox should not be selected");
            // 8. Verify that 'Create' button is enabled:
            await createRequestPublishDialog.waitForCreateRequestButtonEnabled();
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'Hide excluded'  button has been clicked THEN 'Show excluded' button gets visible`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItemsCheckbox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // 4. Unselect 'All' checkbox
            await createRequestPublishDialog.clickOnAllDependantsCheckbox();
            // 5. Click on 'Apply selection' button:
            await createRequestPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('request_publish_exclude_items');
            // 6. Verify that 'Hide excluded' button should be visible:
            await createRequestPublishDialog.clickOnHideExcludedItemsButton();
            // 7. "Show excluded" button should be visible:
            await createRequestPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            // 8. Verify that 'Create request' button is enabled:
            await createRequestPublishDialog.waitForCreateRequestButtonEnabled();
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'Exclude invalid items' has been clicked THEN 'Next' button gets enabled`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with invalid items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item:
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. Verify that Next is enabled(child items are not included)
            await createRequestPublishDialog.waitForCreateRequestButtonEnabled();
            // 4. Click on Include children icon:
            await createRequestPublishDialog.clickOnIncludeChildItemsCheckbox(appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_DISPLAY_NAME);
            // 5. Create button gets disabled now:
            await createRequestPublishDialog.waitForCreateRequestButtonDisabled();
            // 6. click on 'Exclude invalid items' button
            await createRequestPublishDialog.clickOnExcludeInvalidItemsButton();
            await studioUtils.saveScreenshot('request_dlg_excluded_invalid_items');
            // 7. Verify that 'Create' button gets enabled:
            await createRequestPublishDialog.waitForCreateRequestButtonEnabled();
        });

    it(`GIVEN existing folder is selected AND 'Request Publishing' menu item has been clicked  WHEN an item to publish has been clicked THEN this item should be opened in new wizard-tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1.Select the existing content:
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            // Expand Publish Menu and click on 'Request Publishing...' menu item:
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // click on the publish-item:
            await createRequestPublishDialog.clickOnItemToPublishAndSwitchToWizard(FOLDER1_NAME);
            // new wizard-tab should be opened
            await contentWizard.waitForOpened();
            await studioUtils.saveScreenshot('publish_request_dialog_item_clicked');
            let displayName = await contentWizard.getDisplayName();
            assert.equal(displayName, FOLDER1_NAME, 'Expected display name should be present in that wizard');
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
