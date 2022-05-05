/**
 * Created on 27.04.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");

describe('filter.by.modifier.spec: tests for filter panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

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
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.MODIFIER);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.WORKFLOW);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.CONTENT_TYPES);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LAST_MODIFIED);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.OWNER);
            await filterPanel.waitForAggregationGroupDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.LANGUAGE);
        });

    it(`WHEN just created folder is filtered THEN The number of items in the 'Modifiers' aggregation checkbox should be 1`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Type the name of folder in Filter Input:
            await studioUtils.findAndSelectItem(FOLDER_NAME_1);
            //2. Verify that "Me" checkbox is displayed in 'Modifiers' block in 'Filter Panel'
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.MODIFIER,
                appConst.systemUsersDisplayName.ME);
            //3. Verify that "Anonymous user" checkbox is not displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.MODIFIER,
                appConst.systemUsersDisplayName.ANONYMOUS_USER);
            //4. Get the number in the 'Me' checkbox:
            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView("Modifier",
                appConst.systemUsersDisplayName.ME);
            //5. Verify that the numbers are equal:
            assert.equal(numberInCheckbox, 1, "1 should be displayed in the label checkbox");
        });

    it(`WHEN just created folder is filtered THEN The number of items in the 'Owner' aggregation checkbox should be 1`,
        async () => {
            let filterPanel = new FilterPanel();
            //1. Type the name of folder in Filter Input:
            await studioUtils.findAndSelectItem(FOLDER_NAME_1);
            //2. Verify that "Me" checkbox is displayed in Modifiers block in Filter Panel
            await filterPanel.waitForCheckboxDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.MODIFIER,
                appConst.systemUsersDisplayName.ME);
            //3. Verify that "Anonymous user" checkbox is not displayed in Workflow block in Filter Panel
            await filterPanel.waitForCheckboxNotDisplayed(appConst.FILTER_PANEL_AGGREGATION_BLOCK.MODIFIER,
                appConst.systemUsersDisplayName.ANONYMOUS_USER);
            //4. Get the number in the 'Me' checkbox:
            let numberInCheckbox = await filterPanel.getNumberOfItemsInAggregationView("Owner",
                appConst.systemUsersDisplayName.ME);
            //5. Verify that the numbers are equal:
            assert.equal(numberInCheckbox, 1, "1 should be displayed in the label checkbox");
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });

});
