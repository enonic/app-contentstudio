/**
 * Created on 29.06.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');

describe('htmlarea.insert.link.email.spec: insert `email-link` into htmlArea', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const INVALID_EMAIL = "john@@mail.com";
    const VALID_EMAIL = "john@mail.com";
    const EXPECTED_EMAIL_TXT_PART_1 = "href=\"mailto:john@mail.com\"";
    const EXPECTED_EMAIL_TXT_PART_2 = "title=\"Email\"";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN required 'Email' is empty WHEN 'Insert' button has been pressed THEN validation message should appear in the dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('Email');
            // 4. Do not insert a url and a text, but click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            // 5. Verify that validation messages gets visible:
            let validationMessage = await insertLinkDialog.getEmailInputValidationMessage();
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message gets visible");
        });

    it("GIVEN  invalid 'email' has been inserted WHEN Insert button has been pressed THEN expected validation message should appear in the dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to Email tab:
            await insertLinkDialog.clickOnBarItem('Email');
            // 4. Fill in the tooltip input:
            await insertLinkDialog.typeInLinkTooltip('Email link');
            // 5. Fill in the email input (invalid value):
            await insertLinkDialog.typeTextInEmailInput(INVALID_EMAIL);
            // 6. click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            //7. Verify that validation messages gets visible - Invalid value entered:
            let validationMessage = await insertLinkDialog.getEmailInputValidationMessage();
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED,
                "'Invalid value entered' validation message gets visible");
        });

    it("GIVEN valid data is in 'Email' link inputs WHEN 'Insert' button has been pressed THEN expected email-link should appear in the htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to Email tab:
            await insertLinkDialog.clickOnBarItem('Email');
            await insertLinkDialog.typeInLinkTextInput('Email link');
            // 4. Fill in the tooltip input:
            await insertLinkDialog.typeInLinkTooltip('Email');
            // 5. Fill in the email input (invalid value):
            await insertLinkDialog.typeTextInEmailInput(VALID_EMAIL);
            // 6. click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('email_link_inserted');
            // 7. Verify that expected email link is present in the htmlArea
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_EMAIL_TXT_PART_1), "Expected text should be inserted in HtmlArea");
            assert.ok(result[0].includes(EXPECTED_EMAIL_TXT_PART_2), "Expected text should be inserted in HtmlArea");
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
