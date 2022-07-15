/**
 * Created on 27.04.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../libs/content.builder");
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");
const ContentPublishDialog = require('../page_objects/content.publish.dialog');

describe('filtering.by.workflow.spec: tests for filter panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let FOLDER_NAME_1 = contentBuilder.generateRandomName('folder');

    it(`WHEN existing 'work in progress' folder is filtered THEN The number of items in the grid and number in the 'work in progress' aggregation should be equal`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let folder = contentBuilder.buildFolder(FOLDER_NAME_1);
            await studioUtils.doAddFolder(folder);
            //1. Type the name of folder in Filter Input:
            await studioUtils.findAndSelectItem(folder.displayName);
            //2. Verify that "Work in progress" checkbox is displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            //3. Verify that "Ready for publishing" checkbox is not displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //5. Get the number in the 'Work in progress' checkbox:
            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView("Workflow",
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            //6. Get the number of items in the grid
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            //7. Verify that the numbers are equal:
            assert.equal(numberInCheckbox, items.length,
                "The number of items in the grid must be the same as the number in the label in Filter Panel");
        });

    it.skip(`GIVEN existing 'work in progress' folder is filtered WHEN the folder has been marked as ready THEN The number of items in the grid and number in the 'Ready for publishing' aggregation should be equal`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select the folder
            await studioUtils.findAndSelectItem(FOLDER_NAME_1);
            //3. Click on "Mark as Ready" button in Browse toolbar:
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot("filtered_by_workflow_content_published");
            //4. Verify that "Work in progress" checkbox gets not visible in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            //5. Verify that "Ready for publishing" checkbox is displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //6. Get the number in the aggregation checkbox:
            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView("Workflow",
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            //7. Get the number of items in the grid"
            let items = await contentBrowsePanel.getDisplayNamesInGrid();
            //8. Verify that the numbers are equal:
            assert.equal(numberInCheckbox, items.length,
                "The number of items in the grid must be the same as the number in the label in Filter Panel");
        });

    it.skip(`GIVEN existing 'ready for publishing' folder is filtered WHEN the folder has been published THEN The number in the 'ready for publishing' aggregation should not be updated`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select 'ready for publishing' folder and publish it:
            await studioUtils.findAndSelectItem(FOLDER_NAME_1);
            await contentBrowsePanel.clickOnPublishButton();
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot("filtered_by_workflow_content_published");
            //2. Verify that "Work in progress" checkbox remains not visible in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.WORKFLOW_STATE.WORK_IN_PROGRESS);
            //5. Verify that "Ready for publishing" checkbox is displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);

            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView("Workflow",
                appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
            assert.equal(numberInCheckbox,1,"1 item should be displayed in the label checkbox");
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
