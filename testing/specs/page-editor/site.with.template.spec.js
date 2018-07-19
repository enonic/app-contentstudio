/**
 * Created on 12.03.2018.
 *
 * Verifies xp-apps#360 "Refresh options in the Page Template selection when templates change "
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");


describe('site.wit.template: when a template has been deleted, then site-wizard should be refreshed', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let TEMPLATE;
    let SUPPORT = 'Site';
    let CONTROLLER_NAME = 'main region';
    it(`WHEN new site has been added THEN the site should be listed in the grid`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                studioUtils.saveScreenshot(displayName + '_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`WHEN new template has been added THEN the template should be listed in the grid`,
        () => {
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
            return studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE).then(()=> {
                return studioUtils.findAndSelectItem(TEMPLATE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(TEMPLATE.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'template should be listed in the grid');
            });
        });

    it(`GIVEN site is opened WHEN page-template has been deleted THEN site-wizard should be reset and controller-combobox should appear`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return studioUtils.doSwitchToContentBrowsePanel();
            }).then(()=> {
                return studioUtils.doDeleteContent(TEMPLATE.displayName);
            }).then(()=> {
                return studioUtils.switchToContentTabWindow(SITE.displayName);
            }).then(()=> {
                return contentWizard.waitForControllerOptionFilterInputVisible();
            }).then((result)=> {
                studioUtils.saveScreenshot(SITE.displayName + '_reset');
                assert.isTrue(result, 'Options filter input should appear in the site, because the template was deleted')

            });
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
