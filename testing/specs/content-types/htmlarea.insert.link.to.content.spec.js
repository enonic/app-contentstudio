/**
 * Created on 11.01.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const InsertContentLinkTab = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.content.panel');
const InsertLinkDialogUrlPanel = require('../../page_objects/wizardpanel/html-area/insert.link.modal.dialog.url.panel');

describe('htmlarea.insert.link.to.content.spec: insert `content-link` into htmlArea', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const TEST_TOOLTIP = 'my tooltip';
    const TEST_CONTENT_DISPLAY_NAME = 'Templates';

    it(
        `GIVEN target is selected in the Insert content-link modal dialog WHEN the option has been removed THEN 'upload' button should appears in the dialog`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertContentLinkTab = new InsertContentLinkTab();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Fill in inputs and select a target in the selector:
            await insertLinkDialog.clickOnBarItem('Content');
            await insertLinkDialog.typeInLinkTextInput('test-content-link');
            await insertLinkDialog.typeInLinkTooltip(TEST_TOOLTIP);
            // 3. Insert the name of content ('Templates')
            await insertContentLinkTab.selectTargetInContentSelector(TEST_CONTENT_DISPLAY_NAME);
            // 4. Click on remove-icon and remove the selected option:
            // TODO
            await insertContentLinkTab.clickOnRemoveSelectedOptionIcon('_templates');
            // 5. Verify that 'Upload' button appears in the 'Insert content link' form
            await insertContentLinkTab.waitForUploadContentButtonDisplayed();
        });

    it(
        `GIVEN insert link dialog is opened WHEN 'Show content from entire project' checkbox has been clicked THEN content from entire project should be present in dropdown options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertContentLinkTab = new InsertContentLinkTab();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.clickOnBarItem('Content');
            // 2. Click on 'show content from entire project' checkbox
            await insertContentLinkTab.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Click on content-dropdown handler, expand the options:
            await insertContentLinkTab.clickOnContentDropdownHandle();
            // 4. Verify that a folder from root directory appears in the dropdown options(tree mode is default mode in the dropdown):
            let items = await insertContentLinkTab.getContentSelectorOptionsDisplayNameInTreeMode();
            await studioUtils.saveScreenshot('content_link_entire_project_checked');
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES), "Folder from Default project should be present in the options");
            assert.ok(items.length > 3, 'Items from default project should be present in the options');
        });

    // Verify the issue - Link dialog - selector not reloaded on mode or checkbox change #7388
    // https://github.com/enonic/app-contentstudio/issues/7388
    it(
        `GIVEN 'Show content from entire project' checkbox has been clicked WHEN dropdown has been switched to flat-mode THEN expected folder from the root directory should be present in the options in flat-mode`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertContentLinkTab = new InsertContentLinkTab();
            // 1. Open 'Insert Link' modal dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.clickOnBarItem('Content');
            // 2. Click on 'show content from entire project' checkbox
            await insertContentLinkTab.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Click on mode-toggle button, switch to flat mode:
            await insertContentLinkTab.clickOnContentSelectorModeTogglerButton();
            await insertContentLinkTab.pause(1000);
            //await insertContentLinkTab.selectTargetInContentSelector(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            // 4. Verify that a folder from root directory appears in the dropdown options(tree mode is default mode in the dropdown):
            let items = await insertContentLinkTab.getContentSelectorOptionsDisplayNameInFlatMode();
            await studioUtils.saveScreenshot('content_link_entire_project_checked_flat_mode');
            assert.ok(items.length > 4, "Folder from Default project should be present in the options");
            await insertContentLinkTab.typeTextInContentOptionsFilterInput(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            items = await insertContentLinkTab.getContentSelectorOptionsDisplayNameInFlatMode();
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES), "Folder from Default project should be present in the options");
        });

    it.skip(`GIVEN insert link dialog is opened WHEN a folder from 'Default' project has been selected in content selector THEN 'show content from entire project' checkbox gets hidden`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertContentLinkTab = new InsertContentLinkTab();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.clickOnBarItem('Content');
            // 2. Click on 'show content from entire project' checkbox
            await insertContentLinkTab.clickOnShowContentFromEntireProjectCheckbox();
            // 3. Type the folder name and select filtered folder from Default project:
            await insertContentLinkTab.selectTargetInContentSelector(appConst.TEST_FOLDER_WITH_IMAGES);
            await studioUtils.saveScreenshot('content_link_entire_project_checkbox_hidden');
            // 4. Verify that 'show content from entire project' checkbox gets not visible now:
            await insertContentLinkTab.waitForShowContentFromEntireProjectCheckboxNotDisplayed();
            // 5. Verify that 'Open in new tab' checkbox is displayed now:
            await insertContentLinkTab.waitForOpenInNewTabCheckboxDisplayed();
            // 6. 'Open in new tab' checkbox is not selected by default:
            let isSelected = await insertContentLinkTab.isOpenInNewTabCheckboxSelected();
            assert.ok(isSelected === false, "'Open in new tab' checkbox should not be selected");

            // TODO bug
            let result = await insertContentLinkTab.getSelectedOptionDisplayName();
            assert.equal(result, appConst.TEST_FOLDER_WITH_IMAGES, 'Expected option should be selected');
        });

    it(`GIVEN insert link dialog is opened WHEN 'Show content from entire project' checkbox is not selected THEN content from entire project should not be present in dropdown options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertContentLinkTab = new InsertContentLinkTab();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.clickOnBarItem('Content');
            // 2. 'show content from entire project' checkbox is not selected by default:
            let isSelected = await insertContentLinkTab.isShowContentFromEntireProjectCheckboxSelected();
            assert.ok(isSelected === false, 'Show content from entire project should not be selected by default');
            // 3. Click on content-dropdown handler, expand the options in tree mode(the default mode):
            await insertContentLinkTab.clickOnContentDropdownHandle();
            // 4. get options in Tree-mode
            let items = await insertContentLinkTab.getContentSelectorOptionsDisplayNameInTreeMode();
            assert.equal(items.length, 1, "Only one item should be displayed in the dropdown list");
            // 5. Verify that items from root directory are not present in the options, due to show content from entire project is not selected:
            await studioUtils.saveScreenshot('content_link_entire_project_not_checked');
            assert.ok(items.includes(appConst.TEST_FOLDER_WITH_IMAGES) === false,
                "Folder from the root directory should not be present in the options");
            // 6. Switch to the flat mode:
            await insertContentLinkTab.clickOnContentSelectorModeTogglerButton();
            // 7. Verify the number of available items in the flat mode:
            let itemsFlatMode = await insertContentLinkTab.getContentSelectorOptionsDisplayNameInFlatMode();
            assert.equal(itemsFlatMode.length > 1, 'Items from the current site should be present in the options list in Flat mode');
        });

    it(`GIVEN content link is inserted in a htmlarea WHEN 'Edit link' modal dialog is opened THEN Content tab should be active and expected content should be present in selected options`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            let insertContentLinkTab = new InsertContentLinkTab();
            // 1. Open Insert Link dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.clickOnBarItem('Content');
            // 2. insert a content-link and close the modal dialog
            await insertLinkDialog.typeInLinkTextInput('test-content-link');
            await insertLinkDialog.typeInLinkTooltip(TEST_TOOLTIP);
            // 3. Insert the name of content ('Templates')
            await insertContentLinkTab.selectTargetInContentSelector(TEST_CONTENT_DISPLAY_NAME);
            // 4. Click on Insert button in the modal dialog:
            await insertLinkDialog.clickOnInsertButton();
            // 5. toolbar remains visible after inserting the link, reopen the modal dialog  again
            await htmlAreaForm.clickOnInsertLinkButton();
            // 9. Verify that Content tab is active:
            await studioUtils.saveScreenshot('htmlarea_content_link_reopened');
            let isActive = await insertLinkDialog.isTabActive('Content');
            assert.ok(isActive, "'Content' tab should be active");
            // 10. Verify that expected content is selected in the dropdown selector:
            let result = await insertContentLinkTab.getSelectedOptionDisplayName();
            assert.equal(result, TEST_CONTENT_DISPLAY_NAME, 'Expected content should be displayed in selected option');
            // 11. Verify the text in Tooltip Text Input:
            let tooltip = await insertLinkDialog.getTextInLinkTooltipInput();
            assert.equal(tooltip, TEST_TOOLTIP, "Expected text should be present in the tooltip text input");
        });

    it("GIVEN 'Insert Link' modal dialog is opened WHEN required 'URL' and text inputs are empty THEN Insert button should be disabled",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            // 1. Open new wizard for htmlArea content:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 2. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 3. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            // 4. Do not insert URL and a text, but click on 'Insert' button:
            await insertLinkDialog.waitForInsertButtonDisabled();
        });

    it("GIVEN 'Insert Link' dialog is opened WHEN required 'text' input is not filled THEN Insert button should be disabled",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let insertLinkDialogUrlPanel = new InsertLinkDialogUrlPanel();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 1. Open 'Insert Link' dialog and insert just an URL:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            // 2. Go to URL tab:
            await insertLinkDialog.clickOnBarItem('URL');
            await insertLinkDialogUrlPanel.typeUrl("http://enonic.com");
            // 3. Click on 'Insert' button:
            await insertLinkDialog.waitForInsertButtonDisabled();
            await insertLinkDialog.typeInLinkTextInput('test');
            await insertLinkDialog.waitForInsertButtonEnabled();
            // // 4. Verify that validation message for text-input is displayed(dialog is not closed):
            // let validationMessage = await insertLinkDialog.getTextInputValidationMessage();
            // assert.equal(validationMessage, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, "Expected validation message gets visible");
        });

    it("GIVEN InsertLinkModalDialog is opened WHEN 'Escape' key has been pressed THEN modal dialog should closes",
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.HTML_AREA_0_1);
            await htmlAreaForm.pause(1000);
            // 1. Open 'Insert Link' dialog:
            let insertLinkDialog = await htmlAreaForm.showToolbarAndClickOnInsertLinkButton();
            await insertLinkDialog.waitForDialogLoaded();
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
