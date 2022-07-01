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

describe('htmlarea.insert.link.email.url.spec: insert `email-link` and url-link into htmlArea', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEST_TOOLTIP = "my tooltip";
    let INVALID_EMAIL = "john@@mail.com";
    let VALID_EMAIL = "john@mail.com";
    const EXPECTED_EMAIL_TXT_PART = "a title=\"Email link\" href=\"mailto:john@mail.com\"";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN required 'Email' is empty WHEN 'Insert' button has been pressed THEN validation message should appear in the dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem("Email");
            //4. Do not insert a url and a text, but click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            //5. Verify that validation messages gets visible:
            let validationMessage = await insertLinkDialog.getEmailInputValidationMessage();
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message gets visible");
        });

    it("GIVEN  invalid 'email' has been inserted WHEN Insert button has been pressed THEN expected validation message should appear in the dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to Email tab:
            await insertLinkDialog.clickOnBarItem("Email");
            //4. Fill in the tooltip input:
            await insertLinkDialog.typeInLinkTooltip("Email link");
            //5. Fill in the email input (invalid value):
            await insertLinkDialog.typeTextInEmailInput(INVALID_EMAIL);
            //6. click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            //7. Verify that validation messages gets visible - Invalid value entered:
            let validationMessage = await insertLinkDialog.getEmailInputValidationMessage();
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED,
                "'Invalid value entered' validation message gets visible");
        });

    it("GIVEN required inputs are filled WHEN 'Insert' button has been pressed THEN validation message should appear in the dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to Email tab:
            await insertLinkDialog.clickOnBarItem("Email");
            await insertLinkDialog.typeInTextInput("Email link");
            //4. Fill in the tooltip input:
            await insertLinkDialog.typeInLinkTooltip("Email link");
            //5. Fill in the email input (invalid value):
            await insertLinkDialog.typeTextInEmailInput(VALID_EMAIL);
            //6. click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            //7. Verify that expected email link is present in the htmlArea
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_EMAIL_TXT_PART), "Expected text should be inserted in HtmlArea");
        });


    it("GIVEN required inputs are filled WHEN 'Insert' button has been pressed THEN validation message should appear in the dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Go to Email tab:
            await insertLinkDialog.clickOnBarItem("URL");
            await insertLinkDialog.typeInTextInput("Email link");
            //4. Fill in the tooltip input:
            await insertLinkDialog.typeInLinkTooltip("Email link");
            //5. Fill in the email input (invalid value):
            await insertLinkDialog.typeTextInEmailInput(VALID_EMAIL);
            //6. click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            //7. Verify that expected email link is present in the htmlArea
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_EMAIL_TXT_PART), "Expected text should be inserted in HtmlArea");
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
