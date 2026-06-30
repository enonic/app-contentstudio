/**
 * Created on 05.07.2019. updated on 10.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const SortContentDialog = require('../../page_objects/browsepanel/sort.content.dialog');
const studioUtils = require('../../libs/studio.utils.js');
const appConst = require('../../libs/app_const');
const ContentWizardPanel = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('sort.content.dialog.manually.sorted.spec, sorts a folder(with child items) and checks the sort-icon in content grid',
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        if (typeof browser === 'undefined') {
            webDriverHelper.setupBrowser();
        }

        it(`GIVEN 'Sort Content' dialog is opened WHEN 2 items have been swapped in the dialog-grid THEN 'Manually sorted' type should be displayed in the dialog`,
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let sortContentDialog = new SortContentDialog();
                await contentBrowsePanel.waitForSpinnerNotVisible(appConst.mediumTimeout);
                // 1. Select the folder with child items and open sort-dialog:
                await contentBrowsePanel.clickOnRowByDisplayName(appConst.TEST_FOLDER_WITH_IMAGES);
                await contentBrowsePanel.clickOnSortButton();
                await sortContentDialog.waitForDialogVisible();
                await sortContentDialog.pause(2000);
                await sortContentDialog.swapItems(appConst.TEST_IMAGES.CAPE, appConst.TEST_IMAGES.RENAULT);
                // 2. 'Manually sorted' menu item has been clicked:
                await studioUtils.saveScreenshot('sort_dialog_items_swapped');
                // 3. Save the sorting and close the dialog:
                let actualOrder = await sortContentDialog.getSelectedOrder();
                await studioUtils.saveScreenshot('manually_sorted');
                assert.equal(actualOrder, "Manually sorted", "Manually sorted  sort type should be displayed ");
            });

        // Verify the bug New content is added into the end of the tree list #10922
        it(`WHEN new folder has been created THEN it is added to the firs place in the root`,
            async () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let contentWizardPanel = new ContentWizardPanel();
                // 1. Open the folder-wizard:
                await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
                let displayName = appConst.generateRandomName('folder')
                await contentWizardPanel.typeDisplayName(displayName);
                await contentWizardPanel.waitAndClickOnSave();
                await contentWizardPanel.waitForNotificationMessage();
                await studioUtils.doCloseWizardAndSwitchToGrid();
                let result =  await contentBrowsePanel.getContentNamesInGrid();
                assert.equal(result[0], displayName, "New folder should be added to the first place in the root");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
        before(async () => {
            if (typeof browser !== 'undefined') {
                await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
            }
            return console.log('specification starting: ' + this.title);
        });
    });
