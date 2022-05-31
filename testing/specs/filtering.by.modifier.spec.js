/**
 * Created on 27.04.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");

describe('filter.by.modifier.spec: tests for filter panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let FOLDER_NAME_1 = contentBuilder.generateRandomName('folder');

    it(`Preconditions: new folder with 'English (en)' should be added`,
        async () => {
            //1. Create new folder with 'English (en)' language:
            let folder = contentBuilder.buildFolder(FOLDER_NAME_1, appConst.LANGUAGES.EN);
            await studioUtils.doAddFolder(folder);
        });

    it(`WHEN Filter Panel is opened THEN expected aggregation groups should be present`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Open Filter Panel:
            await studioUtils.openFilterPanel();
            //2. Verify that  Content Type, Workflow, Modifier, Owner, Last Modified, Language aggregation groups are displayed:
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.CONTENT_TYPES);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.OWNER);
            //await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LANGUAGE);
        });

    it(`WHEN just created folder is filtered THEN The number of items in the 'Last Modified By' aggregation checkbox should be 1`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Type the name of folder in Filter Input:
            await studioUtils.findAndSelectItem(FOLDER_NAME_1);
            //2. Verify that "Me" checkbox is displayed in 'Last Modified By' block in 'Filter Panel'
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY,
                appConst.systemUsersDisplayName.ME);
            //3. Verify that "Anonymous user" checkbox is not displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW,
                appConst.systemUsersDisplayName.ANONYMOUS_USER);
            //4. Get the number in the 'Me' checkbox:
            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY,
                appConst.systemUsersDisplayName.ME);
            //5. Verify that the numbers are equal:
            assert.equal(numberInCheckbox, 1, "1 should be displayed in 'Last Modified By' checkbox");
        });

    it(`WHEN just created folder is filtered THEN The number of items in the 'Owner' aggregation checkbox should be 1`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Type the name of folder in Filter Input:
            await studioUtils.findAndSelectItem(FOLDER_NAME_1);
            //2. Verify that "Me" checkbox is displayed in 'Last Modified By' block in Filter Panel
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY,
                appConst.systemUsersDisplayName.ME);
            //3. Verify that "Anonymous user" checkbox is not displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED_BY,
                appConst.systemUsersDisplayName.ANONYMOUS_USER);
            //4. Get the number in the 'Me' checkbox:
            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView("Owner",
                appConst.systemUsersDisplayName.ME);
            //5. Verify that the numbers are equal:
            assert.equal(numberInCheckbox, 1, "1 should be displayed in 'Owner' checkbox");
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