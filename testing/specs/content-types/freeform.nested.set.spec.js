/**
 * Created on 12.04.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const FreeFormNestedSet = require('../../page_objects/wizardpanel/itemset/freeform.form.view');
const FreeFormOptionSet1 = require('../../page_objects/wizardpanel/itemset/freeform.optionset1.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');


describe('freeform.nested.set.spec: updates a content with nested set and checks `Save` button on the wizard-toolbar', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let siteDisplayName;
    let SITE;
    let contentDisplayName;

    it(`Preconditions: site should be added`, () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            siteDisplayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(siteDisplayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed => {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN two radio buttons have been clicked consequentially THEN Save button should appear on the wizard-toolbar`,
        () => {
            let contentWizard = new ContentWizard();
            let freeFormNestedSet = new FreeFormNestedSet();
            let freeFormOptionSet1 = new FreeFormOptionSet1();
            contentDisplayName = contentBuilder.generateRandomName('freeform');
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'freeform').then(() => {
                return contentWizard.typeDisplayName(contentDisplayName);
            }).then(() => {
                //save only the name
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                //click on the radio and expand the first form (set)
                return freeFormNestedSet.clickOnElementType_Input();
            }).then(() => {
                // save the content again
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                // click on the radio in the first form(set)
                return freeFormOptionSet1.clickOnImageRadioButton();
            }).then(() => {
                studioUtils.saveScreenshot('set_in_set_save_issue');
                return contentWizard.waitForSaveButtonEnabled();
            }).then(result => {
                assert.isTrue(result, "Save button should be enabled, because radio button has been clicked in the form");
            })
        });

    it(`GIVEN 'wizard for new content with 'nested set' is opened AND name has been saved WHEN two radio buttons have been clicked sequentially THEN Save button should appear on the wizard-toolbar`,
        () => {
            let contentWizard = new ContentWizard();
            let freeFormOptionSet1 = new FreeFormOptionSet1();
            return studioUtils.selectAndOpenContentInWizard(contentDisplayName).then(() => {
                return freeFormOptionSet1.clickOnTextRadioButton();
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(()=>{
              return contentWizard.pause(1500);
            }).then(() => {
                return freeFormOptionSet1.clickOnImageRadioButton();
            }).then(() => {
                return contentWizard.waitForSaveButtonEnabled();
            }).then(result => {
                assert.isTrue(result, "Save button should be enabled, because radio button has been clicked in the form");
            }).then(() => {
                return contentWizard.isContentInvalid();
            }).then(result => {
                assert.isFalse(result, "Red icon should not be displayed, because required inputs are filled");
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
