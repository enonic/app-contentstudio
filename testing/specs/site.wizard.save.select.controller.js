/**
 * Created on 02.04.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const PageInspectionPanel = require('../page_objects/wizardpanel/liveform/page.inspection.panel');


describe('site.wizard.save.select.controller.spec: Saves site-data and selects a controller', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    it(`GIVEN wizard for new site is opened WHEN name typed and Save button has been pressed THEN controller selector should be available in no longer than 5 seconds`,
        () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('site');
            let SITE = contentBuilder.buildSite(displayName, 'test site', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doOpenSiteWizard().then(() => {
                return contentWizard.typeData(SITE);
            }).then(() => {
                //Press 'Save' button
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                //switch to 'LiveEdit' and select the controller
                return contentWizard.selectPageDescriptor('Page');
            }).then(() => {
                return contentWizard.waitForNotificationMessage()
            }).then(result => {
                assert.equal(result, appConstant.itemSavedNotificationMessage(displayName), "Expected notification message should appear");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
