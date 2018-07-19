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
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const metadataStepForm = require('../page_objects/wizardpanel/test.metadata.step.form');
const siteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const appConst = require('../libs/app_const');


describe('site.with.meta.fields.spec: verifies application-metadata in a site-wizard', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`GIVEN site with application-metadata is saved WHEN required input for metadata is empty THEN red icon should be displayed in the grid near the content`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site-meta');
            SITE = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConstant.APP_WITH_METADATA_MIXIN]);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                return studioUtils.typeNameInFilterPanel(SITE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                studioUtils.saveScreenshot('site_metadata1');
                assert.isTrue(isDisplayed, '`new site should be listed');
            }).then(()=> {
                return assert.eventually.isTrue(contentBrowsePanel.isRedIconDisplayed(SITE.displayName),
                    "`Red icon` should be displayed near the content, because the required input for metadata is empty");
            });
        });

    it(`WHEN site with application-metadata is opened THEN red icon should be displayed in the wizard`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return assert.eventually.isTrue(metadataStepForm.isOverrideDescriptionTextAreaVisible(),
                    "`Override Description` text area should be displayed");
            }).then(()=> {
                return assert.eventually.isTrue(metadataStepForm.isOverrideTitleInputVisible(),
                    "`Override Title` input should be displayed");
            }).then(()=> {
                return assert.eventually.isTrue(metadataStepForm.isValidationRecordingVisible(),
                    "`This field is required` should be displayed, because the required input for metadata is empty");
            }).then(()=> {
                return contentWizard.isContentInvalid();
            }).then(isInvalid=> {
                studioUtils.saveScreenshot('site_metadata_wizard');
                assert.isTrue(isInvalid, 'red icon should be displayed in the wizard!');
            });
        });

    it(`GIVEN site with application-metadata is opened WHEN the required description has been typed THEN the site is getting valid`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return metadataStepForm.typeDescription('test description');
            }).then(()=> {
                return contentWizard.waitUntilInvalidIconDisappears();
            }).then(redIconNotVisible=> {
                studioUtils.saveScreenshot('site_meta_description_typed');
                assert.isTrue(redIconNotVisible, 'red icon should not be visible in the wizard!');
            });
        });

    //Verifies the https://github.com/enonic/xp-apps/issues/533
    it(`GIVEN creating of a new site with application-metadata AND data is saved WHEN description in metadata has been typed THEN 'Saved' label-button should be changed to 'Save'`,
        () => {
            let displayName = contentBuilder.generateRandomName('site-meta');
            let testSite = contentBuilder.buildSite(displayName, 'test for displaying of metadata', [appConstant.APP_WITH_METADATA_MIXIN]);
            return studioUtils.openContentWizard(appConst.contentTypes.SITE).then(()=> {
            }).then(()=> {
                return contentWizard.typeDisplayName(testSite.displayName);
            }).then(()=> {
                return siteFormPanel.addApplications([appConstant.APP_WITH_METADATA_MIXIN]);
            }).then(()=> {
                return contentWizard.waitAndClickOnSave();
            }).then(()=> {
                return metadataStepForm.typeDescription('test description');
            }).then(()=> {
                return assert.eventually.isTrue(contentWizard.waitForSaveButtonEnabled(),
                    "`Save` button should be enabled, because the required input for metadata has been updated");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
