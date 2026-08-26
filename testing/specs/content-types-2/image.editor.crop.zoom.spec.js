/**
 * Created on 20.09.2021  updated on 25.08.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const LiveViewImageEditor = require('../../page_objects/wizardpanel/liveview.image.editor');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('image.content.crop.spec: tests for crop button', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const TEST_IMAGE = appConst.TEST_IMAGES.BRO;

    it(`GIVEN Crop button has been pressed THEN Apply and Cancel buttons become visible and other editing buttons get disabled`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open an existing image:
        await studioUtils.selectContentAndOpenWizard(TEST_IMAGE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Click on Crop button
        await imageEditor.clickOnCropButton();
        await contentWizard.waitForSaveButtonDisabled();
        // 3. Verify that Rotate, Flip, Focus are disabled now
        await imageEditor.waitForRotateButtonDisabled();
        await imageEditor.waitForFlipButtonDisabled();
        await imageEditor.waitForFocusButtonDisabled();
        // 4. Verify that Upload button is not visible:
        await imageEditor.waitForUploadButtonNotDisplayed();
        // 5. Apply  button is displayed:
        await imageEditor.waitForApplyButtonDisplayed();
        // 6. Cancel button is displayed:
        await imageEditor.clickOnCancelButton();
        await imageEditor.waitForUploadButtonDisplayed();
        await imageEditor.waitForRotateButtonEnabled();
        await imageEditor.waitForFlipButtonEnabled();
        await imageEditor.waitForFocusButtonEnabled();
        await contentWizard.waitForSaveButtonDisabled();
    });

    it(`GIVEN 'Crop' button has been pressed WHEN Apply button has been clicked THEN Apply, Cancel buttons should not be visible`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        // 1. Open an existing image:
        await studioUtils.selectContentAndOpenWizard(TEST_IMAGE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Click on 'Crop' button
        await imageEditor.clickOnCropButton();
        await studioUtils.saveScreenshot('image_crop_button_pressed');
        // 3. Click on Apply button :
        await imageEditor.clickOnApplyButton();
        // 4. Verify that Apply, Close, Zoom Knob buttons get not visible in not edit mode:
        await imageEditor.waitForApplyButtonNotDisplayed();
        await imageEditor.waitForCancelEditModeButtonNotDisplayed();
    });

    it(`GIVEN existing image is opened WHEN the image has been cropped THEN 'Reset' gets visible AND Save button is enabled`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open the zoomed image:
        await studioUtils.selectContentAndOpenWizard(TEST_IMAGE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Click on Crop button, 'Reset Mask' button gets visible in the edit mode.
        await imageEditor.clickOnCropButton();
        // 3. Crop the image:
        await imageEditor.doCropImage(-100);
        await studioUtils.saveScreenshot('image_cropped');
        // 5. Verify that 'Reset filters' button should be visible
        await imageEditor.clickOnApplyButton();
        await imageEditor.waitForResetButtonDisplayed();
        // 6. Save button gets enabled
        await contentWizard.waitAndClickOnSave();
        await contentWizard.waitForNotificationMessage();
    });

    it.skip(`GIVEN existing cropped image is opened WHEN 'Crop' button have been pressed THEN Reset button should be displayed`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open the zoomed image:
        await studioUtils.selectContentAndOpenWizard(TEST_IMAGE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Click on Crop button, 'Reset' button gets visible.
        await imageEditor.clickOnCropButton();
        // 3. Crop the image:
        await imageEditor.clickOnResetButton();
        await studioUtils.saveScreenshot('image_cropped_to_initial');
        // 4. Click on 'Apply' button
        await imageEditor.clickOnApplyButton();
        // 5. Verify that 'Reset' button gets not visible
        await imageEditor.waitForResetButtonNotDisplayed();
        // 6. Save button gets enabled
        await contentWizard.waitForSaveButtonEnabled();
    });

    it(`GIVEN the cropped image is opened WHEN Reset button has been pressed AND Save pressed THEN Reset button should not be visible`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open the existing image:
        await studioUtils.selectContentAndOpenWizard(TEST_IMAGE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        await studioUtils.saveScreenshot('image_cropped_reopened');
        await imageEditor.waitForResetButtonDisplayed();
        await imageEditor.clickOnResetButton();
        // 4. Save the content:
        await contentWizard.waitAndClickOnSave();
        await imageEditor.waitForResetButtonNotDisplayed();
    });

    it.skip(`GIVEN existing image is opened WHEN the cropped version has been reverted THEN 'Reset' get visible in Image Editor`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        let wizardVersionsWidget = new WizardVersionsWidget();
        // 1. Open the image:
        await studioUtils.selectContentAndOpenWizard(TEST_IMAGE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Open Versions Panel
        await contentWizard.openVersionsHistoryPanel();
        // 3. Revert the previous version(image should be focused):
        await wizardVersionsWidget.clickAndExpandVersion(1);
        await wizardVersionsWidget.clickOnRestoreButton();
        await studioUtils.saveScreenshot('cropped_version_reverted');
        // 4. Verify that 'Reset filters' button gets visible:
        await imageEditor.waitForResetButtonDisplayed();
        // 'Save' button should be disabled:
        await contentWizard.waitForSaveButtonDisabled();
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
