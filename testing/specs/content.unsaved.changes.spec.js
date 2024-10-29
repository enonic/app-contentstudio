/**
 * Created on 16.01.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentBuilder = require("../libs/content.builder");
const studioUtils = require('../libs/studio.utils.js');
const ContentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');

describe('content.unsaved.changes.spec: tests for unsaved changes in wizard + tests for deleting multiselect content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let folder1;
    let folder2;
    it(`Precondition:two folders has been added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            await studioUtils.doAddFolder(folder1);
            await studioUtils.doAddFolder(folder2);
        });

    //verifies :
    // 1) xp-apps#398 Buttons remain enabled in the grid toolbar after deleting 2 content.
    // 2) https://github.com/enonic/lib-admin-ui/issues/1273  Browse toolbar is not updated after deleting filtered content
    it(`GIVEN two folders(New) in the root directory WHEN both folders have been selected and deleted THEN 'Archive...' button gets disabled`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.typeNameInFilterPanel(folder1.displayName);
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(folder1.displayName);
            // 1. Select the first folder:
            await studioUtils.typeNameInFilterPanel(folder2.displayName);
            await contentBrowsePanel.pause(1000);
            // 2. Select the second folder:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(folder2.displayName);
            // 3. Delete folders:
            await studioUtils.doDeleteNowAndConfirm(2);
            // 4. Delete button should be disabled now:
            await contentBrowsePanel.waitForArchiveButtonDisabled();
        });

    it(`GIVEN there are not saved changes in the wizard WHEN 'Delete' menu item has been clicked THEN the wizard should be closed and the content is deleted`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 1. Fill in the name input
            await contentWizard.typeDisplayName(appConst.generateRandomName("folder"));
            // 2. Open Delete/Archive content dialog
            await contentWizard.clickOnArchiveButton();
            await deleteContentDialog.waitForDialogOpened();
            await deleteContentDialog.waitForSpinnerNotVisible();
            // 3. Click on 'Delete' menu item:
            await deleteContentDialog.clickOnDeleteMenuItem();
            // 4. Verify that Alert does not appear in the wizard:
            let result = await contentWizard.isAlertOpen();
            if (result) {
                await contentWizard.dismissAlert();
            }
            assert.ok(result === false, "Alert should not appear after trying to delete the wizard with unsaved changes");
            await studioUtils.doSwitchToContentBrowsePanel();
            await contentBrowsePanel.pause(2000);
        });

    it.skip(
        `GIVEN there are not saved changes in the wizard WHEN Close icon has been pressed AND 'Leave' button has been pressed THEN the wizard should be closed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentWizard = new ContentWizard();
            let folderName = appConst.generateRandomName("folder");
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            // 1. Fill in the name input
            await contentWizard.typeDisplayName(folderName);
            // 2. Click on 'Close tab' icon:
            await contentWizard.clickOnCloseBrowserTab();
            await contentWizard.pause(500);
            // 3. Verify that Alert appears in the wizard:
            let result = await contentWizard.isAlertOpen();
            if (result) {
                await contentWizard.acceptAlert();
            }
            assert.ok(result, "Alert should appear after trying to close the wizard with unsaved changes");
            await studioUtils.doSwitchToContentBrowsePanel();
            let contentFilterPanel = new ContentFilterPanel();
            // 4. Open Filter Panel and type the name of folder
            await studioUtils.openFilterPanel();
            await contentFilterPanel.typeSearchText(folderName);
            // 5. Verify that content with that name does not exist (has not been saved)
            await contentBrowsePanel.waitForContentNotDisplayed(folderName);
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
