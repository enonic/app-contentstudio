/**
 * Created on 13.02.2023
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('Test for updating text in fragment', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    const SITE_NAME = appConst.generateRandomName('site');
    let CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const GENERATED_TEXT_2 = appConst.generateRandomName('second');
    const GENERATED_TEXT_1 = appConst.generateRandomName('first');

    it(`GIVEN new fragment has been saved WHEN the text has been updated THEN text in the site's Live Form should be updated as well`,
        async () => {
            let contentWizard = new ContentWizard();
            let textComponentCke = new TextComponentCke();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let siteFormPanel = new SiteFormPanel();
            // 1. Open wizard for new site:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeDisplayName(SITE_NAME);
            await siteFormPanel.filterOptionsAndSelectApplication(appConst.TEST_APPS_NAME.SIMPLE_SITE_APP);
            await contentWizard.pause(2000);
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(CONTROLLER_NAME);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Insert new text-component
            await pageComponentView.openMenu('main');
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentCke.insertTextInCkeEditor(GENERATED_TEXT_1);
            // 4.  Do not save the site, but save new fragment from the just inserted text:
            await pageComponentView.openMenu(GENERATED_TEXT_1);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
            await contentWizard.pause(700);
            // 5. Switch to Fragment wizard:
            await studioUtils.doSwitchToNewWizard();
            // 6. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await pageComponentView.openMenu(GENERATED_TEXT_1);
            // 7. Update the text in the fragment
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT]);
            await textComponentCke.insertTextInCkeEditorSection(GENERATED_TEXT_2);
            // 8. Save the fragment:
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('fragment_txt_updated');
            // 9. Switch to the site again:
            await studioUtils.doSwitchToPrevTab();
            await studioUtils.saveScreenshot('fragment_component_txt');
            // 10. Verify  that text is updated in the Live Form panel"
            let actualTxt = await liveFormPanel.getTextInFragmentComponent();
            assert.equal(actualTxt, GENERATED_TEXT_2, 'Site wizard - Text should be updated in the fragment component');
        });

    // Verify https://github.com/enonic/app-contentstudio/issues/6674
    it(`GIVEN existing text-fragment has been opened WHEN 'Context menu' has been opened in wizard-PCV THEN Inspect, Reset, Edit menu items should be displayed`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open the existing text fragment:
            let fragmentDisplayName = GENERATED_TEXT_1;
            await studioUtils.selectByDisplayNameAndOpenContent(fragmentDisplayName);
            // 2. Expand the context menu in the Wizard Step form:
            await pageComponentsWizardStepForm.openMenu(GENERATED_TEXT_2);
            await studioUtils.saveScreenshot('fragment_txt_context_menu');
            // 3. Verify the menu items:
            let menuItems = await pageComponentsWizardStepForm.getContextMenuItems();
            assert.ok(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET),
                "'Reset' menu item should be present in the context menu");
            assert.ok(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.EDIT),
                "'Edit' menu item should be present in the context menu");
            assert.ok(menuItems.includes(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT),
                "'Inspect' menu item should be present in the context menu");
            assert.equal(menuItems.length, 3, "The only three menu items should be present in the Context Menu");
        });

    it(`GIVEN existing text-fragment has been opened WHEN 'Reset' menu item has been clicked in Context Menu THEN text should be cleared in the input in Live Edit`,
        async () => {
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            let contentWizard = new ContentWizard();
            let liveFormPanel = new LiveFormPanel();
            // 1. Open the existing text fragment:
            let fragmentDisplayName = GENERATED_TEXT_1;
            await studioUtils.selectByDisplayNameAndOpenContent(fragmentDisplayName);
            await contentWizard.switchToLiveEditFrame();
            // 2. Verify that expected text is present in the Live Edit:
            let actualText1 = await liveFormPanel.getTextInTextComponent();
            assert.equal(actualText1, GENERATED_TEXT_2, 'Fragment wizard - Expected text should be present in Live Edit')
            await contentWizard.switchToMainFrame();
            // 3. Expand the context menu in the Wizard Step form:
            await pageComponentsWizardStepForm.openMenu(GENERATED_TEXT_2);
            // 4. Click on 'Reset' menu item:
            await pageComponentsWizardStepForm.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await studioUtils.saveScreenshot('fragment_txt_reset');
            await contentWizard.switchToLiveEditFrame();
            // 5. Verify that the text component is cleared
            await liveFormPanel.waitForTextComponentEmpty(0);
            await contentWizard.switchToMainFrame();
            await contentWizard.waitForSaveButtonEnabled();
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
