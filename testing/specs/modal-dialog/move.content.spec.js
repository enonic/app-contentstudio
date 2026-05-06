/**
 * Created on 24.01.2022 updated on 29.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('move.content.spec: Tests for destination options in move dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const TEST_FOLDER_NAME = appConst.TEST_FOLDER_WITH_IMAGES_NAME;
    const TEST_FOLDER_DISPLAY_NAME = appConst.TEST_DATA.TEST_FOLDER_IMAGES_1_DISPLAY_NAME;

    it(`GIVEN existing folder is selected AND 'Move' button pressed WHEN own name of the folder has been typed THEN all options should be disabled in the selector`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select a folder with child items:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            // 2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. type the name of the same folder
            await moveContentDialog.typeTextInOptionFilterInput(TEST_FOLDER_NAME);
            await moveContentDialog.pause(500);
            // Verify - unable to move folder to itself:
            let isDisabled = await moveContentDialog.isOptionRowDisabled(TEST_FOLDER_DISPLAY_NAME);
            await moveContentDialog.clickOnDropdownHandle();
            await moveContentDialog.clickOnCloseButton();
            await moveContentDialog.waitForClosed();
            assert.ok(isDisabled, 'Dropdown option should be disabled');
        });

    it(`GIVEN existing folder in the root is selected WHEN move combobox has been expanded THEN 'Project root' option should be disabled`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select a folder in root:
            await studioUtils.findAndSelectItem(TEST_FOLDER_NAME);
            // 2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Click on dropdown handle and expand options in move content dialog:
            await moveContentDialog.clickOnDropdownHandle();
            // 4. Verify - 'Project root' option item is disabled:
            let result = await moveContentDialog.isOptionRowDisabled('Project root');
            await moveContentDialog.clickOnCloseButton();
            await moveContentDialog.waitForClosed();
            assert.ok(result, "'Project root' option should be disabled");

        });

    it(`WHEN existing image in its parent folder is selected AND 'Move' button pressed THEN 'Project root' option should be enabled in Move dropdown`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select an image in the test folder:
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.ENTERPRISE);
            // 2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Click on dropdown handle and expand options in move content dialog:
            await moveContentDialog.clickOnDropdownHandle();
            // 4. Verify - 'Project root' option item should be enabled:
            let result = await moveContentDialog.isOptionRowDisabled('Project root');
            assert.ok(result === false, "'Project root' option should be enabled");
            await studioUtils.saveScreenshot('move_dlg_project_root');
            // 5. Expand dropdown and select 'Project root' option, verify Move gets enabled:
            await moveContentDialog.clickOnOptionInDropdown('Project root');
            await moveContentDialog.waitForMoveButtonEnabled();
        });

    // verifies: Incorrect filtering of options when parent and its child are selected for moving
    it(`GIVEN parent folder and its child are selected AND 'Move' button has been pressed WHEN name of the parent folder has been typed THEN all options should be disabled in the selector`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select a folder with child items:
            await studioUtils.findContentAndClickCheckBox(TEST_FOLDER_DISPLAY_NAME);
            await contentBrowsePanel.clickOnExpanderIcon(TEST_FOLDER_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            // 2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Fill in the options filter input:
            await moveContentDialog.typeTextInOptionFilterInput(TEST_FOLDER_DISPLAY_NAME);
            await moveContentDialog.pause(500);
            // 4. Verify - unable to move a folder to itself:
            let isDisabled = await moveContentDialog.isOptionRowDisabled(TEST_FOLDER_DISPLAY_NAME);
            assert.ok(isDisabled, "the option should be disabled in the dropdown");
            isDisabled = await moveContentDialog.isOptionRowDisabled(appConst.TEST_IMAGES.CAPE);
            assert.ok(isDisabled, "the option should be disabled in the dropdown");
        });

    it.skip(`GIVEN parent folder and its child are selected AND 'Move' button has been pressed WHEN name of another existing folder has been typed THEN the option should be enabled in the selector`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select a folder with child items:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            // 2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Insert the folder name in  the options filter input:
            await moveContentDialog.typeTextInOptionFilterInput(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            await moveContentDialog.pause(500);
            // 4. Verify - it possible to move 2 items(folder and its child item) to another folder:
            let isDisabled = await moveContentDialog.isOptionRowDisabled(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            assert.ok(isDisabled === false, "The option should be enabled in the dropdown");
        });

    it(`GIVEN Move dialog is opened WHEN dropdown handle button has been pressed THEN expected options should be loaded`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Select a folder with child items:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_WITH_IMAGES);
            // 2. Open 'Move' dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            // 3. Click on dropdown handle button:
            await moveContentDialog.clickOnDropdownHandle();
            await moveContentDialog.pause(500);
            await studioUtils.saveScreenshot('move_dropdown_handle_1');
            let options = await moveContentDialog.getOptionsName();
            assert.ok(options.length > 1, "Dropdown should be expanded");
            assert.ok(options.includes("All Content types images"), "Expected option should be displayed");
            // 4. Click on Cancel top button
            await moveContentDialog.clickOnCloseButton();
            // 5. Verify that the modal dialog is closed
            await moveContentDialog.waitForClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach( async() => {
        let moveContentDialog = new MoveContentDialog();
        let result = await moveContentDialog.isOpened();
        if(result){
            await moveContentDialog.clickOnCloseButton();
            await moveContentDialog.waitForClosed();
        }
        await studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
