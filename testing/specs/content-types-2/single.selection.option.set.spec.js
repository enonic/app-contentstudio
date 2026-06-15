/**
 * Created on 31.10.2022 updated on 14.06.2026
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const assert = require('node:assert');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/expanded.single.selection.option.set.view');
const appConst = require('../../libs/app_const');

describe("single.selection.option.set.spec: tests for single-select option-sets with expanded property", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const CONTENT_NAME = appConst.generateRandomName('set');


    it(`GIVEN wizard for new content with expanded Single Selection is opened WHEN 'Option 1' has been selected THEN inputs from the 'Option 2' should not be visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. Open new wizard for Option Set with expanded by default single selection:
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.EXPANDED_SINGLE_SELECTION_OPTION_SET);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            await contentWizard.pause(1000);
            // 2. Select 'Option 1' in single selection dropdown:
            await singleSelectionOptionSet.selectOption('Option 1');
            await studioUtils.saveScreenshot('single_selection_option_1_selected');
            // 3. Verify that inputs from 'option 2'-form are not displayed:
            await singleSelectionOptionSet.waitForOption1TextInputDisplayed();
            await singleSelectionOptionSet.waitForOption2FilterInputNotDisplayed();
            // 4. Save the content
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessages();
        });

    //Verifies the issue -  Single-select Option Set displays forms for non-selected options
    //https://github.com/enonic/lib-admin-ui/issues/2834
    it(`WHEN existing content with expanded Single Selection is opened THEN inputs from the 'Option 2' should not be visible`,
        async () => {
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. Open the existing content with single-select option-sets with <expanded>true</expanded>:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await studioUtils.saveScreenshot('single_selection_option_1_reopened');
            // 2. Verify that only input from 'Option 1' is displayed
            await singleSelectionOptionSet.waitForOption1TextInputDisplayed();
            await singleSelectionOptionSet.waitForOption2FilterInputNotDisplayed();
        });

    //Verifies the issue -  Single-select Option Set displays forms for non-selected options
    // https://github.com/enonic/lib-admin-ui/issues/2834
    // https://github.com/enonic/app-contentstudio/issues/10834
    it.skip(`GIVEN existing content with expanded Single Selection is opened WHEN 'Option 1' has been reset AND 'Option 2' has been selected THEN only input from the 'Option 2' should  be visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let singleSelectionOptionSet = new SingleSelectionOptionSet();
            // 1. existing content with Single Selection is opened
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await singleSelectionOptionSet.pause(500);
            // 2. Fill in the option1 text input
            await singleSelectionOptionSet.typeTextInOption1TextInput('test');
            await contentWizard.waitAndClickOnSave();
            // 3. Click on 'Option 2':
            await singleSelectionOptionSet.selectOption('Option 2');
            // 4. Save the content
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessages();
            await studioUtils.saveScreenshot('single_selection_option_2_saved');
            // 4. Verify that input from 'Option 1' is not displayed after the saving:
            await singleSelectionOptionSet.waitForOption1TextInputNotDisplayed();
            await singleSelectionOptionSet.waitForOption2FilterInputDisplayed();

            await singleSelectionOptionSet.selectOption('Option 1');
            await singleSelectionOptionSet.waitForOption1TextInputDisplayed();
            let actualText = await singleSelectionOptionSet.getTextInOption1TextInput();
            assert.equal(actualText,'', "The Text input should be cleared");
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
