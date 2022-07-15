/**
 * Created on 13.07.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');

describe("insert.content.link.anchor.spec: insert content link into htmlArea", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    const ANCHOR_TXT = "myAnchor";
    const EXPECTED_PART_1 = "a href=\"content";
    const EXPECTED_ANCHOR_PART = "fragment=myAnchor\">";
    const EXPECTED_PARAMETERS_PART = "?query=par1";
    const PARAMETER_VALUE = "value1";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN Content tab is active AND 'Add anchor' button has been clicked and text inserted WHEN Insert button has been preseed THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialog.selectTargetInContentTab(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("content link anchor");
            await studioUtils.saveScreenshot("content_link_with_anchor");
            //4. Click on Add anchor button:
            await insertLinkDialog.clickOnAddAnchorButton();
            //Verify that Add anchor button gets not visible:
            await insertLinkDialog.waitForAddAnchorButtonNotDisplayed();
            //5.Type a text in the anchor input:
            await insertLinkDialog.typeTextInAnchorInput(ANCHOR_TXT);
            //6. Click in Insert button:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //7. Verify the text in htmlArea:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_PART_1), "Expected text should be present in the htmlArea");
            assert.isTrue(result[0].includes(EXPECTED_ANCHOR_PART), "Expected text should be present in the htmlArea");
        });

    it("GIVEN 'Insert Content link' dialog is reopened WHEN 'Anchor' input has been cleared THEN 'This field is required' - message should be displayed in the modal dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialog.selectTargetInContentTab(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("content link anchor");
            //4. Click on Add anchor button:
            await insertLinkDialog.clickOnAddAnchorButton();
            //5.Type a text in the anchor input and click on Insert button:
            await insertLinkDialog.typeTextInAnchorInput(ANCHOR_TXT);
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //6. Reopen the inserted link:
            await htmlAreaForm.clickOnInsertLinkButton();
            await insertLinkDialog.waitForDialogLoaded();
            //7. Clear the Anchor input:
            await insertLinkDialog.typeTextInAnchorInput("");
            await studioUtils.saveScreenshot("content_link_anchor_validation");
            let message = await insertLinkDialog.getAnchorFormValidationMessage();
            //8. Verify that 'This field is required' gets visible in the form:
            assert.equal(message, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "'This field is required - validation message should be displayed");
        });

    it("GIVEN 'Add parameters' button has been clicked then parameter form is filled WHEN Insert button has been pressed THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialog.selectTargetInContentTab(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("content link anchor");
            //4. Click on 'Add parameters' button:
            await insertLinkDialog.clickOnAddParametersButton();
            //5.Type a name in the parameter name input:
            await insertLinkDialog.typeInParameterNameInput("par1", 0);
            //6. Fill in the parameter's value input:
            await insertLinkDialog.typeInParameterValueInput(PARAMETER_VALUE, 0);
            await studioUtils.saveScreenshot("content_link_with_param");
            //7. Click on Insert button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //8. Verify the text in htmlArea:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_PARAMETERS_PART), "Expected text should be present in the htmlArea");
            assert.isTrue(result[0].includes(PARAMETER_VALUE), "Expected text should be present in the htmlArea");
        });

    it("WHEN Anchor with a parameter has been inserted THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialog.selectTargetInContentTab(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("content link anchor");
            await studioUtils.saveScreenshot("content_link_modal_dialog");
            //4. Click on 'Add parameters' button:
            await insertLinkDialog.clickOnAddParametersButton();
            //5.Type a name in the parameter name input:
            await insertLinkDialog.typeInParameterNameInput("par1", 0);
            //6. Fill in the parameter's value input:
            await insertLinkDialog.typeInParameterValueInput(PARAMETER_VALUE, 0);
            //7. Click on 'Add anchor' button
            await insertLinkDialog.clickOnAddAnchorButton();
            await insertLinkDialog.typeTextInAnchorInput(ANCHOR_TXT);
            await studioUtils.saveScreenshot("content_link_with_param_anchor");
            //8. Click on Insert button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            //9. Verify the text in htmlArea:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.isTrue(result[0].includes(EXPECTED_PARAMETERS_PART), "Expected text should be present in the htmlArea");
            assert.isTrue(result[0].includes(PARAMETER_VALUE), "Expected text should be present in the htmlArea");
            assert.isTrue(result[0].includes(EXPECTED_ANCHOR_PART), "Expected text should be present in the htmlArea");
        });

    it("GIVEN parameter name input is empty WHEN 'Insert' button has been pressed THEN expected validation message gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialog.selectTargetInContentTab(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("content link anchor");
            await studioUtils.saveScreenshot("content_link_modal_dialog");
            //4. Click on 'Add parameters' button:
            await insertLinkDialog.clickOnAddParametersButton();
            //5. Click on 'Insert' button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogLoaded();
            //6. 'All parameters must have a name' - should be displayed:
            let result = await insertLinkDialog.getParametersFormValidationMessage();
            assert.equal(result, appConst.VALIDATION_MESSAGE.LINK_PARAMETERS,
                "All parameters must have a name - validation message should be displayed");
        });

    it("GIVEN Anchor input is empty WHEN 'Insert' button has been pressed THEN expected validation message gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            //1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            //2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            //3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialog.selectTargetInContentTab(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("content link anchor");
            //4. Click on 'Add anchor' button:
            await insertLinkDialog.clickOnAddAnchorButton();
            //5. Click on 'Insert' button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot("content_link_anchor_validation_2");
            //6. 'This field is required' - should be displayed:
            let result = await insertLinkDialog.getAnchorFormValidationMessage();
            assert.equal(result, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "'This field is required - validation message should be displayed");
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
