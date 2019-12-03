/**
 * Created on 23.12.2017.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
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
        () => {
            let contentSelector = new ContentSelector();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP).then(() => {
                return contentSelector.waitForModeTogglerDisplayed();
            }).then(() => {
                return contentSelector.getMode();
            }).then(mode => {
                studioUtils.saveScreenshot('content_selector_default_mode');
                assert.isTrue(mode == 'flat', 'Flat mode should be by default');
            });
        });

    it(`GIVEN wizard for 'custom-relationship' is opened WHEN mode toggler has been clicked THEN switches to 'Tree' mode`,
        () => {
            let contentSelector = new ContentSelector();
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP).then(() => {
                return contentSelector.waitForModeTogglerDisplayed();
            }).then(() => {
                return contentSelector.clickOnModeTogglerButton();
            }).then(() => {
                return contentSelector.getMode();
            }).then(mode => {
                studioUtils.saveScreenshot('content_selector_tree_mode');
                assert.isTrue(mode == 'tree', '`Tree` mode should be in the selector');
            });
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
