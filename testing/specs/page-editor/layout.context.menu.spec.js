/**
 * Created on 24.08.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('layout.context.menu.spec: tests for layout-fragment with config', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const MAIN_REGION = 'main';
    const TEXT_AREA_X_DATA_NAME = 'Text Area x-data';

    // Verifies Layout dropdown should appear in Live Edit after resetting the layout-component #6713
    // https://github.com/enonic/app-contentstudio/issues/6713
    it("GIVEN layer component has been inserted WHEN 'Reset' menu item has been clicked for the layout component THEN layout combobox should appear in Live Edit",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let name = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(name, ' ', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            // 1. Open site-wizard and save:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            await contentWizard.waitForNotificationMessage();
            await contentWizard.pause(500);
            // 2. Verify that the site should be saved automatically after selecting a controller
            await contentWizard.selectPageDescriptor(appConst.CONTROLLER_NAME.MAIN_REGION);
            await contentWizard.waitForSaveButtonDisabled();
            // 3. Click on minimize-toggler, expand 'Live Edit' and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu(MAIN_REGION);
            // 4. Insert the layout:
            await pageComponentView.selectMenuItem(['Insert', 'Layout']);
            await liveFormPanel.selectLayoutByDisplayName(appConst.LAYOUT_NAME.COL_3);
            // 5. Site should be saved automatically:
            await contentWizard.waitForNotificationMessage();
            // 6. Expand the context menu for layout-component:
            await pageComponentView.openMenu(appConst.LAYOUT_NAME.COL_3);
            // 7. Click on 'Reset' menu item.
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await studioUtils.saveScreenshot('layout_reset');
            // 8. Verify that layout-combobox gets visible in the page:
            await contentWizard.switchToLiveEditFrame();
            await liveFormPanel.waitForLayoutComboBoxOptionFilterDisplayed();
        });

    it("GIVEN layer component has been saved as fragment WHEN context menu for the layout fragment has been opened THEN 2 items should be displayed in the menu",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open the existing site-wizard and save:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 2. Expand the context menu for layout-component then click on Save as Fragment  menu item:
            await pageComponentView.openMenu(appConst.LAYOUT_NAME.COL_3);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await studioUtils.doSwitchToNextTab();
            // 3. Expand the context menu in fragment-wizard.
            await pageComponentsWizardStepForm.openMenu(appConst.LAYOUT_NAME.COL_3);
            // 4. Verify that the only two menu items are displayed in the menu:
            let menuItems = await pageComponentsWizardStepForm.getContextMenuItems();
            assert.ok(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET),
                "'Reset' menu item should be present in the context menu");
            assert.ok(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT),
                "'Inspect' menu item should be present in the context menu");
            assert.equal(menuItems.length, 2, "The only two menu items should be present in the Context Menu");
        });


    // Verifies: Layout fragment - Reset menu item should not be displayed if there is no selected option #6717
    // https://github.com/enonic/app-contentstudio/issues/6717
    it("GIVEN fragment-layout has been selected and 'Edit' button has been pressed WHEN 'Reset' menu item has been clicked in the fragment wizard THEN only 'Inspect' menu item remains in the context menu",
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let liveFormPanel = new LiveFormPanel();
            // 1. Expand the site:
            await studioUtils.typeNameInFilterPanel(SITE.displayName);
            await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            await contentBrowsePanel.pause(300);
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName);
            // 2. Select the fragment:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.LAYOUT_NAME.COL_3);
            // 3. Click on 'Edit' button
            await contentBrowsePanel.clickOnEditButton();
            // 4. Switch to the next browser tab
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            // 5. Open the context menu for '3-col' component:
            await pageComponentsWizardStepForm.openMenu(appConst.LAYOUT_NAME.COL_3);
            // 6. Click on 'Reset' menu item:
            await pageComponentsWizardStepForm.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await studioUtils.saveScreenshot('layout_fragment_reset');
            // 7. 'Layout' component gets visible in PCV, open the context menu:
            await pageComponentsWizardStepForm.openMenu('Layout');
            await studioUtils.saveScreenshot('layout_fragment_context_menu_inspect')
            let menuItems = await pageComponentsWizardStepForm.getContextMenuItems();
            // 8. Verify that only 'Inspect' menu is present in the context menu:
            assert.ok(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT),
                "'Inspect' menu item should be present in the context menu");
            assert.equal(menuItems.length, 1, "The only one menu item should be present in the context menu");
            // 9. Verify that 'Save' button should be enabled after clicking on Reset menu item:
            await contentWizard.waitForSaveButtonEnabled();
            // 10. Verify that layout-combobox gets visible in Live Edit:
            await contentWizard.switchToLiveEditFrame();
            await liveFormPanel.waitForLayoutComboBoxOptionFilterDisplayed();
        });

    // Verify X-data is not shown for fragments #7284
    // https://github.com/enonic/app-contentstudio/issues/7284
    it("WHEN fragment-layout has been opened THEN expected x-data should be displayed",
        async () => {
            let contentWizard = new ContentWizard();
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. Expand the site:
            await studioUtils.typeNameInFilterPanel(SITE.displayName);
            await contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
            await contentBrowsePanel.pause(300);
            await contentBrowsePanel.clickOnExpanderIcon(SITE.displayName);
            // 2. Select the fragment:
            await contentBrowsePanel.clickCheckboxAndSelectRowByDisplayName(appConst.LAYOUT_NAME.COL_3);
            // 3. Click on 'Edit' button
            await contentBrowsePanel.clickOnEditButton();
            // 4. Switch to the next browser tab:
            await studioUtils.doSwitchToNewWizard();
            await contentWizard.waitForOpened();
            // 5. Verify that x-data toggler is displayed in the wizard:
            await contentWizard.waitForXdataTogglerVisible(TEXT_AREA_X_DATA_NAME);
            // 6. Verify the title of x-data :
            let result = await contentWizard.getXdataTitles();
            assert.ok(result.includes(TEXT_AREA_X_DATA_NAME), 'Text Area x-data should be present');
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
