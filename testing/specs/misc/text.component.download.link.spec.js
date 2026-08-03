/**
 * Created on 14.05.2018.  updated on 03.08.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const InsertLinkDialog = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.cke');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const InsertLinkDialogContentPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');
const PageInspectionPanel = require("../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel");

describe('Text Component with CKE - insert download-link specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);

    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_954009;
    const IMPORTED_CHILD_CONTENT_DISPLAY_NAME = 'command';
    const EXPECTED_SRC = '<p><a href="media://download/';
    const LINK_TEXT = 'test';


    it(`GIVEN Text component is inserted AND 'Insert Link' dialog is opened WHEN 'download-link' has been inserted THEN correct data should be present in the CKE`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let pageInspectionPanel = new PageInspectionPanel();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open the existing site:
            await studioUtils.selectContentAndOpenWizard(IMPORTED_SITE_NAME);
            await contentWizard.openContextMenuClickOnPageSettings();
            await pageInspectionPanel.selectPageTemplateOrController(appConst.CONTROLLER_NAME.MAIN_REGION);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnCollapseContentForm();
            await pageComponentView.rightClickAndOpenContextMenu('main');
            // 3. Insert text component:
            await pageComponentView.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT, appConst.PCV_MENU_ITEM.TEXT]);
            //await textComponentCke.switchToLiveEditFrame();
            // 4. Open 'Insert Link' modal dialog:
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.clickOnInsertLinkButton();
            // 5. Type a link-name and select a target:
            await insertLinkDialog.typeInLinkTextInput(LINK_TEXT);
            await insertLinkDialog.clickOnBarItem('Content');
            // 6. Filter a content in the content selector(tree mode) - (select the 'server.sh')
            await insertLinkDialogContentPanel.selectTargetInContentSelector(IMPORTED_CHILD_CONTENT_DISPLAY_NAME);
            // 7. Switched to flat mode after inserting a search text
            // 9. Click on 'Download file' radio:
            await insertLinkDialogContentPanel.clickOnRadioButton(appConst.INSERT_LINK_DIALOG_TABS.DOWNLOAD_FILE);
            await studioUtils.saveScreenshot('download_link_dialog');
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.pause(700);
            //await textComponentCke.switchToLiveEditFrame();
            await studioUtils.saveScreenshot('download_link_inserted');
            // 10. Verify the text in CKE: 'media://download' should be present in the htmlarea
            let actualText = await textComponentInspectionPanel.getTextFromEditor();
            //let actualText = await textComponentCke.getTextFromEditor();
            assert.ok(actualText.includes(EXPECTED_SRC), 'Expected text should be in the text component');
            // 11. Save the changes:
            //await textComponentCke.switchToParentFrame();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN the site with download link in the text component is selected WHEN 'Enonic rendering' is selected THEN download-link should be present in the page`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site:
            await studioUtils.findAndSelectItem(IMPORTED_SITE_NAME);
            // 2.  'Enonic rendering' has been selected in the Preview widget dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await studioUtils.saveScreenshot('enonic_rendering_download_link');
            await contentItemPreviewPanel.switchToTextFrame();
            // 3. Verify that new added link is present
            let result = await contentItemPreviewPanel.getTextFromTextComponent(0);
            assert.equal(result, LINK_TEXT, "expected link should be present in the Preview Panel");
        });

    it(`GIVEN the site with download link in the text component is selected WHEN 'Automatic' is selected THEN download-link should be present in the page`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site and 'Automatic' option in the Preview widget dropdown:
            await studioUtils.findAndSelectItem(IMPORTED_SITE_NAME);
            await studioUtils.saveScreenshot('site_automatic_download_link');
            await contentItemPreviewPanel.switchToTextFrame();
            // 2. Verify that new added link is present
            let result = await contentItemPreviewPanel.getTextFromTextComponent(0);
            assert.equal(result, LINK_TEXT, 'expected link should be present in the Preview Panel');
        });

    it(`GIVEN site is selected WHEN 'Enonic rendering' is selected AND 'Preview' button has been pressed THEN download-link should be present in the page`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select the site and click on 'Preview' button
            await studioUtils.findAndSelectItem(IMPORTED_SITE_NAME);
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.ENONIC_RENDERING);
            await contentBrowsePanel.clickOnPreviewButton();
            await studioUtils.switchToContentTabWindow(IMPORTED_SITE_NAME);
            // 2. Verify that new added link is present
            let isDisplayed = await studioUtils.isElementDisplayed(`a=${LINK_TEXT}`);
            await studioUtils.saveScreenshot('download_link_present');
            assert.ok(isDisplayed, 'download link should be present on the page');
        });

    it(`GIVEN existing child content has been selected WHEN Move button has been pressed THEN Confirmation dialog should be loaded`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let moveContentDialog = new MoveContentDialog();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Select  the content
            await studioUtils.findAndSelectItem(IMPORTED_CHILD_CONTENT_DISPLAY_NAME);
            // 2. Move the content to another folder
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            await moveContentDialog.clickOnDropdownHandle();
            await moveContentDialog.clickOnOptionInDropdown('Project root');
            await moveContentDialog.clickOnMoveButton();
            // 3. Confirmation  dialog  should be loaded in this case!
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            await moveContentDialog.waitForClosed();
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
