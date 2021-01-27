/**
 * Created on 28.03.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');

describe('Menu Items: Save as fragment and Detach from Fragment specification', function () {
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

    //verifies https://github.com/enonic/app-contentstudio/issues/1108 (tooltip 'Hide Component View' does not appear. )
    it(`GIVEN existing site is opened WHEN 'Show Component View' toggler has been clicked THEN 'Hide Component View' should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //Click on 'Show Component View'
            await contentWizard.clickOnShowComponentViewToggler();
            await pageComponentView.waitForOpened();
            await pageComponentView.openMenu("main");
            //'Hide Component View' should appear:
            await contentWizard.waitForHideComponentViewTogglerDisplayed();
        });

      //https://github.com/enonic/app-contentstudio/issues/1445
    //Exception after an empty text component has been saved as fragment #1445
    it(`GIVEN existing site is opened AND Text component has been inserted WHEN text-component has been saved as fragment THEN 'Detach from Fragment' menu item should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            //1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //Click on 'Show Component View'
            await contentWizard.clickOnShowComponentViewToggler();
            //Open the context menu:
            await pageComponentView.openMenu("main");
            //Select "Insert>Text"
            await pageComponentView.selectMenuItem(["Insert", "Text"]);
            //Open text-component's context menu:
            await pageComponentView.openMenu("Text");
            //Click on 'Save as Fragment' menu item:
            await pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            await pageComponentView.pause(3000);
            //Open text-component's context menu:
            await pageComponentView.openMenu("Text");
            studioUtils.saveScreenshot('text_saved_as_fragment');
            let result = await pageComponentView.isMenuItemPresent(appConstant.MENU_ITEMS.DETACH_FROM_FRAGMENT);
            assert.isTrue(result, "'Detach from Fragment' menu item should appear in the menu");
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
            let state = await contentWizard.getToolbarWorkflowState();
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

    it(`GIVEN Page Component View is opened WHEN text-fragment context menu has been opened AND 'Detach from Fragment' has been clicked THEN 'Save as Fragment' menu item should appear again`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.clickOnShowComponentViewToggler();
            //text-component context menu has been opened:
            await pageComponentView.openMenu("Text");
            //'Detach from Fragment' menu item has been clicked:
            await pageComponentView.selectMenuItem([appConstant.MENU_ITEMS.DETACH_FROM_FRAGMENT]);
            await pageComponentView.pause(2000);
            //text-component context menu has been opened:
            await pageComponentView.openMenu("Text");
            studioUtils.saveScreenshot('text_is_detached');
            let result = await pageComponentView.isMenuItemPresent(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
            assert.isTrue(result, "'Save as Fragment' menu item should appear again");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
