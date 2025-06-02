/**
 * Created on 01.02.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const MetadataStepForm = require('../page_objects/wizardpanel/wizard-step-form/test.metadata.step.form');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const appConst = require('../libs/app_const');

describe('site.with.meta.fields.spec: verifies application-metadata in a site-wizard', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    it(`GIVEN site with application-metadata is saved WHEN required input for metadata is empty THEN red icon should be displayed in the grid near the content`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site-meta');
            SITE = contentBuilder.buildSite(displayName, 'test for metadata', [appConst.TEST_APPS_NAME.TEST_APP_WITH_METADATA_MIXIN]);
            //1. New site is added:
            await studioUtils.doAddSite(SITE, true);
            //2. Type the name in the filter-panel:
            await studioUtils.typeNameInFilterPanel(displayName);
            await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            await studioUtils.saveScreenshot('site_metadata1');
            //3. red icon should be displayed because the required input(meta-data) was not filled:
            let result = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            assert.ok(result, "'Red icon' should be displayed near the content, because the required input for metadata is empty");
        });

    it(`WHEN existing site with application-metadata is opened THEN red icon should be displayed in the wizard`,
        async () => {
            let metadataStepForm = new MetadataStepForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            let isDisplayed = await metadataStepForm.isOverrideDescriptionTextAreaVisible();
            assert.ok(isDisplayed, "'Override Description' text area should be displayed");
            isDisplayed = await metadataStepForm.isOverrideTitleInputVisible();
            assert.ok(isDisplayed, "'Override Title' input should be displayed");
            let validationRecording = await metadataStepForm.getDescriptionValidationRecording();
            assert.equal(validationRecording, 'This field is required',
                "Expected recording should appear, the text area is empty in metadata form");

            let isRedIconPresent = await contentWizard.isContentInvalid();
            await studioUtils.saveScreenshot('site_metadata_wizard');
            assert.ok(isRedIconPresent, 'red icon should be displayed in the wizard!');
        });

    it(`WHEN required input in metadata has been filled THEN the site gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let metadataStepForm = new MetadataStepForm();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Fill the required input:
            await metadataStepForm.typeDescription('test description');
            // 3. Site gets valid:
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    // Verifies the https://github.com/enonic/xp-apps/issues/533
    it(`GIVEN wizard for new site with metadata is opened AND data is saved WHEN description in metadata has been typed THEN 'Saved' label should be changed to 'Save'`,
        async () => {
            let metadataStepForm = new MetadataStepForm();
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site-meta');
            let testSite = contentBuilder.buildSite(displayName, 'test for metadata', [appConst.TEST_APPS_NAME.TEST_APP_WITH_METADATA_MIXIN]);
            // 1. New site-wizard is opened:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(testSite.displayName);
            // 2. Application with controllers has been selected:
            await siteFormPanel.addApplications([appConst.TEST_APPS_NAME.TEST_APP_WITH_METADATA_MIXIN]);
            // the site automatically saved:
            // 3. Description has been typed:
            await metadataStepForm.typeDescription('test description');
            // 'Save' button gets visible and enabled, because description is updated
            await contentWizard.waitForSaveButtonEnabled();
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
