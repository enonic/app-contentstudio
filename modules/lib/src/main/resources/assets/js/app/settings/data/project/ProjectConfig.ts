
export class ProjectConfig {

    private readonly multiInheritance: boolean;

    constructor(builder: ProjectConfigBuilder) {
        this.multiInheritance = builder.multiInheritance;
    }

    isMultiInheritance(): boolean {
        return this.multiInheritance;
    }

    static create(): ProjectConfigBuilder {
        return new ProjectConfigBuilder();
    }

}

export class ProjectConfigBuilder {

    multiInheritance: boolean;

    setMultiInheritance(value: boolean): ProjectConfigBuilder {
        this.multiInheritance = value;
        return this;
    }

    build(): ProjectConfig {
        return new ProjectConfig(this);
    }
}
