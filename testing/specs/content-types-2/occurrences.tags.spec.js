/**
 * Created on 21.10.2021
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const contentBuilder = require("../../libs/content.builder");
const studioUtils = require('../../libs/studio.utils.js');
const TagForm = require('../../page_objects/wizardpanel/tag.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const VersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('occurrences.tag.spec: tests for content with tag input', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }
    const TAGS_NAME_1 = appConst.generateRandomName("tag");
    const TAGS_NAME_2 = appConst.generateRandomName("tag");
    const TAGS_NAME_3 = appConst.generateRandomName("tag");
    let SITE;
    let TAG_TEXT1 = "enonic";
    let TAG_TEXT2 = "test enonic";

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it("GIVEN new wizard for Tag-content 2:5 is opened WHEN the name input has been filled THEN the content should be invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let tagForm = new TagForm();
            //1. Select the site and open new wizard for tag 2:5 content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TAG_2_5);
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(TAGS_NAME_1);
            //3. Verify that the content is invalid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, 'the content should be invalid, because min 2 tags should be added');
        });

    it("GIVEN new wizard for Tag-content 2:5 is opened WHEN the name input has been filled AND 'Save' button pressed THEN expected validation recording should appear",
        async () => {
            let contentWizard = new ContentWizard();
            let tagForm = new TagForm();
            //1. Select the site and open new wizard for tag 2:5 content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TAG_2_5);
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(TAGS_NAME_1);
            //3. Click on 'Save' button
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            //4. Verify that 'Min 2 valid occurrence(s) required' gets visible:
            let actualRecording = await tagForm.getTagValidationMessage();
            assert.equal(actualRecording, 'Min 2 valid occurrence(s) required', "Expected validation recording gets visible");
        });

    it("GIVEN new wizard for Tag-content 2:5 is opened WHEN two tags has been added AND name input has been filled THEN the content gets valid",
        async () => {
            let contentWizard = new ContentWizard();
            let tagForm = new TagForm();
            //1. Select the site and open new wizard for tag 2:5 content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TAG_2_5);
            await contentWizard.typeDisplayName(TAGS_NAME_2);
            //2. Add 2 tags:
            await tagForm.doAddTag(TAG_TEXT1);
            await tagForm.doAddTag(TAG_TEXT2);
            //3. Verify that the content gets valid even before clicking on the 'Save' button
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, 'the content should be valid, because 2 required tags are added');
            //4. Verify that new content is saved:
            await studioUtils.saveScreenshot('2_tags_added');
            //5. Verify that validation recording is not displayed:
            await tagForm.waitForTagValidationMessageNotDisplayed();
            //6. Click on 'Mark as Ready' button, the content will be automatically saved:
            await contentWizard.clickOnMarkAsReadyButton();
            await contentWizard.waitForNotificationMessage();
        });

    it("GIVEN existing Tag-content 2:5 is opened WHEN one of the two tags has been removed THEN the content gets invalid",
        async () => {
            let contentWizard = new ContentWizard();
            let tagForm = new TagForm();
            //1. open the existing tag 2:5 content:
            await studioUtils.selectAndOpenContentInWizard(TAGS_NAME_2);
            //2. Remove the first tag:
            await tagForm.removeTag(0);
            await studioUtils.saveScreenshot('req_tag_removed');
            //3. Verify that the content gets invalid even before clicking on the 'Save' button
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, 'the content should be valid, because 2 required tags are added');
            //4. Verify that 'Min 2 valid occurrence(s) required' gets visible:
            let actualRecording = await tagForm.getTagValidationMessage();
            assert.equal(actualRecording, 'Min 2 valid occurrence(s) required', "Expected validation recording gets visible");
        });

    it("GIVEN existing Tag-content with added tags is opened WHEN the previous version has been reverted THEN tag input gets empty",
        async () => {
            let contentWizard = new ContentWizard();
            let versionsWidget = new VersionsWidget();
            let tagForm = new TagForm();
            //1. open the existing tag 2:5 content:
            await studioUtils.selectAndOpenContentInWizard(TAGS_NAME_2);
            //2. Revert the previous version:
            await contentWizard.openVersionsHistoryPanel();
            await versionsWidget.clickAndExpandVersion(1);
            await versionsWidget.clickOnRevertButton();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('req_tag_reverted');
            //3. Verify that the content gets invalid even before clicking on the 'Save' button
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isTrue(isInvalid, 'the content should be valid, because 2 required tags are added');
            //4. Verify that 'Min 2 valid occurrence(s) required' gets visible:
            let actualRecording = await tagForm.getTagValidationMessage();
            assert.equal(actualRecording, 'Min 2 valid occurrence(s) required', "Expected validation recording gets visible");
            //5. Verify that Tags input is cleared
            let actualNumber = await tagForm.getTagsCount();
            assert.equal(actualNumber, 0, "Tags input should be empty after the reverting");
        });

    it("GIVEN wizard for new Tag-content 2:5 is opened WHEN 5 tags has been added THEN the tag input gets not displayed/disabled",
        async () => {
            let tagForm = new TagForm();
            //1. open wizard for new tag 2:5 content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TAG_2_5);
            //2. Remove the first tag:
            await tagForm.doAddTag("tag1");
            await tagForm.doAddTag("tag2");
            await tagForm.doAddTag("tag3");
            await tagForm.doAddTag("tag4");
            await tagForm.doAddTag("tag5");
            await studioUtils.saveScreenshot('tag_input_disabled');
            await tagForm.waitForTagInputNotDisplayed();
            let actualNumber = await tagForm.getTagsCount();
            assert.equal(actualNumber, 5, "5 tags should be present in the input");
        });

    it("GIVEN new wizard for Tag-content 0:5 is opened WHEN the name input has been filled THEN the content should be valid",
        async () => {
            let contentWizard = new ContentWizard();
            //1. Select the site and open new wizard for tag 0:5 content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.TAG_0_5);
            //2. Fill in the name input:
            await contentWizard.typeDisplayName(TAGS_NAME_3);
            //3. Verify that the content is valid
            let isInvalid = await contentWizard.isContentInvalid();
            assert.isFalse(isInvalid, 'the content should be valid, because the tag input is not required');
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
