/**
 * Created on 05.06.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageEditor = require('../../page_objects/wizardpanel/image.editor');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const appConst = require('../../libs/app_const');

describe("image.content.flip.rotate.spec: Open an image and flip and rotate it", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN existing image is opened WHEN 'Rotate' button has been pressed AND 'Reset Filter' has been pressed THEN Save button has expected state`,
        async () => {
            let imageEditor = new ImageEditor();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.NORD);
            // 1. Click on Rotate button
            await imageEditor.clickOnRotateButton();
            // 2. Verify that 'Reset filters' button gets visible
            await imageEditor.waitForResetFiltersDisplayed();
            await studioUtils.saveScreenshot('image_rotated');
            // 3. Verify that Save buttons gets enabled
            await contentWizard.waitForSaveButtonEnabled();
            // 4. Click on 'Reset filters' button
            await imageEditor.clickOnResetFiltersButton();
            await studioUtils.saveScreenshot('image_rotate_reset_filter_pressed3');
            // 5. Verify that Save button is disabled now
            await contentWizard.waitForSaveButtonDisabled();
            // 6. Verify that 'Reset filters' button gets not visible:
            await imageEditor.waitForResetFilterNotDisplayed();
        });

    it(`GIVEN existing image is opened WHEN image has been flipped and AND 'Reset Filter' has been pressed THEN Save button should be disabled`,
        async () => {
            let imageEditor = new ImageEditor();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.NORD);
            await studioUtils.saveScreenshot('image_flip_reset_filter_pressed1');
            // 1. Click on Flip button:
            await imageEditor.clickOnFlipButton();
            // 2. Verify that 'Reset filters' button gets visible
            await imageEditor.waitForResetFiltersDisplayed();
            await studioUtils.saveScreenshot('image_flip_reset_filter_pressed2');
            // 3. Verify that 'Save' button is enabled
            await contentWizard.waitForSaveButtonEnabled();
            // 4. Click on 'Reset filters' button
            await imageEditor.clickOnResetFiltersButton();
            await studioUtils.saveScreenshot('image_flip_reset_filter_pressed3');
            // Save gets disabled again. Exception will be thrown after the timeout:
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`GIVEN existing image has been rotated AND saved WHEN the image is reopened THEN 'Reset Filter' button should be displayed`,
        async () => {
            let imageEditor = new ImageEditor();
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
            await imageEditor.waitForResetFiltersDisplayed();
            //'Save' button should be disabled:
            await contentWizard.waitForSaveButtonDisabled();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/1365 Save button gets enabled after reverting changes (rotated or flipped)
    it(`GIVEN existing image is rotated WHEN previous version has been reverted THEN 'Reset filters' gets not visible and Saved button should be disabled`,
        async () => {
            let imageEditor = new ImageEditor();
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
            await imageEditor.waitForResetFilterNotDisplayed();
            await contentWizard.waitForSavedButtonVisible();
        });

    it(`GIVEN an image has been rotated AND saved WHEN try to close the image wizard THEN Alert dialog should not appear`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.RENAULT);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Rotate the image
            await imageEditor.clickOnRotateButton();
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('rotated_saved_image');
            await imageEditor.waitForResetFiltersDisplayed();
            // 4. Try to close the wizard with the saved rotated image:
            await contentWizard.clickOnCloseBrowserTab();
            // 5. Verify that Alert does not appear in the wizard:
            let isOpened = await contentWizard.isAlertOpen();
            if (isOpened) {
                await contentWizard.dismissAlert();
            }
            assert.ok(isOpened === false, "Alert should not appear after trying to close the wizard with the saved rotation");
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
