/**
 * Created on 20.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageEditor = require('../../page_objects/wizardpanel/image.editor');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe("image.content.crop.spec: tests for crop button", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN an image is opened and edit mode is switched on  WHEN 'Close edit mode' has been clicked THEN Apply and close buttons are not visible`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. SWitch on the edit-mode
            await imageEditor.clickOnCropButton();
            await imageEditor.clickOnCloseEditModeButton();
            // 3. Verify that Apply, Close, zoom knob elements are not visible in non edit mode:
            await imageEditor.waitForApplyButtonNotDisplayed();
            await imageEditor.waitForCloseEditModeButtonNotDisplayed();
            await imageEditor.waitForZoomKnobNotDisplayed();
        });

    it(`GIVEN existing image is opened WHEN Crop button has been clicked THEN Apply, Close, Zoom Knob buttons should be visible in the edit mode`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Verify that 'Apply' button is not displayed in the editor-toolbar
            await imageEditor.waitForApplyButtonNotDisplayed();
            await imageEditor.waitForCloseEditModeButtonNotDisplayed();
            // 3. Click on 'Crop' button and switch to 'edit' mode
            await imageEditor.clickOnCropButton();
            await studioUtils.saveScreenshot('image_crop_button_pressed');
            // 4. Verify that Apply, Close, Zoom Knob buttons get visible:
            await imageEditor.waitForApplyButtonDisplayed();
            await imageEditor.waitForCloseEditModeButtonDisplayed();
            await imageEditor.waitForZoomKnobDisplayed();
            // 5. Click on Crop button and close the 'edit' mode:
            await imageEditor.clickOnCropButton();
            // 6. Verify that Apply, Close, Zoom Knob buttons get not visible in not edit mode:
            await imageEditor.waitForApplyButtonNotDisplayed();
            await imageEditor.waitForCloseEditModeButtonNotDisplayed();
            await imageEditor.waitForZoomKnobNotDisplayed();
        });

    it(`GIVEN existing image is opened WHEN the image has been zoomed THEN 'Reset mask' button should appear`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Open the edit-mode
            await imageEditor.clickOnCropButton();
            let initialZoom = await imageEditor.getZoomKnobValue();
            assert.equal(initialZoom, 0);
            // 3. Move the knob to the right:
            await imageEditor.doZoomImage(30);
            // 4. Verify that the image is zoomed
            let zoomed = await imageEditor.getZoomKnobValue();
            assert.ok(zoomed > 0, "The image should be zoomed");
            // 5. Verify that Reset mask button gets visible
            await imageEditor.waitForResetMaskButtonDisplayed();
        });

    it(`GIVEN existing image has been zoomed WHEN 'Apply' button has been pressed THEN 'Reset filters' button should appear`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Open edit-mode and do zoom the image
            await imageEditor.clickOnCropButton();
            let initialZoom = await imageEditor.getZoomKnobValue();
            assert.equal(initialZoom, 0);
            await imageEditor.doZoomImage(30);
            await studioUtils.saveScreenshot("image_zoomed");
            // 3. Verify that the image is zoomed
            let zoomed = await imageEditor.getZoomKnobValue();
            assert.ok(zoomed > 0, "The image should be zoomed");
            // 4. Verify that 'Reset filters' button gets visible
            await imageEditor.clickOnApplyButton();
            await imageEditor.waitForResetFiltersDisplayed();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN existing zoomed image is opened WHEN 'Reset Mask' and 'Apply' buttons have been pressed THEN the image returns to the initial state`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open the zoomed image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Click on Crop button, 'Reset Mask' button gets visible in the edit mode.
            await imageEditor.clickOnCropButton();
            await studioUtils.saveScreenshot('image_reset_mask_1');
            let zoomed = await imageEditor.getZoomKnobValue();
            assert.ok(zoomed > 0, 'The image should be zoomed');
            // 3. Click on 'Reset Mask' button
            await imageEditor.clickOnResetMaskButton();
            await studioUtils.saveScreenshot('image_reset_mask_clicked');
            // 4. Verify that the image returns to the initial state
            let initialState = await imageEditor.getZoomKnobValue();
            assert.equal(initialState, '0', "The image should not be zoomed, knob value should be 0");
            // 5. Verify that 'Reset filters' button should not be visible
            await imageEditor.clickOnApplyButton();
            await imageEditor.waitForResetFiltersNotDisplayed();
            // 6. Save button gets enabled
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN existing image is opened WHEN the image has been cropped THEN 'Reset filters' gets visible`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open the zoomed image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Click on Crop button, 'Reset Mask' button gets visible in the edit mode.
            await imageEditor.clickOnCropButton();
            // 3. Crop the image:
            await imageEditor.doCropImage(-100);
            await studioUtils.saveScreenshot('image_cropped');
            // 5. Verify that 'Reset filters' button should be visible
            await imageEditor.clickOnApplyButton();
            await imageEditor.waitForResetFiltersDisplayed();
            // 6. Save button gets enabled
            await contentWizard.waitAndClickOnSave();
        });


    it(`GIVEN existing cropped image is opened WHEN 'Reset Mask' and 'Apply' buttons have been pressed THEN the image returns to the initial state`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open the zoomed image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Click on Crop button, 'Reset Mask' button gets visible in the edit mode.
            await imageEditor.clickOnCropButton();
            // 3. Crop the image:
            await imageEditor.clickOnResetMaskButton();
            await studioUtils.saveScreenshot("image_cropped_to_initial");
            // 4. Click on 'Apply' button
            await imageEditor.clickOnApplyButton();
            // 5. Verify that 'Reset filters' button gets not visible
            await imageEditor.waitForResetFiltersNotDisplayed();
            // 6. Save button gets enabled
            await contentWizard.waitAndClickOnSave();
        });

    //verifies XP-4167 Impossible to save changes and close the Wizard after an image was cropped
    it(`GIVEN the image has been cropped and saved WHEN try to close the browser tab THEN Alert dialog should not appear after closing the wizard`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open the existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.TELK);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Click on Crop button, 'Reset Mask' button gets visible in the edit mode.
            await imageEditor.clickOnCropButton();
            // 3. Crop the image:
            await imageEditor.doCropImage(-100);
            await studioUtils.saveScreenshot('image_cropped_2');
            await imageEditor.clickOnApplyButton();
            await imageEditor.waitForResetFiltersDisplayed();
            // 4. Save the content:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.clickOnCloseBrowserTab();
            // Check the alert:
            let isOpened = await contentWizard.isAlertOpen();
            if (isOpened) {
                await contentWizard.dismissAlert();
            }
            assert.ok(isOpened === false, "Alert should not appear");
        });


    it(`GIVEN existing image is cropped WHEN Reset Filters button has been pressed THEN 'Reset filters' gets not visible`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open the zoomed image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.ENTERPRISE);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Click on Crop button
            await imageEditor.clickOnCropButton();
            // 3. Crop the image:
            await imageEditor.doCropImage(-100);
            await studioUtils.saveScreenshot('image_cropped_2');
            // 4. Verify that 'Reset filters' button should be visible
            await imageEditor.clickOnApplyButton();
            await imageEditor.waitForResetFiltersDisplayed();
            // 5. Save button gets enabled
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 6. Click on 'Reset filters' button:
            await imageEditor.clickOnResetFiltersButton();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN existing image is opened WHEN the cropped version hase been reverted THEN 'Reset filters' get visible in Image Editor`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open the image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.ENTERPRISE);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Open Versions Panel
            await contentWizard.openVersionsHistoryPanel();
            // 3. Revert the previous version(image should be focused):
            await wizardVersionsWidget.clickAndExpandVersion(1);
            await wizardVersionsWidget.clickOnRestoreButton();
            await studioUtils.saveScreenshot('cropped_version_reverted');
            // 4. Verify that 'Reset filters' button gets visible:
            await imageEditor.waitForResetFiltersDisplayed();
            // 'Save' button should be disabled:
            await contentWizard.waitForSaveButtonDisabled();
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
