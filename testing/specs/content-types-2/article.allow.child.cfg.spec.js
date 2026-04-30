/**
 * Created on 18.08.2025 updated on 30.04.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const NewContentDialog = require('../../page_objects/browsepanel/new.content.dialog');

describe(`article.allow.child.cfg.spec: tests for 'allow-child-content-type' in content type schema`, function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const IMPORTED_SITE_NAME = appConst.TEST_DATA.IMPORTED_SITE_NAME;
    const DROP_MEDIA_MSG = 'Drop media content here or use the Upload button';
    const NO_CONTENT_TYPES_ALLOWED = 'No content types allowed for a new content';
    const ARTICLE_ALLOW_ONLY_MEDIA = appConst.generateRandomName('amedia');
    const ARTICLE_ALLOW_NON_EXISTENT = appConst.generateRandomName('anonexistent');
    const ARTICLE_ALLOW_MEDIA_WILD = appConst.generateRandomName('amediawild');
    const ARTICLE_ALLOW_NON_MEDIA = appConst.generateRandomName('anonmedia');


    // Only one media type is allowed. For example:
    it(`GIVEN article with 'Only one media type is allowed' in cfg is selected WHEN 'New content' modal dialog has been opened THEN Upload button should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(Only one media type is allowed):
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.ARTICLE);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_ONLY_MEDIA);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findContentAndClickCheckBox(ARTICLE_ALLOW_ONLY_MEDIA);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await studioUtils.saveScreenshot('article_allow_only_one_media');
            await newContentDialog.waitForOpened();
            // 5. Click on  'Media' tab
            await newContentDialog.clickOnMediaButton();
            await newContentDialog.waitForAllTabNotDisplayed();
            // 6. Verify that the 'Upload' button is displayed:
            await newContentDialog.waitForDropZoneDisplayed();
            // 7. Click on  'All' tab
            await newContentDialog.clickOnAllButton();
            // 6. Verify the message in the empty view:
            let actualTxt = await newContentDialog.waitForNoTypesFoundMessage('All');
            assert.equal(actualTxt, 'No content types found', 'Expected text in empty view is not displayed as expected');
        });

    // A non-existing content type is allowed:
    it(`GIVEN article with 'A non-existing content type is allowed' in cfg is selected WHEN 'New content' modal dialog has been opened THEN 'Upload' button should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(a non-existing content type is allowed):
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.ARTICLE_ALLOW_NON_EX);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_NON_EXISTENT);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findContentAndClickCheckBox(ARTICLE_ALLOW_NON_EXISTENT);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await studioUtils.saveScreenshot('article_allow_non_existent');
            // TODO BUG https://github.com/enonic/app-contentstudio/issues/10363
            //await newContentDialog.waitForMediaTabButtonDisabled();
            //await newContentDialog.waitForSuggestedTabButtonDisabled()

            let actualTxt = await newContentDialog.waitForNoTypesFoundMessage('All');
            assert.equal(actualTxt, 'No content types found', 'Expected text in empty view is not displayed as expected');

        });

    // All media types are allowed via wild card:
    it(`GIVEN article with 'All media types are allowed via wild card' in cfg is selected WHEN 'New content' modal dialog has been opened THEN 'Upload' button should be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(All media types are allowed via wild card):
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.ARTICLE_ALLOW_MEDIA_WILD_CARD);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_MEDIA_WILD);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findContentAndClickCheckBox(ARTICLE_ALLOW_MEDIA_WILD);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            await newContentDialog.clickOnMediaButton();
            // 5. Verify that the 'Upload' button is displayed:
            await newContentDialog.waitForDropZoneDisplayed();
            await newContentDialog.clickOnAllButton();
            // 6. Verify the message in the empty view:
            let actualTxt = await newContentDialog.waitForNoTypesFoundMessage('All');
            assert.equal(actualTxt, 'No content types found', 'Expected text in empty view is not displayed as expected');
        });

    // Only a specific, non-media type is allowed:
    it(`GIVEN article with 'Only a specific, non-media type is allowed' in cfg is selected WHEN 'New content' modal dialog has been opened THEN 'Upload' button should not be displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let newContentDialog = new NewContentDialog();
            // 1. Open new wizard for article-content(Only a specific, non-media type is allowed):
            await studioUtils.selectSiteAndOpenNewWizard(IMPORTED_SITE_NAME, appConst.contentTypes.ARTICLE_ALLOW_NON_MEDIA);
            // 2. Fill in the name input, save and close the wizard:
            await contentWizard.typeDisplayName(ARTICLE_ALLOW_NON_MEDIA);
            await studioUtils.saveAndCloseWizard();
            // 3. Select the article in the grid:
            await studioUtils.findContentAndClickCheckBox(ARTICLE_ALLOW_NON_MEDIA);
            // 4. Click on 'New' button in the content browse panel:
            await contentBrowsePanel.clickOnNewButton();
            await newContentDialog.waitForOpened();
            // 5. 'Media' tab should be disabled
            //await newContentDialog.waitForMediaTabButtonDisabled();
            // 6. Verify that the only one item should be displayed in the list of items:
            let items = await newContentDialog.getItemsInAllTab();
            assert.ok(items.length === 1, 'Expected no items in the list, but found: ' + items.length);
            assert.strictEqual(items[0], appConst.contentTypes.ARTICLE_ALLOW_NON_MEDIA,
                'Expected content type should be displayed in the list of items, but found: ' + items[0])
        });


    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(async() => {
        await studioUtils.doPressEscape();
        await studioUtils.doCloseAllWindowTabsAndSwitchToHome()
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
