/**
 * Created on 14.05.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');

describe('Text Component with CKE - insert download link  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let TEST_CONTENT_DISPLAY_NAME = 'spumans';
    let CONTROLLER_NAME = 'main region';
    const EXPECTED_SRC = '<p><a href="media://download/';

    it(`Precondition: new site should be added`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            return studioUtils.doAddSite(SITE).then(() => {
                studioUtils.saveScreenshot(displayName + '_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it.skip(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'download-link' has been inserted THEN correct data should be present in the CKE`,
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
                return textComponentCke.switchToLiveEditFrame();
            }).then(() => {
                return textComponentCke.clickOnInsertLinkButton();
            }).then(() => {
                return studioUtils.insertDownloadLinkInCke("test", TEST_CONTENT_DISPLAY_NAME);
            }).then(() => {
                return textComponentCke.switchToLiveEditFrame();
            }).then(() => {
                studioUtils.saveScreenshot('download_link_inserted');
                return textComponentCke.getTextFromEditor();
            }).then(result => {
                assert.isTrue(result.includes(EXPECTED_SRC), 'correct data should be in CKE');
            }).then(() => {
                return textComponentCke.switchToParentFrame();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            })
        });

    it.skip(`GIVEN site is selected WHEN 'Preview' button has been pressed THEN download-link should be present on the page`,
        () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return contentBrowsePanel.clickOnPreviewButton();
            }).then(() => {
                return studioUtils.switchToContentTabWindow(SITE.displayName)
            }).then(() => {
                return studioUtils.isElementDisplayed(`a=test`);
            }).then(result => {
                studioUtils.saveScreenshot('download_link_present');
                assert.isTrue(result, 'download link should be present on the page');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
