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
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');

describe('Text Component with CKE - insert link and table  specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let NOT_VALID_URL = 'test';
    let CONTROLLER_NAME = 'main region';
    let EXPECTED_URL = '<p><a href="http://enonic.com">test</a></p>';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it.skip(
        `GIVEN Text component has been inserted AND 'Insert table' button has been clicked WHEN table has been inserted THEN the modal dialog should be closed`,
        () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
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
            }).then(() => {
                return contentWizard.pause(3000);
            }).then(() => {
                return textComponentCke.switchToCKETableFrameAndInsertTable();
            }).then(result => {
                assert.isTrue(result, '');
            })
        });

    it(`GIVEN 'Insert Link' dialog is opened WHEN incorrect 'url' has been typed AND 'Insert' button pressed THEN validation message should appear`,
        () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertLinkDialog = new InsertLinkDialog();
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
                return insertLinkDialog.typeText("url_link");
            }).then(() => {
                return insertLinkDialog.typeUrl(NOT_VALID_URL);
            }).then(() => {
                return insertLinkDialog.clickOnInsertButton();
            }).then(() => {
                return insertLinkDialog.waitForValidationMessage();
            }).then(result => {
                studioUtils.saveScreenshot('not_valid_url_typed');
                assert.isTrue(result, 'Validation message should be displayed on the modal dialog ');
            })
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'url-link' has been inserted THEN correct data should be present in the CKE`,
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
                return studioUtils.insertUrlLinkInCke("test", 'http://enonic.com');
            }).then(() => {
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
            let contentBrowsePanel = new ContentBrowsePanel();
            return studioUtils.findAndSelectItem(SITE.displayName).then(() => {
                return contentBrowsePanel.clickOnPreviewButton();
            }).then(() => {
                return studioUtils.switchToContentTabWindow(SITE.displayName)
            }).then(() => {
                return studioUtils.clickOnElement(`a=test`);
            }).then(() => {
                return contentBrowsePanel.pause(2000);
            }).then(() => {
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
            }).then(() => {
                return webDriverHelper.browser.pause(2000);
            }).then(() => {
                return studioUtils.getText("//div[@class='frontpage-get-started__container']//h3");
            }).then(result => {
                studioUtils.saveScreenshot('enonic_loaded_in_preview_panel');
                assert.equal(result, 'FASTER DIGITAL PROJECTS WITH THE ENONIC PLATFORM', 'expected text should be loaded');
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.isDialogOpened().then(result => {
            if (result) {
                return insertLinkDialog.clickOnCancelButton();
            }
        }).then(() => {
            return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
        })
    });
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
