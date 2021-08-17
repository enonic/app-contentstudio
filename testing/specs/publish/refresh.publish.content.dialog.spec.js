/**
 * Created on 05.08.2019.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const SettingsStepForm = require('../../page_objects/wizardpanel/settings.wizard.step.form');
const DateRangeInput = require('../../page_objects/components/datetime.range');

describe('refresh.publish.dialog.spec - opens publish content modal dialog and checks control elements', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let FOLDER;

    //verifies https://github.com/enonic/app-contentstudio/issues/697
    //         https://github.com/enonic/lib-admin-ui/issues/1061
    it(`GIVEN new folder ('Work in progress') is selected AND Publish dialog has been opened WHEN this folder has been clicked in the dialog and 'Marked as ready' has been done in the wizard THEN Publish Wizard should be updated`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let folderName = contentBuilder.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(folderName);
            //1. New folder has been added:(status of this folder is Ready for publishing)
            await studioUtils.doAddReadyFolder(FOLDER);
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //2. expand the Publish Menu and select 'Publish...' menu item, Publish Wizard gets visible:
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForPublishNowButtonEnabled();

            //3. click on the folder-name in the modal dialog and switches to new wizard-tab:
            await contentPublishDialog.clickOnItemToPublishAndSwitchToWizard(FOLDER.displayName);
            //4. Select a language in the wizard. The folder get Work in Progress
            let settingsForm = new SettingsStepForm();
            await settingsForm.filterOptionsAndSelectLanguage('English (en)');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            //5. close the wizard
            await studioUtils.doCloseWizardAndSwitchToGrid();
            let workflowStatus = await contentPublishDialog.getWorkflowState(FOLDER.displayName);
            assert.equal(workflowStatus, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS,
                "'Work in Progress' status should be in the modal dialog");
            //exception will be thrown when this button is enabled after 2000ms
            await contentPublishDialog.waitForPublishNowButtonDisabled();
            //'Add Schedule' button  should not be displayed, because the content is `Work in progress`
            await contentPublishDialog.waitForAddScheduleIconNotDisplayed();
        });

    it(`GIVEN Publishing wizard has been opened AND schedule form has been added WHEN click on hours-arrow THEN picker popup should not be closed`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            let dateRangeInput = new DateRangeInput();
            //1. Select existing 'work in progress' folder and open Publish Dialog
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            await contentBrowsePanel.openPublishMenuSelectItem(appConst.PUBLISH_MENU.PUBLISH);
            await contentPublishDialog.waitForDialogOpened();
            //2. For this form to appear, need to make this content marked as ready
            await contentPublishDialog.clickOnMarkAsReadyMenuItem();
            //3. Verify that icon-calendar gets visible now. Click on this button:
            await contentPublishDialog.clickOnAddScheduleIcon();
            //4. Open date time picker popup:
            await dateRangeInput.doOpenOnlineFromPickerPopup();
            studioUtils.saveScreenshot("schedule_picker_popup1");
            //Click on hours-arrow:
            await dateRangeInput.clickOnHoursArrowOnlineFrom();
            studioUtils.saveScreenshot("schedule_picker_popup2");
            await dateRangeInput.pause(1000);
            await dateRangeInput.waitForOnlineFromPickerDisplayed();
        });

    //Verifies https://github.com/enonic/app-contentstudio/issues/2780
    //Publishing Scheduled status remains after scheduled content has been marked as deleted
    it.skip(
        `GIVEN existing folder has been scheduled WHEN the folder has been marked as deleted THEN 'Marked for deletion' status should be in browse panel`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let dateRangeInput = new DateRangeInput();
            //1. Select existing 'Ready to publish' folder and open 'Publish Dialog'
            await studioUtils.findAndSelectItem(FOLDER.displayName);
            //2. Schedule this content:
            await studioUtils.scheduleContent(FOLDER.displayName, "2031-01-01 00:00");
            //3. Click on 'Mark as Deleted' menu item in Delete Content dialog:
            await contentBrowsePanel.doSelectedContentMarkAsDeleted();
            //4. Verify that status gets 'Marked for deletion':
            let actualStatus = await contentBrowsePanel.getContentStatus(FOLDER.displayName);
            assert.equal(actualStatus, appConst.CONTENT_STATUS.MARKED_FOR_DELETION, "Marked for deletion status should be displayed");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
