/**
 * Created on 8.10.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const GeoPointForm = require('../../page_objects/wizardpanel/geopoint.form.panel');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('geopoint.content.spec: tests for geo point content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const INCORRECT_GEO_LOCATION = '1,181';
    const VALID_GEO_LOCATION = '1,1';
    const GEO_POINT_CONTENT_NAME_1 = contentBuilder.generateRandomName('geopoint');
    const GEO_POINT_CONTENT_NAME_2 = contentBuilder.generateRandomName('geopoint');
    const AUTOMATIC_CONTROLLER = appConst.INSPECT_PANEL_TEMPLATE_CONTROLLER.AUTOMATIC;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for 'GeoPoint 0:0' is opened WHEN valid value has been typed THEN validation message should not be present`,
        async () => {
            let geoPoint = new GeoPointForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.GEOPOINT_0_0);
            // 1. Type a correct geo point:
            await geoPoint.typeGeoPoint(VALID_GEO_LOCATION, 0);
            await geoPoint.pause(500);
            await studioUtils.saveScreenshot('geo_point_content_valid');
            // 2. Verify that validation message is not displayed:
            let recording = await geoPoint.getOccurrenceValidationRecording(0);
            await studioUtils.saveScreenshot('double_default_value_1');
            assert.equal(recording, '', 'Validation recording should not be displayed');
        });

    it(`GIVEN wizard for 'GeoPoint 0:0' is opened WHEN not valid value has been typed THEN validation message should be present`,
        async () => {
            let geoPoint = new GeoPointForm();
            let contentWizard = new ContentWizardPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.GEOPOINT_0_0);
            // 1. Type an incorrect geo point:
            await geoPoint.typeGeoPoint(INCORRECT_GEO_LOCATION, 0);
            await contentWizard.typeDisplayName(GEO_POINT_CONTENT_NAME_1);
            await studioUtils.saveScreenshot('geo_point_content_not_valid');
            // 2. Verify that validation message is displayed: 'Invalid value entered'
            let recording = await geoPoint.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Validation recording should be displayed');
            // 3. Save the content and check the red icon in the wizard:
            await contentWizard.waitAndClickOnSave();
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'This content should be valid');
        });

    it(`GIVEN invalid value has been typed in geo point input AND the content has been saved WHEN the content has been reopened THEN geo point input should be empty`,
        async () => {
            let geoPoint = new GeoPointForm();
            let contentWizard = new ContentWizardPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. reopen the content with saved invalid geo point:
            await studioUtils.selectAndOpenContentInWizard(GEO_POINT_CONTENT_NAME_1);
            await contentWizard.openContextWindow();
            await studioUtils.saveScreenshot('geo_point_content_invalid_reopened');
            // 2. Verify that not correct geo point was not saved, the input is empty:
            let actualText = await geoPoint.getValueInGeoPoint(0);
            assert.equal(actualText, '', 'Geo point input should be empty');
            // 3. Verify that 'Add' button is displayed
            await geoPoint.waitForAddButtonDisplayed();
            // 4. Automatic controller should be selected in the Page Inspection Panel:
            let controllerActual = await pageInspectionPanel.getSelectedPageController();
            assert.equal(controllerActual, AUTOMATIC_CONTROLLER, 'Automatic controller should be selected after the resetting');
        });

    it(`GIVEN wizard for 'GeoPoint 1:1' is opened WHEN not correct geo point has been typed THEN validation record should appear`,
        async () => {
            let geoPoint = new GeoPointForm();
            let contentWizard = new ContentWizardPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.GEOPOINT_1_1);
            await contentWizard.typeDisplayName(GEO_POINT_CONTENT_NAME_2);
            await geoPoint.typeGeoPoint(INCORRECT_GEO_LOCATION, 0);
            // 2. Verify the validation message:
            await studioUtils.saveScreenshot('geo_point_content_not_valid_required');
            let recording = await geoPoint.getOccurrenceValidationRecording(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Validation recording should be displayed');
            // 3. Verify that the content is not valid, because geo point input is required
            let result = await contentWizard.isContentInvalid();
            assert.ok(result, 'This content should be invalid');
            // 4. Verify that 'Add' button is not displayed
            await geoPoint.waitForAddButtonNotDisplayed();
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
