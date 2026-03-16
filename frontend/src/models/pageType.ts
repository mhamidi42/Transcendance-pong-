export interface Page {
	render:() => string,
	onMount?: () => void | Promise<void>,
	onUnmount?: () => void,
	onBeforeLeave?: () => void | Promise<void>,
};
