/**
 * Created on 14.06.2018. update on 29.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const appConst = require('../../libs/app_const');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('Text Component with CKE - insert email link  specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const TEST_EMAIL = 'test@mail.com';
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const EXPECTED_SRC = '<p><a href="mailto:test@mail.com">test</a></p>';


    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, null, [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'email-link' has been inserted THEN correct data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Insert new text-component
            await pageComponentView.rightClickAndOpenContextMenu('main');
            await pageComponentView.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            // 4. Open 'Insert Link' dialog and insert email-link:
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.clickOnInsertLinkButton();
            await studioUtils.insertEmailLinkInCke('test', TEST_EMAIL);
            await contentWizard.pause(1000);
            // 5. Verify inserted link in the page:
            await studioUtils.saveScreenshot('email_link_inserted');
            let actualText = await textComponentInspectionPanel.getTextFromEditor();
            assert.ok(actualText.includes(EXPECTED_SRC), 'expected data should be in CKE');
            // Save the changes:
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN site is selected WHEN 'Automatic' is selected AND 'Preview' button has been pressed THEN email-link should be present in the page`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the site and click on Preview button:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await contentBrowsePanel.clickOnPreviewButton();
            await contentItemPreviewPanel.pause(1000);
            await studioUtils.switchToContentTabWindow(SITE.displayName);
            // 2. Verify that the link is present:
            let isDisplayed = await studioUtils.isElementDisplayed(`a=test`);
            await studioUtils.saveScreenshot('email_link_present');
            assert.ok(isDisplayed, 'email link should be present in the page');
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/3476
    //B/I/U disappeared from Text component's toolbar #3476
    it(`GIVEN Text component is inserted THEN B/I/U buttons should be present in the cke-toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            // 3. Insert new text-component
            await pageComponentView.rightClickAndOpenContextMenu('main');
            await pageComponentView.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            await textComponentInspectionPanel.waitForOpened();
            await textComponentInspectionPanel.clickInTextArea();
            // 4. Verify B/I/U buttons
            await studioUtils.saveScreenshot('bold_italic_buttons_text_component');
            await textComponentInspectionPanel.waitForBoldButtonDisplayed();
            await textComponentInspectionPanel.waitForItalicButtonDisplayed();
            await textComponentInspectionPanel.waitForUnderlineButtonDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
