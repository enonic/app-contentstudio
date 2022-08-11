import {Application, ApplicationBuilder} from '@enonic/lib-admin-ui/application/Application';
import {ProjectApplicationJson} from '../../../../resource/json/applications/ProjectApplicationJson';

export class ProjectApplication
    extends Application {

    private readonly icon: string;

    constructor(builder: ProjectApplicationBuilder) {
        super(builder);

        this.icon = builder.icon;
    }

    getIcon(): string {
        return this.icon;
    }

    static fromJson(json: ProjectApplicationJson): ProjectApplication {
        return new ProjectApplicationBuilder().fromJson(json).build();
    }

    static fromJsonArray(jsonArray: ProjectApplicationJson[]): ProjectApplication[] {
        const array: ProjectApplication[] = [];
        jsonArray.forEach((json: ProjectApplicationJson) => {
            array.push(ProjectApplication.fromJson(json));
        });
        return array;
    }
}

export class ProjectApplicationBuilder extends ApplicationBuilder {

    icon: string;

    setIcon(value: string): ProjectApplicationBuilder {
        this.icon = value;
        return this;
    }

    fromJson(json: ProjectApplicationJson): ProjectApplicationBuilder {
        super.fromJson(json);
        this.icon = json.icon;
        return this;
    }

    build(): ProjectApplication {
        return new ProjectApplication(this);
    }
}
