/**
 * Created on 23.09.2019.
 * verifies : https://github.com/enonic/app-contentstudio/issues/174
 *            Publish Tree action - implement a check for unpublished child items #174
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');

describe('publish.tree.check.child.spec - Publish Tree action - check for unpublished child items`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let PARENT_FOLDER;
    let CHILD_FOLDER;
    it(`Precondition: parent and its child folders should be added`,
        async () => {
            let parentFolder = contentBuilder.generateRandomName('parent');
            let childFolder = contentBuilder.generateRandomName('child');
            PARENT_FOLDER = contentBuilder.buildFolder(parentFolder);
            CHILD_FOLDER = contentBuilder.buildFolder(childFolder);
            await studioUtils.doAddReadyFolder(PARENT_FOLDER);
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            await studioUtils.doAddReadyFolder(CHILD_FOLDER);
        });

    //verifies XP-4754 Publish Dialog - Lazy loader stops loading items after turning "Include child items" off and on again
    it(`GIVEN 'Exclude children' button has been pressed in the 'Publishing Wizard' WHEN 'Publishing Wizard' has been reopened THEN child items should be loaded in the dialog`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            //1. Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            //2. Click on the 'Publish Tree' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnShowDependentItems();
            //3. Get dependent items:
            let items1 = await contentPublishDialog.getDisplayNameInDependentItems();
            await contentPublishDialog.clickOnIncludeChildrenToogler();
            //4. Close the modal dialog
            await contentPublishDialog.clickOnCancelTopButton();
            //5. Click on the 'Publish Tree' menu item and reopen the modal dialog:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH_TREE);
            await contentPublishDialog.clickOnShowDependentItems();
            //6. Get dependent items:
            let items2 = await contentPublishDialog.getDisplayNameInDependentItems();
            //7. Verify that dependent items are equal in both cases:
            assert.equal(items1.length, items2.length, "The numbers of dependant items should be the same");
            assert.equal(items1[0], items2[0], "Display name of items should be equal");

        });

    it(`GIVEN existing folder with child WHEN parent folder has been published THEN PUBLISH TREE...  should be default action for the parent folder`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            //Parent folder has been published:
            await studioUtils.doPublish();
            //PUBLISH TREE... should be default action
            await contentBrowsePanel.waitForDefaultAction(appConst.PUBLISH_MENU.PUBLISH_TREE);
        });

    it(`GIVEN existing folder(PUBLISHED) with child(NEW) WHEN child folder has been published THEN Default action  gets 'UNPUBLISH...'`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(CHILD_FOLDER.displayName);
            //Child folder has been published:
            await studioUtils.doPublish();
            //Select the parent folder:
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);
            //UNPUBLISH... should be default action for the parent folder
            await contentBrowsePanel.waitForDefaultAction(appConst.PUBLISH_MENU.UNPUBLISH);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
