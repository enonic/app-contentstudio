/**
 * Created on 31.10.2022
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ExpandedSingleSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/expanded.single.selection.option.set.view');
const appConst = require('../../libs/app_const');

describe("expanded.single.selection.option.set.spec: tests for single-select option-sets with expanded property", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME = appConst.generateRandomName('set');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN wizard for new content with expanded Single Selection is opened WHEN 'Option 1' has been selected THEN inputs from the 'Option 2' should not be visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let expandedSingleSelectionOptionSet = new ExpandedSingleSelectionOptionSet();
            //1. Open new wizard for Option Set with expanded by default single selection:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.EXPANDED_SINGLE_SELECTION_OPTION_SET);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            await contentWizard.pause(1000);
            //2. Select 'Option 1' in single selection dropdown:
            await expandedSingleSelectionOptionSet.selectOption('Option 1');
            await studioUtils.saveScreenshot('single_selection_option_1_selected');
            //3. Verify that inputs from 'option 2'-form are not displayed:
            await expandedSingleSelectionOptionSet.waitForOption1TextInputDisplayed();
            await expandedSingleSelectionOptionSet.waitForOption2FilterInputNotDisplayed();
            //4. Save the content
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessages();
        });

    //Verifies the issue -  Single-select Option Set displays forms for non-selected options
    //https://github.com/enonic/lib-admin-ui/issues/2834
    it(`WHEN existing content with expanded Single Selection is opened THEN inputs from the 'Option 2' should not be visible`,
        async () => {
            let expandedSingleSelectionOptionSet = new ExpandedSingleSelectionOptionSet();
            //1. Open the existing content with single-select option-sets with <expanded>true</expanded>:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            await studioUtils.saveScreenshot('single_selection_option_1_reopened');
            //2. Verify that only input from 'Option 1' is displayed
            await expandedSingleSelectionOptionSet.waitForOption1TextInputDisplayed();
            await expandedSingleSelectionOptionSet.waitForOption2FilterInputNotDisplayed();
        });

    //Verifies the issue -  Single-select Option Set displays forms for non-selected options
    // https://github.com/enonic/lib-admin-ui/issues/2834
    it(`GIVEN existing content with expanded Single Selection is opened WHEN 'Option 1' has been reset AND 'Option 2' has been selected THEN only input from the 'Option 2' should  be visible`,
        async () => {
            let contentWizard = new ContentWizard();
            let expandedSingleSelectionOptionSet = new ExpandedSingleSelectionOptionSet();
            //1. existing content with expanded Single Selection is opened
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            //2. Reset 'Option 1' then select 'Option 2'
            await expandedSingleSelectionOptionSet.expandOptionSetMenu();
            await expandedSingleSelectionOptionSet.clickOnResetMenuItem();
            await expandedSingleSelectionOptionSet.pause(500);
            await expandedSingleSelectionOptionSet.selectOption('Option 2');
            //3. Save the content
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('single_selection_option_2_saved');
            //4. Verify that input from 'Option 1' is not displayed after the saving:
            await expandedSingleSelectionOptionSet.waitForOption1TextInputNotDisplayed();
            await expandedSingleSelectionOptionSet.waitForOption2FilterInputDisplayed();
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
