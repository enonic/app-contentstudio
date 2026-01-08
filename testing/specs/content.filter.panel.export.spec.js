/**
 * Created on 19.09.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");
const ConfirmationDialog = require('../page_objects/confirmation.dialog');

describe('content.filter.panel.spec: tests for filter panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const RANDOM_TEXT = appConst.generateRandomName('test');
    const CONFIRMATION_QUESTION_1 = '4 content items will be exported to a CSV file. Do you want to continue?';
    const CONFIRMATION_QUESTION_2 = '5 content items will be exported to a CSV file. Do you want to continue?';
    let CONFIRMATION_QUESTION_NON_FILTERED_GRID;

    it(`GIVEN filter panel is opened WHEN non-existing name has been typed in the search input THEN 'Export' button gets disabled`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Open Filter Panel:
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 2. Verify that Export button is displayed in the filter panel:
            await filterPanel.waitForExportButtonDisplayed();
            // 3. Fill in the search input with the random text (non-existing content)
            await filterPanel.typeSearchText(RANDOM_TEXT);
            await studioUtils.saveScreenshot('export_btn_hidden1');
            // 4. Verify that Export button gets not visible:
            await filterPanel.waitForExportButtonNotDisplayed();
        });

    it(`GIVEN 'Executable' checkbox has been clicked in Filter Panel WHEN 'Export' button has been clicked THEN expected number of items should be displayed in Confirmation dialog`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 1. Click on "Executable" checkbox in Filter Panel
            await filterPanel.clickOnCheckboxInContentTypesBlock('Executable');
            // 2. Click on Export button:
            await filterPanel.clickOnExportButton();
            // 3. Verify the question in the confirmation dialog:
            await confirmationDialog.waitForDialogOpened();
            let questionTextActual = await confirmationDialog.getWarningMessage();
            assert.equal(questionTextActual, CONFIRMATION_QUESTION_1, 'Four content items will be exported');
        });

    it(`GIVEN 'Executable' checkbox has been clicked in Filter Panel WHEN 'Clear filter' button has been clicked THEN the grid returns to the initial state`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // precondition - save the question for the initial grid:
            await filterPanel.clickOnExportButton();
            await confirmationDialog.waitForDialogOpened();
            CONFIRMATION_QUESTION_NON_FILTERED_GRID = await confirmationDialog.getWarningMessage();
            await confirmationDialog.clickOnNoButton();

            // 1. Click on "Executable" checkbox in 'Filter Panel'
            await filterPanel.clickOnCheckboxInContentTypesBlock('Executable');
            // 2. 'Clear filter' button has been clicked
            await filterPanel.clickOnClearLink();
            await filterPanel.waitForClearLinkNotDisplayed();
            await contentBrowsePanel.pause(2000);
            // 3. Click on 'Export' button:
            await filterPanel.clickOnExportButton();
            // 4. Verify the question returns to the state for the initial grid:
            await confirmationDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('export_clear_link_clicked');
            let questionTextActual = await confirmationDialog.getWarningMessage();
            assert.equal(questionTextActual, CONFIRMATION_QUESTION_NON_FILTERED_GRID, 'Expected question should be displayed');
        });

    it(`GIVEN 'Executable' and 'Document' checkboxes have been clicked WHEN 'Export' button has been clicked THEN expected number of items should be displayed in Confirmation dialog`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 1. Click on "Executable" and 'Document' checkboxes in Filter Panel
            await filterPanel.clickOnCheckboxInContentTypesBlock('Executable');
            await filterPanel.clickOnCheckboxInContentTypesBlock('Document');
            // 2. Click on 'Export' button:
            await filterPanel.clickOnExportButton();
            // 3. Verify the question in the confirmation dialog:
            await confirmationDialog.waitForDialogOpened();
            let questionTextActual = await confirmationDialog.getWarningMessage();
            assert.equal(questionTextActual, CONFIRMATION_QUESTION_2, 'Five content items will be exported');
        });

    it(`GIVEN 'Export' button has been clicked WHEN Yes button has been clicked in the modal dialog THEN Confirmation dialog closes, csv file should be saved`,
        async () => {
            let filterPanel = new FilterPanel();
            let contentBrowsePanel = new ContentBrowsePanel();
            let confirmationDialog = new ConfirmationDialog();
            await contentBrowsePanel.clickOnSearchButton();
            await filterPanel.waitForOpened();
            // 1. Click on Export button:
            await filterPanel.clickOnExportButton();
            // 2. Click on 'Yes' button in the Confirmation modal dialog:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            // 3. Verify that the modal dialog is closed:
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('export_csv_saved');
            // 4. Verify that 'Export' button remains visible in Filter Panel
            await filterPanel.waitForExportButtonDisplayed();
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
