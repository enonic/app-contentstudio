/**
 * Created on 17.02.2022
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageEditor = require('../../page_objects/wizardpanel/image.editor');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('revert.zoomed.image.spec: tests for reverting of zoomed image', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN existing image has been zoomed in WHEN 'Apply' button has been pressed THEN 'Reset filters' button should appear`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            // 1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.SENG);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            // 2. Open edit-mode and do zoom in the image
            await imageEditor.clickOnCropButton();
            await imageEditor.doZoomImage(30);
            await studioUtils.saveScreenshot('image_zoomed_2');
            // 3. Click on Apply button and save the image:
            await imageEditor.clickOnApplyButton();
            await imageEditor.waitForResetFiltersDisplayed();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN existing zoomed in image is opened WHEN the previous version has been reverted THEN 'Reset Filters' button gets hidden`,
        async () => {
            let imageEditor = new ImageEditor();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            let wizardVersionsWidget = new WizardVersionsWidget();
            // 1. Open the zoomed image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.SENG);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            await contentWizard.openDetailsPanel();
            // 2. Verify that 'Reset filters' button is visible:
            await imageEditor.waitForResetFiltersDisplayed();
            // 3. Open Versions Panel
            await contentWizard.openVersionsHistoryPanel();
            // 4. Revert the previous version(image should be focused):
            await wizardVersionsWidget.clickOnVersionItemByHeader(appConst.VERSIONS_ITEM_HEADER.EDITED, 1);
            await wizardVersionsWidget.clickOnRestoreButton();
            await studioUtils.saveScreenshot('version_reverted_not_zoomed');
            // 5. Verify that Save button is disabled:
            await contentWizard.waitForSaveButtonDisabled();
            // 6. Verify that 'Reset filters' button gets not displayed after reverting:
            await imageEditor.waitForResetFiltersNotDisplayed();
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
