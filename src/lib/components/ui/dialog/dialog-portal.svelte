<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	type $$Props = DialogPrimitive.PortalProps;

	export let to: $$Props['to'] = undefined;
	export let disabled: $$Props['disabled'] = undefined;
</script>

<DialogPrimitive.Portal {to} {disabled} {...$$restProps}>
	<slot />
</DialogPrimitive.Portal>
