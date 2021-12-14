/**
 * Created on 13.12.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertMacroModalDialog = require('../../page_objects/wizardpanel/macro/insert.macro.dialog.cke');

describe('htmlarea.macro.modal.dialog.spec: tests for macro modal dialog', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const TEST_TEXT = "test text";
    const CONFIG_IS_NOT_COMPLETED = "Macro configuration is not complete";
    const EXPECTED_CODE = "<p>[disable]" + TEST_TEXT + "[/disable]</p>";
    let SITE;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('area');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });


    it(`GIVEN MacroModalDialog is opened WHEN 'Disable macros' option has been selected AND text inserted THEN expected text should be present in htmlArea`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertMacroModalDialog = new InsertMacroModalDialog();
            //1. Open wizard for new htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.HTML_AREA_0_1);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            //await contentWizard.waitAndClickOnSave();
            //2. Click on 'Insert Macro' button
            await htmlAreaForm.showToolbarAndClickOnInsertMacroButton();
            await insertMacroModalDialog.waitForDialogLoaded();
            //3. Select the 'Disable macros' option:
            await insertMacroModalDialog.selectOption("Disable macros");
            //4. Insert a text in the Configuration Text Area:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(TEST_TEXT);
            //5. Verify the text in the 'Preview Tab' of the modal dialog:
            await insertMacroModalDialog.clickOnPreviewTabItem();
            await studioUtils.saveScreenshot("macro_is_completed");
            let text = await insertMacroModalDialog.getTextInPreviewTab();
            assert.equal(text, TEST_TEXT, "Expected text should be displayed in the Preview tab");
            //6. Click on Insert button
            await insertMacroModalDialog.clickOnInsertButton();
            //7. Verify the text in htmlArea:
            let actualHtmlCode = await htmlAreaForm.getTextInHtmlArea(0);
            assert.equal(actualHtmlCode.trim(), EXPECTED_CODE, "Expected text should be displayed in htmlArea");
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN 'Disable macros' option has been selected WHEN config area is empty AND Insert button has been pressed THEN validation recording gets visible`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertMacroModalDialog = new InsertMacroModalDialog();
            //1. Open wizard for new htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.HTML_AREA_0_1);
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
            assert.equal(recording, appConstant.THIS_FIELD_IS_REQUIRED, "Expected recording should be displayed");
            await insertMacroModalDialog.clickOnPreviewTabItem();
            let text = await insertMacroModalDialog.getWarningInPreviewTab();
            assert.equal(text, CONFIG_IS_NOT_COMPLETED, "Expected text should be displayed in the Preview tab");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
