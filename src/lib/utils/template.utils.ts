/**
 * Utility functions for template rendering and placeholder substitution
 */

import type { Field } from '$lib/services/field.service.js';

/**
 * Generate a placeholder string from a field name
 * Normalizes the field name to match template editor conventions
 */
export function getFieldPlaceholder(fieldName: string): string {
	return `{{${fieldName.toLowerCase().replace(/\s+/g, '_')}}}`;
}

/**
 * Replace placeholders in template content with actual field values
 * Handles multiple placeholder format variations and missing values
 */
export function replacePlaceholders(
	content: string,
	data: Record<string, unknown>,
	_fields?: Field[]
): string {
	if (!content) return '';

	let result = content;

	// Simple approach: directly replace placeholders like the working template preview
	Object.entries(data).forEach(([fieldName, value]) => {
		const stringValue = value ? String(value) : '';

		// Create variations of the placeholder to handle whitespace
		const exactPlaceholder = `{{${fieldName}}}`;
		const spaceVariations = [
			`{{ ${fieldName} }}`,
			`{{ ${fieldName}}}`,
			`{{${fieldName} }}`,
			`{{  ${fieldName}  }}`,
			`{{	${fieldName}	}}` // tab variations
		];

		// Replace exact match first
		result = result.split(exactPlaceholder).join(stringValue);

		// Then handle common whitespace variations
		spaceVariations.forEach((variation) => {
			result = result.split(variation).join(stringValue);
		});

		// Handle case-insensitive replacements for common variations
		const lowerFieldName = fieldName.toLowerCase();
		if (lowerFieldName !== fieldName) {
			const lowerPlaceholder = `{{${lowerFieldName}}}`;
			result = result.split(lowerPlaceholder).join(stringValue);
		}
	});

	// Clean up any remaining placeholders that don't have data
	result = result.replace(
		/\{\{[^}]+\}\}/g,
		'<span class="text-muted-foreground italic text-sm">[Missing field]</span>'
	);

	return result;
}

/**
 * Replace placeholders with example values for preview purposes
 */
export function replacePlaceholdersWithExamples(content: string, fields: Field[]): string {
	if (!content) return '';

	let result = content;

	fields.forEach((field) => {
		const placeholder = getFieldPlaceholder(field.label);
		const exampleValue = field.example || `[${field.label}]`;

		// Replace all variations of the placeholder
		const placeholderVariations = [
			placeholder,
			`{{ ${field.label.toLowerCase().replace(/\s+/g, '_')} }}`,
			`{{ ${field.label.toLowerCase().replace(/\s+/g, '_')}}}`,
			`{{${field.label.toLowerCase().replace(/\s+/g, '_')} }}`,
			`{{  ${field.label.toLowerCase().replace(/\s+/g, '_')}  }}`
		];

		placeholderVariations.forEach((variation) => {
			// Use split and join for global replacement to avoid RegExp constructor security issues
			result = result.split(variation).join(exampleValue);
		});
	});

	// Clean up any remaining placeholders
	result = result.replace(
		/\{\{[^}]+\}\}/g,
		'<span class="text-muted-foreground italic text-sm">[Example field]</span>'
	);

	return result;
}

/**
 * Generate sample data for template preview
 */
export function generateSampleData(fields: Field[]): Record<string, string> {
	const sampleData: Record<string, string> = {};

	fields.forEach((field) => {
		// Use example if available, otherwise generate based on field type and label
		if (field.example) {
			sampleData[field.name] = field.example;
			return;
		}

		// Generate sample based on field label patterns
		const labelLower = field.label.toLowerCase();

		if (labelLower.includes('word') || labelLower.includes('term')) {
			sampleData[field.name] = 'casa';
		} else if (labelLower.includes('translation')) {
			sampleData[field.name] = 'house';
		} else if (labelLower.includes('pronunciation')) {
			sampleData[field.name] = '/ˈka.sa/';
		} else if (labelLower.includes('example') || labelLower.includes('sentence')) {
			sampleData[field.name] = 'Mi casa es grande.';
		} else if (labelLower.includes('description') || labelLower.includes('definition')) {
			sampleData[field.name] = 'A building for human habitation.';
		} else if (labelLower.includes('notes') || labelLower.includes('hint')) {
			sampleData[field.name] = 'Remember: feminine noun (la casa)';
		} else {
			sampleData[field.name] = `Sample ${field.label}`;
		}
	});

	return sampleData;
}
