/**
 * Created on 17.01.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const siteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../libs/app_const');

describe('site.wizard.no.regions.controller.spec: apply a custom style to an image', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;

    it(`Preconditions: site should be added`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            return studioUtils.openContentWizard(appConst.contentTypes.SITE).then(() => {
                return contentWizard.typeDisplayName(SITE.displayName);
            }).then(() => {
                return siteFormPanel.addApplications([appConstant.SIMPLE_SITE_APP]);
            }).then(() => {
                return contentWizard.selectPageDescriptor("no regions");
            }).then(() => {
                return contentWizard.waitForSavedButtonVisible();
            })
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
