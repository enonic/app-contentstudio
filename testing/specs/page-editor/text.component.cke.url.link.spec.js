/**
 * Created on 10.05.2018.
 * Verifies:
 * https://github.com/enonic/lib-admin-ui/issues/485   impossible to insert a table into Text Editor(CKE)
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
const pageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const textComponentCke = require('../../page_objects/components/text.component');

describe('Text Component with CKE - insert link and table  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';
    let EXPECTED_URL = '<p><a href="http://enonic.com">test</a></p>';

    it(`Precondition: WHEN new site has been added THEN the site should be listed in the grid`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                studioUtils.saveScreenshot(displayName + '_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it.skip(
        `GIVEN Text component has been inserted AND 'Insert table' button has been clicked WHEN table has been inserted THEN the modal dialog should be closed`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(() => {
                return pageComponentView.openMenu("main");
            }).then(() => {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(() => {
                return textComponentCke.switchToLiveEditFrame();
            }).then(() => {
                return textComponentCke.clickOnInsertTableButton();
            }).pause(3000).then(() => {
                return textComponentCke.switchToCKETableFrameAndInsertTable();
            }).then((result) => {
                assert.isTrue(result, '');
            })
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'url-link' has been inserted THEN correct data should be present in the CKE`,
        () => {
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
                return studioUtils.insertUrlLinkInCke("test", 'http://enonic.com');
            }).pause(1000).then(() => {
                return textComponentCke.switchToLiveEditFrame();
            }).then(() => {
                studioUtils.saveScreenshot('url_link_inserted');
                return textComponentCke.getTextFromEditor();
            }).then(result => {
                assert.equal(result, EXPECTED_URL, 'correct data should be in CKE');
            }).then(() => {
                return textComponentCke.switchToParentFrame();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            })
        });

    it(`GIVEN site is selected WHEN 'Preview' button has been pressed AND inserted link has been clicked THEN 'Enonic' site should be loaded in the page`,
        () => {
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return contentBrowsePanel.clickOnPreviewButton();
            }).pause(1000).then(() => {
                return studioUtils.switchToContentTabWindow(SITE.displayName)
            }).then(() => {
                return studioUtils.clickOnElement(`a=test`);
            }).pause(2000).then(() => {
                return studioUtils.getTitle();
            }).then(result => {
                studioUtils.saveScreenshot('link_clicked_in_preview_panel');
                assert.equal(result, 'Accelerate your digital projects with the Enonic Platform', 'correct title should be loaded');
            })
        });

    it(`GIVEN site is selected WHEN link in Preview Panel has been pressed THEN Enonic site should be loaded in the Preview Panel`,
        () => {
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return studioUtils.switchToFrameBySrc(SITE.displayName);
            }).then(() => {
                return studioUtils.clickOnElement(`a=test`);
            }).pause(1000).then(() => {
                return webDriverHelper.browser.getText("//div[@class='frontpage-get-started__container']//h3")
            }).then(result => {
                studioUtils.saveScreenshot('enonic_loaded_in_preview_panel');
                assert.equal(result, 'CREATE PROGRESSIVE WEBSITES AND APPLICATIONS FASTER WITH THE ENONIC PLATFORM',
                    'expected text should be loaded');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
