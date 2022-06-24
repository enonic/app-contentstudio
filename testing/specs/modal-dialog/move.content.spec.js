/**
 * Created on 24.01.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const MoveContentDialog = require('../../page_objects/browsepanel/move.content.dialog');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('move.content.spec: Tests for destination options in move dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    it(`GIVEN existing folder is selected AND 'Move' button pressed WHEN own name of the folder has been typed THEN all options should be disabled in the selector`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select a folder with children:
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            //2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            //3.
            await moveContentDialog.typeTextInOptionFilterInput(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await moveContentDialog.pause(500);
            //Verify - unable to move folder to itself:
            let result = await moveContentDialog.isDestinationDisabled(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.isTrue(result, "Option should be disabled");
        });

    //verifies: Incorrect filtering of options when parent and its child are selected for moving
    it(`GIVEN parent folder and its child are selected AND 'Move' button has been pressed WHEN name of the parent folder has been typed THEN all options should be disabled in the selector`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select a folder with children:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            //2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            //3. Fill in the options filter input:
            await moveContentDialog.typeTextInOptionFilterInput(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await moveContentDialog.pause(500);
            //4. Verify - unable to move folder to itself:
            let isDisabled = await moveContentDialog.isDestinationDisabled(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            assert.isTrue(isDisabled, "the option should be disabled");
            isDisabled = await moveContentDialog.isDestinationDisabled(appConst.TEST_IMAGES.CAPE);
            assert.isTrue(isDisabled, "the option should be disabled");
        });

    it(`GIVEN parent folder and its child are selected AND 'Move' button has been pressed WHEN name of another existing folder has been typed THEN the option should be enabled in the selector`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select a folder with children:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_WITH_IMAGES);
            await contentBrowsePanel.clickOnExpanderIcon(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
            await contentBrowsePanel.clickOnCheckboxAndSelectRowByName(appConst.TEST_IMAGES.CAPE);
            //2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            //3. Fill in the options filter input:
            await moveContentDialog.typeTextInOptionFilterInput(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            await moveContentDialog.pause(500);
            //4. Verify - unable to move folder to itself:
            let isDisabled = await moveContentDialog.isDestinationDisabled(appConst.TEST_FOLDER_WITH_IMAGES_NAME_2);
            assert.isFalse(isDisabled, "The option should be enabled");
        });

    it(`GIVEN Move dialog is opened WHEN dropdown handle button has been pressed THEN expected options should be loaded`,
        async () => {
            let moveContentDialog = new MoveContentDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            //1. Select a folder with children:
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_WITH_IMAGES);
            //2. Open Move dialog:
            await contentBrowsePanel.clickOnMoveButton();
            await moveContentDialog.waitForOpened();
            //3. Click on dropdown handle button:
            await moveContentDialog.clickOnDropdownHandle();
            await moveContentDialog.pause(500);
            await studioUtils.saveScreenshot("move_dropdown_handle");
            let options = await moveContentDialog.getOptionsName();
            assert.isAbove(options.length, 0, "Droppdown should be expanded");
            //4. Click on Cancel top button
            await moveContentDialog.clickOnCancelTopButton();
            //5. Verify that the modal dialog is closed
            await moveContentDialog.waitForClosed();
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
