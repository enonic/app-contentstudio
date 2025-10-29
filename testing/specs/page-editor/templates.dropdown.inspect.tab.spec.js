/**
 * Created on 29.10.2025
 */
const webDriverHelper = require('../../libs/WebDriverHelper');
const assert = require('node:assert');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const appConst = require('../../libs/app_const');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');

describe('template.dropdown.inspect.tab.spec: tests for checking templates in Page widget, Inspect Page panel', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let IMPORTED_SITE_NAME = 'site040269';
    let TEMPLATE;
    let FOLDER;
    const SUPPORT_FOLDER = 'Folder';
    const CONTROLLER_NAME = appConst.CONTROLLER_NAME.MAIN_REGION;

    it(`Precondition: new template(supports site) should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            let templateName = contentBuilder.generateRandomName('template');
            TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT_FOLDER, CONTROLLER_NAME);
            // add a page template for Folder content type:
            await studioUtils.doAddPageTemplate(IMPORTED_SITE_NAME, TEMPLATE);
            // Add new child folder to the site:
            await contentBrowsePanel.clickOnRowByDisplayName(IMPORTED_SITE_NAME);
            let displayName = appConst.generateRandomName('folder');
            FOLDER = contentBuilder.buildFolder(displayName);
            await studioUtils.doAddFolder(FOLDER);
        });

    it(`GIVEN existing folder has been opened WHEN 'Page' widget has been opened AND template-dropdown has been expanded THEN template created in the previous test should be present in the dropdown options`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            // 1. Open the existing folder(page template supports 'Folder' content type
            await studioUtils.selectAndOpenContentInWizard(FOLDER.displayName);
            // 2. Click on 'Show Page Editor' button and show Page Editor in the wizard:
            await contentWizard.clickOnPageEditorToggler();
            let contextWindow = await contentWizard.openContextWindow();
            await contextWindow.openPageWidget();
            // 3. Expand the template-dropdown in 'Inspect' tab and verify the just created template in the options:
            let actualOptions = await pageInspectionPanel.getOptionsNameInPageTemplateDropdown();
            await studioUtils.saveScreenshot('template_dropdown_options');
            assert.ok(actualOptions.includes(TEMPLATE.displayName), 'Template should be present in the dropdown options')
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
