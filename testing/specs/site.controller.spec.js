/**
 * Created on 01.02.2018.
 *
 * Verifies xp-apps#359 "Page Inspection panel - Template name is missing for the Automatic template option"
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const PageInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ContextWindow = require('../page_objects/wizardpanel/liveform/liveform.context.window');

describe('site.controller.spec: checks options in selector for Page Templates and Controllers', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    it(`GIVEN wizard for new site is opened WHEN page controller has been selected THEN required options should be present in the Inspection Panel`,
        () => {
        let contentWizard = new ContentWizard();
        let contextWindow = new ContextWindow();
        let pageInspectionPanel = new PageInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for site configurator', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doOpenSiteWizard().then(() => {
                return contentWizard.typeData(SITE);
            }).then(() => {
                return contentWizard.selectPageDescriptor('Page');
            }).then(()=>{
                return contentWizard.pause(700);
            }).then(() => {
                return contextWindow.clickOnTabBarItem('Page');
            }).then(() => {
                return pageInspectionPanel.getPageTemplateDropdownOptions();
            }).then(result => {
                studioUtils.saveScreenshot('site_inspect_panel_template_dropdown');
                let expectedOption = `( no default template found )`;
                assert.isTrue(result[0] == expectedOption, 'correct name for automatic template should be displayed');
                assert.isTrue(result[1] == "test region", 'correct name for automatic template should be displayed');
                assert.isTrue(result[2] == "home page", 'correct name for automatic template should be displayed');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
