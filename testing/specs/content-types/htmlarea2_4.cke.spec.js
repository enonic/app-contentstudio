/**
 * Created on 27.04.2018.
 * Verifies:
 * 1. incorrect behavior of validation, when required inputs in wizard
 *     https://github.com/enonic/lib-admin-ui/issues/461
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const htmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');

describe('htmlarea.cke.spec:  html area with CKE`', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    const EXPECTED_TEXT_TEXT1 = '<p>test text</p>';
    const EXPECTED_TEXT_TEXT2 = '<p>test text 2</p>';
    const TEXT_1 = "test text";
    const TEXT_2 = "test text 2";
    let htmlAreaContent
    let SITE;
    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });


    it(
        `GIVEN wizard for 'htmlArea 2:4' is opened WHEN html area is empty and the content has been saved THEN red icon should appear, because the input is required`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea2_4').then(()=> {
                return contentWizard.typeDisplayName('test_area2_4');
            }).then(()=> {
                return contentWizard.waitAndClickOnSave();
            }).pause(1000).then(()=> {
                return contentWizard.isContentInvalid();
            }).then(result=> {
                studioUtils.saveScreenshot('cke_htmlarea_should_be_invalid');
                assert.isTrue(result, EXPECTED_TEXT_TEXT1, 'the content should be invalid, because the input is required');
            });
        });
    it(
        `GIVEN wizard for 'htmlArea 2:4' is opened WHEN text has been typed in the first area THEN the text should be present in the area `,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea2_4').then(()=> {
                return htmlAreaForm.typeTextInHtmlArea("test text")
            }).pause(1000).then(()=> {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result=> {
                studioUtils.saveScreenshot('cke_html_area2');
                assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
                assert.equal(result[1], '', 'the second area should be empty');
            });
        });

    it(`GIVEN wizard for 'htmlArea 2:4' is opened WHEN all data has been typed and saved THEN correct notification message should be displayed `,
        () => {
            let displayName = contentBuilder.generateRandomName('htmlarea');
            htmlAreaContent = contentBuilder.buildHtmlArea(displayName, ':htmlarea2_4', TEXT_1, TEXT_2);
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, ':htmlarea2_4').pause(1000).then(()=> {
                return contentWizard.typeData(htmlAreaContent);
            }).then(()=> {
                return contentWizard.waitAndClickOnSave();
            }).then(()=> {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result=> {
                studioUtils.saveScreenshot('cke_html_area2');
                assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
                assert.equal(result[1], EXPECTED_TEXT_TEXT2, 'expected and actual value should be equals');
            });
        });

    it(`GIVEN existing 'htmlArea 2:4' WHEN it has been opened THEN expected text should be displayed in the area`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(()=> {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result=> {
                studioUtils.saveScreenshot('htmlarea_2_4_check_value');
                assert.equal(result[0], EXPECTED_TEXT_TEXT1, 'expected and actual value should be equals');
                assert.equal(result[1], EXPECTED_TEXT_TEXT2, 'expected and actual value should be equals');
            });
        });

    //verifies https://github.com/enonic/lib-admin-ui/issues/461
    it(`GIVEN existing 'htmlArea 2:4' WHEN the first area has been cleared THEN red icon should appears in the wizard`,
        () => {
            return studioUtils.selectContentAndOpenWizard(htmlAreaContent.displayName).then(()=> {
                return htmlAreaForm.clearHtmlArea(0);
            }).then(()=> {
                return htmlAreaForm.getTextFromHtmlArea();
            }).then(result=> {
                studioUtils.saveScreenshot('htmlarea_2_4_cleared');
                assert.equal(result[0], '', 'the first area should be empty');
                assert.equal(result[1], EXPECTED_TEXT_TEXT2, 'text should be in the second area');
            }).then(()=> {
                return assert.eventually.isTrue(contentWizard.isContentInvalid(),
                    "Red icon should appear in the wizard, because both inputs are required");
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
