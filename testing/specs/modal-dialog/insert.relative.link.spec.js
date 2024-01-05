/**
 * Created on 07.07.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');

describe("insert.relative.link.spec: insert relative links into htmlArea", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    const VALID_RELATIVE_HTML_FILE = "relative.html";
    const VALID_RELATIVE_HTML_FILE_2 = "../../path/relative.html";
    const INVALID_RELATIVE_SPACES = "./ relative.html";
    const INVALID_RELATIVE_SYMBOLS = "./path$/relative.html";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });


    it("GIVEN URL tab is open WHEN 'Relative' menu option has been selected THEN url input gets empty",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Expand url type selector and click on 'Relative' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption("Relative");
            //5. Verify that 'Http' text appears in the input
            let text = await insertLinkDialogUrlPanel.getTextInUrlInput();
            assert.equal(text, "", "Url input should be empty");
            await insertLinkDialogUrlPanel.clickOnUrlTypeButton();
            //6. Https menu option should be selected in the dropdown selector:
            let result = await insertLinkDialogUrlPanel.isUrlTypeOptionSelected("Relative");
            assert.ok(result, "Relative option should be selected in the dropdown selector");
        });

    it("GIVEN URL tab is open WHEN 'Relative' path of the current directory has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('relative url 1');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Relative' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption('Relative');
            // 5. Fill in the URL input with a valid Relative url: path of the current directory
            await insertLinkDialogUrlPanel.typeUrl(VALID_RELATIVE_HTML_FILE);
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            await studioUtils.saveScreenshot('insert_valid_url_1');
            // 6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //7. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(VALID_RELATIVE_HTML_FILE), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN valid 'Relative' url has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput("relative url 1");
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            // 4. Expand url type selector and click on 'Relative' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption("Relative");
            // 5. Fill in the URL input with a valid relative url: ../../path
            await insertLinkDialogUrlPanel.typeUrl(VALID_RELATIVE_HTML_FILE_2);
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            await studioUtils.saveScreenshot('insert_valid_url_1');
            // 6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 7. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(VALID_RELATIVE_HTML_FILE_2), "Expected text should be present in HtmlArea");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN invalid url (with spaces) has been inserted THEN expected validation recording gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('invalid relative url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Relative' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption('Relative');
            // 5. Fill in the input with the invalid(spaces) relative url:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_RELATIVE_SPACES);
            await studioUtils.saveScreenshot('insert_invalid_relative_1');
            // 6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            // 7. Verify the validation error message:
            await studioUtils.saveScreenshot('insert_invalid_relative_2');
            let message = await insertLinkDialogUrlPanel.getUrlInputValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN invalid relative url (with special symbols) has been inserted THEN expected validation recording gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('invalid relative url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Relative' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption('Relative');
            // 5. Fill in the input with the invalid(special symbols $) relative url:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_RELATIVE_SYMBOLS);
            await studioUtils.saveScreenshot('insert_invalid_relative_3');
            // 6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            // 7. Verify the validation error message:
            await studioUtils.saveScreenshot('insert_invalid_relative_4');
            let message = await insertLinkDialogUrlPanel.getUrlInputValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
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
