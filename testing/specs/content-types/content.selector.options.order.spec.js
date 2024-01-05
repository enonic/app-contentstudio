/**
 * Created on 09.07.2020.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentSelectorForm = require('../../page_objects/wizardpanel/content.selector.form');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('content.selector.options.order.spec:  tests for checking of order of selected options in content selector', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_NAME = contentBuilder.generateRandomName('selector');
    const CONTENT_NAME_SEL_1_2 = appConst.generateRandomName('cs');
    const OPTION_1 = appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME; // All Content types images
    const OPTION_2 = appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_DISPLAY_NAME; // folder for selenium tests
    const OPTION_3 = appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME; // Images for simple page

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN content selector (1-2), dropdown has been expanded WHEN 2 options have been selected AND 'Apply' button has been pressed THEN 'Add new' button gets not visible`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new content-selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_1_2);
            await contentWizard.typeDisplayName(appConst.generateRandomName('cs'));
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 2. Expand the dropdown:
            await contentSelectorForm.clickOnDropdownHandle();
            // 3. Click on 2 checkboxes in options list:
            await contentSelectorForm.clickOnCheckboxInDropdown(0);
            await studioUtils.saveScreenshot('selector_dropdown_1_option');
            await contentSelectorForm.clickOnCheckboxInDropdown(1);
            await studioUtils.saveScreenshot('selector_dropdown_2_option');
            // 4. Verify that 'Apply' button gets visible then click on it:
            await contentSelectorForm.clickOnApplyButton();
            // 5. Verify the selected option:
            let selectedOptions = await contentSelectorForm.getSelectedOptions();
            assert.ok(selectedOptions.length === 2, '2 selected options should be displayed');
            // 6. Verify that Add new button is not displayed now:
            await contentSelectorForm.waitForAddNewContentButtonNotDisplayed();
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN wizard with 'content-selector'(2:8) is opened AND three options have been selected THEN expected options should be present in the form`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Custom-Selector content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_2_8);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 2. 3 options have been selected:
            await contentSelectorForm.selectOption(OPTION_1);
            await contentSelectorForm.selectOption(OPTION_2);
            await contentSelectorForm.selectOption(OPTION_3);
            await contentWizard.waitAndClickOnSave();
            // 3. Verify that options are saved:
            let options = await contentSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('content_selector_3_options');
            assert.equal(options[0], OPTION_1, 'Expected option should be selected');
            assert.equal(options[1], OPTION_2, 'Expected option should be selected');
            assert.equal(options[2], OPTION_3, 'Expected option should be selected');
            // 4. Verify that 'Add new' icon remains visible in the selector:
            await contentSelectorForm.waitForAddNewContentButtonDisplayed();
        });

    // Verifies https://github.com/enonic/lib-admin-ui/issues/920
    // Incorrect order of selected options in Content Selector #920
    it(`GIVEN options have been sorted alphabetically in descending order WHEN page has been saved and refreshed THEN order of selected options should not be changed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Open existing content-selector:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. Change the sorting -  they should be sorted alphabetically in descending order:
            await contentSelectorForm.swapOptions(OPTION_3, OPTION_1);
            await contentSelectorForm.swapOptions(OPTION_2, OPTION_1);
            // 3. Save and refresh the page
            await contentWizard.waitAndClickOnSave();
            await contentWizard.refresh();
            await contentWizard.pause(2000);
            // 4. Verify that order is not changed after refreshing the page :
            let options = await contentSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('content_selector_swapped_options');
            assert.equal(options[0], OPTION_3, 'Order of selected Options should not be changed');
            assert.equal(options[1], OPTION_2, 'Order of selected Options should not be changed');
            assert.equal(options[2], OPTION_1, 'Order of selected Options should not be changed');
        });

    it(`GIVEN content with selector in flat mode is opened WHEN mode toggler has been clicked THEN tree mode should be is switched on`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Open wizard for new content-selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_1_2);
            // 2. Click on the selector mode toggler:
            await contentSelectorForm.clickOnModeTogglerButton();
            await studioUtils.saveScreenshot('selector_modetoggler_btn');
            // 3. Verify that tree mode is switched on:
            let options = await contentSelectorForm.getOptionsDisplayName();
            assert.ok(options.includes(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME),
                'Expected display name should be present in the options list');
        });

    it(`GIVEN dropdown has been expanded WHEN an option's checkbox has been selected AND 'Apply' button has been pressed THEN the options should be selected`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new content-selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_1_2);
            await contentWizard.typeDisplayName(CONTENT_NAME_SEL_1_2);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 2. Expand the dropdown:
            await contentSelectorForm.clickOnDropdownHandle();
            // 3. Click on a checkbox in options list:
            await contentSelectorForm.clickOnCheckboxInDropdown(1);
            await studioUtils.saveScreenshot('selector_apply_btn');
            // 4. Verify that Apply button gets visible then click on it:
            await contentSelectorForm.clickOnApplyButton();
            // 5. Verify the selected option:
            let selectedOptions = await contentSelectorForm.getSelectedOptions();
            assert.ok(selectedOptions.length === 1, 'Selected option should be displayed');
            // 6. Verify that Save button gets enabled:
            await contentWizard.waitAndClickOnSave();
        });

    it(`GIVEN content with single selected option is opened WHEN dropdown has been expanded AND the option has been unselected THEN selected option should be cleared in the selector form`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Open existing content-selector with single selected option:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME_SEL_1_2);
            // 2. Click on dropdown handler:
            await contentSelectorForm.clickOnDropdownHandle();
            // 3. Unselect the option then click on Apply button:
            await contentSelectorForm.clickOnCheckboxInDropdown(1);
            await studioUtils.saveScreenshot('selector_option_unselected');
            await contentSelectorForm.clickOnApplyButton();
            // 4. Verify that selected option is cleared:
            let selectedOptions = await contentSelectorForm.getSelectedOptions();
            assert.ok(selectedOptions.length === 0, 'There are no selected options in the selector');
        });

    it(`GIVEN content selector (1-2), dropdown has been expanded WHEN 2 options hav been selected AND 'Apply' button has been pressed THEN 'Add new' button gets not visible`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            let contentWizard = new ContentWizard();
            // 1. Open wizard for new content-selector:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_1_2);
            await contentWizard.typeDisplayName(appConst.generateRandomName('cs'));
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 2. Expand the dropdown:
            await contentSelectorForm.clickOnDropdownHandle();
            // 3. Click on 2 checkboxes in options list:
            await contentSelectorForm.clickOnCheckboxInDropdown(0);
            await studioUtils.saveScreenshot('dropdown_apply_btn_opt_1');
            await contentSelectorForm.clickOnCheckboxInDropdown(1);
            await studioUtils.saveScreenshot('dropdown_apply_btn__opt_2');
            // 4. Verify that 'Apply' button gets visible then click on it:
            await contentSelectorForm.clickOnApplyButton();
            // 5. Verify the selected option:
            let selectedOptions = await contentSelectorForm.getSelectedOptions();
            assert.ok(selectedOptions.length === 2, '2 selected options should be displayed');
            // 6. Verify that Add new button is not displayed now:
            await contentSelectorForm.waitForAddNewContentButtonNotDisplayed();
            await contentWizard.waitAndClickOnSave();
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
