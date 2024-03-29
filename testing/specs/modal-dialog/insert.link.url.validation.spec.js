/**
 * Created on 29.06.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');

describe("insert.link.url.validation.spec: insert https,ftp links into htmlArea", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    const VALID_HTTPS_URL = "https://google.com";
    const VALID_TEL_VALUE = 'tel:+375293339128';
    const INVALID_TEL_VALUE = 'tel:+@3375293339128';
    const EXPECTED_TEL_TEXT = '<a href="tel:+375293339128">';
    const HTTP_URL_ENDS_WITH_SLASH = "http://google.com/";
    const PARAMS_1 = "page?key1=value1&key2=value2";
    const EXPECTED_HTTPS_PART = "<a href=\"https://google.com\">";
    const EXPECTED_FTP_PART = "<a href=\"ftp://";
    const HTTPS_URL_WITH_PARAMETERS = VALID_HTTPS_URL + "/" + PARAMS_1;
    const EXPECTED_HTTP_PART = "<a href=\"http://google.com\">";
    const EXPECTED_HTTPS_PART_WITH_PARAMS = "<a href=\"https://google.com/page?key1=value1&amp;key2=value2\">google url</a>";
    const INVALID_HTTPS_URL_WITH_SPACES = "http://www.example.com/ main.html";
    const INVALID_HTTPS_URL_WITH_SYMBOLS = "https://google.com/$";
    const FTP_URL = "ftp://ftp.funet.fi/pub/standards/RFC/rfc959.txt";
    const FTP_URL_WITH_PASSWORD = "ftp://guest:qwerty@213.128.193.154/readme.txt";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN URL tab is active  WHEN 'Types' menu button has been pressed THEN expected options should be shown",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            // 4. Click on 'Type' menu button, expand the menu:
            await insertLinkDialogUrlPanel.clickOnUrlTypeButton();
            await studioUtils.saveScreenshot('insert_url_opts');
            // 5. Verify that required types are present in the selector:
            let result = await insertLinkDialogUrlPanel.getUrlTypeMenuOptions();
            assert.ok(result.includes(appConst.URL_TYPE_OPTION.HTTPS), "Https option should be present in the selector");
            assert.ok(result.includes(appConst.URL_TYPE_OPTION.HTTP), "Http option should be present in the selector");
            assert.ok(result.includes(appConst.URL_TYPE_OPTION.FTP), "Ftp option should be present in the selector");
            assert.ok(result.includes(appConst.URL_TYPE_OPTION.RELATIVE), "Relative option should be present in the selector");
            assert.ok(result.includes(appConst.URL_TYPE_OPTION.TEL), "Tel option should be present in the selector");
            assert.equal(result.length, 5, "5 options should be present in the selector");
        });

    it("WHEN URL tab is open THEN 'Https' menu option should be selected by default",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Verify that https type is selected by default:
            let text = await insertLinkDialogUrlPanel.getTextInUrlInput();
            assert.equal(text, "https://", "Expected part of https url should be present by default");
            // 5. Expand the dropdown options:
            await insertLinkDialogUrlPanel.clickOnUrlTypeButton();
            let result = await insertLinkDialogUrlPanel.isUrlTypeOptionSelected("Https");
            assert.ok(result, "Https option should be selected in the dropdown selector by default");
        });

    it("GIVEN URL tab is open WHEN 'Http' menu option has been selected THEN Http part of url should be present in the url input",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Http' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.HTTP);
            // 5. Verify that 'Http' text appears in the input
            let text = await insertLinkDialogUrlPanel.getTextInUrlInput();
            assert.equal(text, "http://", "'Http' part should be present in the input");
            // 6. Expand the dropdown options:
            await insertLinkDialogUrlPanel.clickOnUrlTypeButton();
            // 7. Https menu option should be selected in the dropdown selector:
            let result = await insertLinkDialogUrlPanel.isUrlTypeOptionSelected(appConst.URL_TYPE_OPTION.HTTP);
            assert.ok(result, "'Http' option should be selected in the dropdown selector");
        });

    it("GIVEN URL tab is open WHEN 'Tel' menu option has been selected THEN Tel-part of url should be present in the url input in the modal dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Tel' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.TEL);
            // 5. Verify that 'tel' text appears in the input
            let text = await insertLinkDialogUrlPanel.getTextInUrlInput();
            assert.equal(text, "tel:", "'tel' part should be present in the input");
            // 6. Expand the dropdown options:
            await insertLinkDialogUrlPanel.clickOnUrlTypeButton();
            // 7. 'Tel' menu option should be selected in the dropdown selector:
            let result = await insertLinkDialogUrlPanel.isUrlTypeOptionSelected(appConst.URL_TYPE_OPTION.TEL);
            assert.ok(result, "'Tel' option should be selected in the dropdown selector");
        });

    it("GIVEN URL tab is open WHEN valid value for 'Tel' url has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('tel link');
            // 3. Go to URL tab, select Tel option in 'Type' dropdown:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Tel' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.TEL);
            // 5. Fill in the URL input with a valid https url:
            await insertLinkDialogUrlPanel.typeUrl(VALID_TEL_VALUE);
            await studioUtils.saveScreenshot('insert_valid_tel');
            // 6. Click on 'Insert' button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 7. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_TEL_TEXT), 'Expected link should be present in HtmlArea');
        });

    it("GIVEN invalid value for 'Tel' url has been inserted WHEN 'Insert' button has been pressed THEN 'Invalid value entered' message gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('tel link');
            // 3. Go to URL tab, select Tel option in Type dropdown:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Expand url type selector and click on 'Tel' option
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.TEL);
            // 5. Fill in the URL input with a invalid tel:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_TEL_VALUE);
            await studioUtils.saveScreenshot('insert_invalid_tel');
            // 6. Click on 'Insert' button
            await insertLinkDialog.clickOnInsertButton();
            let message = await insertLinkDialogUrlPanel.getUrlInputValidationMessage();
            // 7. Verify the validation message:
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
        });

    it("GIVEN URL tab is open WHEN 'Https' url has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('google url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Fill in the URL input with a valid https url:
            await insertLinkDialogUrlPanel.typeUrl(VALID_HTTPS_URL);
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            await studioUtils.saveScreenshot('insert_valid_url_1');
            // 5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 6. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_HTTPS_PART), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN 'Https' url with parameters has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('google url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Fill in the URL input with a valid https url:
            await insertLinkDialogUrlPanel.typeUrl(HTTPS_URL_WITH_PARAMETERS);
            await studioUtils.saveScreenshot("insert_valid_url_2");
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            // 5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 6. Verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_HTTPS_PART_WITH_PARAMS), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN 'Https' url (ends with slash) has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('google url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Fill in the URL input with a valid https url:
            await insertLinkDialogUrlPanel.typeUrl(HTTP_URL_ENDS_WITH_SLASH);
            await studioUtils.saveScreenshot("insert_valid_url_3");
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            // 5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 6. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(HTTP_URL_ENDS_WITH_SLASH), "Expected text should be present in HtmlArea");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN invalid url (with spaces) has been inserted THEN expected validation recording gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('google url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Fill in the URL input with the invalid(spaces) https url:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_HTTPS_URL_WITH_SPACES);
            // 5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('insert_invalid_url_1');
            // 6. Verify the validation message:
            let message = await insertLinkDialogUrlPanel.getUrlInputValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN invalid url (with special symbols) has been inserted THEN expected validation recording gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('google url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Fill in the URL input with the invalid(special symbols $) https url:
            await insertLinkDialogUrlPanel.typeUrl(INVALID_HTTPS_URL_WITH_SYMBOLS);
            // 5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('insert_invalid_url_2');
            // 6. Verify the validation message:
            let message = await insertLinkDialogUrlPanel.getUrlInputValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN valid ftp url has been inserted THEN expected text should be present in Html Area",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('ftp url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Select 'Ftp' option in the dropdown selector:
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.FTP);
            // 5. Fill in the URL input with the invalid(special symbols) https url:
            await insertLinkDialogUrlPanel.typeUrl(FTP_URL);
            // 6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("insert_ftp_url_1");
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            await insertLinkDialog.waitForDialogClosed();
            // 7. Verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_FTP_PART), "Expected text should be present in HtmlArea");
            assert.ok(result[0].includes(FTP_URL), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN valid ftp url with IP address has been inserted THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInLinkTextInput('ftp url');
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Select 'Ftp' option in the dropdown selector:
            await insertLinkDialogUrlPanel.clickOnUrlTypeMenuOption(appConst.URL_TYPE_OPTION.FTP);
            // 5. Fill in the URL input with the invalid(special symbols) https url:
            await insertLinkDialogUrlPanel.typeUrl(FTP_URL_WITH_PASSWORD);
            // 6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot('insert_ftp_url_2');
            await insertLinkDialogUrlPanel.waitForValidationMessageForUrlInputNotDisplayed();
            await insertLinkDialog.waitForDialogClosed();
            // 7. Verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_FTP_PART), "Expected text should be present in HtmlArea");
            assert.ok(result[0].includes(FTP_URL_WITH_PASSWORD),
                "Expected user name, password and ip-address should be present in HtmlArea");
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
