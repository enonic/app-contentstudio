/**
 * Created on 05.06.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const ImageEditor = require('../../page_objects/wizardpanel/image.editor');

describe("image.content.flip.rotate.spec: Open an image and flip and rotate it",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'nord';

        it(`GIVEN existing image is opened WHEN 'Rotate' button has been pressed AND 'Reset Filter' has been pressed THEN Save button has expected state`,
            async () => {
                    let imageEditor = new ImageEditor();
                let contentWizard = new ContentWizard();
                await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
                studioUtils.saveScreenshot("image_rotate_reset_filter_pressed1");
                    await imageEditor.clickOnRotateButton();
                    await imageEditor.waitForResetFiltersDisplayed();
                studioUtils.saveScreenshot("image_rotate_reset_filter_pressed2");
                    await imageEditor.pause(1000);
                let isEnabled = await contentWizard.waitForSaveButtonEnabled();
                assert.isTrue(isEnabled, "Save button gets enabled");
                    await imageEditor.clickOnResetButton();
                studioUtils.saveScreenshot("image_rotate_reset_filter_pressed3");
                //exception will be thrown after the timeout:
                await contentWizard.waitForSaveButtonDisabled();
            });

        it(`GIVEN existing image is opened WHEN image has been flipped and AND 'Reset Filter' has been pressed THEN Save button has expected state`,
            async () => {
                    let imageEditor = new ImageEditor();
                let contentWizard = new ContentWizard();
                await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
                studioUtils.saveScreenshot("image_flip_reset_filter_pressed1");
                    await imageEditor.clickOnFlipButton();
                    await imageEditor.waitForResetFiltersDisplayed();
                studioUtils.saveScreenshot("image_flip_reset_filter_pressed2");
                let isEnabled = await contentWizard.waitForSaveButtonEnabled();
                assert.isTrue(isEnabled, "Save button gets enabled");

                    await imageEditor.clickOnResetButton();
                studioUtils.saveScreenshot("image_flip_reset_filter_pressed3");
                // Save gets disabled again. Exception will be thrown after the timeout:
                await contentWizard.waitForSaveButtonDisabled();
            });

        it(`GIVEN existing image is opened AND has been rotated AND saved WHEN the image is reopened THEN 'Reset Filter' button should be displayed`,
            async () => {
                    let imageEditor = new ImageEditor();
                let contentWizard = new ContentWizard();
                await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
                    await imageEditor.clickOnRotateButton();
                await contentWizard.waitAndClickOnSave();
                await studioUtils.doCloseWizardAndSwitchToGrid();
                //clicks on Edit button and open this selected content:
                await studioUtils.doClickOnEditAndOpenContent(IMAGE_DISPLAY_NAME);
                // Reset Filter button should be displayed
                    await imageEditor.waitForResetFiltersDisplayed();
                //'Save' button should be disabled:
                await contentWizard.waitForSaveButtonDisabled();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
