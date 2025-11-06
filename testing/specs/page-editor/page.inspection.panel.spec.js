/**
 * Created on 03.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const PageWidgetPanel = require('../../page_objects/wizardpanel/liveform/page.widget.context.window');

describe('page.inspection.panel.spec: tests for page-inspection panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;
    const EXPECTED_QUESTION = 'This will discard all the page modifications. Are you sure?';

    it("GIVEN new site with controller is created WHEN 'Inspect' link has been clicked THEN Inspection tab should be opened",
        async () => {
            let contentWizard = new ContentWizard();
            let pageWidgetPanel = new PageWidgetPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test site', [appConst.TEST_APPS_NAME.APP_CONTENT_TYPES], CONTROLLER_NAME);
            // 1. Open site-wizard and save new site with a controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            // 2. Verify that the site should be automatically saved after selecting an application:
            await contentWizard.waitForNotificationMessage();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 3. Verify that the site should be saved automatically after selecting a controller
            await pageInspectionPanel.selectPageTemplateOrController(CONTROLLER_NAME);
            await contentWizard.waitForSaveButtonDisabled();
            // 4. Click on the Inspect tab in Inspect Panel
            await pageWidgetPanel.clickOnTabBarItem(appConst.CONTEXT_WINDOW_TABS.INSPECT);
            // 5. Click on dropdown handle and expand options:
            let actualController = await pageInspectionPanel.getSelectedPageController();
            assert.equal(actualController, CONTROLLER_NAME, 'Expected page controller should be selected');
        });

    it("GIVEN 'Page Inspection' tab is opened WHEN another ('Automatic') option has been selected THEN 'Confirmation Dialog' with the question should appear",
        async () => {
            let pageWidgetPanel = new PageWidgetPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            let contentWizard = new ContentWizard();
            // 1. Open existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 2. Click on 'Inspect' tab in Inspection panel:
            await pageWidgetPanel.clickOnTabBarItem(appConst.CONTEXT_WINDOW_TABS.INSPECT);
            // 3. Select another controller(Automatic) and click on OK:
            await pageInspectionPanel.selectPageTemplateOrController('Automatic');
            // 4. Confirmation dialog should appear:
            await confirmationDialog.waitForDialogOpened();
            // 5. Verify the question: 'Switching to a page template will discard all the custom changes made to the page. Are you sure?'
            let question = await confirmationDialog.getQuestion();
            assert.equal(question, EXPECTED_QUESTION, 'Expected question should be displayed in the dialog');
        });

    it("GIVEN 'Page Inspection' tab is opened WHEN 'Automatic' option has been selected in Page widget THEN 'Context window' should be closed AND Details panel should be loaded",
        async () => {
            let pageWidgetPanel = new PageWidgetPanel();
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            // 1. Open existing site:
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 2. Click on 'Inspect' tab in Inspection panel:
            await pageWidgetPanel.clickOnTabBarItem(appConst.CONTEXT_WINDOW_TABS.INSPECT);
            // 3. Select new controller(Automatic)
            await pageInspectionPanel.selectPageTemplateOrController('Automatic');
            // 4. Click on 'Yes' button
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await studioUtils.saveScreenshot('controller_automatic');
            // 5. Verify that the content is automatically saved:
            await contentWizard.waitForNotificationMessage();
            // Verify - 'Save' button remains enabled after switching templates #6484
            await contentWizard.waitForSaveButtonDisabled();
            await wizardContextWindow.getSelectedOptionInWidgetSelectorDropdown();
            // 6. Verify that 'Details' widget loads after selecting 'Automatic'(no default template) controller:
            let selectedOption = await wizardContextWindow.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(selectedOption, appConst.WIDGET_SELECTOR_OPTIONS.DETAILS, `'Details' widget should be in the widget selector`);
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
