/**
 * Created on 28.03.2018.
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');

describe('Menu Items: `Save as fragment` and `Detach from Fragment` specification', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();

    let SITE;
    let CONTROLLER_NAME = 'main region';

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is opened AND Text component has been inserted WHEN text-component has been saved as fragment THEN 'Detach from Fragment' menu item should appear`,
        () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(() => {
                return pageComponentView.openMenu("main");
            }).then(() => {
                return pageComponentView.selectMenuItem(["Insert", "Text"]);
            }).then(() => {
                return pageComponentView.openMenu("Text");
            }).then(() => {
                return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            }).then(() => {
                return pageComponentView.pause(2000);
            }).then(() => {
                return pageComponentView.openMenu("Text");
            }).then(() => {
                studioUtils.saveScreenshot('text_saved_as_fragment');
                return assert.eventually.isTrue(pageComponentView.isMenuItemPresent(appConstant.MENU_ITEMS.DETACH_FROM_FRAGMENT),
                    "Detach from Fragment menu item should appear");
            })
        });

    //verifies: New fragment should be created in the same workflow state as the content it was created from xp/issues/7244
    it(`GIVEN existing site with a fragment WHEN fragment has been opened THEN Workflow state should be 'Work in progress'`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //1. Open Page Component View:
            await contentWizard.clickOnShowComponentViewToggler();

            //2. Select the fragment and open the context-menu:
            await pageComponentView.openMenu("Text");

            //3. Open this fragment in new browser-tab:
            await pageComponentView.selectMenuItem(["Edit"]);
            await studioUtils.doSwitchToNextTab();
            //parent site is 'Work in progress', so this fragment must have the same state
            let state = await contentWizard.getToolbarWorkflowState()
            assert.equal(state, appConstant.WORKFLOW_STATE.WORK_IN_PROGRESS, "Work in progress state should be in fragment-wizard ");
        });

    //Verifies: Page Component View loses selection after changes are saved #936
    it(`GIVEN a component in Page Component View is selected WHEN new description in the site has been saved THEN the component should not lose selection in the View`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //1. Open Page Component View:
            await contentWizard.clickOnShowComponentViewToggler();

            //2. Click on the existing component and select it:
            await pageComponentView.clickOnComponent("Text");

            //3. Update the site-description and save the site:
            await siteFormPanel.typeDescription("description111");
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            let result = await pageComponentView.isComponentSelected("Text");
            assert.isTrue(result, "The component should be selected after changes are saved");
        });

    it(`GIVEN Page Component View is opened WHEN text-fragment clicked AND Detach from Fragment has been clicked THEN 'Save as Fragment' menu item should appear again`,
        () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                return contentWizard.clickOnShowComponentViewToggler();
            }).then(() => {
                return pageComponentView.openMenu("Text");
            }).then(() => {
                return pageComponentView.selectMenuItem([appConstant.MENU_ITEMS.DETACH_FROM_FRAGMENT]);
            }).then(() => {
                return pageComponentView.pause(2000);
            }).then(() => {
                return pageComponentView.openMenu("Text");
            }).then(() => {
                studioUtils.saveScreenshot('text_is_detached');
                return assert.eventually.isTrue(pageComponentView.isMenuItemPresent(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT),
                    "'Save as Fragment' menu item should appear again");
            })
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
