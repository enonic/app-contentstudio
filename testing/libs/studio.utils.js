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
        try {
            let selector = `//iframe[contains(@src,'${src}')]`;
            let el = await webDriverHelper.browser.$(selector);
            await el.waitForDisplayed(1500);
            return await webDriverHelper.browser.switchToFrame(el);
        } catch (err) {
            throw new Error('Error when switch to frame  ' + err);
        }
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
        }).then(() => {
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
    async openIssuesListDialog() {
        let browsePanel = new BrowsePanel();
        let issueListDialog = new IssueListDialog();
        await browsePanel.clickOnShowIssuesListButton();
        await issueListDialog.waitForDialogOpened();
        return await issueListDialog.pause(300);
    },
    async openCreateIssueDialog() {
        try {
            let browsePanel = new BrowsePanel();
            let createIssueDialog = new CreateIssueDialog();
            let issueListDialog = new IssueListDialog();
            await browsePanel.clickOnShowIssuesListButton();
            await issueListDialog.waitForDialogOpened();
            await issueListDialog.clickOnIssuesTab();
            await issueListDialog.clickOnNewIssueButton();
            await createIssueDialog.waitForDialogLoaded();
        } catch (err) {
            throw new Error("Error when opening Create Issue Dialog " + err);
        }
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
    selectAndOpenContentInWizard: function (contentName) {
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

    async doAddShortcut(shortcut) {
        let contentWizardPanel = new ContentWizardPanel();
        //Open new shortcut-wizard:
        await this.openContentWizard(appConst.contentTypes.SHORTCUT);
        await contentWizardPanel.typeData(shortcut);
        await contentWizardPanel.waitAndClickOnSave();
        return await this.doCloseWizardAndSwitchToGrid();
    },
    async doAddReadyFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        await contentWizardPanel.clickOnMarkAsReadyButton();
        await this.doCloseWizardAndSwitchToGrid()
        return await webDriverHelper.browser.pause(1000);
    },
    async doAddFolder(folder) {
        let contentWizardPanel = new ContentWizardPanel();
        //1. Open the folder-wizard:
        await this.openContentWizard(appConst.contentTypes.FOLDER);
        await contentWizardPanel.typeData(folder);
        //2. Save the folder:
        await contentWizardPanel.waitAndClickOnSave();
        //3.Close the wizard:
        await this.doCloseWizardAndSwitchToGrid()
        return await webDriverHelper.browser.pause(1000);
    },
    doCloseWizardAndSwitchToGrid: function () {
        return this.doCloseCurrentBrowserTab().then(() => {
            return this.doSwitchToContentBrowsePanel();
        });
    },
    async doAddSite(site) {
        let contentWizardPanel = new ContentWizardPanel();
        //1. Open new site-wizard:
        await this.openContentWizard(appConst.contentTypes.SITE);
        await contentWizardPanel.typeData(site);
        //2. Type the data and save:
        if (site.data.controller) {
            await contentWizardPanel.selectPageDescriptor(site.data.controller);
        } else {
            await contentWizardPanel.waitAndClickOnSave();
        }
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await webDriverHelper.browser.pause(1000);

    },
    async doAddReadySite(site) {
        let contentWizardPanel = new ContentWizardPanel();
        await this.openContentWizard(appConst.contentTypes.SITE);
        await contentWizardPanel.typeData(site);

        if (site.data.controller) {
            await contentWizardPanel.selectPageDescriptor(site.data.controller);
        } else {
            await contentWizardPanel.clickOnMarkAsReadyButton();
        }
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await webDriverHelper.browser.pause(1000);
    },
    doOpenSiteWizard: function () {
        return this.openContentWizard(appConst.contentTypes.SITE);
    },
    async doOpenPageTemplateWizard(siteName) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await this.typeNameInFilterPanel(siteName);
        await browsePanel.waitForContentDisplayed(siteName);
        await browsePanel.pause(300);
        await browsePanel.clickOnExpanderIcon(siteName);
        await browsePanel.clickCheckboxAndSelectRowByDisplayName('Templates');
        await browsePanel.clickOnNewButton();
        await newContentDialog.clickOnContentType(appConst.contentTypes.PAGE_TEMPLATE);
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },

    doAddPageTemplate: function (siteName, template) {
        let contentWizardPanel = new ContentWizardPanel();
        return this.doOpenPageTemplateWizard(siteName).then(() => {
            return contentWizardPanel.typeData(template);
        }).then(() => {
            //auto saving should be here:
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
    //Clicks on Publish button on the toolbar then clicks on Publish button in the dialog
    async doPublish() {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        await browsePanel.waitForPublishButtonVisible();
        await browsePanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async doPublishTree() {
        let browsePanel = new BrowsePanel();
        let contentPublishDialog = new ContentPublishDialog();
        await browsePanel.clickOnPublishTreeButton();
        await contentPublishDialog.waitForDialogOpened();
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },
    async doPublishInWizard() {
        let contentPublishDialog = new ContentPublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        //1. Open Publish Content Dialog:
        await contentWizardPanel.clickOnPublishButton();
        await contentPublishDialog.waitForDialogOpened();
        //2. Click on Publish Now button:
        await contentPublishDialog.clickOnPublishNowButton();
        return await contentPublishDialog.waitForDialogClosed();
    },

    async doUnPublishInWizard() {
        let contentUnpublishDialog = new ContentUnpublishDialog();
        let contentWizardPanel = new ContentWizardPanel();
        //1. Click on Unpublish menu item:
        await contentWizardPanel.clickOnUnpublishmenuItem();
        await contentUnpublishDialog.waitForDialogOpened();
        //2. Click on Unpublish button:
        await contentUnpublishDialog.clickOnUnpublishButton();
        await contentUnpublishDialog.waitForDialogClosed();
    },

    async doAddArticleContent(siteName, article) {
        let contentWizardPanel = new ContentWizardPanel();
        //1. Select the site
        await this.findAndSelectItem(siteName);
        //2. Open article-wizard:
        await this.openContentWizard(article.contentType);
        //3.Type the data and save all
        await contentWizardPanel.typeData(article);
        await contentWizardPanel.waitAndClickOnSave();
        await this.doCloseCurrentBrowserTab();
        await this.doSwitchToContentBrowsePanel();
        return await webDriverHelper.browser.pause(1000);
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
    //find the content, select it and 'Delete Now'
    doDeleteContent: function (name) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        return this.findAndSelectItem(name).then(() => {
            return browsePanel.clickOnDeleteButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogOpened();
        }).then(() => {
            return deleteContentDialog.clickOnDeleteNowButton();
        }).then(() => {
            return deleteContentDialog.waitForDialogClosed();
        });
    },
    selectContentAndOpenWizard: function (name) {
        let browsePanel = new BrowsePanel();
        let contentWizardPanel = new ContentWizardPanel();
        return this.findAndSelectItem(name).then(() => {
            return this.doClickOnEditAndOpenContent(name);
        })
    },
    doClickOnEditAndOpenContent: function (name) {
        let browsePanel = new BrowsePanel();
        let contentWizardPanel = new ContentWizardPanel()
        return browsePanel.waitForEditButtonEnabled().then(() => {
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
    async selectSiteAndOpenNewWizard(siteName, contentType) {
        let browsePanel = new BrowsePanel();
        let newContentDialog = new NewContentDialog();
        let contentWizardPanel = new ContentWizardPanel();
        await this.findAndSelectItem(siteName);
        await browsePanel.waitForNewButtonEnabled();
        await browsePanel.clickOnNewButton();
        await newContentDialog.waitForOpened();
        await newContentDialog.typeSearchText(contentType);
        await newContentDialog.clickOnContentType(contentType);
        await this.doSwitchToNewWizard();
        return await contentWizardPanel.waitForOpened();
    },
    //Open delete dialog, click on 'Delete Now' button then type a number to delete
    async doDeleteNowAndConfirm(numberOfContents) {
        let browsePanel = new BrowsePanel();
        let deleteContentDialog = new DeleteContentDialog();
        let confirmContentDeleteDialog = new ConfirmContentDeleteDialog();
        //1. Open Delete Content dialog:
        await browsePanel.clickOnDeleteButton();
        await deleteContentDialog.waitForDialogOpened();
        //2. Click on Delete Now button
        await deleteContentDialog.clickOnDeleteNowButton();
        //3. wait for Confirm dialog is loaded:
        await confirmContentDeleteDialog.waitForDialogOpened();
        //4. Type required number:
        await confirmContentDeleteDialog.typeNumberOfContent(numberOfContents);
        //Click on Confirm button:
        await confirmContentDeleteDialog.clickOnConfirmButton();
        return await deleteContentDialog.waitForDialogClosed();
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

    navigateToContentStudioApp: function (userName, password) {
        let launcherPanel = new LauncherPanel();
        return launcherPanel.waitForPanelDisplayed(2000).then(result => {
            if (result) {
                console.log("Launcher Panel is opened, click on the `Content Studio` link...");
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
            return loginPage.pause(700);
        })
    },
    doSwitchToContentBrowsePanel: function () {
        console.log('testUtils:switching to Content Browse panel...');
        let browsePanel = new BrowsePanel();
        return webDriverHelper.browser.switchWindow("Content Studio - Enonic XP Admin").then(() => {
            console.log("switched to content browse panel...");
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

    async saveAndCloseWizard() {
        let contentWizardPanel = new ContentWizardPanel();
        await contentWizardPanel.waitAndClickOnSave();
        await contentWizardPanel.pause(300);
        return await this.doCloseWindowTabAndSwitchToBrowsePanel();
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
    },
    isStringEmpty(str) {
        return (!str || 0 === str.length);
    }
};
