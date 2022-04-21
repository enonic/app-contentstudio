/**
 * Created on 27.12.2021
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

describe('htmlarea.embed.iframe.spec: tests for macro modal dialog', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const TEST_TEXT = "test text";
    const ENONIC_IFRAME = "<iframe src='http://www.enonic.com'> enonic</iframe>";
    const ENONIC_URL = "http://www.enonic.com";
    const PREVIEW_MACRO_NOT_ALLOWED = "Preview of this macro is not allowed";

    let SITE;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('area');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verify Embed macro should not allow preview #4115
    //https://github.com/enonic/app-contentstudio/issues/4115
    it(`GIVEN MacroModalDialog is opened WHEN 'Embed IFrame' option has been selected AND URL inserted THEN expected iframe should be present in htmlArea and in the preview tab`,
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
            //3. Select the 'Embed IFrame' option:
            await insertMacroModalDialog.selectOption("Embed IFrame");
            //4. Insert a text in the Configuration Text Area:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(ENONIC_IFRAME);
            //5. Verify that expected iframe is present in the 'Preview Tab':
            await insertMacroModalDialog.clickOnPreviewTabItem();
            await studioUtils.saveScreenshot("embed_iframe_is_completed");
            //6. Verify that iframe element appears in the preview tab:
            let message = await insertMacroModalDialog.getTextInEmbedPreview();
            assert.equal(message, PREVIEW_MACRO_NOT_ALLOWED,
                "'Preview of this macro is not allowed' this text should be displayed in the Preview tab");
            //7. Click on Insert button:
            await insertMacroModalDialog.clickOnInsertButton();
            await insertMacroModalDialog.pause(500);
            //8. Verify the text in htmlArea:
            let actualHtmlCode = await htmlAreaForm.getTextInHtmlArea(0);
            assert.isTrue(actualHtmlCode.includes(ENONIC_URL), "Expected URL should be present in htmlArea");
            assert.isTrue(actualHtmlCode.includes("[embed]"), "Expected text should be present in htmlArea");

            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN existing content with inserted 'Embed IFrame' is opened WHEN double click on the 'embed iframe' text in htmlArea THEN Insert Macro modal dialog should be loaded`,
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
            //3. Select the 'Embed IFrame' option:
            await insertMacroModalDialog.selectOption("Embed IFrame");
            //4. Insert a text in the Configuration Text Area:
            await insertMacroModalDialog.typeTextInConfigurationTextArea(ENONIC_IFRAME);
            //5. Click on Insert button:
            await insertMacroModalDialog.clickOnInsertButton();
            await htmlAreaForm.pause(1000);
            //6. Do a double click on the text in htmlArea
            await htmlAreaForm.doubleClickOnMacroTextInHtmlArea(ENONIC_URL);
            await studioUtils.saveScreenshot("embed_iframe_double_click");
            //7. Verify that 'Insert Macro' dialog is loaded:
            await insertMacroModalDialog.waitForDialogLoaded();
            await insertMacroModalDialog.clickOnInsertButton();
            await insertMacroModalDialog.waitForDialogClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
