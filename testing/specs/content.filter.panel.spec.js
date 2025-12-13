/**
 * Created on 15.01.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");

describe('content.filter.panel.spec: tests for filter panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let FOLDER_NAME = contentBuilder.generateRandomName('folder');

    it(`WHEN an aggregation checkbox has been clicked in Filter Panel THEN The number of items in the grid must be the same as the number in the checkbox-label in Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 1. Click on "Executable" checkbox in Filter Panel
            await filterPanel.clickOnCheckboxInContentTypesBlock('Executable');
            // 2. Get the number in the aggregation checkbox:
            let numberItems = await filterPanel.getNumberOfItemsInAggregationView('Content Types', 'Executable', true);
            // 3. Get the number of items in the grid
            let itemsInGrid = await contentBrowsePanel.getDisplayNamesInGrid();
            // 4. Verify that the numbers are equal:
            assert.equal(parseInt(numberItems), itemsInGrid.length,
                "The number of items in the grid must be the same as the number in the label in Filter Panel");
        });

    it(`GIVEN an aggregation checkbox has been clicked WHEN 'Clear' button has been clicked THEN the grid returns to the initial state`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 1. Click on "Executable" checkbox in 'Filter Panel'
            await filterPanel.clickOnCheckboxInContentTypesBlock("Executable");
            await contentBrowsePanel.waitForContentDisplayed(appConst.EXECUTABLE_TEST_CONTENT.SERVER);
            let items1 = await contentBrowsePanel.getDisplayNamesInGrid();
            // 2. Click on 'Clear' link:
            await filterPanel.clickOnClearLink();
            await filterPanel.waitForClearLinkNotDisplayed();
            await contentBrowsePanel.pause(2000);
            await studioUtils.saveScreenshot('clear_link_clicked');
            // 3. Get the number of items in the grid
            let items2 = await contentBrowsePanel.getDisplayNamesInGrid();
            // 4. the grid returns to the initial state
            assert.ok(items2.length > items1.length, 'Grid should return to the initial state');
        });

    it(`WHEN new folder has been saved THEN number of folders should be increased in the Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel:
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 2. Get the number in in Folder aggregation checkbox in Filter Panel
            let number1 = await filterPanel.getNumberOfItemsInFolderAggregation();
            // 3. Open new folder wizard and save the folder:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(FOLDER_NAME);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForSavedButtonVisible();
            // 4. Switch to Browse Panel and verify that number in the aggregation checkbox is updated:
            await studioUtils.doSwitchToContentBrowsePanel();
            let number2 = await filterPanel.getNumberOfItemsInFolderAggregation();
            assert.equal(number2 - number1, 1, "Number of folders should be increased in the Filter Panel");
        });

    it(`GIVEN 'Filter Panel' is opened WHEN folder name has been typed in 'Search Input' THEN only Folder aggregation entry remains visible in Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel:
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 2. Verify that more than one entry is present in the panel
            let contentTypes1 = await filterPanel.geContentTypes();
            assert.ok(contentTypes1.length > 1, "More than one content type should be present in the Filter Panel");
            // 3. Type the folder-name in Search Input
            await filterPanel.typeSearchText(FOLDER_NAME);
            await contentBrowsePanel.pause(2000);
            // 4. Verify that only Folder aggregation entry remains visible in Filter Panel:
            let contentTypes2 = await filterPanel.geContentTypes();
            assert.equal(contentTypes2.length, 1, "One content type should be present in the Filter Panel");
        });

    it(`GIVEN 'Filter Panel' is opened WHEN folder name has been typed in 'Search Input' THEN expected timestamps should be present in Last Modified view in Filter Panel`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel:
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 2. Type the folder-name in Search Input
            await filterPanel.typeSearchText(FOLDER_NAME);
            await contentBrowsePanel.pause(2000);
            await studioUtils.saveScreenshot('filter_panel_last_modified');
            // 3. expected timestamps should be present in 'Last Modified' view in Filter Panel
            let countInWeek = await filterPanel.getLastModifiedCount(appConst.LAST_MODIFIED_ENTRY.WEEK);
            let countInDay = await filterPanel.getLastModifiedCount(appConst.LAST_MODIFIED_ENTRY.DAY);
            let countInHour = await filterPanel.getLastModifiedCount(appConst.LAST_MODIFIED_ENTRY.HOUR);
            assert.equal(countInWeek, '1', "Expected count should be present in 'Week'");
            assert.equal(countInHour, '1', "Expected count should be present in 'hour'");
            assert.equal(countInDay, '1', "Expected count should be present in 'Day'");
        });

    // verifies the "XP-3586(old) Content not correctly filtered, when filter panel has been hidden"
    it(`GIVEN folder name has been typed in Search Input WHEN Filter Panel has been closed AND new folder has been added THEN new added folder should not be present in the filtered grid`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel:
            await contentBrowsePanel.clickOnSearchButton();
            // 2. Type the folder-name in Search Input
            await filterPanel.typeSearchText(FOLDER_NAME);
            await contentBrowsePanel.pause(2000);
            // 3. Close the Filter Panel:
            await contentBrowsePanel.clickOnHideSearchPanelButton();
            await studioUtils.saveScreenshot('filter_panel_hidden');
            // 4. Grid is filtered, add new folder-content:
            let displayName = contentBuilder.generateRandomName('folder');
            let folder = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(folder);
            await contentBrowsePanel.pause(2000);
            // 5. Verify that number of content is not updated in the filtered grid:
            let result = await contentBrowsePanel.getDisplayNamesInGrid();
            assert.equal(result.length, 1, "The Number of content items should not be updated")
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
