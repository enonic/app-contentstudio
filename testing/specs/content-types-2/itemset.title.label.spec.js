/**
 * Created on 24.11.2021  updated on 13.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SetInSetFormView = require('../../page_objects/wizardpanel/itemset/set.in.set.form.view');

describe("itemset.title.labels.spec: checks item set's title and labels", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const ITEM_SET_NOTE1 = 'test text';
    const ITEM_SET_NOTE2 = 'test text 2';
    const ITEM_SET_NAME1 = contentBuilder.generateRandomName('itemset');

    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;

    it("GIVEN new wizard with Item Set is opened WHEN a text has been typed in the top text input THEN title and subtitle should be updated automatically",
        async () => {
            let contentWizard = new ContentWizard();
            let setInSetFormView = new SetInSetFormView();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.SET_IN_SET);
            // 2. Fill in the name input:
            await contentWizard.typeDisplayName(ITEM_SET_NAME1);
            // 3. Click on 'Add' button and add 'Contact Info' item set:
            await setInSetFormView.clickOnAddContactInfoButton();
            // 4. Verify that the occurrence header shows the set label 'Contact Info' while all inputs are empty:
            let title = await setInSetFormView.getItemSetTitle();
            assert.equal(title, "Contact Info", "The set label should be displayed in the occurrence header");
            // 5. Fill in the top text input
            await setInSetFormView.typeTextInLabelInput(ITEM_SET_NOTE1);
            // 6. Title gets equal the text in the top input
            title = await setInSetFormView.getItemSetTitle();
            assert.equal(title, ITEM_SET_NOTE1, "Expected title should be displayed in the item set");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing content with Item Set is opened WHEN text in inputs have been updated THEN title and subtitle should be updated automatically",
        async () => {
            let contentWizard = new ContentWizard();
            let setInSetFormView = new SetInSetFormView();
            // 1. Open the existing content with Item Set:
            await studioUtils.selectAndOpenContentInWizard(ITEM_SET_NAME1);
            // 2. Clear the top text input:
            await setInSetFormView.clearLabelInput();
            // 4. Fill in the second text input
            await setInSetFormView.typeTextInStreetInput(ITEM_SET_NOTE2);
            // 5. Title gets equal the text in the second input(the first non-empty input value is shown in the header):
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
            let isInvalid = await contentWizard.isContentInvalid();
            //2. Verify that the content is invalid
            assert.ok(isInvalid, "content should be invalid");
            //3. Fill in the first name and last name inputs:
            await setInSetFormView.typeTextInFirstNameInput("John");
            await setInSetFormView.typeTextInLastNameInput("Doe");
            isInvalid = await contentWizard.isContentInvalid();
            //4. Verify that the content gets valid now
            assert.ok(isInvalid === false, "the content should be valid");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
