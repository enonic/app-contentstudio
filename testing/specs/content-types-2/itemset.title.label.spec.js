/**
 * Created on 24.11.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SetInSetFormView = require('../../page_objects/wizardpanel/itemset/set.in.set.form.view');

describe("itemset.title.labels.spec: checks item set's title and labels", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let ITEM_SET_NOTE1 = "test text";
    let ITEM_SET_NOTE2 = "test text 2";
    let ITEM_SET_NAME1 = contentBuilder.generateRandomName('itemset');

    it("Preconditions: new site should be created",
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN new wizard with Item Set is opened WHEN a text has been typed in the top text input THEN title and subtitle should be updated automatically",
        async () => {
            let contentWizard = new ContentWizard();
            let setInSetFormView = new SetInSetFormView();
            //1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.SET_IN_SET);
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(ITEM_SET_NAME1);
            //3. Click on 'Add' button and add 'Contact Info' item set:
            await setInSetFormView.clickOnAddContactInfoButton();
            //4. Fill in the top text input
            await setInSetFormView.typeTextInLabelInput(ITEM_SET_NOTE1);
            //5. Verify that subtitle automatically gets "Contact Info":
            let subtitle = await setInSetFormView.getItemSetSubtitle();
            assert.equal(subtitle, "Contact Info", "Expected subtitle should be displayed in the item set");
            //6. Title gets equal the text in the top input
            let title = await setInSetFormView.getItemSetTitle();
            assert.equal(title, ITEM_SET_NOTE1, "Expected title should be displayed in the item set");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing content with Item Set is opened WHEN text in inputs have been updated THEN title and subtitle should be updated automatically",
        async () => {
            let contentWizard = new ContentWizard();
            let setInSetFormView = new SetInSetFormView();
            //1. Open the existing content with Item Set:
            await studioUtils.selectAndOpenContentInWizard(ITEM_SET_NAME1);
            //2. Clear the top text input:
            await setInSetFormView.typeTextInLabelInput("");
            //4. Fill in the second text input
            await setInSetFormView.typeTextInStreetInput(ITEM_SET_NOTE2);
            //5. Verify that subtitle remains the same "Contact Info":
            let subtitle = await setInSetFormView.getItemSetSubtitle();
            assert.equal(subtitle, "Contact Info", "Expected subtitle should be displayed in the item set");
            //6. Title gets equal the text in the second input
            let title = await setInSetFormView.getItemSetTitle();
            assert.equal(title, ITEM_SET_NOTE2, "Expected title should be displayed in the item set");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing content with Item Set is opened WHEN required inputs are not filled THEN the content should be invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let setInSetFormView = new SetInSetFormView();
            //1. Open the existing content with Item Set:
            await studioUtils.selectAndOpenContentInWizard(ITEM_SET_NAME1);
            let result = await contentWizard.isContentInvalid();
            //2. Verify that the content is invalid
            assert.isTrue(result, "content should be invalid");
            //3. Fill in the first name and last name inputs:
            await setInSetFormView.typeTextInFirstNameInput("John");
            await setInSetFormView.typeTextInLastNameInput("Doe");
            result = await contentWizard.isContentInvalid();
            //4. Verify that the content gets valid now
            assert.isFalse(result, "content should be valid");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
