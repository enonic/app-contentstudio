/**
 * Created on 02.02.2024
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const appConst = require('../libs/app_const');
const PageComponentsWizardStepForm = require('../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PageInspectionPanel = require('../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../page_objects/confirmation.dialog');
const allureReporter = require('@wdio/allure-reporter');

describe('remove_app.in.site.with.descriptor.spec: replace an application and check the selected controller', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    const APP_1 = appConst.TEST_APPS_NAME.SIMPLE_SITE_APP;
    const APP_2 = appConst.TEST_APPS_NAME.MY_FIRST_APP
    const CONTROLLER_APP_1 = 'default';
    const CONTROLLER_APP_2 = 'Country List';
    const NO_SELECTED_CONTROLLER_MSG = appConst.PAGE_WIDGET.NO_SELECTED_CONTROLLER_MSG;

    it("Precondition",
        async () => {
            await allureReporter.step('new site with a page controller should be added', async () => {
                let applications = [APP_1];
                let displayName = appConst.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'test site1', applications, CONTROLLER_APP_1);
                await studioUtils.doAddSite(SITE);
            });
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/9201
    // Details widget should be loaded after reset of a controller #9201
    it(`WHEN the selected application has been replaced with another application THEN controller from the first application remains visible in PCV AND we can reset the controller`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. remove the App1 in app-selector:
            await siteFormPanel.removeApplication(APP_1);
            await studioUtils.saveScreenshot('app_1_removed');
            // 3. Select App2 application:
            await siteFormPanel.filterOptionsAndSelectApplication(APP_2);
            // 4. the site should be automatically saved after removing the selected options:
            await contentWizard.waitForNotificationMessage();
            await contentWizard.waitForSaveButtonDisabled();
            // 5. Verify that App2 application is selected in app selector-dropdown:
            let apps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(apps[0], APP_2, 'application should be updated in the form');
            // 6. Verify that the controller from the previous application remains visible in PCV:
            await pageComponentsWizardStepForm.openMenu(CONTROLLER_APP_1);
            // 7. Click on 'Reset' menu item, reset the controller
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            let confirmationDialog = new ConfirmationDialog();
            // 8. Click on 'Yes' button in the confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.waitForSaveButtonDisabled();
            let contextWindow = await contentWizard.openContextWindow();
            let widgetName = await contextWindow.getSelectedOptionInWidgetSelectorDropdown();
            // 9. Verify that 'Details' widget is selected after the resetting:
            assert.equal(widgetName, appConst.WIDGET_SELECTOR_OPTIONS.DETAILS,
                `'Details' widget should be selected after resetting the controller`);
            await studioUtils.saveScreenshot('app_replaced_in_site_wizard');
            // 10. Open Page widget in Context Window:
            await contextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            let pageInspectionPanel = new PageInspectionPanel();
            let controller = await pageInspectionPanel.getSelectedPageController();
            assert.equal(controller, 'Automatic', 'Automatic controller should be displayed after resetting');
            // 11. Verify that PCV gets not visible after the resetting:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            // 12. 'Save' button should be disabled after the resetting:
            await contentWizard.waitForSaveButtonDisabled();
            // 13 'Preview' button gets disabled in the Preview item toolbar:
            await contentWizard.waitForPreviewButtonDisabled();
            // 14. Select the page descriptor from the App2:
            await pageInspectionPanel.selectPageTemplateOrController(CONTROLLER_APP_2);
            // 15. Verify that 'Preview' button gets displayed again:
            await contentWizard.waitForPreviewButtonDisplayed();
            // 16. PCV gets visible and contains items from the second application:
            await pageComponentsWizardStepForm.waitForComponentItemDisplayed(CONTROLLER_APP_2);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/7390
    // Site Wizard - PCV overlaps applications dropdown list #7390
    it(`GIVEN app selector has been expanded WHEN checkbox for the selected app has been unchecked THEN the selected option should not be displayed in the form`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. click on dropdown handle in app-selector:
            await siteFormPanel.clickOnDropdownHandle()
            // 3. unselect the checkbox in dropdown-list another application:
            await siteFormPanel.clickOnCheckboxInDropdownByDisplayName(APP_2);
            // 4. Verify that OK(apply selection) gets visible
            await siteFormPanel.waitForApplyAppSelectionButtonDisplayed();
            // 5. Click on the OK button
            await siteFormPanel.clickOnApplySelectionButtonInApplications();
            // 6. Verify that the selected option is removed in the form:
            let selectedApps = await siteFormPanel.getSelectedAppDisplayNames();
            assert.equal(selectedApps.length, 0, 'No selected apps should be in app-selector dropdown');
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/9211
    // Error displaying controllers from a missing app #9211
    it(`GIVEN app has been removed in the site the site is reopened WHEN 'Page widget' has been opened THEN expected controller-name should be displayed in Inspect tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            let contextWindow = await contentWizard.openContextWindow();
            // 2. Verify the controller in Inspect Tab:
            await contextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            let actualController = await pageInspectionPanel.getSelectedPageController();
            assert.equal(actualController, 'main region', `'main region' controller should be selected in the controller selector`);
        });

    // Verifies https://github.com/enonic/app-contentstudio/issues/9201
    // Details widget should be loaded after reset of a controller #9201
    it(`GIVEN site with a selected controller is opened AND a page component is selected in PCV WHEN expand the menu for the 'main region' controller and click on 'Reset' menu item THEN 'No controller is selected' message gets visible `,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Existing site is opened:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            let contextWindow = await contentWizard.openContextWindow();
            // 2. Open Page widget in Context Window:
            await contextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 3. Click and select the 'main' component item in PCV:
            await pageComponentsWizardStepForm.clickOnComponent('main');
            // 4. Open the context menu for the 'Country list' item in PCV:
            await pageComponentsWizardStepForm.openMenu(CONTROLLER_APP_2);
            // 5. Click on 'Reset' menu item, reset the controller
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            let confirmationDialog = new ConfirmationDialog();
            // 6. Click on 'Yes' button in the confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.waitForSaveButtonDisabled();
            // 7. Page widget should be shown in Widget selector:
            let actualWidget = await contextWindow.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(actualWidget, appConst.WIDGET_SELECTOR_OPTIONS.PAGE,
                `'Page' widget should be selected after resetting the controller`);
            // 8. Verify that 'No controller is selected' message gets visible in Inspect tab:
            let actualMessage = await pageInspectionPanel.getNoControllerMessageText();
            assert.equal(actualMessage, NO_SELECTED_CONTROLLER_MSG, 'Expected no controller message should be displayed');
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
