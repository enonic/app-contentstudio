/**
 * Created on 28.03.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('Menu Items: Save as fragment and Detach from Fragment specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let CONTROLLER_NAME = 'main region';
    const FRAGMENT_NAME = "Text";

    it(`Preconditions: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            await studioUtils.doAddSite(SITE);
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/1108 (tooltip 'Hide Component View' does not appear. )
    it(`GIVEN existing site is opened WHEN 'Show Component View' toggler has been clicked THEN 'Hide Component View' should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.waitForLoaded();

            await pageComponentView.openMenu('main');
            // 'Minimize Page Component View' button should appear:
            await pageComponentView.waitForMinimizeDialogButtonDisplayed();
        });

    // verifies -  Context menu stays open when menu button's dropdown is expanded #5075
    // https://github.com/enonic/app-contentstudio/issues/5075
    it(`GIVEN menu in 'Show Component View' has been opened WHEN publish-menu button's dropdown has been clicked THEN component's menu should be closed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.waitForLoaded();
            // 2. Open the menu in Page Component View dialog:
            await pageComponentView.openMenu('main');
            // 3. Verify that required items are visible:
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT);
            // 4. Click on publish-menu button's dropdown:
            await contentWizard.clickOnPublishMenuDropdownHandle();
            await studioUtils.saveScreenshot('components_menu_closed');
            // 5. Verify that page-component's menu gets closed:
            await pageComponentView.waitForMenuItemNotDisplayed(appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT);
            // 6.  But Publish-menu should be expanded and 'Publish...' menu item is enabled here:
            await contentWizard.waitForPublishMenuItemEnabled(appConst.PUBLISH_MENU.PUBLISH);
        });

    // https://github.com/enonic/app-contentstudio/issues/1445
    // Exception after an empty text component has been saved as fragment #1445
    it(`GIVEN existing site is opened AND Text component has been inserted WHEN text-component has been saved as fragment THEN 'Detach from Fragment' menu item should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            // 1. Open existing site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open the context menu:
            await pageComponentView.openMenu('main');
            // 4. Select "Insert>Text"
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            // 5. Open text-component's context menu:
            await pageComponentView.openMenu('Text');
            // 6. Click on 'Save as Fragment' menu item:
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await pageComponentView.pause(4000);
            // 7. Open text-component's context menu:
            await pageComponentView.openMenu('Text');
            await studioUtils.saveScreenshot('text_saved_as_fragment');
            // Verify that "'Detach from Fragment' menu item should appear in the menu
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.DETACH_FROM_FRAGMENT);
        });

    it(`WHEN existing site with a fragment is opened THEN single fragment should be displayed in Page Components View`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Go to Page Component Wizard step form:
            await contentWizard.clickOnWizardStep('Page');
            let result = await pageComponentsWizardStepForm.getFragmentsDisplayName();
            // 2. Verify that single expected fragment is displayed in Page Component View:
            assert.equal(result.length, 1, 'Single fragment should be present');
            assert.equal(result[0], FRAGMENT_NAME, "Expected fragment display name should be present");
            // 3. Select the fragment, open the context-menu and verify all menu items:
            await pageComponentsWizardStepForm.openMenu(FRAGMENT_NAME);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.DUPLICATE);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.DETACH_FROM_FRAGMENT);
            await pageComponentsWizardStepForm.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT);
        });

    it(`WHEN existing site with a fragment is opened THEN single fragment should be displayed in Page Components View`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            let result = await pageComponentView.getFragmentsDisplayName();
            // 2. Verify that single expected fragment is displayed in Page Component View:
            assert.equal(result.length, 1, 'Single fragment should be present');
            assert.equal(result[0], FRAGMENT_NAME, "Expected fragment display name should be present");
            // 3. Select the fragment, open the context-menu and verify all menu items:
            await pageComponentView.openMenu(FRAGMENT_NAME);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.SELECT_PARENT);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.INSERT);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.DUPLICATE);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.DETACH_FROM_FRAGMENT);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT);
        });

    //verifies: New fragment should be created in the same workflow state as the content it was created from xp/issues/7244
    it(`GIVEN existing site with a fragment WHEN fragment has been opened THEN Workflow state should be 'Work in progress'`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Select the fragment and open the context-menu:
            await pageComponentView.openMenu('Text');
            // 3. Open this fragment in new browser-tab:
            await pageComponentView.selectMenuItem(['Edit']);
            await studioUtils.doSwitchToNextTab();
            let result = await contentWizard.waitForWizardStepPresent('Fragment');
            assert.isTrue(result, "'Fragment' Wizard Step should be present in the toolbar");
            // parent site is 'Work in progress', so this fragment must have the same state
            let state = await contentWizard.getContentWorkflowState();
            assert.equal(state, appConst.WORKFLOW_STATE.WORK_IN_PROGRESS, "Work in progress state should be in fragment-wizard ");
        });

    //Verifies: Page Component View loses selection after changes are saved #936
    it(`GIVEN a component in Page Component View is selected WHEN new description in the site has been saved THEN the component should not lose selection in the View`,
        async () => {
            let contentWizard = new ContentWizard();
            let siteFormPanel = new SiteFormPanel();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Click on the existing component and select it:
            await pageComponentView.clickOnComponent('Text');
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Update the site-description and save the site:
            await siteFormPanel.typeDescription('description111');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.pause(1000);
            await contentWizard.clickOnMinimizeLiveEditToggler();
            let result = await pageComponentView.isComponentSelected('Text');
            assert.isTrue(result, 'The component should be selected after changes are saved');
        });

    it(`WHEN fragment's context menu has been opened AND 'Detach from Fragment' has been clicked THEN 'Save as Fragment' menu item should appear again`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 1. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. the fragment's context menu has been opened:
            await pageComponentView.openMenu('Text');
            // 3. 'Detach from Fragment' menu item has been clicked:
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.DETACH_FROM_FRAGMENT]);
            await pageComponentView.pause(2000);
            // 4. The text-component context menu has been opened:
            await pageComponentView.openMenu('Text');
            await studioUtils.saveScreenshot('text_is_detached');
            // 5. Verify that 'Save as Fragment' menu item should appear again
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
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
