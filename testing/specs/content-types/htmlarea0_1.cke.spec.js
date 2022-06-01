/**
 * Created on 27.04.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const FullScreenDialog = require('../../page_objects/wizardpanel/html.full.screen.dialog');
const SourceCodeDialog = require('../../page_objects/wizardpanel/html.source.code.dialog');

describe('htmlarea0_1.cke.spec: tests for html area with CKE', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const EXPECTED_TEXT_TEXT1 = '<p>test text</p>';
    const TEXT_TO_TYPE = "test text";
    let SITE;
    let htmlAreaContent;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('area');
    const CONTENT_NAME_2 = contentBuilder.generateRandomName('area');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    //Verifies: https://github.com/enonic/app-contentstudio/issues/3294
    //Wizard toolbar - button 'Show Component View' should not be visible when a controller is not selected #3294
    it(`GIVEN wizard for new site is opened(controller is not selected) WHEN 'Hide Page Editor' then 'Show Page Editor' have been clicked THEN toggler for Component View should not be visible in the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open a content without controllers
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            //2. Click on 'Hide Page Editor' button:
            await contentWizard.clickOnPageEditorToggler();
            //3. Click on 'Show Page Editor' button:
            await contentWizard.clickOnPageEditorToggler();
            //4. Verify that "Show Component View" toggler is not visible:
            await contentWizard.waitForComponentVewTogglerNotVisible();
        });

    //Verifies: https://github.com/enonic/app-contentstudio/issues/3294
    it(`GIVEN wizard for a content that has no controller is opened WHEN Show Page Editor has been clicked THEN toggler for Component View should not be visible in the toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Open a content without controllers
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            //2. Click on 'Show Page Editor' button:
            await contentWizard.clickOnPageEditorToggler();
            //3. Verify that "Show Component View" toggler is not visible:
            await contentWizard.waitForComponentVewTogglerNotVisible();
        });

    it(`WHEN wizard for 'htmlArea 0:1' is opened THEN single htmlarea should be present by default`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            await contentWizard.waitAndClickOnSave();
            let ids = await htmlAreaForm.getIdOfHtmlAreas();
            assert.equal(ids.length, 1, "Single html area should be displayed by default");
            //Verify that toolbar is not visible:
            let isToolbarVisible = await htmlAreaForm.isEditorToolbarVisible(0);
            assert.isFalse(isToolbarVisible, 'Html Area toolbar should be hidden by default');
            //Verify that Add button is not present:
            await htmlAreaForm.waitForAddButtonNotDisplayed();
            //Verify that Mark as ready button is displayed in the wizard toolbar:
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    it(`GIVEN wizard for new 'htmlArea 0:1' is opened WHEN content has been saved THEN red icon should not be present, because the input is not required`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            await contentWizard.waitAndClickOnSave();
            let isNotValid = await contentWizard.isContentInvalid();
            studioUtils.saveScreenshot('cke_htmlarea_should_be_valid');
            assert.isFalse(isNotValid, 'the content should be valid, because the input is not required');
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            assert.equal(actualResult[0], "", "Html Area should be empty");
        });

    it(`GIVEN htmlarea(0:1) content was saved with empty html area WHEN the content has been re-opened THEN text area should be empty`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectContentAndOpenWizard(CONTENT_NAME_2);
            let isNotValid = await contentWizard.isContentInvalid();
            studioUtils.saveScreenshot('cke_htmlarea_should_be_valid');
            assert.isFalse(isNotValid, 'the content should be valid, because the input is not required');
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            assert.equal(actualResult[0], "", "Html Area should be empty");
        });

    it(`GIVEN wizard for new 'htmlArea 0:1' is opened WHEN text has been typed THEN expected text should appear in the area`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.insertTextInHtmlArea(0, TEXT_TO_TYPE);
            let result = await htmlAreaForm.getTextFromHtmlArea();
            studioUtils.saveScreenshot('cke_htmlarea_0_1');
            assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
        });

    it(`GIVEN wizard for 'htmlArea 0:1' is opened WHEN all data has been typed and saved THEN expected notification message should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('htmlarea');
            htmlAreaContent = contentBuilder.buildHtmlArea(displayName, 'htmlarea0_1', [TEXT_TO_TYPE]);
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.pause(1000);
            await contentWizard.typeData(htmlAreaContent);
            await contentWizard.waitAndClickOnSave();
            let expectedMessage = '\"' + htmlAreaContent.displayName + '\"' + ' is saved';
            await contentWizard.waitForExpectedNotificationMessage(expectedMessage);
        });

    it(`GIVEN existing 'htmlArea 0:1' WHEN it has been reopened THEN expected text should be displayed in the area`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            let result = await htmlAreaForm.getTextFromHtmlArea();
            studioUtils.saveScreenshot('htmlarea_0_1_check_value');
            assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual strings should be equal');
        });

    it(`GIVEN existing 'htmlArea 0:1' is opened WHEN 'fullscreen' button has been pressed THEN expected text should be present in the full screen`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let fullScreenDialog = new FullScreenDialog();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            await htmlAreaForm.clickOnFullScreenButton();
            await fullScreenDialog.waitForDialogLoaded();
            let result = await fullScreenDialog.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('htmlarea_0_1_full_screen_mode');
            assert.equal(result[0], EXPECTED_TEXT_TEXT1, "expected text should be present in 'full screen' dialog");
        });

    it("'fullscreen' button has been pressed THEN expected buttons should be in the toolbar",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let fullScreenDialog = new FullScreenDialog();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            await htmlAreaForm.clickOnFullScreenButton();
            await fullScreenDialog.waitForDialogLoaded();
            let numberOfButtons = await fullScreenDialog.getNumberOfToolbarButtons();
            assert.equal(numberOfButtons, 21, "21 button should be present in toolbar in Full screen mode");
            await fullScreenDialog.waitForBoldButtonDisplayed();
            await fullScreenDialog.waitForItalicButtonDisplayed();
            await fullScreenDialog.waitForUnderlineButtonDisplayed();
            await fullScreenDialog.waitForJustifyButtonDisplayed();
            await fullScreenDialog.waitForAlignRightButtonDisplayed();
            await fullScreenDialog.waitForAlignLeftButtonDisplayed();
            await fullScreenDialog.waitForInsertMacroButtonDisplayed();
            await fullScreenDialog.waitForInsertImageButtonDisplayed();
            await fullScreenDialog.waitForInsertAnchorButtonDisplayed();
        });

    it(`GIVEN existing 'htmlArea 0:1' is opened WHEN 'Source Code' button has been pressed THEN source dialog should appear with expected text`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let sourceCodeDialog = new SourceCodeDialog();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            await htmlAreaForm.clickOnSourceButton();
            await sourceCodeDialog.waitForDialogLoaded();
            let result = await sourceCodeDialog.getText();
            await studioUtils.saveScreenshot('htmlarea_0_1_source_code_dialog');
            assert.equal(result.trim(), EXPECTED_TEXT_TEXT1, 'expected text should be present in `full screen` dialog');
        });

    it("GIVEN 'fullscreen' button has been pressed WHEN 'Increase indent' button has been pressed THEN 'Decrease indent' button gets enabled",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let fullScreenDialog = new FullScreenDialog();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            //1. Open Full Screen dialog:
            await htmlAreaForm.clickOnFullScreenButton();
            await fullScreenDialog.waitForDialogLoaded();
            //2. Verify that Decrease Indent button is disabled:
            await fullScreenDialog.waitForDecreaseIndentButtonDisabled();
            //3. Click on 'Increase Indent' button
            await fullScreenDialog.clickOnIncreaseIndentButton();
            await studioUtils.saveScreenshot('fullscreen_mode_increased');
            //4. Verify that Decrease Indent button gets enabled
            await fullScreenDialog.waitForDecreaseIndentButtonEnabled();
        });

    it(`GIVEN 'Source Code' dialog is opened WHEN text has been cleared THEN htmlArea should be cleared as well`,
        async () => {
            let sourceCodeDialog = new SourceCodeDialog();
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            await htmlAreaForm.clickOnSourceButton();
            await sourceCodeDialog.waitForDialogLoaded();
            await sourceCodeDialog.typeText("");
            await sourceCodeDialog.clickOnOkButton();
            let result = await htmlAreaForm.getTextFromHtmlArea();
            await studioUtils.saveScreenshot('htmlarea_0_1_cleared');
            assert.equal(result[0], "", 'htmlArea should be cleared as well');
        });

    it(`GIVEN existing 'htmlArea 0:1' in full screen mode is opened WHEN 'Esc' key has been pressed THEN 'fullscreen'-dialog should be closed`,
        async () => {
            let fullScreenDialog = new FullScreenDialog();
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName);
            await htmlAreaForm.clickOnFullScreenButton();
            await fullScreenDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('htmlarea_full_screen_opened');
            // click on ESC:
            await fullScreenDialog.pressEscKey();
            await studioUtils.saveScreenshot('htmlarea_full_screen_closed');
            //'full screen dialog should be closed:
            await fullScreenDialog.waitForDialogClosed();
        });

    it(`GIVEN JustifyLeft JustifyRight | Bold Italic included only WHEN Full screen dialog opened THEN only 6 buttons should be present in the dialog`,
        async () => {
            let fullScreenDialog = new FullScreenDialog();
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea_conf');
            //1. Open full screen dialog
            await htmlAreaForm.clickOnFullScreenButton();
            await fullScreenDialog.waitForDialogLoaded();
            await studioUtils.saveScreenshot('htmlarea_full_screen_conf');
            //2. Verify that only 6 buttons are present in the toolbar - JustifyLeft JustifyRight | Bold Italic + 'Source' + Fullscreen buttons
            let numberOfButtons = await fullScreenDialog.getNumberOfToolbarButtons();
            assert.equal(numberOfButtons, 6, "6 buttons should be present in toolbar in Full screen mode");
            await fullScreenDialog.waitForUnderlineButtonNotDisplayed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
