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
const contentBrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const contentFilterPanel = require('../page_objects/browsepanel/content.filter.panel');
const studioUtils = require('../libs/studio.utils.js');
const contentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const pageComponentView = require("../page_objects/wizardpanel/liveform/page.components.view");
const liveFormPanel = require("../page_objects/wizardpanel/liveform/live.form.panel");
const wizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const wizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');


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
            () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                return studioUtils.doAddSite(SITE).then(() => {
                }).then(() => {
                    studioUtils.saveScreenshot(displayName + '_created');
                    return studioUtils.findAndSelectItem(SITE.displayName);
                }).then(() => {
                    return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
                }).then(isDisplayed => {
                    assert.isTrue(isDisplayed, 'site should be listed in the grid');
                });
            });

        it(`Precondition: new template has been added`,
            () => {
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
            () => {
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    return contentWizard.doUnlockLiveEditor();
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.openMenu("main");
                }).then(() => {
                    return pageComponentView.selectMenuItem(["Insert", "Image"]);
                }).then(() => {
                    return liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    return pageComponentView.openMenu(IMAGE_DISPLAY_NAME);
                }).then(() => {
                    return pageComponentView.clickOnMenuItem(appConstant.MENU_ITEMS.SAVE_AS_FRAGMENT);
                }).pause(3000).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    console.log("details panel is opened");
                    return wizardDetailsPanel.openDependencies();
                }).then(() => {
                    studioUtils.saveScreenshot('site_wizard_dependencies');
                    return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonVisible(),
                        '`Show outbound` button should be present on the widget, because one fragment has been created');
                }).then(() => {
                    return assert.eventually.isFalse(wizardDependenciesWidget.isInboundButtonVisible(),
                        '`Show Inbound` button should not be present, because the site has no inbound dependencies');
                })
            });

        it(`GIVEN existing site with fragment WHEN fragment has been selected AND Dependencies widget opened  THEN 'Show Outbound' button should be present AND 'Show Inbound' should be present`,
            () => {
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    return wizardDetailsPanel.openDependencies();
                }).then(() => {
                    studioUtils.saveScreenshot('fragment_wizard_dependencies');
                    return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonVisible(),
                        'Show outbound button should be present on the widget, because the fragment was created from an image');
                }).then(() => {
                    return assert.eventually.isTrue(wizardDependenciesWidget.isInboundButtonVisible(),
                        '`Show Inbound` button should be present, because the fragment has parent site');
                })
            });

        it(`GIVEN existing site with fragment WHEN 'Show Outbound' button has been pressed THEN  Dependencies Section should appear in the new browser-tab`,
            () => {
                return studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME).then(() => {
                    return contentWizard.openDetailsPanel();
                }).then(() => {
                    return wizardDetailsPanel.openDependencies();
                }).then(() => {
                    return wizardDependenciesWidget.clickOnShowOutboundButton();
                }).pause(1000).then(() => {
                    return studioUtils.doSwitchToNextTab();
                }).then(() => {
                    return assert.eventually.isTrue(contentFilterPanel.waitForDependenciesSectionVisible(),
                        '`Dependencies Section` should be present, in the filter panel');
                }).then(() => {
                    studioUtils.saveScreenshot('outbound_dep_in_new_tab');
                    return contentBrowsePanel.getDisplayNamesInGrid();
                }).then(result => {
                    assert.isTrue(result[0] == IMAGE_DISPLAY_NAME, 'correct display name of dependency');
                    assert.isTrue(result.length == 1, 'Only one dependency should be present in the grid');
                })
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
