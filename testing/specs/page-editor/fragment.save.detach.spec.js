/**
 * Created on 28.03.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const pageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");


describe('Menu Items: `Save as fragment` and `Detach from Fragment` specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';
    it(`WHEN new site has been added THEN the site should be listed in the grid`,
        () => {
            //this.bail(1);
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
            return studioUtils.doAddSite(SITE).then(()=> {
            }).then(()=> {
                studioUtils.saveScreenshot(displayName + '_created');
                return studioUtils.findAndSelectItem(SITE.displayName);
            }).then(()=> {
                return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            }).then(isDisplayed=> {
                assert.isTrue(isDisplayed, 'site should be listed in the grid');
            });
        });

    it(`GIVEN existing site is opened AND Text component has been inserted WHEN text-component has been saved as fragment THEN 'Detach from Fragment' menu item should appear`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(()=> {
                return pageComponentView.openMenu("main");
            }).then(()=> {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(()=> {
                return pageComponentView.openMenu("Text");
            }).then(()=> {
                return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            }).pause(2000).then(()=> {
                return pageComponentView.openMenu("Text");
            }).then(()=> {
                studioUtils.saveScreenshot('text_saved_as_fragment');
                return assert.eventually.isTrue(pageComponentView.isMenuItemPresent(appConstant.MENU_ITEMS.DETACH_FROM_FRAGMENT),
                    "Detach from Fragment menu item should appear");
            })
        });
    it(`GIVEN Page Component View is opened WHEN text-fragment clicked AND Detach from Fragment has been clicked THEN 'Save as Fragment' menu item should appear again`,
        () => {
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(()=> {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(()=> {
                return pageComponentView.openMenu("Text");
            }).then(()=> {
                return pageComponentView.selectMenuItem([appConstant.MENU_ITEMS.DETACH_FROM_FRAGMENT]);
            }).pause(2000).then(()=> {
                return pageComponentView.openMenu("Text");
            }).then(()=> {
                studioUtils.saveScreenshot('text_is_detached');
                return assert.eventually.isTrue(pageComponentView.isMenuItemPresent(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT),
                    "'Save as Fragment' menu item should appear again");

            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
