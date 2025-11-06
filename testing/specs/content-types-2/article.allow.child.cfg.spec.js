/**
 * Created on 18.08.2025
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');

describe(`article.allow.child.cfg.spec: tests for 'allow-child-content-type' in content type schema`, function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const DROP_MEDIA_MSG = 'Drop media content here or use the Upload button';
    const NO_CONTENT_TYPES_ALLOWED = 'No content types allowed for a new content';
    const ARTICLE_ALLOW_ONLY_MEDIA = appConst.generateRandomName('amedia');
    const ARTICLE_ALLOW_NON_EXISTENT = appConst.generateRandomName('anonexistent');
    const ARTICLE_ALLOW_MEDIA_WILD = appConst.generateRandomName('amediawild');
    const ARTICLE_ALLOW_NON_MEDIA = appConst.generateRandomName('anonmedia');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            // 1. Add the site:
            await studioUtils.doAddSite(SITE);
        });

    // Only one media type is allowed. For example:
    it(`GIVEN article with 'Only one media type is allowed' in cfg is selected WHEN 'New content' modal dialog has been opened THEN Upload button should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(Only one media type is allowed):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_ONLY_MEDIA);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findAndSelectItem(ARTICLE_ALLOW_ONLY_MEDIA);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await studioUtils.saveScreenshot('article_allow_only_one_media');
            await newContentDialog.waitForOpened();
            // 5. Verify that the 'Upload' button is displayed:
            await newContentDialog.waitForUploaderButtonDisplayed();
            // 6. Verify the message in the empty view: Drop media content here or use the Upload button
            let actualTxt = await newContentDialog.getEmptyViewText();
            assert.equal(actualTxt, DROP_MEDIA_MSG, 'Expected text in empty view is not displayed as expected. Actual: ' + actualTxt);
            let items = await newContentDialog.getItems();
            assert.ok(items.length === 0, 'Expected no items in the list, but found: ' + items.length);
        });

    // A non-existing content type is allowed:
    it(`GIVEN article with 'A non-existing content type is allowed' in cfg is selected WHEN 'New content' modal dialog has been opened THEN 'Upload' button should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(a non-existing content type is allowed):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE_ALLOW_NON_EX);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_NON_EXISTENT);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findAndSelectItem(ARTICLE_ALLOW_NON_EXISTENT);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await studioUtils.saveScreenshot('article_allow_non_existent');
            // 5. Verify that the 'Upload' button is not displayed:
            await newContentDialog.waitForUploaderButtonNotDisplayed();
            let actualTxt = await newContentDialog.getEmptyViewText();
            assert.equal(actualTxt, NO_CONTENT_TYPES_ALLOWED,
                'Expected text in empty view is not displayed as expected. Actual: ' + actualTxt);
            let items = await newContentDialog.getItems();
            assert.ok(items.length === 0, 'Expected no items in the list, but found: ' + items.length);
        });

    // All media types are allowed via wild card:
    it(`GIVEN article with 'All media types are allowed via wild card' in cfg is selected WHEN 'New content' modal dialog has been opened THEN 'Upload' button should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(All media types are allowed via wild card):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE_ALLOW_MEDIA_WILD_CARD);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_MEDIA_WILD);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findAndSelectItem(ARTICLE_ALLOW_MEDIA_WILD);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 5. Verify that the 'Upload' button is displayed:
            await newContentDialog.waitForUploaderButtonDisplayed();
            // 6. Verify the message in the empty view: Drop media content here or use the Upload button
            let actualTxt = await newContentDialog.getEmptyViewText();
            assert.equal(actualTxt, DROP_MEDIA_MSG, 'Expected text in empty view is not displayed as expected. Actual: ' + actualTxt);
            let items = await newContentDialog.getItems();
            assert.ok(items.length === 0, 'Expected no items in the list, but found: ' + items.length);
        });

    // Only a specific, non-media type is allowed:
    it(`GIVEN article with 'Only a specific, non-media type is allowed' in cfg is selected WHEN 'New content' modal dialog has been opened THEN 'Upload' button should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(Only a specific, non-media type is allowed):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.ARTICLE_ALLOW_NON_MEDIA);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_NON_MEDIA);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findAndSelectItem(ARTICLE_ALLOW_NON_MEDIA);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 5. Verify that the Upload button is not displayed:
            await newContentDialog.waitForUploaderButtonNotDisplayed();
            // 6. Verify that the only one item should be displayed in the list of items:
            let items = await newContentDialog.getItems();
            assert.ok(items.length === 1, 'Expected no items in the list, but found: ' + items.length);
            assert.strictEqual(items[0], appConst.contentTypes.ARTICLE_ALLOW_NON_MEDIA,
                'Expected content type should be displayed in the list of items, but found: ' + items[0])
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
