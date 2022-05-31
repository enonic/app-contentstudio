/**
 * Created on 16.09.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const DeleteContentDialog = require('../../page_objects/delete.content.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('delete.content.dialog.dependant.list.spec:  tests for Delete Content Dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let DEPENDANT_ITEMS_11 = 11;

    it(`GIVEN a parent folder is selected WHEN 'Delete Content Dialog' has been opened THEN dependant list should be displayed by default`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            //1. Select existing folder with 11 child content
            await studioUtils.findAndSelectItem(appConst.TEST_FOLDER_2_NAME);
            //2. Open Delete content Dialog
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            //3. Verify the number in 'Hide Dependant Items' link
            let result = await deleteContentDialog.getNumberInHideDependantItemsLink();
            assert.equal(result, 11, "Expected number should be displayed in the link");
            //4. Verify the number of dependant items in the list
            let names = await deleteContentDialog.getDependantItemsName();
            assert.equal(names.length, 11, "Expected number of items should be present in the list")
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/3548
    //Scroll bar is not showing in dialogs with dependant items #3548
    it(`GIVEN two parent folders are selected WHEN 'Delete Content Dialog' has been opened THEN dependant list should be displayed by default`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            await studioUtils.findContentAndClickCheckBox(appConst.TEST_FOLDER_WITH_IMAGES_2);
            //Click on 'Archive...' button:
            await contentBrowsePanel.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await studioUtils.saveScreenshot("2_folders_dependant");
            let result = await deleteContentDialog.getNumberInHideDependantItemsLink();
            assert.equal(result, 21, "Expected number should be displayed in the link");
            let names = await deleteContentDialog.getDependantItemsName();
            //TODO uncomment it, when issue#3548 will be fixed
            //assert.equal(names.length, 21, "Expected number of items should be present in the list")
        });

    it(`GIVEN a parent folders(11 child) is opened WHEN 'Delete Content Dialog' has been opened in the wizard THEN expected dependant list should be displayed in the modal dialog`,
        async () => {
            let contentWizard = new ContentWizard();
            let deleteContentDialog = new DeleteContentDialog();
            //1. Open existing folder
            await studioUtils.selectByDisplayNameAndOpenContent(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            //2. Open Delete Dialog in the wizard:
            await contentWizard.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            //3. Verify the number ot items: should be 11
            await studioUtils.saveScreenshot("wizard_folder_11_shown_dependant");
            await deleteContentDialog.waitForNumberInHideDependantItemsLink(DEPENDANT_ITEMS_11);
            let names = await deleteContentDialog.getDependantItemsName();
            assert.equal(names.length, DEPENDANT_ITEMS_11, "Expected number of items should be present in the list");
        });

    it(`GIVEN a parent folders(11 child) is opened WHEN 'Hide Dependant Items' has been clicked THEN 'Show Dependant Items' link gets visible with the expected number`,
        async () => {
            let contentWizard = new ContentWizard();
            let deleteContentDialog = new DeleteContentDialog();
            //1. Open existing folder
            await studioUtils.selectByDisplayNameAndOpenContent(appConst.TEST_FOLDER_2_DISPLAY_NAME);
            //2. Open Delete Dialog in the wizard:
            await contentWizard.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            //4. Click on 'Hide Dependant Items'
            await deleteContentDialog.clickOnHideDependantItemsLink();
            //5. Verify that 'Show Dependant Items' link gets visible with the correct number
            await deleteContentDialog.waitForShowDependantItemsLinkDisplayed();
            await studioUtils.saveScreenshot("wizard_folder_11_dependant");
            let result = await deleteContentDialog.getNumberInShowDependantItemsLink();
            assert.equal(result, DEPENDANT_ITEMS_11, "Expected number should be displayed in the link");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
