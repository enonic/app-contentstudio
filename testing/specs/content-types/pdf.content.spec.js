/**
 * Created on 07.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require("../../page_objects/browsepanel/content.browse.panel");
const PdfForm = require('../../page_objects/wizardpanel/pdf.form.panel');
const ContentFilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');

describe('pdf.content.spec tests for extraction data for pdf content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const TXT_FILE_DISPLAY_NAME = 'test-text';
    const TXT_EXTRACTION_TEXT = 'Minsk Belarus';
    const PDF_EXTRACTION_TEXT = 'my test pdf file';
    const PDF_TAG_TEXT = 'tag pdf';
    const PDF_CONTENT_DISPLAY_NAME = 'pdf';

    it(`GIVEN existing pdf content has been selected WHEN 'Media' has been selected in 'Preview' Dropdown THEN expected document should be displayed in the Preview Panel`,
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            // 1. Select the site:
            await studioUtils.findAndSelectItem(PDF_CONTENT_DISPLAY_NAME);
            // 2. Select 'Media' in the Preview Dropdown:
            await contentItemPreviewPanel.selectOptionInPreviewWidget(appConst.PREVIEW_WIDGET.MEDIA);
            // 3. Verify the 'Preview' button in Preview Panel (enabled):
            await contentItemPreviewPanel.waitForPreviewButtonEnabled();
            // 4. PDF content should be displayed in the Preview Panel
            await contentItemPreviewPanel.waitForPreviewIframeClass('application');
        });

    it(`GIVEN new tag and extraction text are saved in media content(PDF) WHEN extraction text has been typed in Filter Panel THEN expected pdf content should be filtered in the grid`,
        async () => {
            let pdfForm = new PdfForm();
            let contentWizard = new ContentWizard();
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel:
            await contentBrowsePanel.clickOnSearchButton();
            await contentFilterPanel.waitForOpened();
            // 2. Open the pdf-content
            await contentFilterPanel.typeSearchText(PDF_CONTENT_DISPLAY_NAME);
            await contentBrowsePanel.waitForRowByNameVisible(PDF_CONTENT_DISPLAY_NAME);
            await contentBrowsePanel.clickOnRowByName(PDF_CONTENT_DISPLAY_NAME);
            await contentBrowsePanel.pause(4000);
            await studioUtils.saveScreenshot('pdf_select_spinner_issue');
            await contentBrowsePanel.clickOnEditButton();
            await studioUtils.switchToContentTabWindow(PDF_CONTENT_DISPLAY_NAME);
            await contentWizard.waitForOpened();

            //let contentWizard = await studioUtils.selectAndOpenContentInWizard(PDF_CONTENT_DISPLAY_NAME);
            // 3. Save the text in abstraction text area and create a tag:
            await pdfForm.typeTextInAbstractionTextArea(PDF_EXTRACTION_TEXT);
            await pdfForm.addTag(PDF_TAG_TEXT);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchContentStudioTab();
            // 4. Type the extraction text
            await contentFilterPanel.typeSearchText(PDF_EXTRACTION_TEXT);
            await contentFilterPanel.pause(3000);
            // TODO Uncomment this code:
            //await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            // 5. Verify that the pdf content is filtered:
            await studioUtils.saveScreenshot('pdf_abstraction_text');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 1, 'Single pdf file should be filtered in the grid');
            assert.equal(result[0], PDF_CONTENT_DISPLAY_NAME, 'Expected pdf content should be filtered');
        });

    it(`GIVEN existing media content(PDF) with a tag WHEN tag's text has been typed in Filter Panel THEN expected pdf content should be filtered in grid`,
        async () => {
            let contentFilterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 2. Type the tag's text
            await contentFilterPanel.typeSearchText(PDF_TAG_TEXT);
            await contentFilterPanel.pause(3000);
            await studioUtils.saveScreenshot('pdf_tag_text_0');
            await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            // 4. Verify that the pdf content is filtered:
            await studioUtils.saveScreenshot('pdf_tag_text');
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 1, 'Single pdf file should be filtered in the grid');
            assert.equal(result[0], PDF_CONTENT_DISPLAY_NAME, 'Expected pdf content should be filtered');
        });

    it(`WHEN the text that is contained in a txt-file has been entered in the search input THEN required '.txt' file should be filtered in the grid`,
        async () => {
            let filterPanel = new ContentFilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 2. "Minsk Belarus" this text has been inserted in the search input
            await filterPanel.typeSearchText(TXT_EXTRACTION_TEXT);
            await filterPanel.pause(3000);
            await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
            await studioUtils.saveScreenshot('text_extraction_search_txt');
            // 3. Verify that expected '.txt' file is filtered
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 1, 'Single pdf file should be filtered in the grid"');
            assert.equal(result[0], TXT_FILE_DISPLAY_NAME, 'Expected txt-content should be filtered');
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
