/**
 * Created on 22.11.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const ScheduleForm = require('../../page_objects/wizardpanel/schedule.wizard.step.form');

describe('Wizard page - verify schedule form`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SCHEDULE_STEP_TITLE = 'Schedule';

    let TEST_FOLDER;
    it(`WHEN new folder has been created THEN schedule form should not be present AND schedule menu item is not visible on the step-navigator`,
        () => {
            let contentWizard = new ContentWizard();
            let displayName = contentBuilder.generateRandomName('folder');
            TEST_FOLDER = contentBuilder.buildFolder(displayName);
            return studioUtils.openContentWizard(appConst.contentTypes.FOLDER).then(() => {
                return contentWizard.typeDisplayName(TEST_FOLDER.displayName);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                return assert.eventually.isFalse(contentWizard.isWizardStepByTitlePresent(SCHEDULE_STEP_TITLE),
                    "button should not be present on the step-navigator");
            }).then(() => {
                return assert.eventually.isFalse(contentWizard.waitForScheduleFormVisible(),
                    "'Schedule form' should not be present on the wizard page");
            }).then(() => {
                return expect(contentWizard.getContentStatus()).to.eventually.equal('New');
            });
        });

    it(`GIVEN existing content is opened WHEN content has been published THEN 'Schedule' form should appear`,
        () => {
            let contentWizard = new ContentWizard();
            return studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName).then(() => {
            }).then(() => {
                return contentWizard.openPublishMenuAndPublish();
            }).then(() => {
                return assert.eventually.isTrue(contentWizard.isWizardStepByTitlePresent(SCHEDULE_STEP_TITLE),
                    "new button should be present on the step-navigator");
            }).then(() => {
                return assert.eventually.isTrue(contentWizard.waitForScheduleFormVisible(),
                    "Schedule form should be present on the wizard page");
            }).then(() => {
                studioUtils.saveScreenshot("check_schedule_form");
                return expect(contentWizard.getContentAuthor()).to.eventually.equal('by Super User');
            }).then(() => {
                return expect(contentWizard.getContentStatus()).to.eventually.equal('Published');
            });
        });

    it(`WHEN existing online-content is opened THEN Expected date time should be displayed in 'Online from'`,
        async () => {
            let contentWizard = new ContentWizard();
            let scheduleForm = new ScheduleForm();
            let expectedDate = new Date().toISOString().substring(0, 10);
            await studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName);
            let from = await scheduleForm.getOnlineFrom();
            assert.isTrue(from.includes(expectedDate), "Expected date time should be displayed");
        });

    it(`GIVEN existing online-content is opened WHEN content has been unpublished THEN 'Schedule' form is getting not visible`,
        () => {
            let contentWizard = new ContentWizard();
            return studioUtils.selectAndOpenContentInWizard(TEST_FOLDER.displayName).then(() => {
            }).then(() => {
                return studioUtils.doUnPublishInWizard();
            }).then(() => {
                return assert.eventually.isTrue(contentWizard.waitForWizardStepByTitleNotVisible(SCHEDULE_STEP_TITLE),
                    "schedule menu item is getting not visible on the step-navigator");
            }).then(() => {
                return assert.eventually.isTrue(contentWizard.waitForScheduleFormNotVisible(),
                    "Schedule form is getting not visible on the wizard page");
            }).then(() => {
                studioUtils.saveScreenshot("check_schedule_form_unpublished");
                return expect(contentWizard.getContentAuthor()).to.eventually.equal('by Super User');
            }).then(() => {
                return expect(contentWizard.getContentStatus()).to.eventually.equal('Unpublished');
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
