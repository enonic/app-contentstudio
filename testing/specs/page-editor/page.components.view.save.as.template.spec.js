/**
 * Created on 19.08.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('Save as Template specification', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let COUNTRY_LIST_CONTROLLER = 'Country List';

    it("GIVEN site with a controller has been created WHEN Page Component View has been opened and menu in the root element has been opened THEN expected menu items should be present in the menu",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'My first Site', [appConst.MY_FIRST_APP], COUNTRY_LIST_CONTROLLER);
            // 1. Open site-wizard and save new site with a controller:
            await studioUtils.openContentWizard(appConst.contentTypes.SITE);
            await contentWizard.typeData(SITE);
            // Verify that the site should be automatically saved after selecting an application:
            await contentWizard.waitForNotificationMessage();
            // Verify that the site should be saved automatically after selecting a controller
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(COUNTRY_LIST_CONTROLLER);
            await contentWizard.waitForSaveButtonDisabled();
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open the menu in the root element:
            await pageComponentView.openMenu(COUNTRY_LIST_CONTROLLER);
            // 4. Verify menu items
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.RESET);
            await pageComponentView.waitForMenuItemPresent(appConst.COMPONENT_VIEW_MENU_ITEMS.INSPECT);
        });

    it("GIVEN existing site has been opened WHEN expand the menu in the root element and click on 'Save as Template' menu item THEN wizard for new page template should be loaded",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let pageTemplateForm = new PageTemplateForm();
            // 1. Open existing site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Open the menu in the root element:
            await pageComponentView.openMenu(COUNTRY_LIST_CONTROLLER);
            await studioUtils.saveScreenshot(`save_as_template_0`);
            // 4. Click on 'Save as Template' menu item
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE);
            await pageComponentView.pause(500);
            await studioUtils.doSwitchToNextTab();
            // 5. Verify the path of new template that was opened in new browser tab:
            await contentWizard.waitForOpened();
            await studioUtils.saveScreenshot('save_as_template1');
            let expectedPath = 'template-' + SITE.displayName;
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, expectedPath, "Template's path should contain the name of its site");
            // 6. Verify the support selected option:
            let support = await pageTemplateForm.getSupportSelectedOptions();
            assert.equal(support.length, 1, 'Single item should be in support form');
            assert.equal(support[0], 'Site', 'Site option should be selected in the selector');
        });

    it("GIVEN 'Page Component View' has been opened AND the root element has been clicked WHEN 'Save as Template' menu item has been clicked THEN wizard for new page template should be loaded",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let pageTemplateForm = new PageTemplateForm();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open existing site
            await studioUtils.selectAndOpenContentInWizard(SITE.displayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Click on the root element in the modal dialog:
            await pageComponentView.clickOnComponent(COUNTRY_LIST_CONTROLLER);
            await studioUtils.saveScreenshot('controller_inspection_panel');
            // 4. Click on 'Save as Template' menu item
            await pageComponentView.openMenu(COUNTRY_LIST_CONTROLLER);
            await pageComponentView.clickOnMenuItem(appConst.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_TEMPLATE);
            await studioUtils.doSwitchToNextTab();
            // 5. Verify the path of new template that was opened in new browser tab:
            await contentWizard.waitForOpened();
            await studioUtils.saveScreenshot('save_as_template2');
            let expectedPath = 'template-' + SITE.displayName + '-1';
            let actualPath = await contentWizard.getPath();
            assert.equal(actualPath, expectedPath, `Template's path should contain the name of its site`);
            // 6. Verify the support selected option:
            let support = await pageTemplateForm.getSupportSelectedOptions();
            assert.equal(support.length, 1, `Single item should be in support form`);
            assert.equal(support[0], 'Site', `Site option should be selected in the selector`);
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
