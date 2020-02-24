/**
 * Created on 01.02.2018.
 *
 * Verifies xp-apps#359 "Page Inspection panel - Template name is missing for the Automatic template option"
 */
const chai = require('chai');
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
    it(`GIVEN wizard for new site is opened WHEN page controller has been selected THEN required options should be present in Inspection Panel`,
        async() = > {
        let contentWizard = new ContentWizard();
    let contextWindow = new ContextWindow();
    let pageInspectionPanel = new PageInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test for site configurator', [appConstant.APP_CONTENT_TYPES]);
    //1. Open new site-wizard:
    await
    studioUtils.doOpenSiteWizard();
    await
    contentWizard.typeData(SITE);
    //2. Select the controller:
    await
    contentWizard.selectPageDescriptor('Page');
    await
    contentWizard.pause(700);
    //3. Context Window loads automatically, click on 'Page' tab:
    await
    contextWindow.clickOnTabBarItem('Page');
    //4. Click on dropdown handle and expand options:
    let actualOptions = await
    pageInspectionPanel.getPageTemplateDropdownOptions();
    //5. Verify actual options:
    studioUtils.saveScreenshot('site_inspect_panel_template_dropdown');
    let expectedOption = `( no default template found )`;
    assert.equal(actualOptions[0], expectedOption, 'name of automatic template should be displayed');
    assert.equal(actualOptions[1], "test region", 'expected option should be present');
    assert.equal(actualOptions[2], "home page", 'expected option should be present');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
