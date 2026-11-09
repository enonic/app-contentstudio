const MESSAGE = 'IconButton requires a non-empty aria-label describing its action.';

function isIconButton(name, sourceCode, node) {
    const namespace = name.type === 'JSXMemberExpression' && name.property.name === 'IconButton';
    const identifier = namespace ? name.object : name;
    if (identifier.type !== 'JSXIdentifier') {
        return false;
    }

    for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
        const variable = scope.set.get(identifier.name);
        if (!variable) {
            continue;
        }

        return variable.defs.some(
            (definition) =>
                definition.type === 'ImportBinding' &&
                definition.parent.source.value === '@enonic/ui' &&
                (namespace
                    ? definition.node.type === 'ImportNamespaceSpecifier'
                    : definition.node.type === 'ImportSpecifier' && definition.node.imported.name === 'IconButton'),
        );
    }
    return false;
}

function isBlank(node) {
    if (!node) {
        return true;
    }

    switch (node.type) {
        case 'Literal':
            return typeof node.value !== 'string' || node.value.trim() === '';
        case 'TemplateLiteral':
            return node.expressions.length === 0 && node.quasis.every((part) => !part.value.cooked.trim());
        case 'Identifier':
            return node.name === 'undefined';
        case 'UnaryExpression':
            return node.operator === 'void';
        case 'ConditionalExpression':
            return isBlank(node.consequent) || isBlank(node.alternate);
        case 'JSXExpressionContainer':
        case 'TSAsExpression':
        case 'TSTypeAssertion':
        case 'TSNonNullExpression':
        case 'TSSatisfiesExpression':
        case 'ParenthesizedExpression':
            return isBlank(node.expression);
        case 'JSXEmptyExpression':
            return true;
        default:
            // Runtime values, including translated labels, are checked in the browser.
            return false;
    }
}

export default {
    meta: { name: 'content-studio' },
    rules: {
        'icon-button-label': {
            meta: {
                type: 'problem',
                schema: [],
                messages: { label: MESSAGE },
            },
            create(context) {
                return {
                    JSXOpeningElement(node) {
                        if (!isIconButton(node.name, context.sourceCode, node)) {
                            return;
                        }

                        const label = node.attributes.findLast(
                            (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'aria-label',
                        );
                        // Forwarded props are checked by IconButton's required TypeScript prop.
                        if (!label && node.attributes.some((attribute) => attribute.type === 'JSXSpreadAttribute')) {
                            return;
                        }

                        if (!label || isBlank(label.value)) {
                            context.report({ node: label ?? node, messageId: 'label' });
                        }
                    },
                };
            },
        },
    },
};
