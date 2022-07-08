/**
 * Created on 29.06.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');

describe("insert.link.url.validation.spec: insert https,ftp links into htmlArea", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    const VALID_HTTPS_URL = "https://google.com";
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
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Click on 'Type' menu button:
            await insertLinkDialog.clickOnUrlTypeButton();
            await studioUtils.saveScreenshot("insert_url_opts");
            //5. Verify that required types are present in the selector:
            let result = await insertLinkDialog.getUrlTypeMenuOptions();
            assert.isTrue(result.includes("Https"), "Https option should be present in the selector");
            assert.isTrue(result.includes("Http"), "Http option should be present in the selector");
            assert.isTrue(result.includes("Ftp"), "Ftp option should be present in the selector");
            assert.isTrue(result.includes("Relative"), "Relative option should be present in the selector");
            assert.equal(result.length, 4, "4 options should be present in the selector");
        });

    it("WHEN URL tab is open THEN 'Https' menu option should be selected by default",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Verify that https type is selected by default:
            let text = await insertLinkDialog.getTextInUrlInput();
            assert.equal(text, "https://", "Expected part of https url should be present by default");
            await insertLinkDialog.clickOnUrlTypeButton();
            let result = await insertLinkDialog.isUrlTypeOptionSelected("Https");
            assert.isTrue(result, "Https option should be selected in the dropdown selector by default");
        });

    it("GIVEN URL tab is open WHEN 'Http' menu option has been selected THEN Http part of url should be present in the url input",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Expand url type selector and click on 'Http' option
            await insertLinkDialog.clickOnUrlTypeMenuOption("Http");
            //5. Verify that 'Http' text appears in the input
            let text = await insertLinkDialog.getTextInUrlInput();
            assert.equal(text, "http://", "'Http' part should be present in the input");
            await insertLinkDialog.clickOnUrlTypeButton();
            //6. Https menu option should be selected in the dropdown selector:
            let result = await insertLinkDialog.isUrlTypeOptionSelected("Http");
            assert.isTrue(result, "Http option should be selected in the dropdown selector");
        });

    it("GIVEN URL tab is open WHEN 'Https' url has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("google url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Fill in the URL input with a valid https url:
            await insertLinkDialog.typeUrl(VALID_HTTPS_URL);
            await insertLinkDialog.waitForValidationMessageForUrlInputNotDisplayed();
            await studioUtils.saveScreenshot("insert_valid_url_1");
            //5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //6. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_HTTPS_PART), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN 'Https' url with parameters has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("google url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Fill in the URL input with a valid https url:
            await insertLinkDialog.typeUrl(HTTPS_URL_WITH_PARAMETERS);
            await studioUtils.saveScreenshot("insert_valid_url_2");
            await insertLinkDialog.waitForValidationMessageForUrlInputNotDisplayed();
            //5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //6. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_HTTPS_PART_WITH_PARAMS), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN 'Https' url (ends with slash) has been inserted THEN expected text should be present in the HtmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("google url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Fill in the URL input with a valid https url:
            await insertLinkDialog.typeUrl(HTTP_URL_ENDS_WITH_SLASH);
            await studioUtils.saveScreenshot("insert_valid_url_3");
            await insertLinkDialog.waitForValidationMessageForUrlInputNotDisplayed();
            //5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //6. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(HTTP_URL_ENDS_WITH_SLASH), "Expected text should be present in HtmlArea");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN invalid url (with spaces) has been inserted THEN expected validation recording gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("google url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Fill in the URL input with the invalid(spaces) https url:
            await insertLinkDialog.typeUrl(INVALID_HTTPS_URL_WITH_SPACES);
            //5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("insert_invalid_url_1");
            let message = await insertLinkDialog.getUrlInputValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN invalid url (with special symbols) has been inserted THEN expected validation recording gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("google url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Fill in the URL input with the invalid(special symbols $) https url:
            await insertLinkDialog.typeUrl(INVALID_HTTPS_URL_WITH_SYMBOLS);
            //5. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("insert_invalid_url_2");
            let message = await insertLinkDialog.getUrlInputValidationMessage();
            assert.equal(message, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Invalid value entered - message gets visible");
        });

    it("GIVEN Insert Link dialog, URL tab is open WHEN valid ftp url has been inserted THEN expected text should be present in Html Area",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("ftp url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Select 'Ftp' option in the dropdown selector:
            await insertLinkDialog.clickOnUrlTypeMenuOption("Ftp");
            //5. Fill in the URL input with the invalid(special symbols) https url:
            await insertLinkDialog.typeUrl(FTP_URL);
            //6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("insert_ftp_url_1");
            await insertLinkDialog.waitForValidationMessageForUrlInputNotDisplayed();
            await insertLinkDialog.waitForDialogClosed();
            //7. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_FTP_PART), "Expected text should be present in HtmlArea");
            assert.isTrue(result[0].includes(FTP_URL), "Expected text should be present in HtmlArea");
        });

    it("GIVEN URL tab is open WHEN valid ftp url with IP address has been inserted THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.typeInTextInput("ftp url");
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("URL");
            //4. Select 'Ftp' option in the dropdown selector:
            await insertLinkDialog.clickOnUrlTypeMenuOption("Ftp");
            //5. Fill in the URL input with the invalid(special symbols) https url:
            await insertLinkDialog.typeUrl(FTP_URL_WITH_PASSWORD);
            //6. Click on Insert button
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("insert_ftp_url_2");
            await insertLinkDialog.waitForValidationMessageForUrlInputNotDisplayed();
            await insertLinkDialog.waitForDialogClosed();
            //7. Get and verify the text in html area:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_FTP_PART), "Expected text should be present in HtmlArea");
            assert.isTrue(result[0].includes(FTP_URL_WITH_PASSWORD),
                "Expected user name, password and ip-address should be present in HtmlArea");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
