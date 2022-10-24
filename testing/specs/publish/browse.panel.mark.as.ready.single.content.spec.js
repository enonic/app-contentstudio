/**
 * Created on 09.09.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');

describe('browse.panel.mark.as.ready.single.content.spec - tests for Request Publishing and Publish menu items', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    let TEST_FOLDER;

    it("WHEN 'Work in progress' folder is selected AND 'Publish...' menu item has been clicked THEN publishing wizard should be opened AND the folder is Work in progress",
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let name = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(name);
            //1. 'Work in progress' folder has been added:
            await studioUtils.doAddFolder(TEST_FOLDER);
            //2. Click on checkbox and select the folder:
            await studioUtils.findContentAndClickCheckBox(name);
            //3. Click on 'Publish...' menu item
            await contentBrowsePanel.openPublishMenuSelectItem("Publish...");
            //4. Verify that Publishing wizard is opened:
            await contentPublishDialog.waitForDialogOpened();
            //5. Expand the menu and make the folder 'Ready to publishing'
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            let state = await contentPublishDialog.getWorkflowState(name);
            studioUtils.saveScreenshot("content_gets_ready_to_publish");
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING, "The content gets 'Ready for publishing'");
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/2736
    //"Request Publishing" wizard is missing "Mark as ready" menu action #2736
    it(`WHEN 'Work in progress' folder is selected AND 'Request Publishing...' menu item has been clicked THEN request publish dialog should be opened AND the folder gets Ready to publish`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let name = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(name);
            // 1. 'Work in progress' folder has been added:
            await studioUtils.doAddFolder(TEST_FOLDER);
            //2. Click on checkbox and select the folder
            await studioUtils.findContentAndClickCheckBox(name);
            //3. Click on 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);
            //4. Verify that the modal dialog is loaded:
            await createRequestPublishDialog.waitForDialogLoaded();
            //5. Expand the menu and select 'Mark as Ready' menu item
            await createRequestPublishDialog.clickOnMarkAsReadyMenuItem();
            //6. Verify that 'Next' button is enabled:
            await createRequestPublishDialog.waitForNextButtonEnabled();
            let state = await createRequestPublishDialog.getWorkflowState(name);
            studioUtils.saveScreenshot("ready_to_publish_via_menu_action");
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING, "The content gets 'Ready for publishing'");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
