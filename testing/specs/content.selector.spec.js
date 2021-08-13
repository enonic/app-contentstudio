/**
 * Created on 23.12.2017.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const ContentSelector = require('../page_objects/components/content.selector');

describe('content.selector.spec: content-selector specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    let articleContent;

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`WHEN new article has been saved THEN the article should be listed in the grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let displayName = contentBuilder.generateRandomName('article');
            articleContent =
                contentBuilder.buildArticleContent(displayName, 'title', 'body', appConstant.contentTypes.ARTICLE);
            await studioUtils.doAddArticleContent(SITE.displayName, articleContent);
            await studioUtils.typeNameInFilterPanel(articleContent.displayName);
            let isDisplayed = await contentBrowsePanel.waitForContentDisplayed(articleContent.displayName);
            studioUtils.saveScreenshot('article_content_added');
            assert.isTrue(isDisplayed, 'the article should be listed in the grid');
        });

    it(`WHEN wizard for 'custom-relationship' is opened THEN mode toggler should be present in the content-selector AND 'Flat' mode should be by default`,
        async () => {
            let contentSelector = new ContentSelector();
            //1. Open the wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP);
            await contentSelector.waitForModeTogglerDisplayed();
            //2. Verify the mode in content-selector:
            let actualMode = await contentSelector.getMode();
            studioUtils.saveScreenshot('content_selector_default_mode');
            assert.equal(actualMode, 'flat', 'Flat mode should be by default');
        });

    it(`GIVEN wizard for 'custom-relationship' is opened WHEN mode toggler has been clicked THEN switches to 'Tree' mode`,
        async () => {
            let contentSelector = new ContentSelector();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP);
            //1. Click on mode toggler button:
            await contentSelector.clickOnModeTogglerButton();
            //2. Verify new mode:
            let actualMode = await contentSelector.getMode();
            studioUtils.saveScreenshot('content_selector_tree_mode');
            assert.equal(actualMode, 'tree', "'Tree' mode should be in the selector");
        });

    it(`GIVEN wizard for 'custom-relationship' is opened WHEN 'mode toggler' button has been clicked THEN switches to 'Tree'-mode AND parent site should be present in the options`,
        async () => {
            let contentSelector = new ContentSelector();
            //1. Custom relationship has been opened:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP);
            //2. Mode toggler has been clicked(switch to tree mode):
            await contentSelector.clickOnModeTogglerButton();
            let options = await contentSelector.getTreeModeOptionDisplayNames();
            //3. Parent site should be present in the options
            studioUtils.saveScreenshot('content_sel_tree_mode_option');
            assert.strictEqual(options[0], SITE.displayName);
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification is starting: ' + this.title);
    });
});
