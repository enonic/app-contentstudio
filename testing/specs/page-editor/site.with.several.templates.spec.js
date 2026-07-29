/**
 * Created on 06.03.2019. updated on 29.07.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PageWidgetPanel = require("../../page_objects/wizardpanel/liveform/page.widget.context.window");

describe('site.with.several.templates: click on dropdown handle in Inspection Panel and change a template ', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const IMPORTED_SITE = 'site45412';
    const IMPORTED_TEMPLATE2 = 'template621010';
    const IMPORTED_TEMPLATE1 = 'template622806';

    it(`WHEN Automatic option has been changed to the first template THEN site should be saved automatically AND 'Saved' button should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            let pageWidgetPanel = new PageWidgetPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(IMPORTED_SITE);
            await contentWizard.unlockSiteWithTemplate();
            await contentWizard.switchToParentFrame();
            // 2. Click on 'Customize Page' button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            // 3. Confirm the action
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 4. Select the controller:
            await contentWizard.clickOnWizardStep('Page');
            await pageWidgetPanel.clickOnTabBarItem(appConst.CONTEXT_WINDOW_TABS.INSPECT);
            await pageInspectionPanel.selectPageTemplateOrController(IMPORTED_TEMPLATE1);
            // 5. Confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            // 6. Verify the notification message(the content is saved automatically)
            let notificationMessage = await contentWizard.waitForNotificationMessage();
            let expectedMessage = appConst.itemSavedNotificationMessage(IMPORTED_SITE);
            assert.equal(notificationMessage, expectedMessage, "'Item is saved' - this message should appear");
            // 7. Verify -  'Save' button gets disabled in the wizard-toolbar
            await contentWizard.waitForSaveButtonDisabled();
        });

    // Verifies issue  Content customise picks incorrect template #7038
    //  https://github.com/enonic/app-contentstudio/issues/7038
    it(`WHEN the current template has been switched to the second template THEN items in PCV should be updated`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let pageWidgetPanel = new PageWidgetPanel();
            // 1. Open the site:
            await studioUtils.selectContentAndOpenWizard(IMPORTED_SITE);
            // 2. Click on Customize menu item::
            await contentWizard.unlockSiteWithTemplate();
            await contentWizard.switchToParentFrame();
            // Click on 'Customize' Page button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 3. Check the items in PCV:
            await contentWizard.clickOnWizardStep('Page');
            await pageWidgetPanel.clickOnTabBarItem(appConst.CONTEXT_WINDOW_TABS.INSPECT);
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.ok(result.includes('main region'), 'main region item should be displayed in the modal dialog');
            assert.ok(result.includes('MAIN'), 'Main item should be displayed in the modal dialog');
            // 4. Select another template:
            await pageInspectionPanel.selectPageTemplateOrController(IMPORTED_TEMPLATE2);
            // 5. Confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            // 6. Confirm it:
            await confirmationDialog.clickOnConfirmButton();
            // 7. Verify that notification message appears:
            await contentWizard.waitForNotificationMessage();
            // 8. Live Edit gets locked again, click on 'Customize' menu item:
            await contentWizard.unlockSiteWithTemplate();
            await contentWizard.switchToParentFrame();
            // 9. Click on 'Customize' Page button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            // 6. Confirm it:
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            // 9. Verify that items in PCV are updated after switching to another template:
            result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.ok(result.includes('default'), 'default item should be displayed in the modal dialog');
            assert.ok(result.includes('MAIN'), 'Main item should be displayed in the modal dialog');
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
            await studioUtils.selectContentAndOpenWizard(IMPORTED_SITE);
            // 2. Select the 'Page' widget:
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await contentWizard.clickOnWizardStep('Page');
            // 3. Click on 'Reset' menu item and reset the selected controller:
            await pageComponentsWizardStepForm.rightClickAndOpenContextMenu('default');
            await pageComponentsWizardStepForm.selectContextMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            // 4. Click on 'Yes' button in the confirmation dialog:
            await confirmationDialog.clickOnConfirmButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.waitForSaveButtonDisabled();
            let actualWidget = await wizardContextWindow.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(actualWidget, appConst.WIDGET_SELECTOR_OPTIONS.PAGE,
                `'Page' widget should be selected after resetting the controller`);
            // 5. Select the second template:
            await pageInspectionPanel.selectPageTemplateOrController(IMPORTED_TEMPLATE2);
            await studioUtils.saveScreenshot('site_second_template_selected');
            //await contentWizard.waitForNotificationMessage();
            // 6. Verify that 'Customize Page' button remains displayed:
            await pageInspectionPanel.waitForCustomizePageButtonDisplayed();
            // 7. PCV should not be displayed (LiveEdit is locked):
            await contentWizard.clickOnWizardStep('Page');
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.equal(result[0],IMPORTED_TEMPLATE2, "Expected component item should be displayed in PCV")
            await contentWizard.waitForSaveButtonDisabled();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
