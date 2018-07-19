/**
 * Created on 23.05.2018.
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
const insertAnchorDialog = require('../../page_objects/wizardpanel/insert.anchor.dialog.cke');

describe('Text Component with CKE - insert Anchor specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';
    let EXPECTED_DATA_CKE = '<p><a id="test anchor" name="test anchor"></a></p>'

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

    it(`GIVEN Text component is inserted AND 'Insert Anchor' dialog is opened WHEN 'anchor' has been inserted THEN correct data should be present in the CKE`,
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
                return textComponentCke.clickOnInsertAnchorButton();
            }).then(() => {
                return insertAnchorDialog.typeInTextInput('test anchor');
            }).then(() => {
                studioUtils.saveScreenshot('anchor_text_typed');
                return insertAnchorDialog.clickOnInsertButton();
            }).then(() => {
                return contentWizard.switchToLiveEditFrame();
            }).then(() => {
                return textComponentCke.getTextFromEditor();
            }).then(result => {
                assert.equal(result, EXPECTED_DATA_CKE, 'correct data should be in CKE');
            })
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
