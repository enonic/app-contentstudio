/**
 * Created on 22.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ScheduleForm = require('../../page_objects/wizardpanel/schedule.wizard.step.form');

describe('Wizard page - verify schedule form', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SCHEDULE_STEP_TITLE = 'Schedule';

    let TEST_FOLDER;
    it(`WHEN new folder has been created THEN schedule form should not be present AND schedule menu item is not visible on the step-navigator`,
        async () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            //1. Open new folder-wizard, type a name and save:
            await studioUtils.openContentWizard(appConst.contentTypes.FOLDER);
            await contentWizard.typeDisplayName(TEST_FOLDER.displayName);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.clickOnMarkAsReadyButton();
            //2. Schedule button should not be displayed in the step-navigator:
            let result = await contentWizard.isWizardStepByTitlePresent(SCHEDULE_STEP_TITLE);
            assert.isFalse(result, "Schedule button should no be visible");
            //3. 'Schedule form' should not be present in the wizard page:
            result = await contentWizard.waitForScheduleFormVisible();
            assert.isFalse(result, "Schedule form should no be visible");
            let status = await contentWizard.getContentStatus();
            assert.equal(status, "New", "New status should be in ContentWizardToolbar");
        });

    it(`GIVEN existing content is opened WHEN content has been published THEN 'Schedule' form should appear AND folder ges PUBLISHED`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Select and publish the content:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            await contentWizard.openPublishMenuAndPublish();
            let result = await contentWizard.isWizardStepByTitlePresent(SCHEDULE_STEP_TITLE);
            assert.isTrue(result, "'Schedule' button gets visible in the step-navigator");
            result = await contentWizard.waitForScheduleFormVisible();
            assert.isTrue(result, "Schedule form should appear in the wizard page");
            studioUtils.saveScreenshot("check_schedule_form");
            let author = await contentWizard.getContentAuthor();
            assert.equal(author, 'by Super User', "Expected author should be displayed in the toolbar");

            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'Published', "'Published' status should be displayed in the toolbar");
        });

    it(`WHEN existing published content is opened THEN Expected date time should be displayed in 'Online from'`,
        async () => {
            let scheduleForm = new ScheduleForm();
            let expectedDate = new Date().toISOString().substring(0, 10);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            let from = await scheduleForm.getOnlineFrom();
            assert.isTrue(from.includes(expectedDate), "Expected date time should be displayed");
        });

    it(`GIVEN existing published content is opened WHEN content has been unpublished THEN 'Schedule' form gets not visible`,
        async () => {
            let contentWizard = new ContentWizard();
            //1. Select and open the folder:
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            //2. Unpublish the folder:
            await studioUtils.doUnPublishInWizard();
            //3. Verify the toolbar and status:
            let result = await contentWizard.waitForWizardStepByTitleNotVisible(SCHEDULE_STEP_TITLE);
            assert.isTrue(result, "Schedule menu item gets not visible in the step-navigator");

            result = await contentWizard.waitForScheduleFormNotVisible();
            assert.isTrue(result, "Schedule form gets not visible in the wizard page");
            studioUtils.saveScreenshot("check_schedule_form_unpublished");
            let author = await contentWizard.getContentAuthor();
            assert.equal(author, 'by Super User', "Expected author should be displayed in the toolbar");

            let status = await contentWizard.getContentStatus();
            assert.equal(status, 'Unpublished', "'Unpublished' status should be displayed in the toolbar");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
