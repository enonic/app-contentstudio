/**
 * Created on 10.02.2022
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const PageTemplateWidget = require('../../page_objects/browsepanel/detailspanel/page.template.widget');
const contentBuilder = require('../../libs/content.builder');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const PageTemplateForm = require('../../page_objects/wizardpanel/page.template.form.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');

describe('page.template.widget.spec: Tests for page template widget in Details Panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const COUNTRY_LIST_CONTROLLER = 'Country List';
    let SITE;
    const TEMPLATE_NAME = appConst.generateRandomName('template');

    it("WHEN image content is selected THEN 'Page Template is not used' should be present",
        async () => {
            let pageTemplateWidget = new PageTemplateWidget();
            await studioUtils.findAndSelectItem(appConst.TEST_IMAGES.HAND);
            await studioUtils.saveScreenshot("template_widget_image");
            await pageTemplateWidget.waitForNoTemplateMessageDisplayed();
        });

    it("WHEN site with a controller has been selected THEN 'Custom' template should be displayed in the widget",
        async () => {
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'My first Site', [appConst.MY_FIRST_APP], COUNTRY_LIST_CONTROLLER);
            await studioUtils.doAddSite(SITE);
            let pageTemplateWidget = new PageTemplateWidget();
            // 1. Select a site with a controller
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.saveScreenshot('template_widget_site');
            // 2. Verify that controller's name is displayed in the widget
            let controllerName = await pageTemplateWidget.getControllerName();
            assert.equal(controllerName, COUNTRY_LIST_CONTROLLER, "Expected controller name should be displayed in the widget");
            // 7. Verify that 'Custom' controller type is displayed:
            let type = await pageTemplateWidget.getControllerType();
            assert.equal(type, 'Custom', "'Custom' template should be present in the widget");
        });

    it("WHEN site with a template has been selected THEN link to template should be displayed in the widget",
        async () => {
            let contentWizard = new ContentWizard();
            let pageTemplateForm = new PageTemplateForm();
            let displayName = appConst.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'My first Site', [appConst.MY_FIRST_APP]);
            // 1. Add a site:
            await studioUtils.doAddSite(SITE);
            // 2. Open new wizard for template
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            // 3. Fill in the name input, select a page descriptor:
            await contentWizard.typeDisplayName(TEMPLATE_NAME);
            // 4.Select 'Site' in support selector:
            await pageTemplateForm.filterOptionsAndSelectSupport(appConst.TEMPLATE_SUPPORT.SITE);
            let pageInspectionPanel = new PageInspectionPanel();
            // Open 'Page' widget:
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(COUNTRY_LIST_CONTROLLER);
            await contentWizard.waitForSaveButtonDisabled();

            await studioUtils.doCloseCurrentBrowserTab();
            await studioUtils.doSwitchToContentBrowsePanel();
            // 5. Select the site:
            let pageTemplateWidget = new PageTemplateWidget();
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.saveScreenshot('template_widget_site_with_template');
            // 6. Verify that the template's name is displayed in the link
            let templateName = await pageTemplateWidget.getControllerLink();
            assert.equal(templateName, TEMPLATE_NAME, "Expected template name should be displayed in the template widget");
            // 7. Verify that 'Automatic' controller type is displayed:
            let type = await pageTemplateWidget.getControllerType();
            assert.equal(type, 'Automatic', "Automatic template should be present in the widget");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(function () {
        return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
    });
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
