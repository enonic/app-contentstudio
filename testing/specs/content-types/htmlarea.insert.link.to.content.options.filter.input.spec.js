/**
 * Created on 05.06.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialogContentPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');
const InsertLinkDialog = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.cke');
const SourceCodeDialog = require('../../page_objects/wizardpanel/html.source.code.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('htmlarea.insert.link.to.content.spec: tests for filtering in content selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let SITE_NAME = contentBuilder.generateRandomName('site');
    const DUPLICATED_SITE_NAME = SITE_NAME + '-copy';

    it(`Preconditions: new site and its copy should be created`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            SITE = contentBuilder.buildSite(SITE_NAME, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);

            await studioUtils.findAndSelectItem(SITE_NAME);
            let contentDuplicateModalDialog = await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateModalDialog.clickOnDuplicateButton();
            await contentDuplicateModalDialog.waitForDialogClosed();
        });

    it(`GIVEN Show content from entire project checkbox is not selected WHEN options are expanded THEN content name that starts the same as the current site should not be present in the options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open 'Insert Link' dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Click on content-dropdown handler, expand the options:
            await insertLinkDialogContentPanel.clickOnContentDropdownHandle();
            // 3. Content selector should be switched to tree mode by default:
            let actualMode = await insertLinkDialogContentPanel.getOptionsMode();
            assert.equal(actualMode, 'tree', 'Content selector should be in tree mode');
            // 4. Verify - content name that starts the same as the current site(duplicated content) should not be present in the options:
            let items = await insertLinkDialogContentPanel.getContentSelectorOptionsDisplayNameInTreeMode()
            await studioUtils.saveScreenshot('duplicated_content_is_not_present_in_options');
            // Only one item should be present in the list of options in Tree mode:
            assert.equal(items.length, 1, 'Only one item should be present in the list of options');
            assert.ok(items.includes('/' + DUPLICATED_SITE_NAME) === false, 'Duplicated site should not be present in the options');
        });

    it(`GIVEN Show content from entire project checkbox is selected WHEN current site's name has been typed in the options filter input THEN content name that starts the same as the current site should be present in the options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Click on 'show content from entire project' checkbox
            await insertLinkDialogContentPanel.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Insert the current site's name in the options filter input:
            await insertLinkDialogContentPanel.typeTextInContentOptionsFilterInput(SITE_NAME)
            await insertLinkDialogContentPanel.pause(1000);
            await studioUtils.saveScreenshot('duplicated_content_is_present_in_options');
            // 4. Verify - content name that starts the same as the current site(duplicated content) should be present in the options:
            let items = await insertLinkDialogContentPanel.getContentSelectorOptionsNameInFlatMode();
            assert.ok(items.includes('/' + DUPLICATED_SITE_NAME), 'Duplicated site should be present in the options');
        });

    // NBSP appears after pasting text before a link #8996
    // https://github.com/enonic/app-contentstudio/issues/8996
    it(`GIVEN paste any text before the link, press space WHEN open 'Insert Link dialog' and new link has been inserted THEN 'NBSP' should not be present in SourceCodeDialog`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            await htmlAreaForm.insertTextInHtmlArea(0, 'test');
            await htmlAreaForm.clickInTextArea();
            await htmlAreaForm.pressWhiteSpace();
            // 1. Open 'Insert Link' dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('enonic');
            // 2. Insert an URL:
            await insertLinkDialog.clickOnBarItem('URL');
            await insertLinkDialogUrlPanel.typeUrl("http://enonic.com");
            // 3. Click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 4. Open 'Source Code' dialog:
            await htmlAreaForm.clickOnSourceButton();
            let sourceCodeDialog = new SourceCodeDialog();
            await sourceCodeDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('source_code_dialog_nbsp_with_link');
            // 5. Verify that '&nbsp;' should not be present in the source code:
            let result = await sourceCodeDialog.getText();
            assert.ok(!result.includes('nbsp'), "'&nbsp;' should not be present in the source code");
        });

    it(`GIVEN white space has been inserted after a text WHEN a text inserted via Ctrl+v THEN 'NBSP' should not be present in SourceCodeDialog`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialog = new InsertLinkDialog();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 1. Insert text in the html area:
            await htmlAreaForm.insertTextInHtmlArea(0, 'test');
            await htmlAreaForm.clickInTextArea();
            // 2. Copy and paste the text in the html area:
            await htmlAreaForm.pressCtrl_A();
            await htmlAreaForm.pressCtrl_C();
            await htmlAreaForm.pressEndKey();
            // 3. Add white space between the words:
            await htmlAreaForm.pressWhiteSpace();
            await htmlAreaForm.pressCtrl_V();
            // 4. Open 'Source Code' dialog:
            await htmlAreaForm.clickOnSourceButton();
            let sourceCodeDialog = new SourceCodeDialog();
            await sourceCodeDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('source_code_nbsp_between_words');
            // 5. Verify that '&nbsp;' should not be present in the source code:
            let result = await sourceCodeDialog.getText();
            assert.ok(!result.includes('nbsp'), "'&nbsp;' should not be present in the source code");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
