import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import * as Q from 'q';
import {PermissionHelper} from '../../../../wizard/PermissionHelper';
import {ProjectHelper} from '../../../../settings/data/project/ProjectHelper';
import {ProjectContext} from '../../../../project/ProjectContext';
import {GetContentPermissionsByIdRequest} from '../../../../resource/GetContentPermissionsByIdRequest';
import {AccessControlList} from '../../../../access/AccessControlList';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {PropertiesWizardStepForm} from './PropertiesWizardStepForm';
import {PropertiesWizardStepFormFactory, PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';

export class PropertiesWidgetItemViewHelper {

    private item: ContentSummaryAndCompareStatus;

    setItem(value: ContentSummaryAndCompareStatus): this {
        this.item = value;
        return this;
    }

    generateProps(application?: Application): Map<string, string> {
        const propsMap: Map<string, string> = new Map<string, string>();

        this.setPropsFieldId(propsMap);
        this.setPropsType(propsMap);
        this.setPropsApp(propsMap, application);
        this.setPropsCreated(propsMap);
        this.setPropsModified(propsMap);
        this.setPropsPublishFirstTime(propsMap);
        this.setPropsPublishFromTime(propsMap);
        this.setPropsPublishToTime(propsMap);
        this.setPropsLang(propsMap);
        this.setPropsOwner(propsMap);

        return propsMap;
    }

    private setPropsType(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.type'), this.item.getType().getLocalName()
                                         ? this.item.getType().getLocalName() : this.item.getType().toString());
    }

    private setPropsApp(propsMap: Map<string, string>, application?: Application) {
        propsMap.set(i18n('field.app'),
            application ? application.getDisplayName() : this.item.getType().getApplicationKey().getName());
    }

    private setPropsLang(propsMap: Map<string, string>) {
        if (this.item.getLanguage()) {
            propsMap.set(i18n('field.lang'), this.item.getLanguage());
        }
    }

    private setPropsOwner(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getOwner()) {
            propsMap.set(i18n('field.owner'), this.item.getContentSummary().getOwner().getId());
        }
    }

    private setPropsCreated(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.created'), DateTimeFormatter.createHtml(this.item.getContentSummary().getCreatedTime()));
    }

    private setPropsModified(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getModifiedTime()) {
            propsMap.set(i18n('field.modified'), DateTimeFormatter.createHtml(this.item.getContentSummary().getModifiedTime()));
        }
    }

    private setPropsPublishFirstTime(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getPublishFirstTime()) {
            propsMap.set(i18n('field.firstPublished'), DateTimeFormatter.createHtml(this.item.getContentSummary().getPublishFirstTime()));
        }
    }

    private setPropsPublishFromTime(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getPublishFromTime()) {
            propsMap.set(i18n('field.onlineFrom'), DateTimeFormatter.createHtml(this.item.getContentSummary().getPublishFromTime()));
        }
    }

    private setPropsPublishToTime(propsMap: Map<string, string>) {
        if (this.item.getContentSummary().getPublishToTime()) {
            propsMap.set(i18n('field.onlineTo'), DateTimeFormatter.createHtml(this.item.getContentSummary().getPublishToTime()));
        }
    }

    private setPropsFieldId(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.id'), this.item.getId());
    }

    private isEditSettingAllowed(): Q.Promise<boolean> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            return this.hasAdminAccessToSettings(loginResult) ? Q.resolve(true) : this.hasFullAccess(loginResult);
        }).catch(() => {
            NotifyManager.get().showWarning(i18n(''));
            return Q.resolve(false);
        });
    }

    private hasAdminAccessToSettings(loginResult: LoginResult): boolean {
        return PermissionHelper.hasAdminPermissions(loginResult) ||
               loginResult.isContentExpert() ||
               ProjectHelper.isProjectOwner(loginResult, ProjectContext.get().getProject());
    }

    private hasFullAccess(loginResult: LoginResult): Q.Promise<boolean> {
        return new GetContentPermissionsByIdRequest(this.item.getContentId()).sendAndParse().then(
            (permissions: AccessControlList) => {
                return PermissionHelper.hasFullAccess(loginResult, permissions);
            });
    }

    private isEditScheduleAllowed(): boolean {
        if (this.item.getContentSummary().getPublishFromTime() != null || this.item.getContentSummary().getPublishFromTime() != null) {
            return true;
        }

        return this.item.getContentSummary().getPublishFirstTime() != null && this.item.isPublished();
    }

    getAllowedForms(): Q.Promise<PropertiesWizardStepForm[]> {
        const result: PropertiesWizardStepForm[] = [];
        const resultPromises: Q.Promise<void>[] = [];

        Object.keys(PropertiesWizardStepFormType)
            .map((key: string) => PropertiesWizardStepFormType[key])
            .forEach((formType: PropertiesWizardStepFormType) => {
                const p: Q.Promise<void> = this.isFormAllowed(formType).then((isAllowed: boolean) => {
                    if (isAllowed) {
                        result.push(PropertiesWizardStepFormFactory.getWizardStepForm(formType));
                    }

                    return Q.resolve();
                });

                resultPromises.push(p);
            });

        return Q.all(resultPromises).then(() => {
           return result;
        });
    }

    private isFormAllowed(type: PropertiesWizardStepFormType): Q.Promise<boolean> {
        if (type === PropertiesWizardStepFormType.SETTINGS) {
            return this.isEditSettingAllowed();
        }

        if (type === PropertiesWizardStepFormType.SCHEDULE) {
            return Q.resolve(this.isEditScheduleAllowed());
        }

        throw new Error(`Unknown properties form type: ${type}`);
    }
}
