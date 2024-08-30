/**
 * Created on 12.04.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FreeFormNestedSet = require('../../page_objects/wizardpanel/itemset/freeform.form.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe("freeform.nested.set.spec: updates a content with nested set and checks 'Save' button in the wizard-toolbar", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTENT_1;
    let CONTENT_2 = contentBuilder.generateRandomName('freeform');

    it("Preconditions: new site should be created",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // Verify:  Nested Form Item Sets - incorrect behaviour of validation when 2 levels added #3773
    // https://github.com/enonic/app-contentstudio/issues/3773
    it("GIVEN wizard for new content with 'nested set' is opened AND the second level is added WHEN options have been selected in the both required inputs THEN the content gets valid",
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.FREE_FORM);
            // 1. Fill in the name input:
            await contentWizard.typeDisplayName(CONTENT_2);
            await studioUtils.saveScreenshot('freeform_not_scrolled');
            // 2. just scroll the wizard page:
            //await contentWizard.scrollPanel(500);
            await contentWizard.pause(1000);
            // 3. Add an occurrence block (the second level):
            await freeFormNestedSet.clickOnAddButton();
            await studioUtils.saveScreenshot('freeform_scrolled');
            // 4. Expand the dropdown selector in the first occurrence then select the required option ( select 'Button' option)
            await freeFormNestedSet.expandOptionsAndSelectElementType('Button', 0);
            await studioUtils.saveScreenshot('nested_sets_remains_invalid_0');
            await contentWizard.scrollPanel(-500);
            await studioUtils.saveScreenshot('nested_sets_remains_invalid_1');
            // 5. Verify that the content remains invalid, because the  'element type' dropdown in the second added occurrence block is not selected yet.
            let isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid, 'The content should be invalid');
            // 6. Scroll the wizard page and select 'Button' option in the second occurrence block:
            await contentWizard.scrollPanel(600);
            //
            await freeFormNestedSet.expandOptionsAndSelectElementType('Button', 1);
            await studioUtils.saveScreenshot('nested_sets_gets_valid_0');
            // 7. Verify that "Save" button gets enabled
            await contentWizard.waitForSaveButtonEnabled();
            await contentWizard.scrollPanel(-500);
            await studioUtils.saveScreenshot('nested_sets_gets_valid_1');
            // 8. Verify that the content gets valid, because options are selected in the both required selectors:
            isInvalid = await contentWizard.isContentInvalid();
            assert.ok(isInvalid === false, 'The content should be valid')
        });

    it("GIVEN wizard for new content with 'nested set' is opened AND name has been saved WHEN element type and input type have been selected THEN 'Save' button gets enabled in the wizard-toolbar",
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            CONTENT_1 = contentBuilder.generateRandomName('freeform');
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.FREE_FORM);
            await contentWizard.typeDisplayName(CONTENT_1);
            // save just the name:
            await contentWizard.waitAndClickOnSave();
            // Select Input in the selector and load new form:
            await contentWizard.scrollPanel(600);
            await freeFormNestedSet.expandOptionsAndSelectElementType('Input', 0);
            // save the content again
            await contentWizard.waitAndClickOnSave();
            // Select the option in the dropdown
            await freeFormNestedSet.selectInputType('image');
            await studioUtils.saveScreenshot('set_in_set_save_issue');
            // "Save" button gets enabled, because radio button has been checked
            await contentWizard.waitForSaveButtonEnabled();
        });

    // Verifies https://github.com/enonic/lib-admin-ui/issues/1679
    // No content validation after changing option in a single-select option-set
    it("GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN Image and Text options have been selected sequentially THEN Save button gets enabled in the wizard-toolbar",
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            // 1. Open existing content with options set:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_1);
            // 2.Select text-option in the dropdown:
            // #1556 Single occurrence of item-set should be expanded by default
            await freeFormNestedSet.selectInputType('text');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            // 3. change the selected option to 'image':
            await freeFormNestedSet.resetInputTypeOption();
            await freeFormNestedSet.selectInputType('image');
            // "Save" button gets enabled, because the option was updated:
            await contentWizard.waitForSaveButtonEnabled();
            await contentWizard.waitAndClickOnSave();
            // 4. Verify that the content gets valid now:
            let result = await contentWizard.isContentInvalid();
            assert.ok(result === false, "Red icon should not be displayed, because required options are selected");
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
