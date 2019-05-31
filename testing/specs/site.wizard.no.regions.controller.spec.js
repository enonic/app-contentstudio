/**
 * Created on 27.02.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../libs/app_const');

describe('site.wizard.no.regions.controller.spec: checks Ssave button after selecting a template with `no region` ', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;

//verifies https://github.com/enonic/app-contentstudio/issues/210
//"Save" button doesn't get disabled after save when assigning a template with no regions to a site
    it(`GIVEN new site wizard is opened AND name has been typed WHEN template with 'no regions' has been selected THEN Save button gets disabled`,
        () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            return studioUtils.openContentWizard(appConst.contentTypes.SITE).then(() => {
                return contentWizard.typeDisplayName(SITE.displayName);
            }).then(() => {
                return siteFormPanel.addApplications([appConstant.SIMPLE_SITE_APP]);
            }).then(() => {
                //site should be automatically saved after selecting a controller
                return contentWizard.selectPageDescriptor("no regions");
            }).then(() => {
                // Save button gets disabled
                return contentWizard.waitForSaveButtonDisabled();
            }).then(result => {
                assert.isTrue(result, "Save button gets disabled after selecting 'no regions' ")
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
