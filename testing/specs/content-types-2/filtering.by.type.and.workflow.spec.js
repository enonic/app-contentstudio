/**
 * Created on 02.05.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const ShortcutForm = require('../../page_objects/wizardpanel/shortcut.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const FilterPanel = require('../../page_objects/browsepanel/content.filter.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');

describe("Tests for updating a number in aggregation checkboxes", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const TARGET_1 = "whale";
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
            let settingsStepForm = new SettingsStepForm();
            let contentBrowsePanel = new ContentBrowsePanel();

            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            //1. Add new shortcut with "Deutsch" language
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(SHORTCUT_DE_NAME);
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            await settingsStepForm.filterOptionsAndSelectLanguage(appConst.LANGUAGES.DEUTSCH_DE);
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchToGrid();
            //2. Open Filter Panel
            await studioUtils.openFilterPanel();
            //3. Click on Deutsch checkbox:
            await filterPanel.clickOnCheckboxInLanguageBlock("Deutsch");
            //4. Verify that one item should be present in the filtered grid:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.isTrue(result.length === 1, "One item should be filtered in the grid");
            assert.equal(result[0], SHORTCUT_DE_NAME, "Expected display name should be present in Grid");
        });

    it(`WHEN Deutsch checkbox has been clicked in Filter Panel THEN expected owner and Last Modified By (Me) should be displayed in the Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Open Filter Panel
            await studioUtils.openFilterPanel();
            //2. Click on Deutsch checkbox:
            await filterPanel.clickOnCheckboxInLanguageBlock("Deutsch");
            //3. Verify that Me is displayed in 'Last Modified By' and 'Owner' aggregation checkboxes:
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY, "Me");
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.OWNER, "Me");
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW, "Ready for publishing");
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW, "Work in progress");
            //4. 1 should be displayed in aggregation checkboxes:
            let result = await filterPanel.getNumberOfItemsInAggregationView(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                "Ready for publishing");
            assert.equal(result, 1, "One ready for publishing item should be displayed in the label");
        });

    it(`GIVEN folder with Deutsch language has been opened WHEN language has been removed in the wizard THEN Deutsch checkbox gets not visible in the Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let settingsStepForm = new SettingsStepForm();
            let contentWizard = new ContentWizard();
            //1. Open Filter Panel
            await studioUtils.openFilterPanel();
            //2. Verify that Deutsch checkbox is displayed in Language block:
            await filterPanel.waitForCheckboxDisplayed("Language", "Deutsch");
            //3. Open the folder with Deutsch language:
            await studioUtils.selectAndOpenContentInWizard(SHORTCUT_DE_NAME);
            //4. Click on remove language icon and save:
            await settingsStepForm.clickOnRemoveLanguage();
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //5. Switch to the browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            //6. Verify that Deutsch checkbox is not displayed in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed("Language", "Deutsch");
        });

    it(`GIVEN wizard for new shortcut is opened WHEN new 'work in progress' shortcut has been added THEN number in 'Work in progress' checkbox should be increased by 1`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            //1. Open Filter Panel
            await studioUtils.openFilterPanel();
            await studioUtils.saveScreenshot("shortcut_workflow_aggregation_0");
            //2. Click on Shortcut checkbox:
            await filterPanel.clickOnCheckboxInContentTypesBlock("Shortcut");
            await studioUtils.saveScreenshot("shortcut_workflow_aggregation_1");
            let numberBefore = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            //3. Open wizard for new shortcut:
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            //4. Fill in the name input and select a target:
            await contentWizard.typeDisplayName(SHORTCUT_NAME);
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            //5. save the shortcut:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //6. Go to Browse panel:
            await studioUtils.doSwitchToContentBrowsePanel();
            await studioUtils.saveScreenshot("shortcut_workflow_aggregation_2");
            //7. Verify that the number in 'work in progress' checkbox is increased:
            let numberAfter = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            assert.isTrue(numberAfter - numberBefore === 1, "Number in work in progress checkbox should be increased");
        });

    it(`GIVEN existing 'Work in progress shortcut' is selected WHEN the shortcut has been marked as ready THEN number in 'Ready for publishing' checkbox should be increased by 1`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Open Filter Panel
            await studioUtils.openFilterPanel();
            //2. Click on 'Shortcut' checkbox:
            await filterPanel.clickOnCheckboxInContentTypesBlock("Shortcut");
            await studioUtils.saveScreenshot("shortcut_workflow_aggregation_3");
            //3. Get the number in 'Ready for publishing' checkbox in Filter Panel
            let ready1 = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //4. Click on the row then press on 'Mark as ready' button:
            await contentBrowsePanel.clickOnRowByName(SHORTCUT_NAME);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await contentBrowsePanel.pause(1500);
            await studioUtils.saveScreenshot("shortcut_workflow_aggregation_4");

            //5. Get the number in 'ready for publishing' checkbox in the filter panel
            let ready2 = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //6. Verify that number in 'ready for publishing' is increased by 1
            assert.isTrue(ready2 - ready1 === 1, "Number in 'Ready for publishing' checkbox should be increased");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
