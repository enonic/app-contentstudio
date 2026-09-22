import { describe, expect, it } from 'vitest';
import { type Project } from '../../../../app/settings/data/project/Project';
import { projectsToTreeListItems, searchProjectsToListItems } from './projects';

const project = (name: string, displayName: string, parents: string[] = []): Readonly<Project> =>
    ({
        getName: () => name,
        getDisplayName: () => displayName,
        getParents: () => parents,
        hasMainParentByName: (parentName: string) => parents[0] === parentName,
    }) as unknown as Readonly<Project>;

// ? Mirrors the Create Project wizard: two layers nested under the `default` project.
const defaultProject = project('default', 'Default');
const cfeLayer = project('cfe', 'cfe', ['default']);
const featuresLayer = project('features', 'Features', ['default']);
const projects = [cfeLayer, defaultProject, featuresLayer];

//
// * projectsToTreeListItems
//

describe('projectsToTreeListItems', () => {
    it('should omit children of collapsed projects', () => {
        const items = projectsToTreeListItems(projects, []);

        expect(items.map((item) => item.id)).toEqual(['default']);
        expect(items[0]).toMatchObject({ level: 1, parentId: null, hasChildren: true, isExpanded: false });
    });

    it('should list children right after their expanded parent', () => {
        const items = projectsToTreeListItems(projects, ['default']);

        expect(items.map((item) => item.id)).toEqual(['default', 'cfe', 'features']);
        expect(items[1]).toMatchObject({ level: 2, parentId: 'default', hasChildren: false, isExpanded: false });
    });
});

//
// * searchProjectsToListItems
//

describe('searchProjectsToListItems', () => {
    it('should match a layer nested under a collapsed project', () => {
        const items = searchProjectsToListItems(projects, 'cfe');

        expect(items.map((item) => item.id)).toEqual(['cfe']);
    });

    it('should render matches as flat rows', () => {
        const items = searchProjectsToListItems(projects, 'cfe');

        expect(items[0]).toMatchObject({ level: 1, parentId: null, hasChildren: false, isExpanded: false });
        expect(items[0].data).toBe(cfeLayer);
    });

    it('should match partially and ignore case on both display name and name', () => {
        expect(searchProjectsToListItems(projects, 'FEAT').map((item) => item.id)).toEqual(['features']);
        expect(searchProjectsToListItems(projects, 'eatur').map((item) => item.id)).toEqual(['features']);
    });

    it('should match a project whose parent is missing from the list', () => {
        const orphan = project('orphan', 'Orphan', ['not-visible']);

        expect(searchProjectsToListItems([...projects, orphan], 'orphan').map((item) => item.id)).toEqual(['orphan']);
    });

    it('should keep the incoming project order', () => {
        expect(searchProjectsToListItems(projects, 'fe').map((item) => item.id)).toEqual(['cfe', 'features']);
    });

    it('should return every project when the search value is blank', () => {
        expect(searchProjectsToListItems(projects, '   ').map((item) => item.id)).toEqual([
            'cfe',
            'default',
            'features',
        ]);
    });

    it('should return nothing when no project matches', () => {
        expect(searchProjectsToListItems(projects, 'nope')).toEqual([]);
    });
});
