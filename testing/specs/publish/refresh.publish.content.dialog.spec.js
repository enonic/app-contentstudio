/**
 * Created on 05.08.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('refresh.request.publish.dialog.spec - opens request publish modal dialog and checks control elements`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER;


    //verifies https://github.com/enonic/app-contentstudio/issues/697
    //         https://github.com/enonic/lib-admin-ui/issues/1061
    let SITE;
    it(`GIVEN new folder ('Work in progress') is selected AND Publish dialog has been opened WHEN this folder has been clicked in the dialog and 'Marked as ready' has been done in the wizard THEN Publish Wizard should be updated`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let folderName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(folderName);
            //1. New folder has been added
            await studioUtils.doAddFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);

            //2. expand the Publish Menu and select 'Publish...' menu item, Publish Wizard gets visible:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);

            //3. click on the folder-name in the modal dialog and switches to new wizard-tab:
            await contentPublishDialog.clickOnItemToPublishAndSwitchToWizard(FOLDER.displayName);
            //4. Click on 'Mark as Ready' button and that content gets "Ready for Publishing" in its wizard-page
            await contentWizard.clickOnMarkedAsReadyButton();

            await studioUtils.doCloseWizardAndSwitchToGrid();
            let workflowStatus = await contentPublishDialog.getWorkflowState(FOLDER.displayName);
            assert.equal(workflowStatus, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "`Ready for publishing` status should be in the modal dialog");
            //exception will be thrown when this button is not enabled after 3000ms
            await contentPublishDialog.waitForPublishNowButtonEnabled();
            //exception will be thrown when 'Add Schedule' button  is not displayed after 2000ms
            await contentPublishDialog.isAddScheduleButtonDisplayed();
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});