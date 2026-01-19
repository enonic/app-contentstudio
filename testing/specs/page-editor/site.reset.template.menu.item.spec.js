/**
 * Created on 06.09.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const TextComponentCke = require('../../page_objects/components/text.component');
const appConst = require('../../libs/app_const');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const TextComponentInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/text.component.inspect.panel');

describe('site.reset.template.menu.item.spec - resets a site to default template', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let CONTROLLER_NAME = 'Country Region';
    let TEST_TEXT = 'test text';
    let TEMPLATE;
    const CONFIRMATION_QUESTION='This will detach the page from its template. Are you sure?'

    it(`Preconditions: new site and a page template with a text component should be added`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let textComponentInspectionPanel = new TextComponentInspectionPanel();

            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.MY_FIRST_APP]);
            await studioUtils.doAddSite(SITE);
            // 1. Expand the site and add a template:
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, 'Site', CONTROLLER_NAME);
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            await contentWizard.typeData(TEMPLATE);
            let pageInspectTab = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectTab.selectPageTemplateOrController(CONTROLLER_NAME);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the item and open Context Menu:
            await pageComponentView.openMenu('country');
            // 4. Insert Text Component with 'test text' and save it:
            await pageComponentView.selectMenuItem(['Insert', 'Text']);
            await textComponentInspectionPanel.clickInTextArea();
            await textComponentInspectionPanel.typeTextInEditor(TEST_TEXT);
            await contentWizard.waitAndClickOnSave();
        });

    // New test for  8607 Universal Editor
    it(`GIVEN open a site with a template WHEN Customize button has been pressed in Inspect tab THEN Confirmation modal dialog should be opened`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardContextPanel = new WizardContextPanel();
            let pageComponentView = new PageComponentView();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open the site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Details widget should be opened by default:
            let selectedWidgetOption = await wizardContextPanel.getSelectedOptionInWidgetSelectorDropdown();
            assert.equal(selectedWidgetOption, appConst.WIDGET_SELECTOR_OPTIONS.DETAILS, "'Details' selected option should be in the widget selector");
            // 3. Select 'Page' option in the widget selector:
            await wizardContextPanel.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            // 4. Verify that Automatic option is selected in the controller selector:
            let selectedControllerOption = await pageInspectionPanel.getSelectedPageController();
            assert.equal(selectedControllerOption, 'Automatic', `'Automatic' controller should be selected in the controller selector`);
            // 5. Verify the 'Customize Page' button is displayed and enabled:
            await pageInspectionPanel.waitForCustomizePageButtonDisplayed();
            // 6. Click on 'Customize Page' button:
            await pageInspectionPanel.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            let questionActual = await confirmationDialog.getQuestion();
            // 7. Verify that confirmation dialog is opened with correct question:
            assert.equal(questionActual, CONFIRMATION_QUESTION, 'Confirmation dialog question is incorrect');
            // 8. Click on 'No' button in the confirmation dialog:
            await confirmationDialog.clickOnNoButton();
            await confirmationDialog.waitForDialogClosed();
            await contentWizard.waitForSaveButtonDisabled();
            // 9. 'Page Component View' modal dialog should not be displayed, because the site was not customized:
            await pageComponentView.waitForNotDisplayed();
        });

    it(`GIVEN text component has been removed in 'Page Component View' WHEN 'Reset' menu item has been clicked in 'Page Component View' THEN site should be reset to default template`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let pageComponentView = new PageComponentView();
            // 1. Open the site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on Customize button and confirm the action
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToMainFrame();
            await pageInspectionPanel.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 3. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 4. Click on the item and open Context Menu:
            await pageComponentView.openMenu(TEST_TEXT);
            // 5. Remove the text component and save it
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.REMOVE]);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('site_txt_component_customized');
            // 6. Verify that  number of components is reduced:
            let result1 = await pageComponentView.getPageComponentsDisplayName();
            assert.equal(result1.length, 2, 'Number of items in Component View should be reduced after the removing');
            // 7. Expand the controller's menu(the root element) and click on 'Reset' item
            await pageComponentView.openMenu(CONTROLLER_NAME);
            await pageComponentView.selectMenuItem([appConst.COMPONENT_VIEW_MENU_ITEMS.RESET]);
            await pageComponentView.pause(1000);
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 8. Click on 'Page Settings' menu item in Live Edit frame:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            await contentWizard.switchToMainFrame();
            // 9. Click on 'Customize' button in Inspect tab
            await pageInspectionPanel.clickOnCustomizePageButton();
            await confirmationDialog.waitForDialogOpened();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('site_reset_to_template');
            // 10. Verify that the site is reset to default template:
            let result2 = await pageComponentView.getPageComponentsDisplayName();
            assert.equal(result2.length, 3,
                "Number of items in 'Component View' should be increased after the resetting to the default template");
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
