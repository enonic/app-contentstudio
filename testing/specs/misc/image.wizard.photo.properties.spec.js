/**
 * Created on 09.07.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const ImagePhotoInfoFormPanel = require('../../page_objects/wizardpanel/image.photoinfo.form.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');
const appConst = require('../../libs/app_const');

describe("image.wizard.photo.properties.spec: Open an image and update photo properties then rollback the previous version", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.NORD;

    // verifies https://github.com/enonic/app-contentstudio/issues/388  and https://github.com/enonic/app-contentstudio/issues/618
    // Image Wizard - some field values are not updated after version rollback
    it(`GIVEN existing image is opened(photo's date time is not specified) WHEN dateTime has been typed and saved AND revert the previous version THEN dateTime input should be empty in Photo form`,
        async () => {
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            let imagePhotoInfoFormPanel = new ImagePhotoInfoFormPanel();
            let wizardDetailsPanel = new WizardDetailsPanel();
            // 1. open existing image
            await studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME);
            await imageFormPanel.clickOnPhotoWizardStep();
            // 2. Type and save a date time in the input
            await imagePhotoInfoFormPanel.typeDateTime('2019-07-09 00:00');
            await studioUtils.saveScreenshot('image_photo_date_time_saved');
            await imageFormPanel.pause(1000);
            await contentWizard.waitAndClickOnSave();
            // 3. open Versions widget in wizard-details panel
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openVersionHistory();
            let wizardVersionsWidget = new WizardVersionsWidget();
            await wizardVersionsWidget.waitForVersionsLoaded();
            // 4. Expand menu and restore the previous version
            await wizardVersionsWidget.clickAndExpandVersion(1);
            // click on 'Revert' button:
            await wizardVersionsWidget.clickOnRestoreButton();
            await studioUtils.saveScreenshot('photo_form_date_time_rollback');
            let result = await imagePhotoInfoFormPanel.getDateTimeValue();
            assert.equal(result, "", "Date Time input should be empty after rollback the version");
            // 'Saved' button should be displayed. (exception will bw thrown when timeout expired)
            await contentWizard.waitForSavedButtonVisible();
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
