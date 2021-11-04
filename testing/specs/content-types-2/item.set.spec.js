/**
 * Created on 02.11.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ItemSetForm = require('../../page_objects/wizardpanel/itemset/item.set.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('item.set.spec: tests for content with Item Set', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const CONTENT_1 = contentBuilder.generateRandomName('itemset');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("WHEN wizard for ItemSet(0:0) content is opened THEN 'Add' button should be displayed",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            //1. 'Add' button should be displayed:
            await itemSetForm.waitForAddButtonDisplayed();
            await itemSetForm.waitForItemSetFormNotDisplayed();
            await contentWizard.typeDisplayName(CONTENT_1);
            await studioUtils.saveScreenshot('itemset_0_0_no_set');
            //3. Verify that the content gets valid after the filling the display name input:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "the content with Item Set should be valid");
        });

    it("GIVEN wizard for ItemSet(0:0) is opened AND only the name input is filled in WHEN 'Add' button has been pressed THEN the content gets invalid",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            //1. Click on 'Add' button,
            await itemSetForm.clickOnAddButton();
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(CONTENT_1);
            //3. Verify that the content gets invalid after clicking on Add button, because there are required inputs in the form:
            await studioUtils.saveScreenshot('itemset_0_0_set_added');
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "Item Set content should be invalid, required inputs are present in the set");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //5. Validation recording gets visible after clicking on 'Save' button:
            let recording = await itemSetForm.getValidationRecordingForHtmlArea(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, 'Validation recording should be displayed');
        });

    it("GIVEN existing invalid ItemSet(0:0) content is opened WHEN required inputs have been filled in the form THEN the content gets valid",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // Open existing invalid content
            await studioUtils.selectContentAndOpenWizard(CONTENT_1);
            //1. Type a text in htmlarea and text line;
            await itemSetForm.typeTextInHtmlArea(0, "hello htmlarea");
            await itemSetForm.typeTextInTextLine(0, "hello text line");
            await studioUtils.saveScreenshot('itemset_0_0_filled');
            //2. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "the content with Item Set should be valid now");
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/3773
    //Nested Form Item Sets - incorrect behaviour of validation when 2 levels added
    it.skip(
        "GIVEN existing content with single empty form is opened AND the second form has been added WHEN required inputs have been filled in the first form THEN the content remains invalid",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            //1. Open existing content with single empty form:
            await studioUtils.selectContentAndOpenWizard(CONTENT_1);
            //2. Add the second form:
            await itemSetForm.clickOnAddButton();
            //3. Fill in required inputs only in the first form:
            await itemSetForm.typeTextInHtmlArea(0, "hello htmlarea");
            await itemSetForm.typeTextInTextLine(0, "hello text line");
            await studioUtils.saveScreenshot('itemset_0_0_filled_2');
            //4. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, "the content should be invalid");
        });

    it("GIVEN existing content with single empty form is opened AND the second form has been added WHEN both forms have been filled THEN the content gets valid now",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            //1. Open existing content with single empty form:
            await studioUtils.selectContentAndOpenWizard(CONTENT_1);
            //2. Add the second form:
            await itemSetForm.clickOnAddButton();
            await contentWizard.typeDisplayName(CONTENT_1);
            //3. Fill in required inputs in both forms:
            await itemSetForm.typeTextInHtmlArea(0, "hello htmlarea");
            await itemSetForm.typeTextInTextLine(0, "hello text line");
            await itemSetForm.typeTextInHtmlArea(1, "hello htmlarea 2");
            await itemSetForm.typeTextInTextLine(1, "hello text line 2");

            await studioUtils.saveScreenshot('itemset_0_0_filled_3');
            //4. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, "the content with Item Set should be valid now");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
