/**
 * Created on 31.05.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentDuplicateDialog = require('../page_objects/content.duplicate.dialog');
const contentBuilder = require("../libs/content.builder");

describe('content.duplicate.spec: Select and duplicate 2 folders', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let folder1;
    let folder2;

    it(`Preconditions: two folders should be added`,
        async () => {
            let displayName1 = contentBuilder.generateRandomName('folder');
            let displayName2 = contentBuilder.generateRandomName('folder');
            folder2 = contentBuilder.buildFolder(displayName2);
            folder1 = contentBuilder.buildFolder(displayName1);
            await studioUtils.doAddFolder(folder1);
            await studioUtils.doAddFolder(folder2);
        });

    //verifies - https://github.com/enonic/app-contentstudio/issues/1015  Duplicate button does not contain a number of content to duplicate
    it(`GIVEN two folders are checked WHEN 'Duplicate Dialog' has been opened THEN expected number(2) should be present in the Duplicate button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            //Click on Duplicate... button in the toolbar:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            studioUtils.saveScreenshot("2_folders_to_duplicate");
            let result = await contentDuplicateDialog.getTotalNumberItemsToDuplicate();
            assert.equal(result, '2', "Expected number of content (2) should be present in the Duplicate button");
        });

    it(`GIVEN two folders are checked AND 'Duplicate Dialog' is opened WHEN 'Duplicate' button on the modal dialog has been pressed THEN '2 items are duplicated' message should appear`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentDuplicateDialog = new ContentDuplicateDialog();
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            //Click on Duplicate... button in the toolbar:
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            studioUtils.saveScreenshot("folders_to_duplicate");
            //Click on Duplicate button in the dialog:
            await contentDuplicateDialog.clickOnDuplicateButton();
            let result = await contentBrowsePanel.waitForNotificationMessage();
            studioUtils.saveScreenshot("folders_were_duplicated2");
            assert.equal(result, '2 items are duplicated.', 'Expected notification message should be displayed');
        });

    it(`WHEN two folders have been duplicated THEN 2 copies should be present in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.typeNameInFilterPanel(folder1.displayName + '-copy');
            await contentBrowsePanel.waitForContentDisplayed(folder1.displayName + '-copy');
            await studioUtils.typeNameInFilterPanel(folder2.displayName + '-copy');
            let name = folder2.displayName + '-copy';
            await contentBrowsePanel.waitForContentDisplayed(name);
            let state = await contentBrowsePanel.getWorkflowStateByName(name);
            //duplicated content should have the same state as the target content:
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS);
        });

    it(`WHEN 'Published' folder has been duplicated THEN copy should be 'Ready for publishing'`,
        async () => {
            let contentDuplicateDialog = new ContentDuplicateDialog();
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(folder1.displayName);
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            //Publish the folder:
            await studioUtils.doPublish();
            await contentBrowsePanel.clickOnDuplicateButtonAndWait();
            await contentDuplicateDialog.clickOnDuplicateButton();
            await contentDuplicateDialog.waitForDialogClosed();
            //Do filter the second copy of the folder:
            await studioUtils.typeNameInFilterPanel(folder1.displayName + '-copy-2');
            let state = await contentBrowsePanel.getWorkflowStateByName(folder1.displayName + '-copy-2');
            //duplicated folder should be 'Ready for publishing':
            assert.equal(state, appConstant.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
