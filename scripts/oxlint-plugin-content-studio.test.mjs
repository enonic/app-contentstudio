import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const imports = `
import { IconButton, IconButton as ActionButton } from '@enonic/ui';
import * as UI from '@enonic/ui';
import { IconButton as OtherButton } from 'another-library';
`;

function lint(source) {
    const directory = mkdtempSync(path.join(tmpdir(), 'cs-icon-button-label-'));
    const file = path.join(directory, 'fixture.tsx');
    try {
        writeFileSync(file, imports + source);
        const result = spawnSync(
            process.execPath,
            [
                path.join(root, 'modules/lib/node_modules/oxlint/bin/oxlint'),
                '-c',
                path.join(root, '.oxlintrc.json'),
                '--no-ignore',
                '--format',
                'json',
                file,
            ],
            { encoding: 'utf8', cwd: root },
        );
        assert.ifError(result.error);
        assert.ok(result.status === 0 || result.status === 1, result.stderr || result.stdout);
        return { status: result.status, diagnostics: JSON.parse(result.stdout).diagnostics };
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

test('the configured lint command rejects missing and statically blank icon-button labels', () => {
    const cases = [
        '<IconButton />',
        '<IconButton title="Close" />',
        '<IconButton aria-label="" />',
        '<IconButton aria-label="   " />',
        '<IconButton aria-label={""} />',
        '<IconButton aria-label={"\\t\\n"} />',
        '<IconButton aria-label={` `} />',
        '<IconButton aria-label={null} />',
        '<IconButton aria-label={undefined} />',
        '<IconButton aria-label={void 0} />',
        '<IconButton aria-label />',
        '<IconButton aria-label={false} />',
        '<IconButton aria-label={enabled ? "Close" : ""} />',
        '<IconButton aria-label={"" as string} />',
        '<IconButton aria-label={"" satisfies string} />',
        '<ActionButton aria-label="" />',
        '<UI.IconButton aria-label="" />',
    ];
    const result = lint(`const cases = [${cases.join(',\n')}];`);

    assert.equal(result.status, 1);
    assert.equal(result.diagnostics.length, cases.length);
    assert.ok(result.diagnostics.every((diagnostic) => diagnostic.message.includes('non-empty aria-label')));
});

test('the guard accepts named buttons, dynamic labels and forwarded props without flagging unrelated components', () => {
    const result = lint(`
const cases = [
    <IconButton aria-label="Close" />,
    <IconButton aria-label={"Remove"} />,
    <IconButton aria-label={\`Refresh\`} />,
    <IconButton aria-label={removeLabel} />,
    <IconButton aria-label={useI18n('action.remove')} />,
    <IconButton aria-label={enabled ? 'Enable' : 'Disable'} />,
    <IconButton aria-label={\`Remove \${name}\`} />,
    <IconButton {...props} />,
    <ActionButton aria-label="Close" />,
    <UI.IconButton aria-label="Refresh" />,
    <OtherButton aria-label="" />,
];
function Example(IconButton) {
    return <IconButton aria-label="" />;
}
`);

    assert.equal(result.status, 0, JSON.stringify(result.diagnostics));
    assert.deepEqual(result.diagnostics, []);
});
