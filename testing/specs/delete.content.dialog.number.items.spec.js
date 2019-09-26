/**
 * Created on 26.09.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const PublishContentDialog = require('../page_objects/content.publish.dialog');
const contentBuilder = require("../libs/content.builder");

describe('delete.content.dialog.number.items.spec: Select and open delete dialog for  2 folders', function () {
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

    //verifies - https://github.com/enonic/app-contentstudio/issues/1032  Delete button is missing a number of items to delete
    it(`GIVEN two folders are checked WHEN 'Delete Content Dialog' has been opened THEN expected number(2) should be present in the Delete button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let deleteContentDialog = new DeleteContentDialog();
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            //Click on Delete... button in the toolbar:
            await contentBrowsePanel.clickOnDeleteButton();
            await deleteContentDialog.waitForDialogOpened();
            studioUtils.saveScreenshot("2_folders_to_delete");
            let result = await deleteContentDialog.getTotalNumberItemsToDelete();
            assert.equal(result, '2', "Expected number of content (2) should be present in the Delete button");
        });

    it(`GIVEN two folders are checked WHEN 'Publish Content Dialog' has been opened THEN expected number(2) should be present in the Publish button`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let publishContentDialog = new PublishContentDialog();
            await studioUtils.findContentAndClickCheckBox(folder1.displayName);
            await studioUtils.findContentAndClickCheckBox(folder2.displayName);
            //Click on Delete... button in the toolbar:
            await contentBrowsePanel.clickOnMarkAsReadyButtonAndConfirm();
            await contentBrowsePanel.clickOnPublishButton();
            await publishContentDialog.waitForDialogOpened();
            studioUtils.saveScreenshot("2_folders_to_publish");
            let result = await publishContentDialog.getNumberItemsToPublish();
            assert.equal(result, '2', "Expected number of content (2) should be present in the 'Publish now' button");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
