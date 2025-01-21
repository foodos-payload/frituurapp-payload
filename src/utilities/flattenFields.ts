// File: src/utils/flattenFields.ts
import { Field } from 'payload';

/** 
 * Narrow the union so TS knows a field actually has a `name` property.
 */
function hasName(field: Field): field is Field & { name: string } {
    return typeof (field as any).name === 'string';
}

/**
 * Recursively traverse any Payload field type
 * and gather actual named fields (excluding containers).
 */
export function flattenFields(fields: Field[]): { name: string; type: string }[] {
    const results: { name: string; type: string }[] = [];

    fields.forEach((field) => {
        switch (field.type) {
            case 'group':
            case 'collapsible':
                // 'group' or 'collapsible' both have a 'fields' array
                if (field.fields) {
                    results.push(...flattenFields(field.fields));
                }
                break;

            case 'array':
                // Arrays have an item 'fields' array
                if (hasName(field)) {
                    // Record the array field itself if it has a `name`
                    results.push({ name: field.name, type: 'array' });
                }
                if (field.fields) {
                    // Flatten any subfields within the array
                    results.push(...flattenFields(field.fields));
                }
                break;

            case 'tabs':
                // Tabs is an array of { label, fields[] }
                if (field.tabs) {
                    field.tabs.forEach((tab) => {
                        results.push(...flattenFields(tab.fields));
                    });
                }
                break;

            default:
                // For normal fields like text, number, select, etc.
                // Only push if it has a `name`.
                if (hasName(field)) {
                    results.push({ name: field.name, type: field.type });
                }
                break;
        }
    });

    return results;
}
