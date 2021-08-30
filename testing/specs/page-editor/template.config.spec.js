/**
 * Created on 12.09.2019.
 *
 * Verifies: https://github.com/enonic/xp/issues/7396 and  https://github.com/enonic/app-contentstudio/issues/947
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const DefaultPageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/default.page.inspection.panel');

describe('template.config.spec: template config should be displayed in the Inspection Panel', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let TEMPLATE;
    let SUPPORT = 'article';
    let CONTROLLER_NAME = 'Page';
    let TITLE_TEXT = "My title";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`Precondition: new template(supports article) should be added`,
        async () => {
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE);
        });

    //verifies https://github.com/enonic/xp/issues/7396 and https://github.com/enonic/app-contentstudio/issues/947
    it(`WHEN new wizard for article has been opened THEN input from template-config should be displayed in the Inspection Panel`,
        async () => {
            let defaultPageInspectionPanel = new DefaultPageInspectionPanel();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.ARTICLE);
            await contentWizard.doUnlockLiveEditor();
            await contentWizard.switchToMainFrame();
            //Inspection Panel should be automatically opened:
            await defaultPageInspectionPanel.waitForTitleInputDisplayed();
            await defaultPageInspectionPanel.typeTitle(TITLE_TEXT);
            //Click on Apply button in the Inspect Panel and save the changes:
            await defaultPageInspectionPanel.clickOnApplyButton();
            let result = await defaultPageInspectionPanel.getTitle();
            assert.equal(result, TITLE_TEXT, "expected and actual title should be equal");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });

});
