/**
 * Created on 10.05.2018
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertLinkDialog = require('../../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');

describe('Text Component with CKE - insert link and table specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let INVALID_URL_SPEC = 'http://test$$.com';
    let CONTROLLER_NAME = 'main region';
    let EXPECTED_URL = '<a href="http://google.com">test</a>';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component has been inserted WHEN 'Insert table' button has been clicked THEN menu item for inserting of Html-table gets visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //1. Insert a text-component:
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await pageComponentView.clickOnCloseButton();
            //Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            //2. Click on 'Insert Table' menu-button:
            await textComponentCke.clickOnInsertTableButton();
            // menu item for inserting of Html-table gets visible:
            await textComponentCke.waitForTableDisplayedInCke();
        });

    it(`GIVEN 'Insert Link' dialog is opened WHEN invalid 'url' has been typed AND 'Insert' button pressed THEN validation message should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            // 1. Insert a text component and type an invalid URL:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await pageComponentView.clickOnCloseButton();
            // Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            // 2. Open Insert link modal dialog
            await textComponentCke.clickOnInsertLinkButton();
            // go to url-tab
            await insertLinkDialog.clickOnBarItem('URL')
            await insertLinkDialog.typeInLinkTextInput('url_link');
            // 3. Insert invalid URL:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_URL_SPEC);
            // 4. Click on 'Insert" in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('not_valid_url');
            // 5. Verify that Validation message gets visible:
            await insertLinkDialogUrlPanel.waitForValidationMessage();
            let message = await insertLinkDialogUrlPanel.getValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - should be visible" );
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'url-link' has been inserted THEN expected URL should appear in CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //1. Insert a text component:
            await pageComponentView.openMenu("main");
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            await pageComponentView.clickOnCloseButton();
            //Close the details panel
            await contentWizard.clickOnDetailsPanelToggleButton();
            await textComponentCke.switchToLiveEditFrame();
            //2. Open Insert Link dialog and add the link:
            await textComponentCke.clickOnInsertLinkButton();
            await studioUtils.insertUrlLinkInCke("test", 'http://google.com');
            await textComponentCke.switchToLiveEditFrame();
            await studioUtils.saveScreenshot('url_link_inserted');
            //3. Get and check the text in CKE:
            let result = await textComponentCke.getTextFromEditor();
            assert.isTrue(result.includes(EXPECTED_URL), 'expected URL should appear in CKE');
            await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN site is selected WHEN 'Preview' button has been pressed AND inserted link has been clicked THEN 'Enonic' site should be loaded in the page`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the site and click on Preview button:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPreviewButton();
            //2. Switch to the new browser-tab and verify the link:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            await studioUtils.clickOnElement('a=test');
            await contentBrowsePanel.pause(2000);
            let title = await studioUtils.getTitle();
            await studioUtils.saveScreenshot('site_preview_button_clicked');
            assert.equal(title, 'Google', 'expected title should be loaded');
        });

    it("WHEN site is selected THEN the link should appear in Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.saveScreenshot('link_loaded_in_preview_panel');
            await contentItemPreviewPanel.waitForElementDisplayedInFrame('a=test');
        });

    it("GIVEN site is selected WHEN the link has been clicked THEN error message should appear in Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentItemPreviewPanel.clickOnElementInFrame("a=test");
            await studioUtils.saveScreenshot('enonic_not_loaded_in_preview_panel');
            //The Link gets not visible:
            let result = await contentItemPreviewPanel.waitForElementNotDisplayedInFrame("a=test");
            assert.isTrue(result, 'The link should not be visible');
            await contentItemPreviewPanel.pause(2000);
            await studioUtils.saveScreenshot("link_clicked_in_preview_panel");
            //Web page should not be loaded as well, because disallowed loading of the resource in an iframe outside of their domain:
            result = await contentItemPreviewPanel.waitForElementNotDisplayedInFrame("//input[name='q']");
            assert.isTrue(result, "Web page should not be loaded");
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
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
