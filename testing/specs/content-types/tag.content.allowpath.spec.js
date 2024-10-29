/**
 * Created on 23.03.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const TagForm = require('../../page_objects/wizardpanel/tag.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const appConst = require('../../libs/app_const');

describe('wizard.tag.allowpath.spec: check allowPath for tags`', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const MY_TAGS_FOLDER_NAME = 'mytags';// "${site}/mytags/"
    let FOLDER;
    let SITE;
    const TAG_TEXT1 = 'enonic';
    const TAG_TEXT2 = 'test enonic';

    it(`Preconditions: site and child folder should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            FOLDER = contentBuilder.buildFolder(MY_TAGS_FOLDER_NAME);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`Precondition, new tag should be added in the root of the site: tag-content wizard has been opened and tag with text 'enonic' has been saved`,
        async () => {
            let contentWizard = new ContentWizard();
            let tagForm = new TagForm();
            // 1. Select the site and open new wizard for child content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'tag0_5');
            await contentWizard.typeDisplayName('test-tag1');
            // 2. type 'enonic' in the input and save this tag:
            await tagForm.doAddTag(TAG_TEXT1);
            await contentWizard.waitAndClickOnSave();
            // 3. Verify that new content is saved:
            await studioUtils.saveScreenshot('tag1_added');
            await contentWizard.waitForNotificationMessage();
        });

    it(`Precondition: new tag-content should be added in the folder that specified in 'allowPath'`,
        async () => {
            let tagForm = new TagForm();
            let contentWizard = new ContentWizard();
            // select 'mytags' folder and open wizard for tag-content
            await studioUtils.selectSiteAndOpenNewWizard(MY_TAGS_FOLDER_NAME, 'tag0_5');
            await contentWizard.typeDisplayName('test-tag2');
            // type 'test-enonic' in the input and save this tag:
            await tagForm.doAddTag(TAG_TEXT2);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('tag2_added');
            // verify that new content is saved:
            await contentWizard.waitForNotificationMessage();
        });

    // <allowPath>${site}/mytags/</allowPath>
    it(`GIVEN wizard for new tag-content is opened WHEN part of the tag that is not in 'allowPath' has been typed THEN tag-suggestion should not appear`,
        async () => {
            let tagForm = new TagForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard in "${site}/mytags/"
            await studioUtils.selectSiteAndOpenNewWizard(MY_TAGS_FOLDER_NAME, 'tag0_5');
            // 2. type a name
            await contentWizard.typeDisplayName('test-tag3');
            // 3. type the text-part of existing tag(the tag is not in allowed folder)
            await tagForm.typeInTagInput('enon');
            // Verify that the suggestion is not visible because tag is not in 'allowPath'
            let actualSuggestion = await tagForm.getTagSuggestions();
            await studioUtils.saveScreenshot('no_tag_suggestion');
            assert.equal(actualSuggestion, "", "Tag Suggestion should not be visible");
        });

    it(`GIVEN wizard for new tag-content is opened WHEN part of the tag that in 'allowed' folder has been typed THEN tag-suggestion should appear`,
        async () => {
            let tagForm = new TagForm();
            let contentWizard = new ContentWizard();
            // 1. open new wizard in "${site}/mytags/"
            await studioUtils.selectSiteAndOpenNewWizard(MY_TAGS_FOLDER_NAME, 'tag0_5');
            // 2. type a name:
            await contentWizard.typeDisplayName('test-tag3');
            // 3. type the part of text of existing tag(the tag is in allowed folder)
            await tagForm.typeInTagInput('test');
            // Verify : suggestion should be visible because allowPath is "${site}/mytags"
            let actualSuggestion = await tagForm.getTagSuggestions();
            await studioUtils.saveScreenshot('tag_suggestion');
            assert.equal(actualSuggestion, TAG_TEXT2, "Expected tag-suggestion should appear")
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
