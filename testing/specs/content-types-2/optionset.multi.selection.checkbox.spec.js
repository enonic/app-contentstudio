/**
 * Created on 25.03.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const MultiSelectionOptionSet = require('../../page_objects/wizardpanel/optionset/multi.selection.option.set');
// Multi selection set with HtmlArea:
const MultiSelectionSetView = require('../../page_objects/wizardpanel/optionset/multi.selection.set.view');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/html-area/insert.image.dialog.cke');

describe('optionset.multi.selection.checkbox.spec: tests for option set with multi selection checkboxes', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const DISPLAY_NAME = contentBuilder.generateRandomName('optionset');
    const DISPLAY_NAME_2 = contentBuilder.generateRandomName('optionset');

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/5757
    // Option Set wizard - Html Area is disabled in selected options #5757
    it(`GIVEN wizard for option set with HtmlArea is opened WHEN an image has been inserted in the HtmlArea THEN Insert Image dialog should be closed`,
        async () => {
            let multiSelectionSetView = new MultiSelectionSetView();
            let insertImageDialog = new InsertImageDialog();
            // 1. Open new wizard for option-set content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            // 2. select the option with HtmlArea:
            await multiSelectionSetView.clickOnOption('Option 3');
            // 3. Open Insert Image dialog:
            await multiSelectionSetView.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.waitForDialogVisible();
            // 4. Select an image:
            await insertImageDialog.filterAndSelectImage(appConst.TEST_IMAGES.BOOK);
            // 5. Click on 'Insert' button in the dialog:
            await insertImageDialog.clickOnInsertButton();
            // 6. Verify that the dialog closes:
            await insertImageDialog.waitForDialogClosed();
        });

    it(`GIVEN wizard for option set with multi selection minimum="0" maximum="2" is opened WHEN 2 checkboxes have been clicked THEN the third checkbox should be disabled`,
        async () => {
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let contentWizard = new ContentWizard();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET_0_2);
            await contentWizard.typeDisplayName(DISPLAY_NAME);
            // 2. two checkboxes have been clicked
            await multiSelectionOptionSet.clickOnOption('Option 1');
            await multiSelectionOptionSet.clickOnOption('Option 2');
            // 3. The content has been saved:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('item_set_multi_selection_2_disabled');
            // 4. Verify that the third checkbox is disabled:
            await multiSelectionOptionSet.waitForOptionCheckboxDisabled('Option 3');
            // 5. Unselect the first checkbox
            await multiSelectionOptionSet.clickOnOption('Option 1');
            await studioUtils.saveScreenshot('item_set_multi_selection_2_enabled');
            // 6. Verify that the third checkbox gets enabled:
            await multiSelectionOptionSet.waitForOptionCheckboxEnabled('Option 3');
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/5593
    // Multi-select option-set allows selecting more than maximum options #5593
    it(`GIVEN wizard for option set with multi selection minimum="1" maximum="3" is opened WHEN 3 checkboxes have been clicked THEN the third checkbox should be disabled`,
        async () => {
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            let contentWizard = new ContentWizard();
            // 1. Open the new wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.OPTION_SET);
            await contentWizard.typeDisplayName(DISPLAY_NAME_2);
            //2. three checkboxes have been clicked, ('Option 2' is selected by default)
            await multiSelectionOptionSet.clickOnOption('Option 1');
            await multiSelectionOptionSet.clickOnOption('Option 3');
            // 3. The content has been saved:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('opt_set_m_selection_3_selected');
            // 4. Verify that the fourth checkbox gets disabled:
            await multiSelectionOptionSet.waitForOptionCheckboxDisabled('Option 4');
            // scroll up the page:
            await contentWizard.scrollPanel(-100);
            // 5. Unselect the first checkbox
            await multiSelectionOptionSet.clickOnOption('Option 1');
            await studioUtils.saveScreenshot('opt_set_m_selection_2_selected');
            // 6. Verify that the fourth checkbox gets enabled:
            await multiSelectionOptionSet.waitForOptionCheckboxEnabled('Option 4');
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/4354
    //Multi selection in option set - more than maximum options can be selected after content is reopened #4354
    it(`WHEN existing option set with 2 selected options is opened THEN the third checkbox should be disabled`,
        async () => {
            let multiSelectionOptionSet = new MultiSelectionOptionSet();
            // 1. existing option set with 2 selected options is opened
            await studioUtils.selectAndOpenContentInWizard(DISPLAY_NAME);
            // 2. two checkboxes should be selected:
            let isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 1');
            assert.ok(isSelected, "'Option 1' checkbox should be selected");
            isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 2');
            assert.ok(isSelected, "'Option 2' checkbox should be selected");
            // 2. The third checkbox should be not selected and disabled :
            isSelected = await multiSelectionOptionSet.isCheckboxSelected('Option 3');
            assert.ok(isSelected === false, "'Option 3' checkbox should be not selected");
            await studioUtils.saveScreenshot('item_set_multi_selection_2_disabled');
            await multiSelectionOptionSet.waitForOptionCheckboxDisabled('Option 3');
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
