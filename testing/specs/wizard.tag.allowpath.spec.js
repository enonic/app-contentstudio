/**
 * Created on 23.03.2019.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const tagForm = require('../page_objects/wizardpanel/tag.form.panel');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');


describe('wizard.tag.allowpath.spec: check allowPath for tags`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let MY_TAGS_FOLDER = "mytags";
    let FOLDER;
    let SITE;
    let TAG_TEXT1 = "enonic";
    let TAG_TEXT2 = "test enonic";

    it(`Preconditions: site and child folder should be added`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            FOLDER = contentBuilder.buildFolder("mytags");
            return studioUtils.doAddSite(SITE).then(() => {
            }).then(() => {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(() => {
                return studioUtils.doAddFolder(FOLDER);
            });
        });

    it(`Precondition, new tag should be added in the root of the site: tag-content wizard has been opened and tag with text 'enonic' has been saved`,
        () => {
           //do add new tag-content in the root of the site
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'tag0_5').then(() => {
                return contentWizard.typeDisplayName("test-tag1");
            }).then(() => {
                //type 'enonic' in the input and save this tag
                return tagForm.doAddTag(TAG_TEXT1);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                studioUtils.saveScreenshot('tag1_added');
                return contentWizard.waitForNotificationMessage();
            });
        });

    it(`Precondition: new tag-content should be added in the folder that specified in 'allowPath'`,
        () => {
           //select 'mytags' folder and open wizard for tag-content
            return studioUtils.selectSiteAndOpenNewWizard(MY_TAGS_FOLDER, 'tag0_5').then(() => {
                return contentWizard.typeDisplayName("test-tag2");
            }).then(() => {
                //type 'test-enonic' in the input and save this tag
                return tagForm.doAddTag(TAG_TEXT2);
            }).then(() => {
                return contentWizard.waitAndClickOnSave();
            }).then(() => {
                studioUtils.saveScreenshot('tag2_added');
                return contentWizard.waitForNotificationMessage();
            });
        });

    //<allowPath>${site}/mytags/</allowPath>
    it(`GIVEN wizard for new tag-content is opened WHEN part of the tag that is not in 'allowPath' has been typed THEN tag-suggestion should not appear`,
        () => {
            //open new wizard in "${site}/mytags/"
            return studioUtils.selectSiteAndOpenNewWizard(MY_TAGS_FOLDER, 'tag0_5').then(() => {
                //type a name
                return contentWizard.typeDisplayName("test-tag3");
            }).then(() => {
                //type the text-part of existing tag(the tag is not in allowed folder)
                return tagForm.typeInTagInput("enon");
            }).then(() => {
                // suggestion is not visible because 'allowPath' is "${site}/mytags"
                return tagForm.getTagSuggestions();
            }).then(result => {
                studioUtils.saveScreenshot('no_tag_suggestion');
                assert.isTrue(result === "", "Tag Suggestion should not be visible");
            });
        });

    it(`GIVEN wizard for new tag-content is opened WHEN part of the tag that in 'allowed' folder has been typed THEN tag-suggestion should appear`,
        () => {
            //open new wizard in "${site}/mytags/"
            return studioUtils.selectSiteAndOpenNewWizard(MY_TAGS_FOLDER, 'tag0_5').then(() => {
                //type a name
                return contentWizard.typeDisplayName("test-tag3");
            }).then(() => {
                //type the part of text of existing tag(the tag is in allowed folder)
                return tagForm.typeInTagInput("test");
            }).then(() => {
                // suggestion should be visible because allowPath is "${site}/mytags"
                return tagForm.getTagSuggestions();
            }).then(result => {
                studioUtils.saveScreenshot('tag_suggestion');
                assert.isTrue(result === TAG_TEXT2, "Tag- Suggestion should appear")
            });
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
