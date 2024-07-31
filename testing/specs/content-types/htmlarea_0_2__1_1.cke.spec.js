/**
 * Created on 14.04.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('htmlarea0_2__1_1.cke.spec: tests for html area with CKE', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const EXPECTED_TEXT_TEXT1 = '<p>test 1</p>';
    const EXPECTED_TEXT_TEXT2 = '<p>test 2</p>';
    let SITE;
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('area');
    const CONTENT_NAME_2 = contentBuilder.generateRandomName('area');
    const CONTENT_NAME_3 = contentBuilder.generateRandomName('area');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN new wizard for htmlArea(0:0) is opened WHEN button 'Add' clicked 3 times THEN button 'Add' remains visible",
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open wizard for new htmlarea-content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_0);
            await contentWizard.pause(1000);
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('area'));
            // 2. Click on Add button 3 times:
            await htmlAreaForm.clickOnAddButton();
            await htmlAreaForm.clickOnAddButton();
            await htmlAreaForm.clickOnAddButton();
            // 3 . Verify that 'Add' button is visible:
            await htmlAreaForm.waitForAddButtonDisplayed();
            // 4. Verify that 4 areas are present in the form:
            let ids = await htmlAreaForm.getIdOfHtmlAreas();
            assert.equal(ids.length, 4, "Four html-area should be displayed now");
            // 5. The content should be valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "The content should be valid, because these html areas are not required inputs");
        });

    it(`GIVEN wizard for 'htmlArea 1:1' is opened WHEN display name has been typed THEN the content remains invalid`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_1_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('area'));
            await contentWizard.pause(1000);
            // 3. Verify that the content is invalid, the html-area is required input
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === true, "The content should be not valid, because html area is required input");
            // 4. Verify that 'Create Issue' button is displayed in the wizard toolbar(It is the default action):
            await contentWizard.waitForCreateIssueButtonDisplayed();
        });

    it(`GIVEN wizard for 'htmlArea 1:1' is opened WHEN display name has been typed AND saved THEN validation message appears`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_1_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('area'));
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            // 4. Verify that the content is invalid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === true, "The content should be invalid, because html area is required input");
            // 5. Verify that validation message gets visible now:
            let message = await htmlAreaForm.getFormValidationRecording();
            assert.equal(message, "This field is required", "Expected message should be displayed");
        });

    it(`GIVEN wizard for 'htmlArea 1:1' is opened WHEN display name and text have been inserted THEN content gets valid`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_1_1);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('area'));
            // 3. Insert a text in html-area
            await htmlAreaForm.insertTextInHtmlArea(0, 'test');
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "The content should be valid, because the required html area is filled");
            // 4. Verify that 'Mark as ready' button is displayed in the wizard toolbar:
            await contentWizard.waitForMarkAsReadyButtonVisible();
            // 5. Clear the text in the html-area
            await htmlAreaForm.insertTextInHtmlArea(0, '');
            // 6. Verify that the content gets invalid:
            isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "The content should be invalid after clearing text in HtmlArea");
            // 7. Verify that the validation message is not displayed before saving the content:
            await htmlAreaForm.waitForFormValidationRecordingNotDisplayed();
        });

    it(`GIVEN wizard for 'htmlArea 0:2' is opened WHEN display name has been typed THEN content gets valid`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_2);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(contentBuilder.generateRandomName('area'));
            await contentWizard.pause(1000);
            // 3. Verify that the content gets valid but it is not saved yet:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "The content should be valid, because html area is not required input");
            // 4. Verify that 'Mark as ready' button is displayed in the wizard toolbar:
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    it(`WHEN wizard for 'htmlArea 0:2' is opened THEN single htmlarea should be present by default`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            // 1. Open new wizard
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_2);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            let ids = await htmlAreaForm.getIdOfHtmlAreas();
            assert.equal(ids.length, 1, "Single html area should be displayed by default");
            // 4.Verify that 'Add' button is present:
            await htmlAreaForm.waitForAddButtonDisplayed();
            // 5. Verify that 'Mark as ready' button is displayed in the wizard toolbar:
            await contentWizard.waitForMarkAsReadyButtonVisible();
        });

    it(`GIVEN wizard for new 'htmlArea 0:2' is opened WHEN content has been saved THEN red icon should not be present, because the input is not required`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_2);
            // 2. Fill the name input:
            await contentWizard.typeDisplayName(CONTENT_NAME_2);
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            // 4. This content should be valid after clicking on Save button:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'the content should be valid, because the input is not required');
            let actualResult = await htmlAreaForm.getTextFromHtmlArea();
            assert.equal(actualResult[0], "", "Html Area should be empty");
        });

    it("GIVEN new wizard for htmlArea(0:2) is opened WHEN button 'Add' clicked THEN two text areas should be present and button 'Add' gets hidden",
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_2);
            await contentWizard.pause(1000);
            // 2. Click on Add button
            await htmlAreaForm.clickOnAddButton();
            // 3 . Verify that Add button is not visible now:
            await htmlAreaForm.waitForAddButtonNotDisplayed();
            // 4. Verify tah 2 areas are present in the form:
            let ids = await htmlAreaForm.getIdOfHtmlAreas();
            assert.equal(ids.length, 2, "Two html area should be displayed now");
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.equal(result[1], "", "New added area should be empty");
        });

    it(`GIVEN new 'htmlArea 0:2' is saved(text is inserted in the first area) WHEN a text has been inserted in the second area THEN 'Save' button gets enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let htmlAreaForm = new HtmlAreaForm();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.HTML_AREA_0_2);
            // 1. content Name has been typed
            await contentWizard.typeDisplayName(CONTENT_NAME_3);
            // 2. Text has been inserted in the first area:
            await htmlAreaForm.insertTextInHtmlArea(0, 'test');
            //'3. The second area has been added:
            await htmlAreaForm.clickOnAddButton();
            //'4. Content has been saved
            await contentWizard.waitAndClickOnSave();
            //'5. Text has been inserted in the second area:
            await htmlAreaForm.insertTextInHtmlArea(1, 'test');
            //'6. Verify that 'Save' button gets enabled:
            await contentWizard.waitForSaveButtonEnabled();
        });

    it(`GIVEN existing 'htmlArea 0:2' with 2 areas is opened WHEN the second area has been removed THEN one html area should be present in the form`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            //'1. Open existing content
            await studioUtils.selectContentAndOpenWizard(CONTENT_NAME_3);
            //'2. Remove the second area:
            await htmlAreaForm.removeTextArea(1);
            //'3. Verify that 'Add' button gets visible
            await htmlAreaForm.waitForAddButtonDisplayed();
            await contentWizard.waitForSaveButtonEnabled();
            //'4. Verify that single area is present in the form now:
            let ids = await htmlAreaForm.getIdOfHtmlAreas();
            assert.equal(ids.length, 1, "Single html area should be displayed");
        });

    it(`GIVEN text is inserted in both html area WHEN the content has been reopened THEN expected text should be in both areas`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            // 1. Open existing content
            await studioUtils.selectContentAndOpenWizard(CONTENT_NAME_2);
            // 2. Click on Add button and insert text in both areas:
            await htmlAreaForm.clickOnAddButton();
            // 3. Insert text in both area
            await htmlAreaForm.insertTextInHtmlArea(0, 'test 1');
            await htmlAreaForm.insertTextInHtmlArea(1, 'test 2');
            // 4. Save and reopen the content:
            await studioUtils.saveAndCloseWizard();
            await studioUtils.doClickOnEditAndOpenContent(CONTENT_NAME_2);
            await htmlAreaForm.pause(1500);
            // 5. Verify that expected text is correctly saved:
            let result = await htmlAreaForm.getTextFromHtmlArea();
            assert.ok(result.includes(EXPECTED_TEXT_TEXT1), "Expected text should be in the area");
            assert.ok(result.includes(EXPECTED_TEXT_TEXT2), "Expected text should be in the area");
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
