/**
 * Created on 13.02.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const ImageEditor = require('../page_objects/wizardpanel/image.editor');
const WizardVersionsWidget = require('../page_objects/wizardpanel/details/wizard.versions.widget');

describe("image.wizard.rotate.revert.spec: Open an image, click on Rotate then revert the changes",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = appConstant.TEST_IMAGES.CAPE;

        // verifies https://github.com/enonic/app-contentstudio/issues/1365 Save button gets enabled after reverting changes (rotated or flipped)
        it(`GIVEN existing image is rotated WHEN previous version has been reverted THEN 'Reset filters' gets not visible and Saved button should be disabled`,
            async () => {
                    let imageEditor = new ImageEditor();
                let contentWizard = new ContentWizard();
                let wizardVersionsWidget = new WizardVersionsWidget();
                //1. open existing image and click on Rotate button:
                await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
                    await imageEditor.clickOnRotateButton();
                await studioUtils.saveScreenshot("image_rotated");
                // 2. Save the image:
                await contentWizard.waitAndClickOnSave();
                //3. Open Versions Panel:
                await contentWizard.openVersionsHistoryPanel();
                //4. Expand menu and revert the previous version:
                await wizardVersionsWidget.clickAndExpandVersion(1);
                await wizardVersionsWidget.clickOnRevertButton();
                studioUtils.saveScreenshot("rotated_image_reverted");
                //5. Verify that 'Reset filters' gets not visible and Saved button is disabled:
                    await imageEditor.waitForResetFilterNotDisplayed();
                await contentWizard.waitForSavedButtonVisible();
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
