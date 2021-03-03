/**
 * Created on 12.04.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FreeFormNestedSet = require('../../page_objects/wizardpanel/itemset/freeform.form.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe("freeform.nested.set.spec: updates a content with nested set and checks 'Save' button in the wizard-toolbar", function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let contentDisplayName;

    it("Preconditions: new site should be created",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN element type and input type have been selected THEN 'Save' button gets enabled in the wizard-toolbar",
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            contentDisplayName = contentBuilder.generateRandomName('freeform');
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'freeform');
            await contentWizard.typeDisplayName(contentDisplayName);
            //save just the name:
            await contentWizard.waitAndClickOnSave();
            //Select Input in the selector and load new form:
            await freeFormNestedSet.expandOptionsAndSelectElementType("Input");
            // save the content again
            await contentWizard.waitAndClickOnSave();
            // Select the option in the dropdown
            await freeFormNestedSet.selectInputType("image");
            studioUtils.saveScreenshot('set_in_set_save_issue');
            //"Save" button gets enabled, because radio button has been checked"
            await contentWizard.waitForSaveButtonEnabled();
        });

    //Verifies https://github.com/enonic/lib-admin-ui/issues/1679
    //No content validation after changing option in a single-select option-set
    it("GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN Image and Text options have been selected sequentially THEN Save button gets enabled in the wizard-toolbar",
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            //1. Open existing content with options set:
            await studioUtils.selectAndOpenContentInWizard(contentDisplayName);
            //2.Select text-option:
            //#1556 Single occurrence of item-set should be expanded by default
            await freeFormNestedSet.selectInputType("text");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            //3. change the selected option to 'image':
            await freeFormNestedSet.resetInputTypeOption();
            await freeFormNestedSet.selectInputType("image");
            //"Save" button gets enabled, because the option was updated:
            await contentWizard.waitForSaveButtonEnabled();
            await contentWizard.waitAndClickOnSave();
            //4. Verify that the content gets valid now:
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "Red icon should not be displayed, because required input is filled");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
