import { error } from '@sveltejs/kit';
import { templateService } from '$lib/services/template.service';
import { fieldService } from '$lib/services/field.service';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    try {
        const templateId = params.templateId;

        if (!templateId) {
            throw error(404, 'Template not found');
        }

        // Load template and its fields in parallel
        const [template, fieldsResult] = await Promise.all([
            templateService.getById(templateId),
            fieldService.listByTemplate(templateId)
        ]);

        return {
            template,
            fields: fieldsResult.items
        };
    } catch (err: any) {
        console.error('Error loading template for edit:', err);
        throw error(404, 'Template not found');
    }
};
