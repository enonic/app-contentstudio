/**
 * Created on 12.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const CreateRequestPublishDialog = require('../../page_objects/issue/create.request.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('refresh.request.publish.dialog.spec - opens request publish modal dialog and checks control elements`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER1;
    let FOLDER2;

    //verifies https://github.com/enonic/app-contentstudio/issues/760
    it(`GIVEN new folder ('Work in progress') is selected AND Publish dialog has been opened WHEN this folder has been clicked in the dialog and 'Marked as ready' has been done in the wizard THEN Publish Wizard should be updated`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let createRequestPublishDialog = new CreateRequestPublishDialog();
            let folderName1 = contentBuilder.generateRandomName('folder');
            let folderName2 = contentBuilder.generateRandomName('folder');
            FOLDER1 = contentBuilder.buildFolder(folderName1);
            FOLDER2 = contentBuilder.buildFolder(folderName2);
            //1. New folder has been added
            await studioUtils.doAddFolder(FOLDER1);
            await studioUtils.doAddReadyFolder(FOLDER2);
            await studioUtils.findContentAndClickCheckBox(FOLDER1.displayName);
            await studioUtils.findContentAndClickCheckBox(FOLDER2.displayName);
            //2. expand the Publish Menu and select 'Request Publishing...' menu item, Request Publishing Wizard gets visible:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.REQUEST_PUBLISH);

            //3. click on the folder-name in the modal dialog and switch to new wizard-tab:
            await createRequestPublishDialog.clickOnItemToPublishAndSwitchToWizard(FOLDER1.displayName);
            //4. Click on 'Mark as Ready' button and that content gets "Ready for Publishing" in its wizard-page
            await contentWizard.clickOnMarkAsReadyButton();

            await studioUtils.doCloseWizardAndSwitchToGrid();
            //exception will be thrown when this button is not enabled after 3000ms
            await createRequestPublishDialog.waitForNextButtonEnabled();
            let workflowStatus = await createRequestPublishDialog.getWorkflowState(FOLDER1.displayName);
            assert.equal(workflowStatus, appConst.WORKFLOW_STATE.READY_FOR_PUBLISHING,
                "`Ready for publishing` status should be in the modal dialog");

            //Check the warning in the title:
            let isDisplayed = await createRequestPublishDialog.isWarningMessageDisplayed();
            assert.isFalse(isDisplayed, "Work in progress! message gets not visible now")
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});