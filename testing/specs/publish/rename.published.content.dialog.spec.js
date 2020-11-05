/**
 * Created on 04.11.2020.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('rename.published.content.dialog.spec - tests for Rename published content modal dialog', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;
    let NEW_PATH = contentBuilder.generateRandomName('folder');

    it("Precondition - folder should be added and published",
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddReadyFolder(TEST_FOLDER);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.doPublish();
        });

    it("GIVEN existing 'published' folder is opened WHEN 'Click to modify path' icon has been clicked THEN 'Rename published content' dialog should be loaded",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathIcon();
            let title = await renamePublishedContentDialog.getDialogTitle();
            assert.equal(title, "Rename published content", "Expected title should be in the dialog");
            let path = await renamePublishedContentDialog.getPath();
            assert.equal(path, "/" + TEST_FOLDER.displayName, "Expected path should be in the dialog");
        });

    it("GIVEN 'Rename published content' dialog is opened WHEN new path has been typed THEN 'Rename' button gets enabled",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathIcon();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_PATH);
            //2. Verify that Rename button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
        });

    it("GIVEN new path has been typed in the modal dialog WHEN 'Cancel' button has been clicked THEN path should not be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathIcon();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_PATH);
            //2. Verify that 'Rename' button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
            await renamePublishedContentDialog.clickOnCancelButton();
            await renamePublishedContentDialog.waitForDialogClosed();
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, TEST_FOLDER.displayName, "Path in wizard page should not be updated");
            //3. Verify that 'modify path' icon is visible after canceling the modal dialog:
            await contentWizard.waitForModifyPathIconDisplayed();
        });

    it("GIVEN new path has been typed in the modal dialog WHEN 'Rename' button has been clicked THEN path should be updated in wizard page",
        async () => {
            let contentWizard = new ContentWizard();
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //1. Click on 'Modify path icon' and open the modal dialog:
            let renamePublishedContentDialog = await contentWizard.clickOnModifyPathIcon();
            await renamePublishedContentDialog.typeInNewNameInput(NEW_PATH);
            //2. Verify that 'Rename' button gets enabled:
            await renamePublishedContentDialog.waitForRenameButtonEnabled();
            await renamePublishedContentDialog.clickOnRenameButton();
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, NEW_PATH, "Path in wizard page should be updated");
            //3. Verify that 'modify path' icon gets not visible in wizard page after updating the path:
            await contentWizard.waitForModifyPathIconNotDisplayed();
            //4. Verify that content's status gets 'Moved'
            await contentWizard.waitForContentStatus(appConst.CONTENT_STATUS.MOVED);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
