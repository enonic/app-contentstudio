import {OptionDataLoader, OptionDataLoaderData} from '@enonic/lib-admin-ui/ui/selector/OptionDataLoader';
import {type LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {type Project} from '../../../../data/project/Project';
import {ProjectListRequest} from '../../../../resource/ProjectListRequest';

export class ProjectOptionDataLoader
    extends OptionDataLoader<Project> {

    private modeChangeListener: (isTreeMode: boolean) => void;

    protected createRequest(): ProjectListRequest {
        return new ProjectListRequest(true);
    }

    filterFn(project: Project): boolean {
        const searchString: string = this.getSearchString().toLowerCase();

        if (StringHelper.isBlank(searchString)) {
            return true;
        }

        return project.getDisplayName()?.toLowerCase().indexOf(searchString) > -1 ||
               project.getDescription()?.toLowerCase().indexOf(searchString) > -1 ||
               project.getName()?.toLowerCase().indexOf(searchString) > -1;
    }

    checkReadonly(options: Project[]): Q.Promise<string[]> {
        return Q([]);
    }

    private getAndWrapDirectProjectChildren(project: Project) {
        const childrenProjects: Project[] = this.getDirectProjectChildren(project);
        return new OptionDataLoaderData<Project>(childrenProjects);
    }

    private getDirectProjectChildren(project: Project): Project[] {
        return this.getResults().filter((item: Project) => item.hasMainParentByName(project.getName()));
    }

    onLoadModeChanged(listener: (isTreeMode: boolean) => void) {
        if (!this.modeChangeListener) {
            this.modeChangeListener = listener;
        }

        this.modeChangeListener(true);
    }

    unLoadModeChanged(listener: (isTreeMode: boolean) => void): void {
    //
    }

    whenLoaded(listener: (projects: Project[]) => void): void {
        const innerListener = (event: LoadedDataEvent<Project>) => {
            listener(event.getData());
            this.unLoadedData(innerListener);
            return Q();
        };

        this.onLoadedData(innerListener);
    }

    isPartiallyLoaded(): boolean {
        return false;
    }
}
