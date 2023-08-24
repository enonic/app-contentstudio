/**
 * Created on 24.08.2023
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require('../../page_objects/wizardpanel/liveform/page.components.view');
const LiveFormPanel = require('../../page_objects/wizardpanel/liveform/live.form.panel');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');

describe('layout.context.menu.spec: tests for layout-fragment with config', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const MAIN_REGION = 'main';

    // Verifies Layout dropdown should appear in Live Edit after resetting the layout-component #6713
    // https://github.com/enonic/app-contentstudio/issues/6713
    it("GIVEN layer component has been inserted WHEN 'Reset' menu item has been clicked for the layout component THEN layout combobox should appear in  Live Edit",
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
            // 8. Verify that layout combobox gets visible on the page:
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
            assert.isTrue(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET), "'Reset' menu item should be present in the context menu");
            assert.isTrue(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT), "'Inspect' menu item should be present in the context menu");
            assert.equal(menuItems.length, 2, "The only two menu items should be present in the Context Menu");
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
