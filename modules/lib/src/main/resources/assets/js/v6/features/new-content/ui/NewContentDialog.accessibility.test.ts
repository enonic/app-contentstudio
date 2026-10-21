import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
    join(process.cwd(), 'src/main/resources/assets/js/v6/features/new-content/ui/NewContentDialog.tsx'),
    'utf8',
);

describe('NewContentDialog accessibility', () => {
    it('uses the dialog title and description primitives for its accessible name', () => {
        expect(source).toMatch(/<Dialog\.Title\b/);
        expect(source).toMatch(/<Dialog\.Description\b/);
    });
});
