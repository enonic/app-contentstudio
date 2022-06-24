/**
 * Created on 21.09.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ImagePropertiesForm = require('../../page_objects/wizardpanel/image/image.properties.form.view');
const ImagePhotoForm = require('../../page_objects/wizardpanel/image/photo.info.form.view');
const ImageLocationForm = require('../../page_objects/wizardpanel/image/image.location.form.view');
const ImageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe("image.properties.photo.spec: tests for focus button", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const ALTITUDE = 3000;
    const DIRECTION = 'direction';
    const GEO_POINT = '37.785146,-122.39758';
    const GEO_POINT_NOT_VALID = '1234567';
    const ARTIST_TEXT = appConst.generateRandomName("art");
    const TAGS_TEXT = appConst.generateRandomName("tag");

    it("GIVEN image content is opened WHEN search tags have been added THEN the image should be searchable with the tags",
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            //1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            await imageFormPanel.waitForCaptionTextAreaDisplayed();
            await imageFormPanel.waitForCopyrightInputDisplayed();
            //2. Add tags in Artist and tags inputs
            await imageFormPanel.addArtistsTag(ARTIST_TEXT);
            await imageFormPanel.addTag(TAGS_TEXT);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //3. close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            //4. type the tag's text in Filter Panel
            await contentFilterPanel.typeSearchText(ARTIST_TEXT);
            await contentFilterPanel.pause(2000);
            await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            //5. Verify that the expected image is filtered:
            await studioUtils.saveScreenshot("image_tagged1");
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            await studioUtils.saveScreenshot("image_tagged2");
            assert.equal(result.length, 1, "Single image file should be filtered in the grid");
            assert.equal(result[0], appConst.TEST_IMAGES.POP_02, "Expected image content should be filtered");
        });

    it("WHEN image content with tags is opened THEN expected tags should be present",
        async () => {
            let imageFormPanel = new ImageFormPanel();
            //1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            //2. Verify that expected tags should be displayed in the wizard form:
            let artists = await imageFormPanel.getArtistsTagsText();
            let tags = await imageFormPanel.getTagsText();
            assert.isTrue(artists.includes(ARTIST_TEXT), "Expected artists tags should be displayed");
            assert.isTrue(tags.includes(TAGS_TEXT), "Expected tags should be displayed");
        });

    it("WHEN image content is opened THEN expected inputs should be present in Properties form",
        async () => {
            let imagePropertiesForm = new ImagePropertiesForm();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            //1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            //2. Verify that Properties wizard's step is present:
            await contentWizard.clickOnWizardStep("Properties");
            //3. Verify that required inputs are displayed
            await imagePropertiesForm.waitForByteSizeInputDisplayed();
            await imagePropertiesForm.waitForColorSpaceInputDisplayed();
            await imagePropertiesForm.waitForContentTypeInputDisplayed();
            await imagePropertiesForm.waitForDescriptionInputDisplayed();
            await imagePropertiesForm.waitForFileSourceInputDisplayed();
            await imagePropertiesForm.waitForHeightInputDisplayed();
            await imagePropertiesForm.waitForWidthInputDisplayed();
            await imagePropertiesForm.waitForSizePixelsInputDisplayed();
        });

    it("GIVEN  Altitude, Direction, Geo Point inputs are filled in WHEN Save button has been pressed THEN saved values should be present in the form",
        async () => {
            let imageLocationForm = new ImageLocationForm();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            //1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            //2. Verify that Location step is present:
            await contentWizard.clickOnWizardStep("Location");
            //3. Fill in all inputs in location form:
            await imageLocationForm.typeAltitude(ALTITUDE);
            await imageLocationForm.typeDirection(DIRECTION);
            //type a valid geo point
            await imageLocationForm.typeGeoPoint(GEO_POINT);
            //4. Click on Save button:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            let actualAltitude = await imageLocationForm.getTextInAltitude();
            let actualDirection = await imageLocationForm.getTextInDirection();
            let actualGeoPoint = await imageLocationForm.getTextInGeoPoint();
            //5. Verify saved values:
            assert.equal(actualAltitude, ALTITUDE, "Expected altitude should be present");
            assert.equal(actualDirection, DIRECTION, "Expected geo point should be present");
            assert.equal(actualGeoPoint, GEO_POINT, "Expected direction should be present");
        });

    it("WHEN not valid value has been typed in GeoPoint input THEN 'Save' button should be disabled",
        async () => {
            let imageLocationForm = new ImageLocationForm();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            //1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            //2. Verify that Location step is present:
            await contentWizard.clickOnWizardStep("Location");
            //3 type a not valid value in geo point
            await imageLocationForm.typeGeoPoint(GEO_POINT_NOT_VALID);
            //4. Verify the location validation recording
            let actualMessages = await imageLocationForm.getGeoPointValidationRecording();
            assert.equal(actualMessages[0], appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED,
                "Expected validation message should be displayed");
        });

    it("WHEN image content is opened THEN expected inputs should be present in Properties form",
        async () => {
            let imagePhotoForm = new ImagePhotoForm();
            let imageFormPanel = new ImageFormPanel();
            let contentWizard = new ContentWizard();
            //1. Open an existing image:
            await studioUtils.selectContentAndOpenWizard(appConst.TEST_IMAGES.POP_02);
            await imageFormPanel.waitForImageLoaded(appConst.mediumTimeout);
            //2. Verify that 'Photo' wizard's step is present:
            await contentWizard.clickOnWizardStep("Photo");
            //3. Verify that required inputs are displayed
            await imagePhotoForm.waitForModelInputDisplayed();
            await imagePhotoForm.waitForMakeInputDisplayed();
            await imagePhotoForm.waitForApertureInputDisplayed();
            await imagePhotoForm.waitForAutoFlashCompensationInputDisplayed();
            await imagePhotoForm.waitForDateTimeInputDisplayed();
            await imagePhotoForm.waitForExposureInputDisplayed();
            await imagePhotoForm.waitForFocalInputDisplayed();
            await imagePhotoForm.waitForFocusInputDisplayed();
            await imagePhotoForm.waitForFocusDistanceInputDisplayed();
            await imagePhotoForm.waitForFlashInputDisplayed();
            await imagePhotoForm.waitForFocalLength35InputDisplayed();
            await imagePhotoForm.waitForIsoInputDisplayed();
            await imagePhotoForm.waitForLensInputDisplayed();
            await imagePhotoForm.waitForMeteringModeInputDisplayed();
            await imagePhotoForm.waitForWhitBalanceInputDisplayed();
            await imagePhotoForm.waitForExposureModeInputDisplayed()
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
