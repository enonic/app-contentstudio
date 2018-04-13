/**
 * Created on 23.12.2017.
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
const contentSelector = require('../page_objects/components/content.selector');

describe('content.selector.spec: content-selector specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let articleContent;

    it(`WHEN site with content types has been added THEN the site should be listed in the grid`,
        () => {
            this.bail(1);
            let displayName = contentBuilder.generateRandomName('cselector-site');
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

    it(`WHEN article is saved THEN the article should be listed in the grid`,
        () => {
            let displayName = contentBuilder.generateRandomName('article');
            articleContent =
                contentBuilder.buildArticleContent(displayName, 'title', 'body', appConstant.contentTypes.ARTICLE);
            return studioUtils.doAddArticleContent(SITE.displayName, articleContent).then(()=> {
                return studioUtils.typeNameInFilterPanel(articleContent.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(articleContent.displayName);
            }).then(isDisplayed=> {
                studioUtils.saveScreenshot('article_content_added');
                assert.isTrue(isDisplayed, 'the article should be listed in the grid');
            });
        });

    it(`WHEN wizard for 'custom-relationship' is opened THEN mode toggler should be present in the content-selector AND mode should be 'Flat'`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP).then(()=> {
                return contentSelector.waitForModeTogglerDisplayed();
            }).then(()=> {
                return contentSelector.getMode();
            }).then(mode=> {
                studioUtils.saveScreenshot('content_selector_default_mode');
                assert.isTrue(mode == 'flat', 'Flat mode should be by default');
            });
        });
    it(`GIVEN wizard for 'custom-relationship' is opened WHEN mode  toggler has been clicked THEN the mode should be switched to 'Tree'`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP).then(()=> {
                return contentSelector.waitForModeTogglerDisplayed();
            }).then(()=> {
                return contentSelector.clickOnModeTogglerButton();
            }).then(()=> {
                return contentSelector.getMode();
            }).then(mode=> {
                studioUtils.saveScreenshot('content_selector_tree_mode');
                assert.isTrue(mode == 'tree', '`Tree` mode should be in selector when toggler has been clicked');
            });
        });

    it(`GIVEN wizard for 'custom-relationship' is opened WHEN 'mode toggler' button has been pressed THEN mode should be switched to 'Tree' and site, that is parent for the image should be present in the options`,
        () => {
            return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.CUSTOM_RELATIONSHIP).then(()=> {
                return contentSelector.clickOnModeTogglerButton();
            }).then(()=> {
                return contentSelector.getTreeModeOptionDisplayNames();
            }).then(options=> {
                studioUtils.saveScreenshot('content_sel_tree_mode_option');
                assert.strictEqual(options[0], SITE.displayName);
            });
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification is starting: ' + this.title);
    });
});
