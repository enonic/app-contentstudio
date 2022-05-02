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

describe("Tests for updating a number in aggregation checkboxes", function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const TARGET_1 = "whale";
    const SHORTCUT_NAME = contentBuilder.generateRandomName('shortcut');
    const WORKFLOW_AGGREGATION = appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW;

    it(`Preconditions: ready for publishing and work in progress shortcuts should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('sh');
            let shortcutForm = new ShortcutForm();
            let contentWizard = new ContentWizard();
            await studioUtils.openContentWizard(appConst.contentTypes.SHORTCUT);
            await contentWizard.typeDisplayName(displayName);
            await shortcutForm.filterOptionsAndSelectTarget(TARGET_1);
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.doCloseWizardAndSwitchToGrid();

            let displayName2 = contentBuilder.generateRandomName('shortcut');
            let shortcut = contentBuilder.buildShortcut(displayName2, TARGET_1);
            await studioUtils.doAddShortcut(shortcut);
        });

    it(`GIVEN wizard for new shortcut is opened WHEN new 'work in progress' shortcut has been added THEN number in 'Work in progress' checkbox should be increased by 1`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentWizard = new ContentWizard();
            let shortcutForm = new ShortcutForm();
            //1. Open Filter Panel
            await studioUtils.openFilterPanel();
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
            let numberBeforeMarkAsReady = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //4. Click on the row then press on 'Mark as ready' button:
            await contentBrowsePanel.clickOnRowByName(SHORTCUT_NAME);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot("shortcut_workflow_aggregation_4");

            //5. Get the number in 'ready for publishing' checkbox in the filter panel
            let numberAfterMarkAsReady = await filterPanel.getNumberOfItemsInAggregationView(WORKFLOW_AGGREGATION,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //6. Verify that number in 'ready for publishing' is increased by 1
            assert.isTrue(numberBeforeMarkAsReady - numberAfterMarkAsReady === 1,
                "Number in 'Ready for publishing' checkbox should be increased");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
