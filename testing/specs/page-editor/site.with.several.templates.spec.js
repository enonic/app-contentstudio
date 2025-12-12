/**
 * Created on 06.03.2019.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PageWidgetPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');

describe('site.with.several.templates: click on dropdown handle in Inspection Panel and change a template ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEMPLATE1;
    let TEMPLATE2;
    const SUPPORT_SITE = 'Site';
    const CONTROLLER_NAME1 = appConst.CONTROLLER_NAME.MAIN_REGION;
    const CONTROLLER_NAME2 = 'default';
    const MAIN_REGION_CONTROLLER = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`Precondition 1: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.TEST_APPS_NAME.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is opened WHEN a controller is not selected THEN button 'Show Page Editor' should be present in the wizard toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            // 1. Open the existing site(no page controller is selected):
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Verify that 'Hide Page Editor' button is displayed
            await contentWizard.waitForPageEditorTogglerDisplayed();
            // 3. Verify that 'Show Context Window' button is visible:
            await contentWizard.waitForShowContextPanelButtonDisplayed();
        });

    it(`Precondition 2: the first template should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            TEMPLATE1 = contentBuilder.buildPageTemplate(appConst.generateRandomName('template'), SUPPORT_SITE, CONTROLLER_NAME1);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE1);
            await studioUtils.findAndSelectItem(TEMPLATE1.displayName);
            await contentBrowsePanel.waitForContentDisplayed(TEMPLATE1.displayName);
        });

    it(`Precondition 3:  the second template should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            TEMPLATE2 = contentBuilder.buildPageTemplate(appConst.generateRandomName('template'), SUPPORT_SITE, CONTROLLER_NAME2);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE2);
            await studioUtils.findAndSelectItem(TEMPLATE2.displayName);
            await contentBrowsePanel.waitForContentDisplayed(TEMPLATE2.displayName);
        });

    it(`GIVEN existing site with a template is opened(shader should be applied) WHEN Customize menu item has been clicked THEN shader gets not displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let pageInspectionTab = new PageInspectionPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.pause(1000);
            // 3. Verify that LiveEdit is locked: Check for editor-shader in style attribute:
            let isLocked = await contentWizard.isLiveEditLocked();
            assert.ok(isLocked, 'Page editor should be locked');
            // PCV should be hidden in locked LiveEdit:
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            await contentWizard.switchToParentFrame();
            // 4. Click on 'Customize' menu item:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            // 5. Click on Customize Page button:
            await contentWizard.switchToParentFrame();
            await pageInspectionTab.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            // 5. Verify that LiveEdit is unlocked:
            isLocked = await contentWizard.isLiveEditLocked();
            assert.ok(isLocked === false, 'Page editor should not be locked');
            // switch from LiveEdit to parent frame:
            await contentWizard.switchToParentFrame();
            // 6. Verify that PCV gets visible now:
            await pageComponentsWizardStepForm.waitForLoaded();
        });

    it(`GIVEN site is opened AND Inspection Panel is opened WHEN another template has been selected in the Inspect Panel THEN site should be saved automatically AND 'Saved' button should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToParentFrame();
            // 2. Click on 'Customize Page' button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            // 3. Confirm the action
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 4. Select the controller:
            let pageWidgetPanel = new PageWidgetPanel();
            await pageWidgetPanel.clickOnTabBarItem('Inspect');
            await pageInspectionPanel.selectPageTemplateOrController(TEMPLATE1.displayName);
            // 5. Confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            // 6. Verify the notification message(the content is saved automatically)
            let notificationMessage = await contentWizard.waitForNotificationMessage();
            let expectedMessage = appConst.itemSavedNotificationMessage(SITE.displayName);
            assert.equal(notificationMessage, expectedMessage, "'Item is saved' - this message should appear");
            // 7. Verify -  'Save' button gets disabled in the wizard-toolbar
            await contentWizard.waitForSaveButtonDisabled();
        });

    // Verifies issue  Content customise picks incorrect template #7038
    //  https://github.com/enonic/app-contentstudio/issues/7038
    it(`GIVEN site is opened WHEN the current template has been switched in the Inspect Panel THEN items in PCV should be updated`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Click on Customize menu item::
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToParentFrame();
            // Click on 'Customize' Page button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 3. Check the items in PCV:
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.ok(result.includes('main region'), 'main region item should be displayed in the modal dialog');
            assert.ok(result.includes('Main'), 'Main item should be displayed in the modal dialog');
            // 4. Select another template:
            let pageWidgetPanel = new PageWidgetPanel();
            await pageWidgetPanel.clickOnTabBarItem('Inspect');
            await pageInspectionPanel.selectPageTemplateOrController(TEMPLATE2.displayName);
            // 5. Confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            // 6. Confirm it:
            await confirmationDialog.clickOnYesButton();
            // 7. Verify that notification message appears:
            await contentWizard.waitForNotificationMessage();
            // 8. Live Edit gets locked again, click on 'Customize' menu item:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToParentFrame();
            // 9. Click on 'Customize' Page button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            // 6. Confirm it:
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 9. Verify that items in PCV are updated after switching to another template:
            result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.ok(result.includes('default'), 'default item should be displayed in the modal dialog');
            assert.ok(result.includes('Main'), 'Main item should be displayed in the modal dialog');
            // 10. Save the customized site:
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN customized site is opened WHEN the controller has been reset in PCV and another controller has been selected THEN 'Customize Page' button remains displayed AND PCV should not be displayed after switching templates`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open the customized site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Select the 'Page' widget:
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 3. Click on 'Reset' menu item and reset the selected controller:
            await pageComponentsWizardStepForm.openMenu('default');
            await pageComponentsWizardStepForm.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            // 4. Click on 'Yes' button in the confirmation dialog:
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.waitForSaveButtonDisabled();
            let actualWidget = await wizardContextWindow.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(actualWidget, appConst.WIDGET_SELECTOR_OPTIONS.PAGE,
                `'Page' widget should be selected after resetting the controller`);
            // 5. Select the second template:
            await pageInspectionPanel.selectPageTemplateOrController(TEMPLATE2.displayName);
            await studioUtils.saveScreenshot('site_second_template_selected');
            await contentWizard.waitForNotificationMessage();
            // 6. Verify that 'Customize Page' button remains displayed:
            await pageInspectionPanel.waitForCustomizePageButtonDisplayed();
            // 7. PCV should not be displayed (LiveEdit is locked):
            await pageComponentsWizardStepForm.waitForNotDisplayed();
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`GIVEN Inspection Panel is loaded WHEN 'main region' controller has been selected in Inspect Panel THEN PCV should be unlocked in wizard step`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            // 2. Select the controller:
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(MAIN_REGION_CONTROLLER);
            await studioUtils.saveScreenshot('controller_switched_pcv_gets_enabled');
            // 3. PCV should not be disabled (not locked):
            await pageComponentsWizardStepForm.waitForNotLocked()
            // 4. Verify -  'Save' button is disabled in the wizard-toolbar
            await contentWizard.waitForSaveButtonDisabled();
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
