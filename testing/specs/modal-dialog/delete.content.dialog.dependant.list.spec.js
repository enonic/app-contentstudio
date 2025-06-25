/**
 * Created on 16.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('delete.content.dialog.dependant.list.spec:  tests for Delete Content Dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let DEPENDANT_ITEMS_11 = 11;

    it(`GIVEN a parent folder is selected WHEN 'Delete Content Dialog' has been opened THEN dependant list should be displayed by default`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            // 1. Select existing folder with 11 child content
            await studioUtils.findAndSelectItem(appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_NAME);
            // 2. Open Delete content Dialog
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            // 3. Verify that 'Dependants' header is displayed:
            await deleteContentDialog.waitForDependantsHeaderDisplayed();
            // 4. Verify the number of dependant items in the list
            let names = await deleteContentDialog.getDependantItemsName();
            assert.equal(names.length, 11, "Expected number of items should be present in the list");
            let result = await deleteContentDialog.getNumberInArchiveButton();
            assert.equal(result, '12', '12 should be displayed in the Archive button');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/3548
    // Scroll bar is not showing in dialogs with dependant items #3548
    it(`GIVEN two parent folders are selected WHEN 'Delete Content Dialog' has been opened THEN dependant list should be displayed by default`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_DISPLAY_NAME);
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_DATA.FOLDER_WITH_IMAGES_2_DISPLAY_NAME);
            // Click on 'Delete...' button:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot('2_folders_dependant');
            let result = await deleteContentDialog.getDependantItemsName();
            assert.equal(result.length, 21, "Expected list of dependent items should be displayed");
            // Verify the total number of items to delete
            let numberInArchiveButton = await deleteContentDialog.getNumberInArchiveButton();
            assert.equal(numberInArchiveButton, '23', '23 should be displayed in the Archive button');
        });

    it(`GIVEN a parent folders(11 child) is opened WHEN 'Delete Content Dialog' has been opened in the wizard THEN expected dependant list should be displayed in the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let deleteContentDialog = new DeleteContentDialog();
            //1. Open existing folder
            await studioUtils.selectByDisplayNameAndOpenContent(appConst.TEST_DATA.SELENIUM_TESTS_FOLDER_DISPLAY_NAME);
            //2. Open Delete content Dialog in the wizard:
            await contentWizard.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            //3. Verify the number ot items: should be 11
            await studioUtils.saveScreenshot('wizard_folder_11_shown_dependant');
            let names = await deleteContentDialog.getDependantItemsName();
            assert.equal(names.length, DEPENDANT_ITEMS_11, "Expected number of dependent items should be present in the list");
            let numberInArchiveButton = await deleteContentDialog.getNumberInArchiveButton();
            assert.equal(numberInArchiveButton, '12', "12 should be displayed in the 'Archive' button");
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
