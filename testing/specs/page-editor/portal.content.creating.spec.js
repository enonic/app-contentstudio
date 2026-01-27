/**
 * Created on 01.09.2021
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const CountryFormPanel = require('../../page_objects/wizardpanel/country.form.panel');
const CityCreationPage = require('../../page_objects/wizardpanel/city.creation.page');
const LauncherPanel = require('../../page_objects/launcher.panel');
const CityFormPanel = require('../../page_objects/wizardpanel/city.form.panel');
const appConst = require('../../libs/app_const');
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const PartInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/part.inspection.panel');

describe('portal.content.creating.spec - tests for portal creating', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const COUNTRY_NAME = 'Norway';
    const CITY_NAME = 'lillestrom';
    const COUNTRY_CONTENT_PATH = appConst.generateRandomName('Norway');
    const SUPPORT = 'Country';
    let TEMPLATE;
    const CONTROLLER = 'Country Region';
    const COUNTRY_TEMPLATE_NAME = contentBuilder.generateRandomName('template');
    const CITY_POPULATION = '100000';

    it(`Precondition: new site and template with 'City Creation' should be created`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageComponentView = new PageComponentView();
            let partInspectionPanel = new PartInspectionPanel();
            let pageInspectionPanel = new PageInspectionPanel();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'My first Site', [appConst.MY_FIRST_APP]);
            // add new site:
            await studioUtils.doAddSite(SITE);

            TEMPLATE = contentBuilder.buildPageTemplate(COUNTRY_TEMPLATE_NAME, SUPPORT, CONTROLLER);
            // 1. Expand the site and open wizard for new page-template:
            await studioUtils.doOpenPageTemplateWizard(SITE.displayName);
            await contentWizard.typeData(TEMPLATE);

            let wizardContextWindow = await contentWizard.openContextWindow();
            await wizardContextWindow.selectItemInWidgetSelector(appConst.WIDGET_SELECTOR_OPTIONS.PAGE);
            await pageInspectionPanel.selectPageTemplateOrController(TEMPLATE.data.controllerDisplayName);
            // 2. Click on minimize-toggle  expand Live Edit and show Page Component modal dialog:
            await contentWizard.clickOnMinimizeLiveEditToggler();
            // 3.Click on the country item and open Context Menu:
            await pageComponentView.openMenu('country');
            await pageComponentView.selectMenuItem(['Insert', 'Part']);
            await partInspectionPanel.waitForOpened();
            await partInspectionPanel.typeNameAndSelectPart(appConst.PART_NAME.MY_FIRST_APP_CITY_CREATION);
            await studioUtils.saveScreenshot('template_city_creation_part');
            // The content should be automatically saved after selecting a part
            await contentWizard.waitForSaveButtonDisabled();
        });

    it(`GIVEN 'City Creation' page is opened in draft branch WHEN city content has been created THEN expected city content should be displayed in the grid`,
        async () => {
            let contentWizard = new ContentWizard();
            let countryFormPanel = new CountryFormPanel();
            let cityCreationPage = new CityCreationPage();
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'Country');
            // 1. Save new Norway content:
            await contentWizard.typeInPathInput(COUNTRY_CONTENT_PATH);
            await contentWizard.typeDisplayName(COUNTRY_NAME);
            await countryFormPanel.typeDescription('Norway country');
            await countryFormPanel.typePopulation('7000000');
            await contentWizard.waitAndClickOnSave();
            await contentWizard.waitForNotificationMessage();
            // 2. Open Norway-country content in 'draft' branch - 'City Creation' page should be loaded
            await studioUtils.openResourceInDraft(SITE.displayName + '/' + COUNTRY_CONTENT_PATH);
            // 3. Fill in the city form and click on SUBMIT button:
            await cityCreationPage.typeCityName(CITY_NAME);
            await cityCreationPage.typeLocation('1,1');
            await cityCreationPage.typePopulation(CITY_POPULATION);
            await studioUtils.saveScreenshot('city_creation_page');
            await cityCreationPage.clickOnSubmitButton();
            // 4. Navigate to content browse panel again:
            await studioUtils.doSwitchToHome();
            let launcherPanel = new LauncherPanel();
            await launcherPanel.clickOnContentStudioLink();
            await launcherPanel.pause(1000);
            await studioUtils.doSwitchToContentBrowsePanel();
            // 5. Verify that new city content is present in the grid:
            let cityFormPanel = new CityFormPanel();
            // 6. Open just created city content and verify the population:
            await studioUtils.openContentAndSwitchToTabByDisplayName(CITY_NAME, CITY_NAME + " " + appConst.TAB_TITLE_PART);
            await studioUtils.saveScreenshot('verify_city_wizard');
            let actualPopulation = await cityFormPanel.getPopulation();
            assert.equal(actualPopulation, CITY_POPULATION, 'Expected population should be present in the wizard page');
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
