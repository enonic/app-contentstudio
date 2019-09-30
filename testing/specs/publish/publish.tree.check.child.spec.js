/**
 * Created on 23.09.2019.
 * verifies : https://github.com/enonic/app-contentstudio/issues/174
 *            Publish Tree action - implement a check for unpublished child items #174
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");

describe('publish.tree.check.child.spec - Publish Tree action - check for unpublished child items`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
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

    it(`GIVEN existing folder with child WHEN parent folder has been published THEN PUBLISH TREE...  should be default action for the parent folder`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(PARENT_FOLDER.displayName);

            //Parent folder has been published:
            await studioUtils.doPublish();
            //PUBLISH TREE... should be default action
            await contentBrowsePanel.waitForDefaultAction(appConstant.PUBLISH_MENU.PUBLISH_TREE);
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
            await contentBrowsePanel.waitForDefaultAction(appConstant.PUBLISH_MENU.UNPUBLISH);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
