/**
 * Created on 09.12.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentSelectorForm = require('../../page_objects/wizardpanel/content.selector.form');
const appConst = require('../../libs/app_const');

describe('content.selector.allowpath.spec: tests for allowPath type param', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CHILD_FOLDER;
    let ARTICLE_CONTENT_1;
    let ARTICLE_CONTENT_2;
    const CHILD_FOLDER_NAME = appConst.generateRandomName('articles');


    it(`Preconditions 1: new site should be created`,
        async () => {
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
            await studioUtils.findAndSelectItem(SITE.displayName);
            CHILD_FOLDER = contentBuilder.buildFolder(CHILD_FOLDER_NAME);
            await studioUtils.doAddFolder(CHILD_FOLDER);
        });

    it(`Preconditions 2: the first article has been created in {site}/articles/ folder and the second article in the {site} root`,
        async () => {
            await studioUtils.findAndSelectItem(CHILD_FOLDER_NAME);
            ARTICLE_CONTENT_1 = contentBuilder.buildArticleContent('article1', 'title', 'body', appConst.contentTypes.ARTICLE);
            ARTICLE_CONTENT_2 = contentBuilder.buildArticleContent('article2', 'title', 'body', appConst.contentTypes.ARTICLE);
            await studioUtils.doAddArticleContent(CHILD_FOLDER_NAME, ARTICLE_CONTENT_1);
            await studioUtils.doAddArticleContent(SITE.displayName, ARTICLE_CONTENT_2);
        });

    it(`GIVEN allowPath is wizard with content-selector is opened WHEN the selector has been expanded THEN Only content from the {site}/articles/ folder should be displayed in the options list`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. Wizard for Content-Selector with allowPath to /articles/ is opened
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.CONTENT_SELECTOR_ALLOW_CHILD_FROM_SITE);
            // 2. Expand the selector:
            await contentSelectorForm.clickOnDropdownHandle();
            let result = await contentSelectorForm.getOptionsDisplayNameInFlatMode();
            // 3. Verify that only one option is displayed in the dropdown list
            assert.ok(result.length === 1, 'Only one option should be displayed in the dropdown list');
        });

    it(`GIVEN allowPath is {site}/people/ WHEN ContentType in selector-config does not match any content type in the app THEN 'No matching items' - no options should be displayed in the dropdown list`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. selector-config does not match any content type in the app
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName,
                appConst.contentTypes.CONTENT_SELECTOR_ALLOW_CHILD_FROM_SITE_NOT_EX);
            // 2. Expand the selector:
            await contentSelectorForm.clickOnDropdownHandle();
            // 3. Verify that 'No matching items' is displayed
            await contentSelectorForm.waitForEmptyOptionsMessage();
        });

    // Content Selector - Incorrect behaviour of allowContentType with type that does not match any content type #9537
    // https://github.com/enonic/app-contentstudio/issues/9537
    it.skip(
        `GIVEN allowPath is {site} WHEN ContentType in selector-config does not match any content type in the app THEN 'No matching items' - no options should be displayed in the dropdown list`,
        async () => {
            let contentSelectorForm = new ContentSelectorForm();
            // 1. selector-config does not match any content type in the app
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName,
                appConst.contentTypes.CONTENT_SELECTOR_ALLOW_CHILD_FROM_SITE_NOT_EX2);
            // 2. Expand the selector:
            await contentSelectorForm.clickOnDropdownHandle();
            // 3. Verify that 'No matching items' is displayed
            await contentSelectorForm.waitForEmptyOptionsMessage();
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
