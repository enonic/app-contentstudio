/**
 * Created on 07.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
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
            // 2.Click on  'mark as ready' then close Publish wizard:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            // 3. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentWizard.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            await studioUtils.saveScreenshot("wizard_publish_dialog_single_folder");
            let status = await createRequestPublishDialog.getContentStatus(FOLDER1_NAME);

            assert.equal(status, appConst.CONTENT_STATUS.NEW, "'New' status should be displayed in the dialog");
            let isPresent = await createRequestPublishDialog.waitForNextButtonDisplayed();
            assert.isTrue(isPresent, "'Next' button should be displayed");

            let isRemovable = await createRequestPublishDialog.isItemRemovable(FOLDER1_NAME);
            assert.isFalse(isRemovable, "One item should be displayed on the dialog and it should not be removable");
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
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            await studioUtils.saveScreenshot('request_publish_include_children');
            //3. 'Show dependent items' link should appear, because all children are Ready for publishing
            await createRequestPublishDialog.waitForAllDependantsCheckboxDisplayed();
            let isSelected = await createRequestPublishDialog.isAllDependantsCheckboxSelected();
            assert.isTrue(isSelected, 'All checkbox should be selected');
            let result = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(result.length, 10, '10 dependent items should be present in the dialog');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/6041
    // Disable Next button when Request Publishing dialog is in edit mode #6041
    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'All' checkbox has been unselected THEN 'Next' button should be disabled`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // 4. Unselect 'All' checkbox
            await createRequestPublishDialog.clickOnAllDependantsCheckbox();
            await studioUtils.saveScreenshot('request_publish_include_all_unselected');
            // 5. Verify that 'Apply selection' button gets visible
            await createRequestPublishDialog.waitForApplySelectionButtonDisplayed();
            await createRequestPublishDialog.waitForCancelSelectionButtonDisplayed();
            // 6. Verify that 'Next' button is disabled:
            await createRequestPublishDialog.waitForNextButtonDisabled();
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'All' checkbox has been unselected AND Apply button has been clicked THEN 'Show excluded' button should be disabled`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // 4. Unselect 'All' checkbox
            await createRequestPublishDialog.clickOnAllDependantsCheckbox();
            // 5. Click on 'Apply selection' button:
            await createRequestPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('request_publish_exclude_items');
            // 6. Verify that 'Show excluded' button gets visible:
            await createRequestPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            // 7. Dependent items should be hidden:
            let result = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(result.length, 0, 'dependant items should be hidden');
            // 8. Verify that 'Next' button is enabled:
            await createRequestPublishDialog.waitForNextButtonEnabled();
        });

    it(`GIVEN 'Request Publishing Wizard' is opened WHEN 'All' checkbox has been unselected AND Apply button has been clicked THEN 'Show excluded' button gets visible`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. folder with child items is selected:
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. click on 'Include children items'
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // 4. Unselect 'All' checkbox
            await createRequestPublishDialog.clickOnAllDependantsCheckbox();
            // 5. Click on 'Apply selection' button:
            await createRequestPublishDialog.clickOnApplySelectionButton();
            await studioUtils.saveScreenshot('request_publish_exclude_items');
            // 6. Verify that 'Show excluded' button gets visible:
            await createRequestPublishDialog.waitForShowExcludedItemsButtonDisplayed();
            // 7. Dependent items should be hidden:
            let result = await createRequestPublishDialog.getDisplayNameInDependentItems();
            assert.equal(result.length, 0, 'dependant items should be hidden in the modal dialog');
            // 8. Verify that 'Next' button is enabled:
            await createRequestPublishDialog.waitForNextButtonEnabled();
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
            await createRequestPublishDialog.waitForNextButtonEnabled();
            // 4. Click on Include children icon:
            await createRequestPublishDialog.clickOnIncludeChildItems(appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_DISPLAY_NAME);
            // 5. Next button gets disabled now:
            await createRequestPublishDialog.waitForNextButtonDisabled();
            // 6. click on 'Exclude invalid items' button
            await createRequestPublishDialog.clickOnExcludeInvalidItemsButton();
            await studioUtils.saveScreenshot('request_dlg_excluded_invalid_items');
            // 7. Verify that 'Next' button gets enabled:
            await createRequestPublishDialog.waitForNextButtonEnabled();
        });

    it(`GIVEN existing folder is selected AND 'Request Publishing...' menu item has been clicked  WHEN an item to publish has been clicked THEN this item should be opened in new wizard-tab`,
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

    // verifies https://github.com/enonic/app-contentstudio/issues/867  Create request button should be disabled when required input is empty
    it(`GIVEN folder is selected AND 'Request Publishing' dialog is opened WHEN 'Next' button has been pressed THEN new wizard page should be loaded`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1.Select the content:
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            // 2. Expand Publish Menu and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            await createRequestPublishDialog.clickOnNextButton();
            await studioUtils.saveScreenshot('request_publishing_next');
            // 'Create Request' button should be disabled , because required input is empty:
            await createRequestPublishDialog.waitForCreateRequestButtonDisabled();
            // Previous button.
            await createRequestPublishDialog.waitForPreviousButtonDisplayed();
        });

    it(`GIVEN the second page in 'Request Publishing' wizard is opened WHEN 'Previous' button has been pressed THEN first wizard page should be loaded`,
        async () => {
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1.Select the content:
            await studioUtils.findAndSelectItem(FOLDER1_NAME);
            // 2. Expand 'Publish Menu' and select 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuAndClickOnRequestPublish();
            // 3. Go to the second step in the wizard:
            await createRequestPublishDialog.clickOnNextButton();
            // 4. click on 'Previous' button
            await createRequestPublishDialog.clickOnPreviousButton();
            // 'Next' button should appear:
            await createRequestPublishDialog.waitForNextButtonDisplayed();
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
