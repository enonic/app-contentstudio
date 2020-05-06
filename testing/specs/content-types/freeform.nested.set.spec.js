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
const FreeFormOptionSet1 = require('../../page_objects/wizardpanel/itemset/freeform.optionset1.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('freeform.nested.set.spec: updates a content with nested set and checks `Save` button in the wizard-toolbar', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let siteDisplayName;
    let SITE;
    let contentDisplayName;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN two radio buttons have been clicked consequentially THEN Save button gets enabled in the wizard-toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            let freeFormOptionSet1 = new FreeFormOptionSet1();
            contentDisplayName = contentBuilder.generateRandomName('freeform');
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'freeform');
            await contentWizard.typeDisplayName(contentDisplayName);
            //save just the name:
            await contentWizard.waitAndClickOnSave();
            //click on the radio and expand the first form (set)
            await freeFormNestedSet.clickOnElementTypeInput();
            // save the content again
            await contentWizard.waitAndClickOnSave();
            // Click on the radio in the first form(set)
            await freeFormOptionSet1.clickOnImageRadioButton();
            studioUtils.saveScreenshot('set_in_set_save_issue');
            //"Save" button gets enabled, because radio button has been checked"
            return contentWizard.waitForSaveButtonEnabled();
        });

    it(`GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN two radio buttons have been clicked sequentially THEN Save button gets enabled in the wizard-toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let freeFormOptionSet1 = new FreeFormOptionSet1();
            //1. Open existing content with options set:
            await studioUtils.selectAndOpenContentInWizard(contentDisplayName);
            //2. Click text-radio button:
            await freeFormOptionSet1.clickOnTextRadioButton();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1500);
            //Click on required radio-button:
            await freeFormOptionSet1.clickOnImageRadioButton();
            //"Save" button gets enabled, because required radio button has been checked
            await contentWizard.waitForSaveButtonEnabled();
            let result = await contentWizard.isContentInvalid();
            assert.isFalse(result, "Red icon should not be displayed, because required input is filled");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
