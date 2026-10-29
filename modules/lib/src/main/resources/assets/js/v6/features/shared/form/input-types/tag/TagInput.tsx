import { PropertyPath } from '@enonic/input-types/data';
import type { SelfManagedComponentProps } from '@enonic/input-types';
import { TagInput as BaseTagInput } from '@enonic/input-types';
import { useCallback, useMemo, type ReactElement } from 'react';
import { useFormScope } from '../../FormScopeContext';
import { suggestContentTags } from './ContentTagSuggester';
import type { TagConfig } from './TagConfig';

export const TagInput = (props: SelfManagedComponentProps<TagConfig>): ReactElement => {
    const { project, content: contextContent } = useFormScope();
    const projectName = project?.getName();
    const fallbackDataPath = useMemo(() => PropertyPath.fromString(props.input.getPath().toString()), [props.input]);
    const dataPath = props.dataPath ?? fallbackDataPath;

    const suggestTags = useCallback(
        (query: string) => {
            if (!projectName) return Promise.resolve<string[]>([]);

            return suggestContentTags({
                query,
                dataPath,
                content: contextContent,
                config: props.config,
                projectName,
            });
        },
        [projectName, contextContent, dataPath, props.config],
    );

    return <BaseTagInput {...props} suggestTags={suggestTags} />;
};

TagInput.displayName = 'TagInput';
