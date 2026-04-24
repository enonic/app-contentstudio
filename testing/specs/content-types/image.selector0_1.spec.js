/**
 * Created on 20.04.2021. updated on 23.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ImageSelectorForm = require('../../page_objects/wizardpanel/imageselector.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const VersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('image.selector0_1.spec tests for not required image selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const CONTENT_NAME = contentBuilder.generateRandomName('content');
    const IMAGE_DISPLAY_NAME1 = appConst.TEST_IMAGES.SEVEROMOR;
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    it("GIVEN wizard for new Image Selector(0:1) has been opened WHEN image selector has been expanded and one option has been clicked THEN the image should be displayed in the selected options",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.IMG_SELECTOR_0_1);
            await contentWizard.typeDisplayName(appConst.generateRandomName('selector'));
            await imageSelectorForm.waitForOptionsFilterInputDisplayed();
            // 2. Expand the image-selector and click on an image-item:
            await imageSelectorForm.filterOptionsAndSelectImage(appConst.TEST_IMAGES.TELK);
            await contentWizard.pause(500);
            // 3. Verify the selected image:
            let selectedOptions = await imageSelectorForm.getSelectedImagesDisplayNames();
            assert.equal(selectedOptions[0], appConst.TEST_IMAGES.TELK, "Expected image should be displayed in selected options");
            // 4. Click on Mark as ready button in the wizard toolbar:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            // 5. Verify that Show/Hide excluded items are not displayed by default configuration:
            await contentPublishDialog.waitForHideExcludedItemsButtonNotDisplayed();
            //await contentPublishDialog.waitForShowExcludedItemsButtonNotDisplayed();
            await studioUtils.saveScreenshot('publish_dlg_dependent_items');
            // 6. Verify that the selected image is displayed in the dependent items block:
            let dependantItems = await contentPublishDialog.getDisplayNameInDependentItems();
            console.log('dependantItems:', JSON.stringify(dependantItems, null, 2));
            let isPresent = await dependantItems.some(item => item.includes(appConst.TEST_IMAGES.TELK));
            assert.ok(isPresent, 'Publish Wizard - The selected image should be displayed in Dependent Items block');
        });

    it("GIVEN wizard for new Image Selector(0:1) has been opened WHEN name has been typed THEN options filter input should be displayed AND the content gets valid",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.IMG_SELECTOR_0_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 3. Verify that options filter input is displayed
            await imageSelectorForm.waitForOptionsFilterInputDisplayed();
            await imageSelectorForm.waitForUploaderButtonDisplayed();
            await imageSelectorForm.pause(1000);
            // 4. Verify that the content is valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'This content should be valid, because the image selector is not required input');
            // 5. Click on Mark as ready button:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCloseButton();
            await contentPublishDialog.waitForDialogClosed();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('test_workflow_icon');
            // 6. Verify that 'Save' button gets disabled:
            await contentWizard.waitForSaveButtonDisabled();
            // 7. Verify the workflow state:
            let workflow = await contentWizard.getContentWorkflowState();
            assert.equal(workflow, appConst.ICON_WORKFLOW_STATE.READY_FOR_PUBLISHING, "The content gets 'Ready for publishing'");
        });

    it(`GIVEN existing content (image is not selected) opened WHEN an image has been selected THEN content gets Work in progress`,
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content (image is not selected):
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. select an image:
            await imageSelectorForm.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME1);
            await studioUtils.saveScreenshot("image_selector_0_1");
            // 3. Verify the expected selected option:
            let names = await imageSelectorForm.getSelectedImagesDisplayNames();
            assert.equal(names[0], IMAGE_DISPLAY_NAME1);
            // 4. Verify that options filter input is not displayed:
            // TODO bug  Incorrect behavior in the selectors after item upload or deleted #10283
            //await imageSelectorForm.waitForOptionsFilterInputNotDisplayed();
            //await imageSelectorForm.waitForUploaderButtonDisabled();
            // 5. Verify that 'Save' button gets enabled:
            await contentWizard.waitForSaveButtonEnabled();
            await studioUtils.saveScreenshot('test_workflow_icon_2');
            // 6. Verify the workflow state:
            let iconState = await contentWizard.getContentWorkflowState();
            assert.equal(iconState, appConst.ICON_WORKFLOW_STATE.IN_PROGRESS, "The content gets 'in progress'");
            await contentWizard.waitAndClickOnSave();
        });

    it("GIVEN existing content is opened WHEN selected image has been removed THEN the content remains valid",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing valid content with selected image:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Click on 'Remove' button:
            await imageSelectorForm.clickOnRemoveButton(IMAGE_DISPLAY_NAME1);
            await studioUtils.saveScreenshot('test_workflow_icon_3');
            // 3. Verify that default action is 'Mark as Ready':
            await contentWizard.waitForMarkAsReadyButtonVisible();
            // 4. Verify that the content remains valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "The content remains valid after removing the selected image");
            // 5. The item is not displayed in Selected options:
            await imageSelectorForm.waitForItemNotDisplayedInSelectedOptions(IMAGE_DISPLAY_NAME1);
            // 6. Verify that Save button gets enabled:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    // TODO update tests for versions
    it.skip(
        "GIVEN existing image content(0:1) is opened(image is not selected) WHEN the previous version has been reverted THEN image should appear in the selected options",
        async () => {
            let imageSelectorForm = new ImageSelectorForm();
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let wizardVersionsWidget = new VersionsWidget();
            // 1. Open existing image content(no selected images):
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await contentWizard.pause(1000);
            // 2. Open Version widget
            await wizardContextPanel.openVersionHistory();
            await wizardVersionsWidget.waitForLoaded();
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            // 3. revert the version with single selected image:
            await wizardVersionsWidget.clickOnRestoreButton();
            // 4. Verify the selected image:
            let result = await imageSelectorForm.getSelectedImagesDisplayNames();
            assert.equal(result.length, 1, 'One image should be present in the selected options');
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
