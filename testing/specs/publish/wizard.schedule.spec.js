/**
 * Created on 22.11.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const contentPublishDialog = require('../../page_objects/content.publish.dialog');
const scheduleWizardStep = require('../../page_objects/wizardpanel/schedule.wizard.step.form');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('Wizard page - verify schedule form`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SCHEDULE_STEP_TITLE = 'Schedule';

    let TEST_FOLDER;
    it(`WHEN new folder has been created THEN schedule form should not be present AND schedule menu item is not visible on the step-navigator`,
        () => {
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
            return studioUtils.openContentInWizard(TEST_FOLDER.displayName).then(() => {
            }).then(() => {
                return studioUtils.doPublishInWizard();
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

    it(`GIVEN existing online-content is opened WHEN content has been unpublished THEN 'Schedule' form is getting not visible`,
        () => {
            return studioUtils.openContentInWizard(TEST_FOLDER.displayName).then(() => {
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
