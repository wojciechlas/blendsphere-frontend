<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	type $$Props = DialogPrimitive.OverlayProps;

	export let transition: $$Props['transition'] = undefined;
	export let transitionConfig: $$Props['transitionConfig'] = undefined;
	export let inTransition: $$Props['inTransition'] = undefined;
	export let inTransitionConfig: $$Props['inTransitionConfig'] = undefined;
	export let outTransition: $$Props['outTransition'] = undefined;
	export let outTransitionConfig: $$Props['outTransitionConfig'] = undefined;
</script>

<DialogPrimitive.Overlay
	{transition}
	{transitionConfig}
	{inTransition}
	{inTransitionConfig}
	{outTransition}
	{outTransitionConfig}
	{...$$restProps}
>
	<slot />
</DialogPrimitive.Overlay>
