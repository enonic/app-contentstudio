/**
 * Created on 08.11.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('change.display.name.rename.published.content.dialog.spec - tests for Rename published content modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;
    let NEW_NAME = contentBuilder.generateRandomName('folder');

    it('Precondition - new folder should be added and published',
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();
        });

    // Verifies: Modified display name is rolled back after renaming a published content #5403
    // https://github.com/enonic/app-contentstudio/issues/5403
    it("GIVEN display name is modified WHEN the content has been renamed THEN the display name should not be updated after the renaming",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            // 1. Update the display name:
            await contentWizard.typeDisplayName(NEW_NAME);
            // 2. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathButton();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_NAME);
            // 3. Click on 'Rename' button and wait for the dialog is closed:
            await renamePublishedContentDialog.clickOnRenameButton();
            await contentWizard.pause(1200);
            // 4. Verify the display name:
            let actualDisplayName = await contentWizard.getDisplayName();
            assert.equal(actualDisplayName, NEW_NAME, 'Display name should not be rolled back after renaming the content');
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
