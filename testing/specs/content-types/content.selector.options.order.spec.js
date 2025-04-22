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
    let FOLDER_1;
    const FOLDER_NEW_DISPLAY_NAME = appConst.generateRandomName('folder-images');
    const CONTENT_NAME_1 = contentBuilder.generateRandomName('selector');
    const CONTENT_NAME = contentBuilder.generateRandomName('selector');
    const CONTENT_NAME_SEL_1_2 = appConst.generateRandomName('cs');
    const OPTION_1 = appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME; // All Content types images
    const OPTION_2 = appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_DISPLAY_NAME; // folder for selenium tests
    const OPTION_3 = FOLDER_NEW_DISPLAY_NAME;

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
            FOLDER_1 = contentBuilder.buildFolder(contentBuilder.generateRandomName('folder'));
            await studioUtils.doAddFolder(FOLDER_1);
        });

    // Verify the bug - Dropdown should open on down arrow #3966
    // https://github.com/enonic/lib-admin-ui/issues/3966
    it(`GIVEN wizard with content-selector is opened WHEN 'Arrow Down' key has been pressed in the selector THEN selector should be expanded in in tree mode`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Content-Selector in tree mode is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_2_8);
            // 2. Move the focus to the selector:
            await contentSelectorForm.clickInOptionsFilterInput();
            // 3. Press the Arrow Down key:
            await contentSelectorForm.pressArrowDown();
            await studioUtils.saveScreenshot('selector_tree_mode_arrow_down_pressed');
            // 4. Verify that options in the expanded selector(tree mode):
            let items = await contentSelectorForm.getOptionsDisplayNameInTreeMode();
            assert.ok(items.includes(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME),
                'Expected folder should be displayed in the expanded list');
        });

    // Verifies Content selector in tree mode not reloaded after clearing input #8525
    // https://github.com/enonic/app-contentstudio/issues/8525
    it(`GIVEN a text has been inserted/cleared in Options Filter Input WHEN filter input has been cleared THEN options should be reloaded in tree mode`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Content-Selector in tree mode is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_2_8);
            // 2. Insert a content-name in options filter input:
            await contentSelectorForm.typeTextInOptionsFilterInput(appConst.TEST_IMAGES.SPUMANS);
            // 3. Switch to tree-mode after inserting a text in the search input:
            await contentSelectorForm.clickOnModeTogglerButton();
            await contentSelectorForm.pause(500);
            // 4. Expand the parent folder in the tree mode:
            await contentSelectorForm.clickOnExpanderIconInOptionsList(appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_NAME);
            await studioUtils.saveScreenshot('tree_mode_expanded_folder');
            // 5. Verify that the only one option with its parent folder are present in the dropdown options:
            let items = await contentSelectorForm.getOptionsDisplayNameInTreeMode();
            assert.ok(items.length === 2, 'Expected number of items should be displayed');
            assert.equal(items[1], appConst.TEST_IMAGES.SPUMANS, 'Expected display name should be present in the options list');
            // 6. Clear the filter input:
            await contentSelectorForm.clearOptionsFilterInput();
            // 7. Verify that tree mode is reloaded and all items are displayed in the dropdown:
            items = await contentSelectorForm.getOptionsDisplayNameInTreeMode();
            assert.ok(items.length > 2, "Options should be reloaded in the tree mode");
        });


    it(`GIVEN content selector with tree mode is opened WHEN a text has been inserted/cleared in Options Filter Input THEN flat mode should be switched on/off`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Custom-Selector content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_2_8);
            // 2. a content-name has been inserted in options filter input:
            await contentSelectorForm.typeTextInOptionsFilterInput(FOLDER_1.displayName);
            await contentSelectorForm.pause(500);
            // 3. Verify that flat mode is switched on:
            let actualMode = await contentSelectorForm.getOptionsMode();
            assert.equal(actualMode, 'flat', 'Flat mode should be after inserting a text in the search input');
            // 4. Clear the filter input:
            await contentSelectorForm.clearOptionsFilterInput();
            await contentSelectorForm.pause(500);
            await studioUtils.saveScreenshot('filter_input_cleared_tree_mode');
            // 5. Verify that tree mode is switched on again:
            actualMode = await contentSelectorForm.getOptionsMode();
            assert.equal(actualMode, 'tree', 'Tre mode should be after clearing the search input');
        });

    // Content selector dropdown - broken layout after updating selected options #7479
    // Verify the bug -  https://github.com/enonic/app-contentstudio/issues/7479
    it(`GIVEN edit-icon has been clicked in a selected option WHEN the display-name has been updated in the next browser-tab THEN new display name should be searchable in the content selector dropdown`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Custom-Selector content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_2_8);
            await contentWizard.typeDisplayName(CONTENT_NAME_1);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 2. The first option has been selected - display name has been typed in filter input (tree mode should be automatically switched to flat mode):
            await contentSelectorForm.doFilterOptionInTreeModeAndApply(FOLDER_1.displayName);
            // 3. Click on Edit-icon then switch to the new browser tab:
            await contentSelectorForm.clickOnEditSelectedOption(FOLDER_1.displayName);
            await studioUtils.doSwitchToNextTab();
            // 4. Update the display-name of the selected option:
            await contentWizard.typeDisplayName(FOLDER_NEW_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 5. Switch to the content with selector dropdown:
            await studioUtils.switchToContentTabWindow(CONTENT_NAME_1);
            // 6. Type the new display-name of the selected option in Options Filter Input:
            await contentSelectorForm.typeTextInOptionsFilterInput(FOLDER_NEW_DISPLAY_NAME);
            // 7. Verify that the option with updated display name is present in the filtered input in Flat mode:
            let result = await contentSelectorForm.getOptionsDisplayNameInFlatMode();
            assert.ok(result[0] === FOLDER_NEW_DISPLAY_NAME, 'New display name should be present in the filtered options');
        });

    it(`GIVEN content selector (1-2), dropdown has been expanded WHEN 2 options have been selected AND 'OK' button has been pressed THEN 'Add new' button gets not visible`,
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
            // 4. Verify that 'Ok' button gets visible then click on it:
            await contentSelectorForm.clickOnApplySelectionButton();
            // 5. Verify the selected option:
            let selectedOptions = await contentSelectorForm.getSelectedOptions();
            assert.ok(selectedOptions.length === 2, '2 selected options should be displayed');
            // 6. Verify that Add new button is not displayed now:
            await contentSelectorForm.waitForAddNewContentButtonNotDisplayed();
        });

    it(`GIVEN wizard with 'content-selector'(2:8) is opened AND three options have been selected THEN expected options should be present in the form`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Custom-Selector content is opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_2_8);
            await contentWizard.typeDisplayName(CONTENT_NAME);
            // 2. three options have been selected - insert a name(switch to flat  mode) and click on the option:
            await contentSelectorForm.doFilterOptionInTreeModeAndApply(OPTION_1);
            await contentSelectorForm.doFilterOptionInTreeModeAndApply(OPTION_2);
            await contentSelectorForm.doFilterOptionInTreeModeAndApply(OPTION_3);
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

    // Verifies https://github.com/enonic/app-contentstudio/issues/8379
    // Options are not cleared in content selector with tree mode #8379
    it(`GIVEN content with 3 selected options is opened WHEN one option has been clicked in the dropdown(unselected) AND 'Apply' button has been pressed THEN two selected options should be displayed in the form`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Open the existing content wit 3 selected options:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. insert the display name in the filter input
            await contentSelectorForm.typeTextInOptionsFilterInput(OPTION_3);
            // 3. Filter the option, click on it in the dropdown and unselect it:
            await contentSelectorForm.doFilterOptionInTreeModeAndApply(OPTION_3);
            // 4. Verify that order is not changed after refreshing the page :
            let options = await contentSelectorForm.getSelectedOptions();
            await studioUtils.saveScreenshot('8379_content_selector_option_unselected');
            assert.equal(options.length, 2, 'Two selected options should be displayed');
            assert.ok(options.includes(OPTION_3) === false, 'Unselected option should not be displayed');
            // 5. Verify that Save button gets enabled:
            await contentWizard.waitForSaveButtonEnabled();
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/8379
    // Options are not cleared in content selector with tree mode #8379
    it(`GIVEN 2 selected options are filtered in the content-selector WHEN remove-icon has been clicked for one selected item AND the dropdown has been expanded THEN the unchecked item should not be displayed in the dropdown list`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Open the existing content with selected options:
            await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME);
            // 2. insert in the filter input the common part of display names:
            await contentSelectorForm.typeTextInOptionsFilterInput('images');
            await studioUtils.saveScreenshot('8379_content_selector_filtered');
            // 3. Verify that 2 option items should be checked in the dropdown list:
            let result1 = await contentSelectorForm.getCheckedOptionsDisplayNameInDropdownList();
            assert.equal(result1.length, 2, 'two option items should be displayed in the dropdown list');
            // 4. Collapse the dropdown list
            await contentSelectorForm.clickOnDropdownHandle();
            // 5. Remove one selected option:
            await contentSelectorForm.removeSelectedOption(OPTION_1);
            await contentSelectorForm.pause(1000);
            // 6. Expand the dropdown list again
            await contentSelectorForm.clickOnDropdownHandle();
            await studioUtils.saveScreenshot('8379_content_selector_option_removed');
            let result2 = await contentSelectorForm.getCheckedOptionsDisplayNameInDropdownList();
            // 4. Verify that the only one option item is checked in the list:
            assert.equal(result2.length, 1, 'One option items should be displayed in the dropdown list');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
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
            let options = await contentSelectorForm.getOptionsDisplayNameInTreeMode();
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
            await studioUtils.saveScreenshot('selector_ok_btn');
            // 4. Verify that Apply button gets visible then click on it:
            await contentSelectorForm.clickOnApplySelectionButton();
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
            await contentSelectorForm.clickOnApplySelectionButton();
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
            await studioUtils.saveScreenshot('dropdown_ok_btn_opt_1');
            await contentSelectorForm.clickOnCheckboxInDropdown(1);
            await studioUtils.saveScreenshot('dropdown_ok_btn__opt_2');
            // 4. Verify that 'Apply' button gets visible then click on it:
            await contentSelectorForm.clickOnApplySelectionButton();
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
