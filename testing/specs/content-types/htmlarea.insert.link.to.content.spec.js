/**
 * Created on 11.01.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertLinkDialogContentPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');

describe('htmlarea.insert.link.to.content.spec: insert `content-link` into htmlArea', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const TEST_TOOLTIP = 'my tooltip';
    const TEST_CONTENT_DISPLAY_NAME = 'Templates';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN target is selected in the Insert content-link modal dialog WHEN the option has been removed THEN 'upload' button should appears in the dialog`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Fill in inputs and select a target in the selector:
            await insertLinkDialog.typeInLinkTextInput('test-content-link');
            await insertLinkDialog.typeInLinkTooltip(TEST_TOOLTIP);
            await insertLinkDialogContentPanel.selectTargetInContentSelector(TEST_CONTENT_DISPLAY_NAME);
            // 3. Click on remove-icon and remove the selected option:
            await insertLinkDialogContentPanel.clickOnRemoveSelectedOptionIcon(TEST_CONTENT_DISPLAY_NAME);
            // 4. Verify that 'Upload' button appears in the 'Insert content link' form
            await insertLinkDialogContentPanel.waitForUploadContentButtonDisplayed();
        });

    it(`GIVEN insert link dialog is opened WHEN 'Show content from entire project' checkbox has been clicked THEN content from entire project should be present in dropdown options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Click on 'show content from entire project' checkbox
            await insertLinkDialogContentPanel.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Click on content-dropdown handler, expand the options:
            await insertLinkDialogContentPanel.clickOnContentDropdownHandle();
            // 4. Verify that a folder from root directory appears in the dropdown options(tree mode is default mode in the dropdown):
            let items = await insertLinkDialogContentPanel.getContentSelectorOptionsDisplayNameInTreeMode();
            await studioUtils.saveScreenshot('content_link_entire_project_checked');
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES), "Folder from Default project should be present in the options");
            assert.ok(items.length > 3, 'Items from default project should be present in the options');
        });

    it(`GIVEN insert link dialog is opened WHEN a folder from Default project has been selected in content selector THEN 'show content from entire project' checkbox gets hidden`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Click on 'show content from entire project' checkbox
            await insertLinkDialogContentPanel.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Type the folder name and select filtered folder from Default project:
            await insertLinkDialogContentPanel.selectTargetInContentSelector(appConst.TEST_FOLDER_WITH_IMAGES);

            await studioUtils.saveScreenshot('content_link_entire_project_checkbox_hidden');
            // 4. Verify that 'show content from entire project' checkbox gets not visible now:
            await insertLinkDialogContentPanel.waitForShowContentFromEntireProjectCheckboxNotDisplayed();
            // 5. Verify that 'Open in new tab' checkbox is displayed now:
            await insertLinkDialogContentPanel.waitForOpenInNewTabCheckboxDisplayed();
            // 6. 'Open in new tab' checkbox is not selected by default:
            let isSelected = await insertLinkDialogContentPanel.isOpenInNewTabCheckboxSelected();
            assert.ok(isSelected === false, "'Open in new tab' checkbox should not be selected");

            let result = await insertLinkDialogContentPanel.getSelectedOptionDisplayName();
            assert.equal(result, appConst.TEST_FOLDER_WITH_IMAGES, 'Expected option should be selected');
        });

    it(`GIVEN insert link dialog is opened WHEN 'Show content from entire project' checkbox is not selected THEN content from entire project should not be present in dropdown options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. 'show content from entire project' checkbox is not selected by default:
            let isSelected = await insertLinkDialogContentPanel.isShowContentFromEntireProjectCheckboxSelected();
            assert.ok(isSelected === false, 'Show content from entire project should not be selected by default');
            // 3. Click on content-dropdown handler, expand the options in tree mode(the default mode):
            await insertLinkDialogContentPanel.clickOnContentDropdownHandle();
            // 4. get options in Tree-mode
            let items = await insertLinkDialogContentPanel.getContentSelectorOptionsDisplayNameInTreeMode();
            assert.equal(items.length, 1,"Only one item should be displayed in the dropdown list");
            // 5. Verify that items from root directory are not present in the options, due to show content from entire project is not selected:
            await studioUtils.saveScreenshot('content_link_entire_project_not_checked');
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES) === false,
                "Folder from the root directory should not be present in the options");
            // 6. Switch to the flat mode:
            await insertLinkDialogContentPanel.clickOnContentSelectorModeTogglerButton();
            // 7. Verify the number of available items in the flat mode:
            let itemsFlatMode = await insertLinkDialogContentPanel.getContentSelectorOptionsDisplayNameInFlatMode();
            assert.equal(itemsFlatMode.length, 6, '6 Items from the current site should be present in the options');
        });

    it(`GIVEN content link is inserted in a htmlarea WHEN 'Edit link' modal dialog is opened THEN Content tab should be active and expected content should be present in selected options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            let insertLinkDialogContentPanel = new InsertLinkDialogContentPanel();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. insert a content-link and close the modal dialog
            await insertLinkDialog.typeInLinkTextInput('test-content-link');
            await insertLinkDialog.typeInLinkTooltip(TEST_TOOLTIP);
            await insertLinkDialogContentPanel.selectTargetInContentSelector(TEST_CONTENT_DISPLAY_NAME);
            // 3. Click on Insert button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            // 4. toolbar remains visible after inserting the link, reopen the modal dialog  again
            await htmlAreaForm.clickOnInsertLinkButton();
            // 5. Verify that Content tab is active:
            await studioUtils.saveScreenshot('htmlarea_content_link_reopened');
            let isActive = await insertLinkDialog.isTabActive('Content');
            assert.ok(isActive, "'Content' tab should be active");
            // 6. Verify that expected content is selected in the dropdown selector:
            let result = await insertLinkDialogContentPanel.getSelectedOptionDisplayName();
            assert.equal(result, TEST_CONTENT_DISPLAY_NAME, 'Expected content should be displayed in selected option');
            // 7. Verify the text in Tooltip Text Input:
            let tooltip = await insertLinkDialog.getTextInLinkTooltipInput();
            assert.equal(tooltip, TEST_TOOLTIP, "Expected text should be present in the tooltip text input");
        });

    it("GIVEN 'Insert Link' modal dialog is opened WHEN required 'URL' and text inputs are empty AND 'Insert' button has been pressed THEN validation message should appear in the dialog",
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
            // 4. Do not insert an url and a text, but click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            // 5. Verify that both validation messages are displayed:
            let validationMessage1 = await insertLinkDialogUrlPanel.getUrlInputValidationMessage();
            assert.equal(validationMessage1, appConst.VALIDATION_MESSAGE.INVALID_VALUE_ENTERED, "Expected validation message gets visible");
            let validationMessage2 = await insertLinkDialog.getTextInputValidationMessage();
            assert.equal(validationMessage2, appConst.THIS_FIELD_IS_REQUIRED, "Expected validation message gets visible");
            await studioUtils.saveScreenshot('htmlarea_url_link_empty');
            // 6. URL tab remains active:
            let isActive = await insertLinkDialog.isTabActive('URL');
            assert.ok(isActive, "'Url' tab should be active");
        });

    it("GIVEN 'Insert Link' dialog is opened WHEN required 'text' input is not filled in AND 'Insert' button has been pressed THEN required validation message gets visible",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await htmlAreaForm.pause(1000);
            // 1. Open 'Insert Link' dialog and insert just an URL:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            await insertLinkDialogUrlPanel.typeUrl("http://enonic.com");
            // 3. Click on 'Insert' button:
            await insertLinkDialog.clickOnInsertButton();
            // 4. Verify that validation message for text-input is displayed(dialog is not closed):
            let validationMessage = await insertLinkDialog.getTextInputValidationMessage();
            assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message gets visible");
        });

    it("GIVEN InsertLinkModalDialog is opened WHEN 'Escape' key has been pressed THEN modal dialog should closes",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 1. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Press 'Esc' key and verify that the modal dialog is closed:
            await insertLinkDialog.pressEscKey();
            await insertLinkDialog.waitForDialogClosed();
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
