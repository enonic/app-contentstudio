/**
 * Created on 13.12.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertMacroModalDialog = require('../../page_objects/wizardpanel/macro/insert.macro.dialog.cke');
const appConst = require('../../libs/app_const');

describe('htmlarea.macro.modal.dialog.spec: tests for macro modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TEST_TEXT = 'test text';
    const MACRO_LONG_TEXT = "myMacro1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111";
    const MACRO_WIT_ATTRIBUTE = "mymacro12345 attrib1=\"value1\" attrib2=\"value2\"";
    const MACRO_HTML = `<p>[disable]${MACRO_LONG_TEXT}[/disable]</p>`;
    const MACRO_HTML_2 = `<p>[disable]${MACRO_WIT_ATTRIBUTE}[/disable]</p>`;
    const CONFIG_IS_NOT_COMPLETED = "Macro configuration is not complete";
    const EXPECTED_CODE = "<p>[disable]" + TEST_TEXT + "[/disable]</p>";
    let SITE;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('area');
    const CONTENT_NAME_2 = contentBuilder.generateRandomName('area');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN MacroModalDialog is opened WHEN 'Disable macros' option has been selected AND text inserted THEN expected text should be present in htmlArea`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertMacroModalDialog = new InsertMacroModalDialog();
            // 1. Open wizard for new htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            // await contentWizard.waitAndClickOnSave();
            // 2. Click on 'Insert Macro' button
            await htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            // 3. Select the 'Disable macros' option:
            await insertMacroModalDialog.selectOption('Disable macros');
            // 4. Insert a text in the Configuration Text Area:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(TEST_TEXT);
            // . Verify the text in the 'Preview Tab' of the modal dialog:
            await insertMacroModalDialog.clickOnPreviewTabItem();
            await studioUtils.saveScreenshot("macro_is_completed");
            let text = await insertMacroModalDialog.getTextInPreviewTab();
            assert.equal(text, TEST_TEXT, "Expected text should be displayed in the Preview tab");
            // 6. Click on Insert button
            await insertMacroModalDialog.clickOnInsertButton();
            // 7. Verify the text in htmlArea:
            let actualHtmlCode = await htmlAreaForm.getTextInHtmlArea(0);
            assert.equal(actualHtmlCode.trim(), EXPECTED_CODE, "Expected text should be displayed in htmlArea");
        });

    it(`GIVEN 'Disable macros' option has been selected WHEN config area is empty AND Insert button has been pressed THEN validation recording gets visible`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertMacroModalDialog = new InsertMacroModalDialog();
            //1. Open wizard for new htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            //2. Click on 'Insert Macro' button
            await htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            //3. Select the 'Disable macros' option:
            await insertMacroModalDialog.selectOption("Disable macros");
            //4. Do not fill the text area but click on Insert button
            await insertMacroModalDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("macro_is_not_completed");
            //5. Verify that expected validation recording gets visible:
            let recording = await insertMacroModalDialog.getValidationRecording();
            assert.equal(recording, appConst.THIS_FIELD_IS_REQUIRED, "Expected recording should be displayed");
            await insertMacroModalDialog.clickOnPreviewTabItem();
            let text = await insertMacroModalDialog.getWarningInPreviewTab();
            assert.equal(text, CONFIG_IS_NOT_COMPLETED,
                "'Macro configuration is not complete' this text should be displayed in the Preview tab");
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/3938
    // HtmlEditor hangs browser tab with macro processing #3938
    it(`GIVEN 'Disable macros' option has been selected WHEN the config textarea has been filled in AND Insert button has been pressed THEN expected text should appear in the htmlArea`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertMacroModalDialog = new InsertMacroModalDialog();
            // 1. Open wizard for new htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            // 2. Click on 'Insert Macro' button
            await htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            // 3. Select the 'Disable macros' option:
            await insertMacroModalDialog.selectOption('Disable macros');
            // 4. Fill in the config textArea:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(MACRO_LONG_TEXT);
            await studioUtils.saveScreenshot('macro_is_completed');
            // 5.Click on 'Insert' button:
            await insertMacroModalDialog.clickOnInsertButton();
            await insertMacroModalDialog.waitForDialogClosed();
            let htmlCode = await htmlAreaForm.getTextInHtmlArea(0);
            assert.equal(htmlCode.trim(), MACRO_HTML, "Expected html code should be present in the htmlarea");
            //6. Verify that double click on the text in htmlarea opens 'Insert Macro' modal dialog:
            await htmlAreaForm.doubleClickOnMacroTextInHtmlArea(MACRO_LONG_TEXT);
            await insertMacroModalDialog.waitForDialogLoaded();
            await insertMacroModalDialog.clickOnInsertButton();
            await insertMacroModalDialog.waitForDialogClosed();

            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`WHEN existing content with an inserted macro is opened THEN expected html code should be present in the htmlArea`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open the existing htmlarea content with an inserted macro:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_1);
            await htmlAreaForm.pause(1000);
            await studioUtils.saveScreenshot('macro_content_reopened');
            // 2. Verify the html code in the htmlArea:
            let htmlCode = await htmlAreaForm.getTextInHtmlArea(0);
            assert.equal(htmlCode.trim(), MACRO_HTML, "Expected html code should be present in the htmlarea");
        });

    //Verify https://github.com/enonic/app-contentstudio/issues/3938
    //HtmlEditor hangs browser tab with macro processing #3938
    it(`GIVEN 'Disable macros' option has been selected WHEN a macro with parameters has been inserted THEN expected code should appear in the htmlArea`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertMacroModalDialog = new InsertMacroModalDialog();
            // 1. Open wizard for new htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            // 2. Click on 'Insert Macro' button
            await htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            // 3. Select the 'Disable macros' option:
            await insertMacroModalDialog.selectOption("Disable macros");
            // 4. insert a macro with parameters:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(MACRO_WIT_ATTRIBUTE);
            await studioUtils.saveScreenshot("macro_attributes_is_completed");
            // 5.Click on 'Insert' button
            await insertMacroModalDialog.clickOnInsertButton();
            await insertMacroModalDialog.waitForDialogClosed();

            // 6. Verify the html code in the htmlArea:
            let htmlCode = await htmlAreaForm.getTextInHtmlArea(0);
            assert.equal(htmlCode.trim(), MACRO_HTML_2, "Expected html code should be present in the htmlarea");
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
