/**
 * Created on 02.11.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ItemSetForm = require('../../page_objects/wizardpanel/itemset/item.set.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('item.set.spec: tests for content with Item Set', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const ITEM_SET_CONTENT_NAME_1 = appConst.generateRandomName('itemset');
    const ITEM_SET_CONTENT_NAME_2 = appConst.generateRandomName('itemset');
    const TEXT_LINE_TEXT_1 = 'text 1';
    const TEXT_LINE_TEXT_2 = 'text 2';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN ItemSet form has been added in the wizard WHEN 'add above' menu item has been clicked THEN 'Collapse all' button gets visible",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            // 1. Click on 'Add' button,
            await itemSetForm.clickOnAddButton();
            await contentWizard.pause(500);
            // 2. Expand the menu then click on 'Add above' menu item:
            await itemSetForm.expandMenuClickOnMenuItem(0, 'Add above');
            // 3. Verify that 'Collapse all' button gets visible:
            await itemSetForm.waitForCollapseAllButtonDisplayed();
            // 4. Click on the top ItemSet item, collapse it
            await itemSetForm.clickOnFormOccurrence('ItemSet', 0);
            await studioUtils.saveScreenshot('itemset_0_0_top_item_collapsed');
            // 5. Verify that 'Collapse all' button remains visible:
            await itemSetForm.waitForCollapseAllButtonDisplayed();
        });

    it("GIVEN ItemSet form has been added in the wizard WHEN the required inputs has been filled in THEN the content gets valid and red border is not displayed",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            // 1. Click on 'Add' button,
            await itemSetForm.clickOnAddButton();
            // 2. Fill in the name input:
            await contentWizard.typeDisplayName(ITEM_SET_CONTENT_NAME_2);
            // 3. Fill in required inputs in the added form:
            await itemSetForm.typeTextInTextLine(0, TEXT_LINE_TEXT_1);
            await itemSetForm.typeTextInHtmlArea(0, 'hello htmlarea');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 4. Verify that red border gets not visible in the ItemSet form:
            let isRedBorderDisplayed = await itemSetForm.isItemSetFormInvalid(0);
            assert.ok(isRedBorderDisplayed === false, "red border should not be displayed");
            // 5. Clear the required text area:
            await itemSetForm.typeTextInTextLine(0, '');
            // 6. Validation recording gets visible for the required text input:  This field is required
            let recording = await itemSetForm.getValidationRecordingForTextInput(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, 'Validation recording should be displayed');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 7. Verify that red border gets visible again:
            isRedBorderDisplayed = await itemSetForm.isItemSetFormInvalid(0);
            assert.ok(isRedBorderDisplayed, "The red border gets visible again");
        });

    it("GIVEN a text has been inserted in the ItemSet form WHEN 'Delete' item-set menu item has been clicked THEN 'Delete ItemSet' button should appears",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // open wizard for new content with ItemSet(0:0)
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            // 1. Click on 'Add' button :
            await itemSetForm.clickOnAddButton();
            // 2. fill in required inputs
            await itemSetForm.typeTextInHtmlArea(0, "hello htmlarea");
            await itemSetForm.typeTextInTextLine(0, "hello text line");
            // 3. Save the content
            await contentWizard.waitAndClickOnSave();
            // 4. Expand the menu and click on 'Delete' item-set menu item:
            await itemSetForm.expandMenuClickOnMenuItem(0, 'Delete');
            // 5. Verify that 'Delete ItemSet' button gets visible:
            await itemSetForm.waitForDeleteItemSetButtonDisplayed();
            // 6. Click on 'Delete ItemSet' button:
            await itemSetForm.clickOnDeleteItemSetButton();
            // 7. Verify that Save button gets enabled after deleting item-set:
            await contentWizard.waitForSaveButtonEnabled();
            // 8. Verify that 'Add' button appears in the form:
            await itemSetForm.waitForAddButtonDisplayed();
        });

    it("WHEN wizard for new content with ItemSet(0:0) is opened THEN 'Add' button should be displayed",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            // 1. 'Add' button should be displayed:
            await itemSetForm.waitForAddButtonDisplayed();
            // 2. Item-set form should not be displayed:
            await itemSetForm.waitForItemSetFormNotDisplayed();
            await contentWizard.typeDisplayName(ITEM_SET_CONTENT_NAME_1);
            await studioUtils.saveScreenshot('itemset_0_0_no_set');
            // 3. Verify that the content gets valid after the filling the display name input:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "the content with Item Set should be valid");
            // 4. Verify that 'Collapse' button is not displayed in the Item-set form:
            await itemSetForm.waitForCollapseButtonNotDisplayed();
        });

    it("GIVEN wizard for ItemSet(0:0) is opened AND only the name input is filled in WHEN 'Add' button has been pressed THEN the content gets invalid",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ITEM_SET_0_0);
            // 1. Click on 'Add' button,
            await itemSetForm.clickOnAddButton();
            // 2. Fill in the name input:
            await contentWizard.typeDisplayName(ITEM_SET_CONTENT_NAME_1);
            // 3. Verify that the content gets invalid after clicking on Add button, because there are required inputs in the form:
            await studioUtils.saveScreenshot('itemset_0_0_set_added');
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "Item Set content should be invalid, required inputs are present in the set");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 5. Validation recording gets visible after clicking on 'Save' button:
            let recording = await itemSetForm.getValidationRecordingForHtmlArea(0);
            assert.equal(recording, appConst.VALIDATION_MESSAGE.THIS_FIELD_IS_REQUIRED, 'Validation recording should be displayed');
            // 6. Verify that 'Collapse' button gets visible in the Item-set form:
            await itemSetForm.waitForCollapseButtonDisplayed();
        });

    it("GIVEN existing invalid ItemSet(0:0) content is opened WHEN required inputs have been filled in the form THEN the content gets valid",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // Open existing invalid content
            await studioUtils.selectContentAndOpenWizard(ITEM_SET_CONTENT_NAME_1);
            // 1. Type a text in htmlarea and text line;
            await itemSetForm.typeTextInHtmlArea(0, "hello htmlarea");
            await itemSetForm.typeTextInTextLine(0, "hello text line");
            await studioUtils.saveScreenshot('itemset_0_0_filled');
            // 2. Verify that the content gets valid:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, "the content with Item Set should be valid now");
        });

    it("GIVEN existing invalid content with added empty ItemSet is opened WHEN 'Collapse' button has been clicked THEN 'Expand' button gets visible",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content with added Item Set
            await studioUtils.selectContentAndOpenWizard(ITEM_SET_CONTENT_NAME_1);
            // 2. Click on 'Collapse' button:
            await itemSetForm.clickOnCollapseButton();
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "the content remains invalid after clicking on Collapse button");
            // 3. Verify that 'Expand' button gets visible:
            await itemSetForm.waitForExpandButtonDisplayed();
            await studioUtils.saveScreenshot('itemset_0_0_collapsed');
            // 4. Verify that 'Save' button remains disabled
            await contentWizard.waitForSaveButtonDisabled();
            await itemSetForm.clickOnExpandButton();
            await itemSetForm.waitForCollapseButtonDisplayed();
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/3773
    // Nested Form Item Sets - incorrect behaviour of validation when 2 levels added
    it("GIVEN existing content with single empty form is opened AND the second form has been added WHEN required inputs have been filled in the first form THEN the content remains invalid",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content with single empty level(item set):
            await studioUtils.selectContentAndOpenWizard(ITEM_SET_CONTENT_NAME_1);
            // 2. Add the second level:
            await itemSetForm.clickOnAddButton();
            // 3. Fill in required inputs only in the first form:
            await itemSetForm.typeTextInHtmlArea(0, 'hello htmlarea');
            await itemSetForm.typeTextInTextLine(0, 'hello text line');
            await studioUtils.saveScreenshot('itemset_0_0_filled_2');
            // 4. Verify that the content gets invalid after adding the second level with required inputs:
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, "the content should be invalid");
        });

    it("GIVEN existing content with single empty form is opened AND the second form has been added WHEN both forms have been filled THEN the content gets valid now",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content with single empty form:
            await studioUtils.selectContentAndOpenWizard(ITEM_SET_CONTENT_NAME_1);
            // 2. Add the second form:
            await itemSetForm.clickOnAddButton();
            // 3. Fill in required inputs in both forms:
            await itemSetForm.typeTextInHtmlArea(0, 'hello htmlarea');
            await itemSetForm.typeTextInTextLine(0, TEXT_LINE_TEXT_1);
            await itemSetForm.typeTextInHtmlArea(1, 'hello htmlarea 2');
            await itemSetForm.typeTextInTextLine(1, TEXT_LINE_TEXT_2);
            await studioUtils.saveScreenshot('itemset_0_0_filled_3');

            // 4. Verify that the content gets valid:
            // TODO https://github.com/enonic/app-contentstudio/issues/7736
            // Incorrect behaviour of validation for Item Set occurrences #7736
            //let isInvalid = await contentWizard.isContentInvalid();
            //assert.ok(isInvalid === false, "the content with Item Set should be valid now");

            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing item set content with 2 filled forms is opened WHEN two items have been swapped THEN form items should be swapped",
        async () => {
            let itemSetForm = new ItemSetForm();
            let contentWizard = new ContentWizard();
            // 1. Open existing content with two filled items:
            await studioUtils.selectContentAndOpenWizard(ITEM_SET_CONTENT_NAME_1);
            await studioUtils.saveScreenshot('itemset_before_swap');
            // 2. swap the items:
            await itemSetForm.swapItems(TEXT_LINE_TEXT_1, TEXT_LINE_TEXT_2);
            await studioUtils.saveScreenshot('itemset_swapped');
            // 3. Verify the items swapped places with each other:
            let title1 = await itemSetForm.getItemSetTitle(0);
            let title2 = await itemSetForm.getItemSetTitle(1);
            assert.equal(title1, TEXT_LINE_TEXT_2, 'form items should be swapped');
            assert.equal(title2, TEXT_LINE_TEXT_1, 'form items should be swapped');
            // 4. Verify that 'Save' button is enabled now:
            await contentWizard.waitForSaveButtonEnabled();
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
