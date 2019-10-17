/**
 * Created on 23.08.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');

describe('Swap two Text Component - specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let CONTROLLER_NAME = 'main region';


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is opened WHEN Page Component View has been opened THEN expected component's description should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //opens Page Component View dialog
            await contentWizard.clickOnShowComponentViewToggler();
            let description = await pageComponentView.getComponentDescription("main region");
            assert.equal(description, "test region", "Expected description should be displayed");
        });

    it(`GIVEN 2 Text component are inserted  WHEN components have been swapped THEN 2 strings should be displayed in correct order`,
        () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(() => {
                return pageComponentView.openMenu("main");
            }).then(() => {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(() => {
                return textComponentCke.typeTextInCkeEditor("component1");
            }).then(() => {
                return contentWizard.switchToMainFrame();
            }).then(() => {
                return pageComponentView.openMenu("main");
            }).then(() => {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(() => {
                return textComponentCke.typeTextInCkeEditor("component2");
            }).then(() => {
                return contentWizard.switchToMainFrame();
            }).then(() => {
                return contentWizard.hotKeySave();
            }).then(() => {
                return contentWizard.pause(1200);
            }).then(() => {
                studioUtils.saveScreenshot('text_components_swapped1');
                return pageComponentView.swapComponents("component1", "component2");
            }).then(() => {
                studioUtils.saveScreenshot('text_components_swapped2');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
