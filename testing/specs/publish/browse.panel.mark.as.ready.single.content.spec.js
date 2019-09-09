/**
 * Created on 09.09.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const RequestContentPublishDialog = require('../../page_objects/issue/request.content.publish.dialog');

describe('wizard.mark.as.ready.single.content.spec - select single content and click on  Request Publishing and Publish menu items`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let TEST_FOLDER;


    //verifies https://github.com/enonic/app-contentstudio/issues/892
    //Single item should be automatically marked as ready when Publish or Request Publish dialogs are opened #892
    it(`WHEN 'Work in progress' folder is selected AND 'Publish...' menu item has been clicked THEN publishing wizard should be opened AND the folder gets Ready to publish`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let name = contentBuilder.generateRandomName('folder');

            TEST_FOLDER = contentBuilder.buildFolder(name);

            // the folders has been added:
            await studioUtils.doAddFolder(TEST_FOLDER);

            //Click on checkboxes and select select folder:
            await studioUtils.findContentAndClickCheckBox(name);
            //Click on 'Publish...' menu item
            await contentBrowsePanel.openPublishMenuSelectItem("Publish...");

            await contentPublishDialog.waitForDialogOpened();
            //The folder automatically gets "Ready to publish"
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            let state = await contentPublishDialog.getWorkflowState(name);
            studioUtils.saveScreenshot("ready_to_publish_automatically1");
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/892
    //Single item should be automatically marked as ready when Publish or Request Publish dialogs are opened #892
    it(`WHEN 'Work in progress' folder is selected AND 'Request Publishing...' menu item has been clicked THEN request publish dialog should be opened AND the folder gets Ready to publish`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let requestContentPublishDialog = new RequestContentPublishDialog();
            let name = contentBuilder.generateRandomName('folder');

            TEST_FOLDER = contentBuilder.buildFolder(name);

            // the folders has been added:
            await studioUtils.doAddFolder(TEST_FOLDER);

            //Click on checkboxes and select the folders
            await studioUtils.findContentAndClickCheckBox(name);
            //Click on 'Request Publishing...' menu item
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);

            await requestContentPublishDialog.waitForDialogLoaded();
            //The folder automatically gets "Ready to publish"
            await requestContentPublishDialog.waitForNextButtonEnabled();
            let state = await requestContentPublishDialog.getWorkflowState(name);
            studioUtils.saveScreenshot("ready_to_publish_automatically2");
            assert.equal(state, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
