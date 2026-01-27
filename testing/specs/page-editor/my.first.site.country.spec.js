/**
 * Created on 28.07.2021.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const CountryForm = require('../../page_objects/wizardpanel/country.form.panel');
const CityForm = require('../../page_objects/wizardpanel/city.form.panel');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const appConst = require('../../libs/app_const');
const PageComponentsWizardStepForm = require('../../page_objects/wizardpanel/wizard-step-form/page.components.wizard.step.form');
const ContentPublishDialog = require('../../page_objects/content.publish.dialog');
const ContentItemPreviewPanel = require('../../page_objects/browsepanel/contentItem.preview.panel');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const PartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/part.inspection.panel');
const CityListPartInspectionPanel= require('../../page_objects/wizardpanel/liveform/inspection/city.list.part.inspection.panel');

describe('my.first.site.country.spec - Create a site with country content', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    let TEMPLATE;
    let USA_CONTENT_NAME;
    const USA_DESCRIPTION = 'USA country';
    const SF_DISPLAY_NAME = 'San Francisco';
    const USA_POPULATION = '300 000 000';
    const PAGE_CONTROLLER_COUNTRY = 'Country Region';
    const COUNTRY_PART = 'Country';
    const SF_LOCATION = '37.7833,-122.4167';
    const SF_NAME = contentBuilder.generateRandomName('sf');
    const SF_POPULATION = '837,442';
    const NEW_SF_POPULATION = '900,000';
    const NEW_SF_POPULATION_WITH_LABEL = 'Population: 900,000';
    const COUNTRY_TEMPLATE_NAME = contentBuilder.generateRandomName('template');

    it(`Precondition: new site and template with 'country-part' and 'city list' should be created`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let liveFormPanel = new LiveFormPanel();
            let partInspectionPanel = new PartInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'My first Site', [appConst.MY_FIRST_APP]);
            await studioUtils.doAddSite(SITE);

            TEMPLATE = contentBuilder.buildPageTemplate(COUNTRY_TEMPLATE_NAME, 'Country', PAGE_CONTROLLER_COUNTRY);
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            await contentWizard.typeData(TEMPLATE);
            let pageInspectionPanel = new PageInspectionPanel();
            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(TEMPLATE.data.controllerDisplayName);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the country item and open Context Menu:
            await pageComponentView.openMenu('country');
            await pageComponentView.selectMenuItem(['Insert', 'Part']);
            await partInspectionPanel.typeNameAndSelectPart(COUNTRY_PART);
            await contentWizard.switchToMainFrame();
            // 4. Insert 'City list' part
            await pageComponentView.openMenu('country');
            await pageComponentView.selectMenuItem(['Insert', 'Part']);
            await partInspectionPanel.typeNameAndSelectPart(appConst.PART_NAME.MY_FIRST_APP_CITY_LIST);
            await contentWizard.switchToMainFrame();
            // the site should be  automatically saved:
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('country_template_saved');
        });

    it(`WHEN required input is not filled in in the page template THEN the page template should be invalid in Grid`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            await studioUtils.findAndSelectItem(COUNTRY_TEMPLATE_NAME);
            // Verify that the page template is invalid (required field in its config)
            //await contentBrowsePanel.waitForRedIconDisplayed(COUNTRY_TEMPLATE_NAME);
        });

    it(`WHEN required field has been filled in in the page template config THEN the page template gets valid in Grid`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let cityListPartInspectionPanel = new CityListPartInspectionPanel();
            // 1. Open the template
            await studioUtils.selectAndOpenContentInWizard(COUNTRY_TEMPLATE_NAME);
            // 2. Click on minimize-toggle, expand Live Edit and open Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3. Select the part in PCV
            await pageComponentView.clickOnComponent('City list');
            // 4. Inspect panel should be loaded
            await cityListPartInspectionPanel.waitForLoaded();
            // 5. Fill in the required field:
            await cityListPartInspectionPanel.selectContentInSelector(appConst.TEST_IMAGES.MAN);
            // 6. Save the template
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
        });

    it(`GIVEN new country-content is saved WHEN 'Automatic' is selected AND 'Preview' button has been clicked THEN expected population and description should be loaded in new browser tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let countryForm = new CountryForm();
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            USA_CONTENT_NAME = contentBuilder.generateRandomName('usa');
            // 1. Open new country wizard, type a name, description, population:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'Country');
            await contentWizard.typeDisplayName(USA_CONTENT_NAME);
            await countryForm.typeDescription(USA_DESCRIPTION);
            await countryForm.typePopulation(USA_POPULATION);
            await studioUtils.saveScreenshot('country_usa');
            // 2. Save and close the wizard:
            await contentWizard.hotKeySaveAndCloseWizard();
            // 3. Select the country-content:
            await studioUtils.findAndSelectItem(USA_CONTENT_NAME);
            // 4. Click on 'Preview' button:
            await contentItemPreviewPanel.clickOnPreviewButton();
            await studioUtils.doSwitchToNextTab();
            await studioUtils.saveScreenshot('usa-country-preview');
            // 5. Verify expected population and description are loaded in the new browser tab:
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes(USA_DESCRIPTION), 'Expected description should be loaded');
            assert.ok(pageSource.includes(USA_POPULATION), 'Expected population should be loaded');
        });

    it(`GIVEN 'San Francisco' city-content is added WHEN USA-country content has been opened in 'draft' THEN expected city population should be loaded in the browser tab`,
        async () => {
            let contentWizard = new ContentWizard();
            let cityForm = new CityForm();
            // 1. Select the USA country-content and open new city-wizard:
            await studioUtils.selectSiteAndOpenNewWizard(USA_CONTENT_NAME, 'City');
            // 2. Type a data and save the city:
            await contentWizard.typeInPathInput(SF_NAME);
            await contentWizard.typeDisplayName(SF_DISPLAY_NAME);
            await cityForm.typeLocation(SF_LOCATION);
            await cityForm.typePopulation(SF_POPULATION);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('sf_saved');
            // 3. Open USA-country content in 'draft'
            await studioUtils.openResourceInDraft(SITE.displayName + '/' + USA_CONTENT_NAME);
            let pageSource = await studioUtils.getPageSource();
            // 4. Verify that expected population of San Francisco is loaded in the browser tab:
            assert.ok(pageSource.includes(SF_POPULATION), 'San Francisco population should be loaded');
        });

    it("GIVEN site is not published yet WHEN USA content has been opened in 'master' THEN '404' page should be loaded",
        async () => {
            await studioUtils.openResourceInMaster(SITE.displayName + '/' + USA_CONTENT_NAME);
            await studioUtils.saveScreenshot('country_site_404');
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes('404 - Not Found'), '404 page should be loaded');
        });

    it("GIVEN site has been published with child items WHEN USA-content has been opened in 'master' THEN expected population and description should be displayed",
        async () => {
            await studioUtils.findAndSelectItem(SITE.displayName);
            let contentBrowsePanel = new ContentBrowsePanel();
            // 1. site has been published with children
            await studioUtils.doMarkAsReadyAndPublishTree();
            await contentBrowsePanel.waitForNotificationMessage();
            await studioUtils.saveScreenshot('country_site_published');
            // 2. Open USA country in master
            await studioUtils.openResourceInMaster(SITE.displayName + '/' + USA_CONTENT_NAME);
            let pageSource = await studioUtils.getPageSource();
            // 3. Verify all data:
            assert.ok(pageSource.includes(USA_DESCRIPTION), 'Expected country description should be loaded');
            assert.ok(pageSource.includes(USA_POPULATION), 'Expected country population should be loaded');
            assert.ok(pageSource.includes(SF_POPULATION), 'Expected San Francisco population should be loaded');
        });

    it("GIVEN population of SF has been updated WHEN USA-content has been opened in 'master' THEN population should not be updated",
        async () => {
            let contentWizard = new ContentWizard();
            let cityForm = new CityForm();
            // 1. Open city content, population of SF has been updated
            await studioUtils.openContentAndSwitchToTabByDisplayName(SF_NAME, SF_DISPLAY_NAME);
            await cityForm.typePopulation(NEW_SF_POPULATION);
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            await studioUtils.saveScreenshot('new_population_saving');
            // 2. Verify that population is not updated in master, because the content is not published now(Modified):
            await studioUtils.openResourceInMaster(SITE.displayName + '/' + USA_CONTENT_NAME);
            await studioUtils.saveScreenshot('new_population_in_master');
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes(SF_POPULATION), "population should not be updated");
        });

    it("GIVEN modified site has been published with child-items WHEN USA-content has been opened in 'master' THEN updated city population should be loaded",
        async () => {
            // 1. modified content has been published
            await studioUtils.findAndSelectItem(SF_NAME);
            let contentBrowsePanel = new ContentBrowsePanel();
            let contentPublishDialog = new ContentPublishDialog();
            await contentBrowsePanel.clickOnMarkAsReadyButton();
            await contentBrowsePanel.waitForNotificationMessage();
            // Verify that `Publish Content` modal dialog is opened:
            await contentPublishDialog.waitForDialogOpened();
            await contentPublishDialog.clickOnPublishNowButton();
            await studioUtils.saveScreenshot('updated_population_published1');
            await contentPublishDialog.waitForDialogClosed();
            await studioUtils.saveScreenshot('updated_population_published2');
            await contentBrowsePanel.pause(500);
            // wait for Published status:
            await contentBrowsePanel.waitForStatus(SF_NAME, appConst.CONTENT_STATUS.PUBLISHED);
            // 2. Open USA country in master branch:
            await studioUtils.openResourceInMaster(SITE.displayName + '/' + USA_CONTENT_NAME);
            await studioUtils.saveScreenshot('master_population_updated');
            // 3. Verify the new population:
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes(NEW_SF_POPULATION_WITH_LABEL), 'updated San Francisco population should be loaded');
        });

    it("GIVEN just one resource(page template) has been unpublished WHEN USA-content has been opened in 'master' THEN '404' page should be loaded",
        async () => {
            await studioUtils.findAndSelectItem(COUNTRY_TEMPLATE_NAME);
            let contentBrowsePanel = new ContentBrowsePanel();
            let unpublishDialog = await contentBrowsePanel.clickOnUnpublishButton();
            // 1. Unpublish the template:
            await unpublishDialog.clickOnUnpublishButton();
            await contentBrowsePanel.waitForNotificationMessage();
            // 2. Open USA country in master
            await studioUtils.openResourceInMaster(SITE.displayName + '/' + USA_CONTENT_NAME);
            await studioUtils.saveScreenshot('master_404_err');
            // 3. Verify the error page
            let pageSource = await studioUtils.getPageSource();
            assert.ok(pageSource.includes('404 - Not Found'), 'expected error page with should be loaded');
        });

    it("GIVEN USA content has been opened AND 'Customize Page' button has been pressed WHEN 'Page Component View' has been opened THEN expected components should be displayed in the dialog",
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let pageInspectionPanel = new PageInspectionPanel();
            await studioUtils.selectAndOpenContentInWizard(USA_CONTENT_NAME);
            // 1. Open USA country content:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            await contentWizard.pause(1000);
            // 2. 'Page Component View' modal dialog should not be displayed, because the content is not customized:
            await pageComponentView.waitForNotDisplayed();
            // 3. Switch to LiveEdit frame and click on 'Page Settings' menu item in Live Edit frame:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            // 4. Switch to parent frame:
            await contentWizard.switchToParentFrame();
            // 4. Click on 'Customize Page' button and click 'Yes' in confirmation dialog:
            await pageInspectionPanel.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 5. Verify that Page Component View modal dialog loads automatically after clicking on 'customize'
            await pageComponentView.waitForLoaded();
            await studioUtils.saveScreenshot('country_pcv');
            let result = await pageComponentView.getPageComponentsDisplayName();
            assert.ok(result.includes(PAGE_CONTROLLER_COUNTRY), "'Country Region'  should be present in the dialog");
            assert.ok(result.includes('City list'), "'City list' part should be present in the dialog");
            assert.ok(result.includes('Country'), "'Country part' should be present in the dialog");
        });

    it("WHEN USA content has been opened AND 'Customize Page' button has been pressed THEN expected components should be displayed in the 'Wizard Page Component step'",
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let pageComponentsWizardStepForm = new PageComponentsWizardStepForm();
            // 1. Open USA country content:
            await studioUtils.selectAndOpenContentInWizard(USA_CONTENT_NAME);
            // 2. Click on 'Page settings' menu item in 'Live Edit' frame:
            await contentWizard.openLockedSiteContextMenuClickOnPageSettings();
            // 3. Switch to main frame:
            await contentWizard.switchToMainFrame();
            // 4. Click on 'Customize Page' button and click 'No' in confirmation dialog:
            await pageInspectionPanel.clickOnCustomizePageButton();
            let confirmationDialog = new ConfirmationDialog();
            await confirmationDialog.clickOnYesButton();
            await confirmationDialog.waitForDialogClosed();
            // 4. Verify that 'Page Component View' wizard step is displayed:
            let result = await pageComponentsWizardStepForm.getPageComponentsDisplayName();
            assert.ok(result.includes(PAGE_CONTROLLER_COUNTRY), 'template(top component)  should be present in the dialog');
            assert.ok(result.includes('City list'), 'City list part should be present in the dialog');
            assert.ok(result.includes('Country'), 'Country part should be present in the dialog');
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
