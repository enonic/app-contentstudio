/**
 * Created on 02.05.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe("Tests for updating a number in aggregation checkboxes", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const TARGET_1 = 'whale';
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');
    const WORKFLOW_AGGREGATION = appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW;
    const SHORTCUT_DE_NAME = appConst.generateRandomName('sh');

    it(`Preconditions: work in progress shortcuts should be created`,
        async () => {
            // add new 'work in progress' shortcut
            let displayName2 = contentBuilder.generateRandomName('shortcut');
            let shortcut = contentBuilder.buildShortcut(displayName2, TARGET_1);
            await studioUtils.doAddShortcut(shortcut);
        });

    it(`WHEN new shortcut with Deutsch language has been created THEN Deutsch checkbox should appear in the Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            // 1. Add new shortcut with "Deutsch" language
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_DE_NAME);
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            // 2. Open 'Edit Settings' modal dialog and select the language:
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editDetailsDialog = await studioUtils.openEditSettingDialog();
            await editDetailsDialog.waitForLoaded();
            await editDetailsDialog.filterOptionsAndSelectLanguage(appConst.LANGUAGES.DEUTSCH_DE);
            await editDetailsDialog.clickOnApplyButton();
            await contentWizard.waitForNotificationMessage();
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            // 3. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 4. Click on Deutsch checkbox:
            await filterPanel.clickOnCheckboxInLanguageBlock('Deutsch');
            await contentBrowsePanel.waitForContentDisplayed(SHORTCUT_DE_NAME);
            // 5. Verify that one item should be present in the filtered grid:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.ok(result.length === 1, "One item should be filtered in the grid");
            assert.equal(result[0], SHORTCUT_DE_NAME, "Expected display name should be present in Grid");
        });

    it(`WHEN Deutsch checkbox has been clicked in Filter Panel THEN expected owner and Last Modified By (Me) should be displayed in the Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            // 1. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 2. Click on Deutsch checkbox:
            await filterPanel.clickOnCheckboxInLanguageBlock('Deutsch');
            // 3. Verify that Me is displayed in 'Last Modified By' and 'Owner' aggregation checkboxes:
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY, 'Me');
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.OWNER, 'Me');
            // 4. Work in progress checkbox should not be displayed, because the content is ready for publishing
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW, 'Work in progress');
            // TODO workflow checkbox temporarily not visible
            //await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW, "Ready for publishing");

            //4. 1 should be displayed in aggregation checkboxes:
            //let result = await filterPanel.getNumberOfItemsInAggregationView(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
            //    "Ready for publishing");
            //assert.equal(result, 1, "One ready for publishing item should be displayed in the label");
        });

    it(`GIVEN folder with Deutsch language has been opened WHEN language has been removed in the wizard THEN Deutsch checkbox gets not visible in the Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentWizard = new ContentWizard();
            // 1. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 2. Verify that Deutsch checkbox is displayed in Language block:
            await filterPanel.waitForCheckboxDisplayed('Language', 'Deutsch');
            // 3. Open the folder with Deutsch language:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_DE_NAME);
            await contentWizard.openContextWindow();
            await contentWizard.openDetailsWidget();
            let editSettingsDialog = await studioUtils.openEditSettingDialog();
            // 4. Click on remove language icon and save:
            await editSettingsDialog.clickOnRemoveLanguage();
            await editSettingsDialog.clickOnApplyButton();
            await contentWizard.waitForSaveButtonDisabled();
            await contentWizard.waitForNotificationMessage();
            // 5. Switch to the browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            // 6. Verify that Deutsch checkbox is not displayed in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed('Language', 'Deutsch');
        });

    it(`GIVEN wizard for new shortcut is opened WHEN new 'work in progress' shortcut has been added THEN number in 'Work in progress' checkbox should be increased by 1`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            // 1. Open Filter Panel
            await studioUtils.openFilterPanel();
            await studioUtils.saveScreenshot('shortcut_workflow_aggregation_0');
            // 2. Click on Shortcut checkbox:
            await filterPanel.clickOnCheckboxInContentTypesBlock('Shortcut');
            await studioUtils.saveScreenshot('shortcut_workflow_aggregation_1');
            let numberBefore = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            // 3. Open wizard for new shortcut:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            // 4. Fill in the name input and select a target:
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            // 5. save the shortcut:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 6. Go to Browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            await studioUtils.saveScreenshot('shortcut_workflow_aggregation_2');
            // 7. Verify that the number in 'work in progress' checkbox is increased:
            let numberAfter = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            assert.ok(numberAfter - numberBefore === 1, "Number in 'work in progress' checkbox should be increased");
        });

    it(`WHEN existing 'Work in progress shortcut' has been marked as ready THEN the number in 'Work in progress' checkbox should decrease by 1`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            // 1. Open Filter Panel
            await studioUtils.openFilterPanel();
            // 2. Click on 'Shortcut' checkbox:
            await filterPanel.clickOnCheckboxInContentTypesBlock('Shortcut');
            await studioUtils.saveScreenshot('shortcut_workflow_aggregation_3');
            // 3. Get the number in 'Ready for publishing' checkbox in Filter Panel
            let number1 = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            // 4. Click on the row then press on 'Mark as ready' button:
            await contentBrowsePanel.clickOnRowByName(SHORTCUT_NAME);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnCancelTopButton();
            await contentPublishDialog.waitForDialogClosed();
            await contentBrowsePanel.pause(1000);
            await studioUtils.saveScreenshot('shortcut_workflow_aggregation_4');

            // 5. Get the number in 'ready for publishing' checkbox in the filter panel
            let number2 = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            // 6. Verify that number in 'Work in progress' is reduced by 1
            assert.ok(number1 - number2 === 1, "Number in 'Work in progress' checkbox should decrease");
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
