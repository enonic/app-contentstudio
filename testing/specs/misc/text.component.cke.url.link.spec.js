/**
 * Created on 10.05.2018
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const InsertLinkDialog = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.cke');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('Text Component with CKE - insert link and table specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const INVALID_URL_SPEC = 'http://test$$.com';
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const EXPECTED_URL = '<a href="http://google.com">test</a>';

    it(`Precondition: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component has been inserted WHEN 'Insert table' button has been clicked THEN menu item for inserting of Html-table gets visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Insert a text-component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            // 2. Click on 'Insert Table' menu-button:
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.clickOnInsertTableButton();
            // menu item for inserting of Html-table gets visible:
            await textComponentInspectionPanel.waitForTableDisplayedInEditorFrame();
        });

    it(`GIVEN 'Insert Link' dialog is opened WHEN invalid 'url' has been typed AND 'Insert' button pressed THEN validation message should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // Details widget should be selected by default! :
            let contextWindow = await contentWizard.openContextWindow();
            await contextWindow.waitForWidgetSelected(appConst.WIDGET_SELECTOR_OPTIONS.DETAILS);
            // 2. Click on minimize-toggle  expand Live Edit and show Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text component and type an invalid URL:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            // 4. Open Insert link modal dialog
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.clickOnInsertLinkButton();
            // 6. go to url-tab
            await insertLinkDialog.clickOnBarItem('URL')
            await insertLinkDialog.typeInLinkTextInput('url_link');
            // 7. Insert invalid URL:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_URL_SPEC);
            // 8. Click on 'Insert" in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('invalid_url');
            // 9. Verify that Validation message gets visible:
            await insertLinkDialogUrlPanel.waitForValidationMessage();
            let message = await insertLinkDialogUrlPanel.getValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, 'Invalid value entered - should be visible' );
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'url-link' has been inserted THEN expected URL should appear in LiveEdit`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentCke = new TextComponentCke();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle  expand Live Edit and show Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert a text component:
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, 'Text']);
            // 4. Open Insert Link dialog and add the link:
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.clickOnInsertLinkButton();
            await studioUtils.insertUrlLinkInCke('test', 'http://google.com');
           // await textComponentCke.switchToLiveEditFrame();
            await studioUtils.saveScreenshot('url_link_inserted');
            // 5. Get and check the text in HtmlArea in LiveEdit:
            let result = await textComponentInspectionPanel.getTextFromEditor();
            assert.ok(result.includes(EXPECTED_URL), 'expected URL should appear in CKE');
            await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN site is selected WHEN 'Automatic' is selected AND 'Preview' button has been pressed AND inserted link has been clicked THEN 'Enonic' site should be loaded in the page`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site and click on Preview button:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentItemPreviewPanel.clickOnPreviewButton();
            // 2. Switch to the new browser-tab and verify the link:
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            await studioUtils.clickOnElement('a=test');
            await contentItemPreviewPanel.pause(1000);
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
            await contentItemPreviewPanel.clickOnElementInFrame('a=test');
            await studioUtils.saveScreenshot('enonic_not_loaded_in_preview_panel');
            // The Link gets not visible:
            let result = await contentItemPreviewPanel.waitForElementNotDisplayedInFrame('a=test');
            assert.ok(result, 'The link should not be visible');
            await contentItemPreviewPanel.pause(2000);
            await studioUtils.saveScreenshot("link_clicked_in_preview_panel");
            // Web page should not be loaded as well, because disallowed loading of the resource in an iframe outside of their domain:
            result = await contentItemPreviewPanel.waitForElementNotDisplayedInFrame("//input[name='q']");
            assert.ok(result, "Web page should not be loaded");
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
