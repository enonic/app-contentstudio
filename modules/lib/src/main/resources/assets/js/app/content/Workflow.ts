import {type WorkflowJson} from '@enonic/lib-admin-ui/content/json/WorkflowJson';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {WorkflowState} from './WorkflowState';

export class Workflow
    implements Equitable {

    private readonly state: WorkflowState;

    constructor(builder: WorkflowBuilder) {
        this.state = builder.state;
    }

    static create(): WorkflowBuilder {
        return new WorkflowBuilder();
    }

    static fromJson(json: WorkflowJson): Workflow {
        return json ? new WorkflowBuilder().fromJson(json).build() : null;
    }

    getState(): WorkflowState {
        return this.state;
    }

    getStateAsString(): string {
        return WorkflowState[this.state].toLowerCase();
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, Workflow)) {
            return false;
        }

        const other = o as Workflow;

        return this.state === other.getState();
    }

    toJson(): WorkflowJson {
        return {
            state: this.state.toUpperCase(),
            checks: {}
        };
    }

    newBuilder(): WorkflowBuilder {
        return new WorkflowBuilder(this);
    }

    public static fromObject(o: object): Workflow {
        if (o instanceof Workflow) {
            return o;
        } else {
            return new WorkflowBuilder().fromJson(o as WorkflowJson).build();
        }
    }
}

export class WorkflowBuilder {

    state: WorkflowState;

    constructor(source?: Workflow) {
        if (source) {
            this.state = source.getState();
        }
    }

    fromJson(json: WorkflowJson): WorkflowBuilder {
        this.state = WorkflowState[json.state];

        return this;
    }

    setState(state: WorkflowState): WorkflowBuilder {
        this.state = state;
        return this;
    }

    build(): Workflow {
        return new Workflow(this);
    }

}
