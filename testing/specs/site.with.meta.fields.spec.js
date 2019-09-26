/**
 * Created on 01.02.2018.
 * Verifies the https://github.com/enonic/xp-apps/issues/533
 * Impossible to save application metadata in the site wizard when the site is opened for the first time #533
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const MetadataStepForm = require('../page_objects/wizardpanel/test.metadata.step.form');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const appConst = require('../libs/app_const');


describe('site.with.meta.fields.spec: verifies application-metadata in a site-wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`GIVEN site with application-metadata is saved WHEN required input for metadata is empty THEN red icon should be displayed in the grid near the content`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site-meta');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConstant.APP_WITH_METADATA_MIXIN]);
            await studioUtils.doAddSite(SITE);
            //type the name in the filter-panel:
            await studioUtils.typeNameInFilterPanel(displayName);
            await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            studioUtils.saveScreenshot('site_metadata1');
            // red icon should be displayed because the required input is empty:
            let result = await contentBrowsePanel.isRedIconDisplayed(SITE.displayName);
            assert.isTrue(result, "`Red icon` should be displayed near the content, because the required input for metadata is empty");
        });

    it(`WHEN site with application-metadata is opened THEN red icon should be displayed in the wizard`, () => {
        let metadataStepForm = new MetadataStepForm();
        let contentWizard = new ContentWizard();
        return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
            return assert.eventually.isTrue(metadataStepForm.isOverrideDescriptionTextAreaVisible(),
                "`Override Description` text area should be displayed");
        }).then(() => {
            return assert.eventually.isTrue(metadataStepForm.isOverrideTitleInputVisible(),
                "`Override Title` input should be displayed");
        }).then(() => {
            return assert.eventually.isTrue(metadataStepForm.isValidationRecordingVisible(),
                "`This field is required` should be displayed, because the required input for metadata is empty");
        }).then(() => {
            return contentWizard.isContentInvalid();
        }).then(isInvalid => {
            studioUtils.saveScreenshot('site_metadata_wizard');
            assert.isTrue(isInvalid, 'red icon should be displayed in the wizard!');
        });
    });

    it(`GIVEN site with application-metadata is opened WHEN the required description has been typed THEN the site gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            let metadataStepForm = new MetadataStepForm();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //fill the required input:
            await metadataStepForm.typeDescription('test description');
            //the site gets valid
            await contentWizard.waitUntilInvalidIconDisappears();
        });

    //Verifies the https://github.com/enonic/xp-apps/issues/533
    it(`GIVEN creating of a new site with application-metadata AND data is saved WHEN description in metadata has been typed THEN 'Saved' label-button should be changed to 'Save'`,
        async () => {
            let metadataStepForm = new MetadataStepForm();
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site-meta');
            let testSite = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConstant.APP_WITH_METADATA_MIXIN]);
            //New site-wizard is opened:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(testSite.displayName);
            await siteFormPanel.addApplications([appConstant.APP_WITH_METADATA_MIXIN]);
            //the site is saved:
            await contentWizard.waitAndClickOnSave();
            //Description has been typed:
            await metadataStepForm.typeDescription('test description');
            //`Save` button should be enabled, because the required input for metadata has been updated
            await contentWizard.waitForSaveButtonEnabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
