import { Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import * as pmView from '@tiptap/pm/view';

interface ClipboardResult {
	dom: HTMLElement;
	text: string;
}

function getPmView() {
	try {
		return pmView;
	} catch {
		return null;
	}
}

export function serializeForClipboard(view: EditorView, slice: Slice): ClipboardResult {
	// Newer Tiptap/ProseMirror
	if (view && typeof view.serializeForClipboard === 'function') {
		return view.serializeForClipboard(slice) as ClipboardResult;
	}

	// Older version fallback
	const proseMirrorView = getPmView() as {
		__serializeForClipboard?: (view: EditorView, slice: Slice) => ClipboardResult;
	} | null;

	if (proseMirrorView && typeof proseMirrorView?.__serializeForClipboard === 'function') {
		return proseMirrorView.__serializeForClipboard(view, slice);
	}

	throw new Error('No supported clipboard serialization method found.');
}
