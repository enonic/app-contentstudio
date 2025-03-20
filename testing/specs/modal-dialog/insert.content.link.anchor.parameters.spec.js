/**
 * Created on 13.07.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialogContentPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');

describe("insert.content.link.anchor.spec: insert content link into htmlArea", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;

    const ANCHOR_TXT = 'myAnchor';
    const PARAM_NAME_WITH_SPACES = ' param1  ';
    const PARAMETER_VALUE_WITH_SPACES = ' value1 ';
    const ANCHOR_TXT_WITH_WHITESPACE = 'myAnchor  ';
    const EXPECTED_PART_1 = "a href=\"content";
    const EXPECTED_ANCHOR_PART = "fragment=myAnchor\">";
    const EXPECTED_PARAMETERS_PART = "?query=par1";
    const PARAMETER_VALUE = 'value1';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN Content tab is active AND 'Add anchor' button has been clicked and text inserted WHEN 'Insert' button has been pressed THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('content link anchor');
            await studioUtils.saveScreenshot("content_link_with_anchor");
            // 5. Click on Add anchor button:
            await insertLinkDialogContentPanel.clickOnAddAnchorButton();
            // Verify that Add anchor button gets not visible:
            await insertLinkDialogContentPanel.waitForAddAnchorButtonNotDisplayed();
            // 6.Type a text in the anchor input:
            await insertLinkDialogContentPanel.typeTextInAnchorInput(ANCHOR_TXT);
            // 7. Click in Insert button:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 8. Verify the text in htmlArea:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_PART_1), "Expected text should be present in the htmlArea");
            assert.ok(result[0].includes(EXPECTED_ANCHOR_PART), "Expected text should be present in the htmlArea");
        });

    it("GIVEN 'Insert Content link' dialog is reopened WHEN 'Anchor' input has been cleared THEN 'This field is required' - message should be displayed in the modal dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('content link anchor');
            // 4. Click on Add anchor button:
            await insertLinkDialogContentPanel.clickOnAddAnchorButton();
            // 5.Type a text in the anchor input and click on Insert button:
            await insertLinkDialogContentPanel.typeTextInAnchorInput(ANCHOR_TXT);
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 6. Reopen the inserted link:
            await htmlAreaForm.clickOnInsertLinkButton();
            await insertLinkDialog.waitForDialogLoaded();
            // 7. Clear the Anchor input:
            await insertLinkDialogContentPanel.typeTextInAnchorInput('');
            await studioUtils.saveScreenshot('content_link_anchor_validation');
            let message = await insertLinkDialogContentPanel.getAnchorFormValidationMessage();
            // 8. Verify that 'This field is required' gets visible in the form:
            assert.equal(message, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "'This field is required - validation message should be displayed");
        });

    it("GIVEN 'Add parameters' button has been clicked then parameter form is filled WHEN Insert button has been pressed THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('content link anchor');
            // 4. Click on 'Add parameters' button:
            await insertLinkDialogContentPanel.clickOnAddParametersButton();
            // 5.Type a name in the parameter name input:
            await insertLinkDialogContentPanel.typeInParameterNameInput('par1', 0);
            // 6. Fill in the parameter's value input:
            await insertLinkDialogContentPanel.typeInParameterValueInput(PARAMETER_VALUE, 0);
            await studioUtils.saveScreenshot('content_link_with_param');
            // 7. Click on Insert button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 8. Verify the text in htmlArea:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_PARAMETERS_PART), 'Expected text should be present in the htmlArea');
            assert.ok(result[0].includes(PARAMETER_VALUE), 'Expected text should be present in the htmlArea');
        });

    it("WHEN Anchor with a parameter has been inserted THEN expected text should be present in htmlArea",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('anchor with a parameter and value');
            await studioUtils.saveScreenshot('content_link_modal_dialog');
            // 4. Click on 'Add parameters' button:
            await insertLinkDialogContentPanel.clickOnAddParametersButton();
            // 5.Type a name in the parameter name input:
            await insertLinkDialogContentPanel.typeInParameterNameInput('par1', 0);
            // 6. Fill in the parameter's value input:
            await insertLinkDialogContentPanel.typeInParameterValueInput(PARAMETER_VALUE, 0);
            // 7. Click on 'Add anchor' button
            await insertLinkDialogContentPanel.clickOnAddAnchorButton();
            await insertLinkDialogContentPanel.typeTextInAnchorInput(ANCHOR_TXT);
            await studioUtils.saveScreenshot('content_link_with_param_anchor');
            // 8. Click on Insert button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 9. Verify the text in htmlArea:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result[0].includes(EXPECTED_PARAMETERS_PART), 'Expected text should be present in the htmlArea');
            assert.ok(result[0].includes(PARAMETER_VALUE), 'Expected text should be present in the htmlArea');
            assert.ok(result[0].includes(EXPECTED_ANCHOR_PART), "Expected text should be present in the htmlArea");
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/4856
    // Insert Link modal dialog - trim whitespaces from string in inputs #4856
    it("WHEN 'Insert Content link' dialog is reopened THEN whitespaces should be trimmed in anchor and parameter inputs",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput("anchor with whitespaces");
            // 4. Click on 'Add parameters' button:
            await insertLinkDialogContentPanel.clickOnAddParametersButton();
            // 5. Type a name with whitespaces at the end of the string:
            await insertLinkDialogContentPanel.typeInParameterNameInput(PARAM_NAME_WITH_SPACES, 0);
            // 6. insert a parameter name with whitespaces at the start and at the end of the line
            await insertLinkDialogContentPanel.typeInParameterValueInput(PARAMETER_VALUE_WITH_SPACES, 0);
            // 7. Click on 'Add anchor' button
            await insertLinkDialogContentPanel.clickOnAddAnchorButton();
            // 8. Insert a text with whitespace at the end of the string:
            await insertLinkDialogContentPanel.typeTextInAnchorInput(ANCHOR_TXT_WITH_WHITESPACE);
            await studioUtils.saveScreenshot('content_link_anchor_with_whitespaces');
            // 9. Click on 'Insert' button and close the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 10. Reopen the inserted link:
            await htmlAreaForm.clickOnInsertLinkButton();
            await insertLinkDialog.waitForDialogLoaded();
            // 11. Verify that text is trimmed in both inputs:
            let textInAnchorInput = await insertLinkDialogContentPanel.getTextInAnchorInput();
            let expectedTrimmedText = ANCHOR_TXT_WITH_WHITESPACE.trim();
            assert.equal(textInAnchorInput, expectedTrimmedText, 'Text should be trimmed in the Anchor input');

            let textInParamInput_0 = await insertLinkDialogContentPanel.getTextInParameterNameInput(0);
            expectedTrimmedText = PARAM_NAME_WITH_SPACES.trim();
            assert.equal(textInParamInput_0, expectedTrimmedText, 'Text should be trimmed in the Parameter name input');
        });

    it("GIVEN 'Insert Content link' dialog is reopened WHEN 'Parameter name' input has been cleared THEN 'All parameters must have a name' - message should be displayed in the modal dialog",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('anchor with a parameter');
            // 4. Click on Add parameters button:
            await insertLinkDialogContentPanel.clickOnAddParametersButton();
            // 5.Type a text in the parameter input and click on 'Insert' button:
            await insertLinkDialogContentPanel.typeInParameterNameInput('param 1', 0);
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogClosed();
            // 6. Reopen the inserted link:
            await htmlAreaForm.clickOnInsertLinkButton();
            await insertLinkDialog.waitForDialogLoaded();
            // 7. Clear the 'Parameter name' input:
            await insertLinkDialogContentPanel.typeInParameterNameInput('', 0);
            await studioUtils.saveScreenshot('content_link_parameters_validation');
            let message = await insertLinkDialogContentPanel.getParametersFormValidationMessage();
            // 8. Verify that 'All parameters must have a name' gets visible in the form:
            assert.equal(message, appConst.VALIDATION_MESSAGE.LINK_PARAMETERS,
                "'All parameters must have a name' - this validation message should be displayed");
        });

    it("GIVEN parameter name input is empty WHEN 'Insert' button has been pressed THEN expected validation message gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('content link anchor');
            await studioUtils.saveScreenshot('content_link_modal_dialog');
            // 4. Click on 'Add parameters' button:
            await insertLinkDialogContentPanel.clickOnAddParametersButton();
            // 5. Click on 'Insert' button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogLoaded();
            // 6. 'All parameters must have a name' - should be displayed:
            let result = await insertLinkDialogContentPanel.getParametersFormValidationMessage();
            assert.equal(result, appConst.VALIDATION_MESSAGE.LINK_PARAMETERS,
                "All parameters must have a name - validation message should be displayed");
        });

    it("GIVEN Anchor input is empty WHEN 'Insert' button has been pressed THEN expected validation message gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Content tab should be active by default, select the site in dropdown selector:
            await insertLinkDialogContentPanel.typeTextInFilterInputInContentSelector(SITE.displayName);
            // 4. After inserting a search text the dropdown should be switched to 'Flat mode', click on the folder(don't need to click on 'Apply' button):
            await insertLinkDialogContentPanel.clickOnOptionByDisplayName(SITE.displayName);
            await insertLinkDialog.typeInLinkTextInput('content link anchor');
            // 5. Click on 'Add anchor' button:
            await insertLinkDialogContentPanel.clickOnAddAnchorButton();
            // 6. Click on 'Insert' button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            await insertLinkDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('content_link_anchor_validation_2');
            // 7. 'This field is required' - should be displayed:
            let result = await insertLinkDialogContentPanel.getAnchorFormValidationMessage();
            assert.equal(result, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED,
                "'This field is required - validation message should be displayed");
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
