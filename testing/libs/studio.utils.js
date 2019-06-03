/**
 * Created on 12/2/2017.
 */
const LauncherPanel = require('../page_objects/launcher.panel');
const HomePage = require('../page_objects/home.page');
const LoginPage = require('../page_objects/login.page');
const BrowsePanel = require('../page_objects/browsepanel/content.browse.panel');
const FilterPanel = require("../page_objects/browsepanel/content.filter.panel");
const ConfirmationDialog = require("../page_objects/confirmation.dialog");
const appConst = require("./app_const");
const NewContentDialog = require('../page_objects/browsepanel/new.content.dialog');
const ContentWizardPanel = require('../page_objects/wizardpanel/content.wizard.panel');
const webDriverHelper = require("./WebDriverHelper");
const IssueListDialog = require('../page_objects/issue/issue.list.dialog');
const CreateIssueDialog = require('../page_objects/issue/create.issue.dialog');
const DeleteContentDialog = require('../page_objects/delete.content.dialog');
const ConfirmContentDeleteDialog = require('../page_objects/confirm.content.delete.dialog');
const InsertLinkDialog = require('../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const ContentPublishDialog = require('../page_objects/content.publish.dialog');
const BrowseDetailsPanel = require('../page_objects/browsepanel/detailspanel/browse.details.panel');
const BrowseDependenciesWidget = require('../page_objects/browsepanel/detailspanel/browse.dependencies.widget');
const ContentUnpublishDialog = require('../page_objects/content.unpublish.dialog');

module.exports = {
    setTextInCKE: function (id, text) {
        let script = `CKEDITOR.instances['${id}'].setData('${text}')`;
        return webDriverHelper.browser.execute(script).then(() => {
            let script2 = `CKEDITOR.instances['${id}'].fire('change')`;
            return webDriverHelper.browser.execute(script2);
        })
    },
    async clickOnElement(selector) {
        let el = await webDriverHelper.browser.$(selector);
        await el.waitForDisplayed(1500);
        return await el.click();
    },
    async getText(selector) {
        let el = await webDriverHelper.browser.$(selector);
        await el.waitForDisplayed(1500);
        return await el.getText();
    },

    async isElementDisplayed(selector) {
        let el = await webDriverHelper.browser.$(selector);
        return await el.isDisplayed();
    },

    async switchToFrameBySrc(src) {
        let selector = `//iframe[contains(@src,'${src}')]`;
        let el = await webDriverHelper.browser.$(selector);
        await el.waitForDisplayed(1500);
        return await webDriverHelper.browser.switchToFrame(el).catch(err => {
            console.log('Error when switch to frame ' + selector);
            throw new Error('Error when switch to frame  ' + err);
        })
    },
    getTitle() {
        return webDriverHelper.browser.getTitle();
    },

    getTextInCKE: function (id) {
        let script = `return CKEDITOR.instances['${id}'].getData()`;
        return webDriverHelper.browser.execute(script);
    },
    insertUrlLinkInCke: function (text, url) {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.typeUrl(url);
        }).then(() => {
            return insertLinkDialog.clickOnInsertButtonAndWaitForClosed();
        }).then(()=>{
            return webDriverHelper.browser.pause(500);
        });

    },
    insertDownloadLinkInCke: function (text, contentDisplayName) {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.selectTargetInDownloadTab(contentDisplayName);
        }).then(() => {
            this.saveScreenshot('download_link_dialog');
            return insertLinkDialog.clickOnInsertButton();
        }).then(() => {
            return insertLinkDialog.pause(700);
        });

    },
    insertEmailLinkInCke: function (text, email) {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.fillEmailForm(email);
        }).then(() => {
            this.saveScreenshot('email_link_dialog');
            return insertLinkDialog.clickOnInsertButton();
        }).then(() => {
            return insertLinkDialog.pause(700);
        });
    },

    insertContentLinkInCke: function (text, contentDisplayName) {
        let insertLinkDialog = new InsertLinkDialog();
        return insertLinkDialog.typeText(text).then(() => {
            return insertLinkDialog.selectTargetInContentTab(contentDisplayName);
        }).then(() => {
            this.saveScreenshot('content_link_dialog');
            return insertLinkDialog.clickOnInsertButton();
        }).then(() => {
            return insertLinkDialog.pause(700);
        });
    },
    doCloseCurrentBrowserTab: function () {
        return webDriverHelper.browser.getTitle().then(title => {
            if (title != 'Enonic XP Home') {
                return webDriverHelper.browser.closeWindow();
            }
        })
    },
    openIssuesListDialog: function () {
        let browsePanel = new BrowsePanel();
        let issueListDialog = new IssueListDialog();
        return browsePanel.clickOnShowIssuesListButton().then(() => {
            return issueListDialog.waitForDialogOpened();
        }).then(()=>{
            return issueListDialog.pause(300);
        });
    },
    openCreateIssueDialog: function () {
        let browsePanel = new BrowsePanel();
        let createIssueDialog = new CreateIssueDialog();
        let issueListDialog = new IssueListDialog();
        return browsePanel.clickOnShowIssuesListButton().then(() => {
            return issueListDialog.waitForDialogOpened();
        }).then(() => {
            return issueListDialog.clickOnNewIssueButton();
        }).then(() => {
            return createIssueDialog.waitForDialogLoaded();
        });
    },
    openPublishMenuAndClickOnCreateIssue: function () {
        let browsePanel = new BrowsePanel();
        let createIssueDialog = new CreateIssueDialog();
        return browsePanel.openPublishMenuAndClickOnCreateIssue().then(() => {
            return createIssueDialog.waitForDialogLoaded();
        })
    },
    openBrowseDetailsPanel: function () {
        let browsePanel = new BrowsePanel();
        let browseDetailsPanel = new BrowseDetailsPanel();
        return browseDetailsPanel.isPanelVisible().then(result => {
            if (!result) {
                return browsePanel.clickOnDetailsPanelToggleButton();
            }
        }).then(() => {
            return browseDetailsPanel.waitForDetailsPanelLoaded();
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible(appConst.TIMEOUT_2);
        }).then(() => {
            return browsePanel.pause(1000);
        });
    },
    openContentWizard: function (contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        return browsePanel.waitForNewButtonEnabled(appConst.TIMEOUT_3).then(() => {
            return browsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.waitForOpened();
        }).then(() => {
            return newContentDialog.clickOnContentType(contentType);
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        })
    },
    openContentInWizard: function (contentName) {
        let contentWizardPanel = new ContentWizardPanel();
        let browsePanel = new BrowsePanel();
        return this.findAndSelectItem(contentName).then(() => {
            return browsePanel.clickOnEditButton();
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        })
    },

    doAddShortcut: function (shortcut) {
        let contentWizardPanel = new ContentWizardPanel();
        return this.openContentWizard(appConst.contentTypes.SHORTCUT).then(() => {
            return contentWizardPanel.typeData(shortcut);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).then(() => {
            return this.doCloseWizardAndSwitchToGrid();
        });
    },
    doAddFolder: function (folder) {
        let contentWizardPanel = new ContentWizardPanel();
        return this.openContentWizard(appConst.contentTypes.FOLDER).then(() => {
            return contentWizardPanel.typeData(folder);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).then(() => {
            return this.doCloseWizardAndSwitchToGrid()
        }).then(() => {
            return webDriverHelper.browser.pause(1000);
        });
    },
    doCloseWizardAndSwitchToGrid: function () {
        return this.doCloseCurrentBrowserTab().then(() => {
            return this.doSwitchToContentBrowsePanel();
        });
    },
    doAddSite: function (site) {
        let contentWizardPanel = new ContentWizardPanel();
        return this.openContentWizard(appConst.contentTypes.SITE).then(() => {
            return contentWizardPanel.typeData(site);
        }).then(() => {
            if (site.data.controller) {
                return contentWizardPanel.selectPageDescriptor(site.data.controller);
            } else {
                return contentWizardPanel.waitAndClickOnSave();
            }
        }).then(() => {
            return this.doCloseCurrentBrowserTab();
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).then(() => {
            return webDriverHelper.browser.pause(1000);
        })
    },
    doOpenSiteWizard: function () {
        return this.openContentWizard(appConst.contentTypes.SITE);
    },
    doOpenPageTemplateWizard: function (siteName) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        return this.typeNameInFilterPanel(siteName).then(() => {
            return browsePanel.waitForContentDisplayed(siteName);
        }).then(() => {
            return browsePanel.pause(300);
        }).then(() => {
            return browsePanel.clickOnExpanderIcon(siteName);
        }).then(() => {
            return browsePanel.clickCheckboxAndSelectRowByDisplayName('Templates');
        }).then(() => {
            return browsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.clickOnContentType(appConst.contentTypes.PAGE_TEMPLATE);
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    doAddPageTemplate: function (siteName, template) {
        let contentWizardPanel = new ContentWizardPanel();
        return this.doOpenPageTemplateWizard(siteName).then(() => {
            return contentWizardPanel.typeData(template);
        }).then(() => {
            //autosaving should be here:
            return contentWizardPanel.selectPageDescriptor(template.data.controllerDisplayName);
        }).then(() => {
            this.saveScreenshot(template.displayName + '_created');
            return this.doCloseCurrentBrowserTab();
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).then(() => {
            return contentWizardPanel.pause(2000);
        });
    },
    //Clicks on Publish button on the toolbar then clicks on Publish button ib the dialog
    doPublish: function () {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        return browsePanel.waitForPublishButtonVisible().then(() => {
            return browsePanel.clickOnPublishButton();
        }).then(() => {
            return contentPublishDialog.waitForDialogOpened();
        }).then(() => {
            return contentPublishDialog.clickOnPublishButton();
        }).then(() => {
            return contentPublishDialog.waitForDialogClosed();
        })
    },
    doPublishTree: function () {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        return browsePanel.waitForPublishTreeButtonVisible().then(() => {
            return browsePanel.clickOnPublishTreeButton();
        }).then(() => {
            return contentPublishDialog.waitForDialogOpened();
        }).then(() => {
            return contentPublishDialog.clickOnPublishButton();
        }).then(() => {
            return contentPublishDialog.waitForDialogClosed();
        })
    },
    doPublishInWizard: function () {
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        return contentWizardPanel.clickOnPublishButton().then(() => {
            return contentPublishDialog.waitForDialogOpened();
        }).then(() => {
            return contentPublishDialog.clickOnPublishButton();
        }).then(() => {
            return contentPublishDialog.waitForDialogClosed();
        })
    },
    doUnPublishInWizard: function () {
        let contentUnpublishDialog = new ContentUnpublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        return contentWizardPanel.clickOnUnpublishmenuItem().then(() => {
            return contentUnpublishDialog.waitForDialogOpened();
        }).then(() => {
            return contentUnpublishDialog.clickOnUnpublishButton();
        }).then(() => {
            return contentUnpublishDialog.waitForDialogClosed();
        })
    },
    doAddArticleContent: function (siteName, article) {
        let contentWizardPanel = new ContentWizardPanel();
        return this.findAndSelectItem(siteName).then(() => {
            return this.openContentWizard(article.contentType);
        }).then(() => {
            return contentWizardPanel.typeData(article);
        }).then(() => {
            return contentWizardPanel.waitAndClickOnSave();
        }).then(() => {
            return this.doCloseCurrentBrowserTab();
        }).then(() => {
            this.doSwitchToContentBrowsePanel();
        }).then(() => {
            return webDriverHelper.browser.pause(1000);
        })
    },
    async findAndSelectItem(name) {
        let browsePanel = new BrowsePanel();
        await this.typeNameInFilterPanel(name);
        await browsePanel.waitForRowByNameVisible(name);
        await browsePanel.pause(500);
        await browsePanel.clickOnRowByName(name);
        return await browsePanel.pause(400);
    },
    findAndSelectContentByDisplayName: function (displayName) {
        let browsePanel = new BrowsePanel();
        return this.typeNameInFilterPanel(displayName).then(() => {
            return browsePanel.waitForContentByDisplayNameVisible(displayName);
        }).then(() => {
            return browsePanel.clickOnRowByDisplayName(displayName);
        });
    },
    doDeleteContent: function (name) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        return this.findAndSelectItem(name).then(() => {
            return browsePanel.clickOnDeleteButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogOpened();
        }).then(() => {
            return deleteContentDialog.clickOnDeleteButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogClosed();
        });
    },
    selectContentAndOpenWizard: function (name) {
        let browsePanel = new BrowsePanel();
        let contentWizardPanel = new ContentWizardPanel()
        return this.findAndSelectItem(name).then(() => {
            return browsePanel.waitForEditButtonEnabled();
        }).then(() => {
            return browsePanel.clickOnEditButton();
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        })
    },
    findContentAndClickCheckBox: function (displayName) {
        let browsePanel = new BrowsePanel();
        return this.typeNameInFilterPanel(displayName).then(() => {
            return browsePanel.waitForContentByDisplayNameVisible(displayName);
        }).then(() => {
            return browsePanel.clickCheckboxAndSelectRowByDisplayName(displayName);
        });
    },
    selectSiteAndOpenNewWizard: function (siteName, contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        return this.findAndSelectItem(siteName).then(() => {
            return browsePanel.waitForNewButtonEnabled();
        }).then(() => {
            return browsePanel.clickOnNewButton();
        }).then(() => {
            return newContentDialog.waitForOpened();
        }).then(() => {
            return newContentDialog.typeSearchText(contentType);
        }).then(() => {
            return newContentDialog.clickOnContentType(contentType);
        }).then(() => {
            return this.doSwitchToNewWizard();
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    clickOnDeleteAndConfirm: function (numberOfContents) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        let confirmContentDeleteDialog = new ConfirmContentDeleteDialog();
        return browsePanel.clickOnDeleteButton().then(() => {
            return deleteContentDialog.waitForDialogOpened();
        }).then(() => {
            return deleteContentDialog.clickOnDeleteButton();
        }).then(() => {
            return confirmContentDeleteDialog.waitForDialogOpened();
        }).then(() => {
            return confirmContentDeleteDialog.typeNumberOfContent(numberOfContents);
        }).then(() => {
            return confirmContentDeleteDialog.clickOnConfirmButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogClosed();
        })
    },
    typeNameInFilterPanel: function (name) {
        let browsePanel = new BrowsePanel();
        let filterPanel = new FilterPanel();
        return filterPanel.isPanelVisible().then((result) => {
            if (!result) {
                return browsePanel.clickOnSearchButton().then(() => {
                    return filterPanel.waitForOpened();
                })
            }
        }).then(() => {
            return filterPanel.typeSearchText(name);
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible(appConst.TIMEOUT_3);
        }).then(() => {
            return browsePanel.pause(300);
        })
    },
    selectAndDeleteItem: function (name) {
        let browsePanel = new BrowsePanel();
        let confirmationDialog = new ConfirmationDialog();
        return this.findAndSelectItem(name).then(() => {
            return browsePanel.waitForDeleteButtonEnabled();
        }).then(result => {
            return browsePanel.clickOnDeleteButton();
        }).then(() => {
            return confirmationDialog.waitForDialogOpened();
        }).then(result => {
            if (!result) {
                throw new Error('Confirmation dialog is not loaded!')
            }
            return confirmationDialog.clickOnYesButton();
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible();
        })
    },
    confirmDelete: () => {
        let browsePanel = new BrowsePanel();
        let confirmationDialog = new ConfirmationDialog();
        return confirmationDialog.waitForDialogOpened().then(() => {
            return confirmationDialog.clickOnYesButton();
        }).then(() => {
            return browsePanel.waitForSpinnerNotVisible();
        });
    },

    navigateToContentStudioApp: function (userName, password) {
        let launcherPanel = new LauncherPanel();
        return launcherPanel.waitForPanelDisplayed(3000).then(result => {
            if (result) {
                console.log("Launcher Panel is opened, click on the `Users` link...");
                return launcherPanel.clickOnContentStudioLink();
            } else {
                console.log("Login Page is opened, type a password and name...");
                return this.doLoginAndClickOnContentStudio(userName, password);
            }
        }).then(() => {
            return this.doSwitchToContentBrowsePanel();
        }).catch(err => {
            console.log('tried to navigate to Content Studio app, but: ' + err);
            this.saveScreenshot(appConst.generateRandomName("err_navigate_to_studio"));
            throw new Error('error when navigate to Content Studio app ' + err);
        });
    },
    doLoginAndClickOnContentStudio: function (userName, password) {
        let loginPage = new LoginPage();
        return loginPage.doLogin(userName, password).then(() => {
            let launcherPanel = new LauncherPanel();
            return launcherPanel.clickOnContentStudioLink();
        }).then(() => {
            return loginPage.pause(1000);
        })
    },
    doSwitchToContentBrowsePanel: function () {
        console.log('testUtils:switching to users app...');
        let browsePanel = new BrowsePanel();
        return webDriverHelper.browser.switchWindow("Content Studio - Enonic XP Admin").then(() => {
            console.log("switched to content browse panel...");
            return browsePanel.waitForSpinnerNotVisible();
        }).then(() => {
            return browsePanel.waitForGridLoaded(appConst.TIMEOUT_5);
        }).catch(err => {
            throw new Error("Error when switching to Content Studio App " + err);
        })
    },
    doSwitchToHome: function () {
        console.log('testUtils:switching to Home page...');
        return webDriverHelper.browser.switchWindow("Enonic XP Home").then(() => {
            console.log("switched to Home...");
        }).then(() => {
            let homePage = new HomePage();
            return homePage.waitForLoaded(appConst.TIMEOUT_3);
        });
    },
    async doCloseWindowTabAndSwitchToBrowsePanel() {
        await webDriverHelper.browser.closeWindow();
        return await this.doSwitchToContentBrowsePanel();
    },

    saveAndCloseWizard: function (displayName) {
        let contentWizardPanel = new ContentWizardPanel();
        return contentWizardPanel.waitAndClickOnSave().then(() => {
            return contentWizardPanel.pause(300);
        }).then(() => {
            return this.doCloseWindowTabAndSwitchToBrowsePanel()
        })
    },

    async switchToContentTabWindow(contentDisplayName) {
        await webDriverHelper.browser.switchWindow(contentDisplayName);
        let contentWizardPanel = new ContentWizardPanel();
        return await contentWizardPanel.waitForSpinnerNotVisible();
    },
    doPressBackspace: function () {
        return webDriverHelper.browser.keys('\uE003');
    },
    doPressTabKey: function () {
        return webDriverHelper.browser.keys('Tab');
    },
    doPressEnter: function () {
        return webDriverHelper.browser.keys('Enter');
    },

    doSwitchToNewWizard: function () {
        console.log('testUtils:switching to the new wizard tab...');
        let contentWizardPanel = new ContentWizardPanel();
        return webDriverHelper.browser.getWindowHandles().then(tabs => {
            return webDriverHelper.browser.switchToWindow(tabs[tabs.length - 1]);
        }).then(() => {
            return contentWizardPanel.waitForOpened();
        });
    },
    async doSwitchToNextTab() {
        let tabs = await webDriverHelper.browser.getWindowHandles();
        return await webDriverHelper.browser.switchToWindow(tabs[tabs.length - 1]);
    },
    doCloseAllWindowTabsAndSwitchToHome: function () {
        return webDriverHelper.browser.getWindowHandles().then(tabIds => {
            let result = Promise.resolve();
            tabIds.forEach(tabId => {
                result = result.then(() => {
                    return this.switchAndCheckTitle(tabId, "Enonic XP Home");
                }).then(result => {
                    if (!result) {
                        return webDriverHelper.browser.closeWindow().then(() => {
                            console.log(tabId + ' was closed');
                        }).catch(err => {
                            console.log(tabId + ' was not closed ' + err);
                        });
                    }
                });
            });
            return result;
        }).then(() => {
            return this.doSwitchToHome();
        });
    },
    switchAndCheckTitle: function (handle, reqTitle) {
        return webDriverHelper.browser.switchToWindow(handle).then(() => {
            return webDriverHelper.browser.getTitle().then(title => {
                return title.includes(reqTitle);
            }).catch(err => {
                console.log("Error when getting Title" + err);
                throw new Error("Error  " + err);
            })
        });
    },

    saveScreenshot: function (name) {
        let path = require('path');
        let screenshotsDir = path.join(__dirname, '/../build/screenshots/');
        return webDriverHelper.browser.saveScreenshot(screenshotsDir + name + '.png').then(() => {
            return console.log('screenshot saved ' + name);
        }).catch(err => {
            return console.log('screenshot was not saved ' + screenshotsDir + 'utils  ' + err);
        })
    },
    openDependencyWidgetInBrowsePanel: function () {
        let browsePanel = new BrowsePanel();
        let browseDependenciesWidget = new BrowseDependenciesWidget();
        return browsePanel.openDetailsPanel().then(() => {
            return browsePanel.openDependencies();
        }).then(() => {
            return browseDependenciesWidget.waitForWidgetLoaded();
        })
    }
};
