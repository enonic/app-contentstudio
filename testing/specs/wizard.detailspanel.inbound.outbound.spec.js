/**
 * Created on 22.08.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const ContentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const ContentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const PageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../page_objects/wizardpanel/liveform/live.form.panel");
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');


describe('wizard.detailspanel.inbound.outbound: select a content with inbound and outbound dependencies and check dependencies',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let TEMPLATE;
        let SUPPORT = 'Site';
        let CONTROLLER_NAME = 'main region';
        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                await studioUtils.doAddSite(SITE);
            });

        it(`Precondition: new template has been added`,
            () => {
                let contentBrowsePanel = new ContentBrowsePanel();
                let templateName = contentBuilder.generateRandomName('template');
                TEMPLATE = contentBuilder.buildPageTemplate(templateName, SUPPORT, CONTROLLER_NAME);
                return studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE).then(() => {
                    return studioUtils.findAndSelectItem(TEMPLATE.displayName);
                }).then(() => {
                    return contentBrowsePanel.waitForContentDisplayed(TEMPLATE.displayName);
                }).then(isDisplayed => {
                    assert.isTrue(isDisplayed, 'template should be listed in the grid');
                });
            });

        it(`GIVEN existing site is opened WHEN an image has been inserted and saved as fragment AND Dependencies widget opened in the site-wizard THEN 'Show Outbound' button should be present but 'Show Inbound' should be hidden`,
            async () => {
                let siteWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let liveFormPanel = new LiveFormPanel();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                //Select and open the site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await siteWizard.doUnlockLiveEditor();

                await siteWizard.switchToMainFrame();
                //Open Page Component View dialog and click on Insert Image menu item:
                await siteWizard.clickOnShowComponentViewToggler();
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);

                //Select the image in the image-selector:
                await liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);

                await siteWizard.switchToMainFrame();
                //open the context menu:
                await pageComponentView.openMenu(IMAGE_DISPLAY_NAME);
                //Click on 'Save as Fragment' menu item:
                await pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
                await pageComponentView.pause(3000);

                //open Details panel in the site-wizard:
                await siteWizard.openDetailsPanel();
                await wizardDetailsPanel.openDependencies();
                studioUtils.saveScreenshot('site_wizard_dependencies');
                //`Show outbound` button should be present in the widget, because new fragment has been created in the site wizard'
                await wizardDependenciesWidget.waitForOutboundButtonVisible();

                let isVisible = wizardDependenciesWidget.isInboundButtonVisible();
                assert.isTrue(isVisible, '`Show Inbound` button should not be present, because the site has no inbound dependencies');
            });

        it(`GIVEN existing site with fragment WHEN fragment has been selected AND Dependencies widget opened  THEN 'Show Outbound' button should be present AND 'Show Inbound' should be present`,
            () => {
                let wizardDetailsPanel = new WizardDetailsPanel();
                let contentWizard = new ContentWizard();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    return wizardDetailsPanel.openDependencies();
                }).then(() => {
                    studioUtils.saveScreenshot('fragment_wizard_dependencies');
                    return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonVisible(),
                        'Show outbound button should be present on the widget, because the fragment was created from an image');
                }).then(() => {
                    return assert.eventually.isTrue(wizardDependenciesWidget.waitForInboundButtonVisible(),
                        '`Show Inbound` button should be present, because the fragment has parent site');
                })
            });

        it(`GIVEN existing site with fragment WHEN 'Show Outbound' button has been pressed THEN  Dependencies Section should appear in the new browser-tab`,
            () => {
                let contentWizard = new ContentWizard();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                let contentFilterPanel = new ContentFilterPanel();
                let contentBrowsePanel = new ContentBrowsePanel();
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    return wizardDetailsPanel.openDependencies();
                }).then(() => {
                    return wizardDependenciesWidget.clickOnShowOutboundButton();
                }).then(() => {
                    return wizardDependenciesWidget.pause(1000);
                }).then(() => {
                    return studioUtils.doSwitchToNextTab();
                }).then(() => {
                    return assert.eventually.isTrue(contentFilterPanel.waitForDependenciesSectionVisible(),
                        '`Dependencies Section` should be present, in the filter panel');
                }).then(() => {
                    studioUtils.saveScreenshot('outbound_dep_in_new_tab');
                    return contentBrowsePanel.getDisplayNamesInGrid();
                }).then(result => {
                    assert.isTrue(result[0] == IMAGE_DISPLAY_NAME, 'expected display name of dependency');
                    assert.equal(result.length, 1, 'One content should be present in the grid');
                })
            });

        it(`GIVEN existing site with fragment is opened WHEN fragment has been removed in 'Page Component View'  THEN 'No outgoing dependencies' should appears`,
            () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    return wizardDetailsPanel.openDependencies();
                }).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.openMenu(IMAGE_DISPLAY_NAME);
                }).then(() => {
                    return pageComponentView.selectMenuItem(["Remove"]);
                }).then(() => {
                    return contentWizard.waitAndClickOnSave();
                }).then(() => {
                    studioUtils.saveScreenshot('fragment_removed_dependencies');
                    return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonNotVisible(),
                        'Show outbound button should disappears on the widget, because the fragment was removed in Page Editor');
                });
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification is starting: ' + this.title);
        });
    });
