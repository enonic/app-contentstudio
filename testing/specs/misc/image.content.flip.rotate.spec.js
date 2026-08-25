/**
 * Created on 05.06.2019.  updated on 25.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const LiveViewImageEditor = require('../../page_objects/wizardpanel/liveview.image.editor');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const appConst = require('../../libs/app_const');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('image.content.flip.rotate.spec: Open an image and flip and rotate it', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`WHEN existing image is opened THEN 'Preview' button should be enabled`, async () => {
        let contentItemPreviewPanel = new ContentItemPreviewPanel();
        let contentWizard = new ContentWizard();
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.NORD);
        await studioUtils.saveScreenshot('image_wizard_preview');
        // TODO bug https://github.com/enonic/app-contentstudio/issues/11333
        //await contentWizard.waitForPreviewButtonEnabled();
        let result = await contentItemPreviewPanel.getSelectedOptionInPreviewWidget();
        assert.equal(
            result,
            appConst.PREVIEW_WIDGET.AUTOMATIC,
            'Automatic option should be selected in the Preview widget',
        );
    });

    it(`GIVEN existing image is opened WHEN image is rotated and Reset button is pressed THEN Save button gets disabled`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let contentWizard = new ContentWizard();
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.NORD);
        // 1. Click on Rotate button
        await imageEditor.clickOnRotateButton();
        // 2. Verify that 'Reset' button gets visible
        await imageEditor.waitForResetButtonDisplayed();
        await imageEditor.waitForRotateButtonEnabled();
        await studioUtils.saveScreenshot('image_rotated');
        // 3. Verify that Save buttons gets enabled
        await contentWizard.waitForSaveButtonEnabled();
        // 4. Click on 'Reset' button
        await imageEditor.waitForResetButtonDisplayed();
        await imageEditor.waitForUploadButtonDisplayed();
        await imageEditor.clickOnResetButton();
        await studioUtils.saveScreenshot('image_rotate_reset_filter_pressed3');
        // 5. Verify that Save button is disabled now
        await contentWizard.waitForSaveButtonDisabled();
        // 6. Verify that 'Reset' button gets not visible:
        await imageEditor.waitForResetButtonNotDisplayed();
        await imageEditor.waitForUploadButtonDisplayed();
    });

    it(`GIVEN existing image is opened WHEN image is flipped and Reset button is pressed THEN Save button gets disabled`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let contentWizard = new ContentWizard();
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.NORD);
        await studioUtils.saveScreenshot('image_flip_reset_filter_pressed1');
        // 1. Click on Flip button:
        await imageEditor.clickOnFlipButton();
        // 2. Verify that 'Reset' button gets visible
        await imageEditor.waitForResetButtonDisplayed();
        await studioUtils.saveScreenshot('image_flip_reset_filter_pressed2');
        // 3. Verify that 'Save' button is enabled
        await contentWizard.waitForSaveButtonEnabled();
        // 4. Click on 'Reset' button
        await imageEditor.clickOnResetButton();
        await studioUtils.saveScreenshot('image_flip_reset_filter_pressed3');
        // Save gets disabled again. Exception will be thrown after the timeout:
        await contentWizard.waitForSaveButtonDisabled();
    });

    it(`GIVEN existing image has been rotated AND saved WHEN the image is reopened THEN 'Reset' button should be displayed`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.NORD);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        await imageEditor.clickOnRotateButton();
        await contentWizard.waitAndClickOnSave();
        await studioUtils.doCloseWizardAndSwitchToGrid();
        //clicks on Edit button and open this selected content:
        await studioUtils.doClickOnEditAndOpenContent(appConst.TEST_IMAGES.NORD);
        // Reset Filter button should be displayed
        await imageEditor.waitForResetButtonDisplayed();
        //'Save' button should be disabled:
        await contentWizard.waitForSaveButtonDisabled();
    });

    // verifies https://github.com/enonic/app-contentstudio/issues/1365 Save button gets enabled after reverting changes (rotated or flipped)
    it.skip(`GIVEN existing image is rotated WHEN previous version has been reverted THEN 'Reset filters' gets not visible and Saved button should be disabled`, async () => {
        let imageEditor = new LiveViewImageEditor();
        let imageFormPanel = new ImageFormPanel();
        let contentWizard = new ContentWizard();
        let wizardVersionsWidget = new WizardVersionsWidget();
        // 1. open existing image and click on Rotate button:
        await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.CAPE);
        await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
        await imageEditor.clickOnRotateButton();
        await studioUtils.saveScreenshot('image_rotated');
        // 2. Save the image:
        await contentWizard.waitAndClickOnSave();
        // 3. Open Versions Panel:
        await contentWizard.openVersionsHistoryPanel();
        // 4. Expand menu and revert the previous version:
        await wizardVersionsWidget.clickAndExpandVersion(1);
        await wizardVersionsWidget.clickOnRestoreButton();
        await studioUtils.saveScreenshot('rotated_image_reverted');
        // 5. Verify that 'Reset filters' gets not visible and Saved button is disabled:
        await imageEditor.waitForResetButtonDisplayed();
        await contentWizard.waitForSavedButtonVisible();
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
