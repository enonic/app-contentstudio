/**
 * Created on 21.09.2021 updated on 24.08.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const LiveViewImageEditor = require('../../page_objects/wizardpanel/liveview.image.editor');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe('image.editor.focus.spec: tests for focus button', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const CIRCLE_CX = 100;
    const CIRCLE_CY = 50;

    it(`GIVEN image is opened WHEN Focus button clicked and edit mode cancelled THEN editor buttons should be enabled again`, async () => {
        let liveViewImageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open an existing image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Click on 'Focus' button and switch to 'edit' mode
        await liveViewImageEditor.clickOnFocusButton();
        // 3. Verify that Circle becomes displayed:
        await liveViewImageEditor.waitForFocusCircleDisplayed();
        // 4. Verify that Crop Flip Rotate Focus buttons are disabled
        await liveViewImageEditor.waitForCropButtonDisabled();
        await liveViewImageEditor.waitForFlipButtonDisabled();
        await liveViewImageEditor.waitForRotateButtonDisabled();
        await liveViewImageEditor.waitForUploadButtonNotDisplayed();
        // 5. Cancel the edit mode:
        await liveViewImageEditor.clickOnCancelButton();
        // 6. Verify that Crop Flip Rotate Focus buttons becomes enabled again
        await liveViewImageEditor.waitForCropButtonEnabled();
        await liveViewImageEditor.waitForFlipButtonEnabled();
        await liveViewImageEditor.waitForRotateButtonEnabled();
        await liveViewImageEditor.waitForFocusButtonEnabled();
        await liveViewImageEditor.waitForUploadButtonDisplayed();
    });

    it(`GIVEN image is opened WHEN focus has been applied THEN Save button should be enabled and 'Reset' button should appear`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open an existing image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Verify that red circle is not displayed
        await imageEditor.waitForFocusCircleNotDisplayed();
        // 3. Click on 'Focus' button and switch to 'edit' mode
        await imageEditor.clickOnFocusButton();
        await imageEditor.waitForFocusCircleDisplayed();
        // 4. Drag the focus circle in edit mode and press on Apply:
        await imageEditor.doDragFocus(CIRCLE_CX, CIRCLE_CY);
        await imageEditor.clickOnApplyButton();
        // 5. Verify that 'Reset' button gets visible in the LiveViewImageEditor:
        await imageEditor.waitForResetButtonDisplayed();
        // 6. Save button should be enabled now:
        await contentWizard.waitForSaveButtonEnabled();
    });

    it(`GIVEN image is opened WHEN focus has been applied THEN Save button should be enabled and Reset Filters button should appear`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open an existing image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Verify that red circle is not displayed
        await imageEditor.waitForFocusCircleNotDisplayed();
        // 3. Click on 'Focus' button and switch to 'edit' mode
        await imageEditor.clickOnFocusButton();
        await imageEditor.waitForFocusCircleDisplayed();
        // 4. Drag the focus circle in edit mode and press on Apply:
        await imageEditor.doDragFocus(CIRCLE_CX, CIRCLE_CY);
        await imageEditor.clickOnResetButton();
        // 5. Verify that 'Reset Filter' button gets visible in the edit mode:
        await imageEditor.waitForApplyButtonDisplayed();
        // 6. Save button should be enabled now:
        await contentWizard.waitForSaveButtonDisabled();
        await imageEditor.clickOnApplyButton();
        await imageEditor.waitForUploadButtonDisplayed();
    });

    it(`GIVEN existing image is opened WHEN focus circle has been moved AND 'Apply' button pressed THEN focus circle should be displayed in the editor`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open an existing image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Verify that red circle is not displayed
        //await imageEditor.waitForFocusCircleNotDisplayed();
        // 3. Click on 'Focus' button and switch to 'edit' mode
        await imageEditor.clickOnFocusButton();
        // 4. Drag the red circle in edit mode:
        await imageEditor.doDragFocus(CIRCLE_CX, CIRCLE_CY);
        // 5. Verify that 'Reset Autofocus' button gets visible in the edit mode:
        await imageEditor.waitForResetAutofocusButtonDisplayed();
        // 6. Click on 'Apply' button and close the edit mode:
        await imageEditor.clickOnApplyButton();
        // 7. Verify that red circle is displayed in the Image Editor:
        await imageEditor.waitForFocusCircleDisplayed();
        await contentWizard.waitAndClickOnSave();
    });

    it(`WHEN existing focused image is opened THEN button 'Reset' and focus circle should be displayed in Image Editor`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        // 1. Open the focused image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        await studioUtils.saveScreenshot('image_focused');
        // 2. Verify that 'Reset' button is displayed
        await imageEditor.waitForResetButtonDisplayed();
        await imageEditor.waitForFocusCircleDisplayed();
    });

    // TODO bug https://github.com/enonic/app-contentstudio/issues/11329
    // Image Editor: "Reset Autofocus" button is missing when editing the focal point
    it.skip(`GIVEN existing focused image is opened WHEN 'Reset' AND 'Apply' button have been pressed THEN button 'Reset' and focus circle become not visible in Image Editor`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        // 1. Open the focused image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Click on 'Focus' button and switch to 'edit' mode
        await imageEditor.clickOnFocusButton();
        // 3. Click on 'Reset Autofocus' button
        await imageEditor.clickOnResetButton();
        await imageEditor.clickOnApplyButton();
        await studioUtils.saveScreenshot('focused_image_to_initial');
        // 4. Verify that 'Reset filters' button is not displayed
        await imageEditor.waitForResetButtonNotDisplayed();
        // 5. Verify that focus circle is not displayed in Image Editor
        //await imageEditor.waitForFocusCircleNotDisplayed();

        await contentWizard.waitAndClickOnSave();
    });

    it.skip(`GIVEN existing image is opened WHEN the focused version has been reverted THEN 'Reset filters' and focus circle get visible in Image Editor`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        let wizardVersionsWidget = new WizardVersionsWidget();
        // 1. Open the image:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        // 2. Open Versions Panel
        await contentWizard.openVersionsHistoryPanel();
        // 3. Revert the focused version:
        await wizardVersionsWidget.clickAndExpandVersion(1);
        await wizardVersionsWidget.clickOnRestoreButton();
        // 4. Verify that 'Reset filters' button gets visible:
        await imageEditor.waitForResetButtonDisplayed();
        await imageEditor.waitForFocusCircleDisplayed();
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
