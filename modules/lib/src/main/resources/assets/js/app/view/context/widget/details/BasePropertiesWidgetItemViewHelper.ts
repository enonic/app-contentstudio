import {PropertiesWidgetItemViewHelper} from './PropertiesWidgetItemViewHelper';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DateTimeFormatter} from '@enonic/lib-admin-ui/ui/treegrid/DateTimeFormatter';
import {PropertiesWizardStepFormType} from './PropertiesWizardStepFormFactory';
import * as Q from 'q';
import {PermissionHelper} from '../../../../wizard/PermissionHelper';
import {ProjectHelper} from '../../../../settings/data/project/ProjectHelper';
import {ProjectContext} from '../../../../project/ProjectContext';
import {GetContentPermissionsByIdRequest} from '../../../../resource/GetContentPermissionsByIdRequest';
import {AccessControlList} from '../../../../access/AccessControlList';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';

export class BasePropertiesWidgetItemViewHelper
    extends PropertiesWidgetItemViewHelper  {

    private application?: Application;

    setApplication(app: Application): this {
        this.application = app;
        return this;
    }

    generateProps(): Map<string, string> {
        const propsMap: Map<string, string> = new Map<string, string>();

        this.setPropsFieldId(propsMap);
        this.setPropsType(propsMap);
        this.setPropsApp(propsMap);
        this.setPropsCreated(propsMap);
        this.setPropsModified(propsMap);
        this.setPropsPublishFirstTime(propsMap);
        this.setPropsLang(propsMap);
        this.setPropsOwner(propsMap);

        return propsMap;
    }

    private setPropsFieldId(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.id'), this.item.getId());
    }

    private setPropsType(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.type'), this.item.getType().getLocalName()
                                         ? this.item.getType().getLocalName() : this.item.getType().toString());
    }

    private setPropsApp(propsMap: Map<string, string>) {
        propsMap.set(i18n('field.app'), this.application?.getDisplayName() || this.item.getType().getApplicationKey().getName());
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

    protected isFormAllowed(type: PropertiesWizardStepFormType): Q.Promise<boolean> {
        if (type === PropertiesWizardStepFormType.SETTINGS) {
            return this.isEditSettingAllowed();
        }

        return super.isFormAllowed(type);
    }

    private isEditSettingAllowed(): Q.Promise<boolean> {
            return this.hasAdminAccessToSettings() ? Q.resolve(true) : this.hasFullAccess().catch(() => {
            NotifyManager.get().showWarning(i18n(''));
            return Q.resolve(false);
        });
    }

    private hasAdminAccessToSettings(): boolean {
        return PermissionHelper.hasAdminPermissions() ||
               AuthHelper.isContentExpert() ||
               ProjectHelper.isProjectOwner(ProjectContext.get().getProject());
    }

    private hasFullAccess(): Q.Promise<boolean> {
        return new GetContentPermissionsByIdRequest(this.item.getContentId()).sendAndParse().then(
            (permissions: AccessControlList) => {
                return PermissionHelper.hasFullAccess(permissions);
            });
    }
}
