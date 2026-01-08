import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		add: (message: string, type: ToastType = 'info', duration: number = 3000) => {
			const id = uuidv4();
			const toast: Toast = { id, message, type, duration };
			update((toasts) => [...toasts, toast]);

			if (duration > 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, duration);
			}
		},
		remove: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		success: (message: string, duration?: number) => toast.add(message, 'success', duration),
		error: (message: string, duration?: number) => toast.add(message, 'error', duration),
		info: (message: string, duration?: number) => toast.add(message, 'info', duration),
		warning: (message: string, duration?: number) => toast.add(message, 'warning', duration)
	};
}

export const toast = createToastStore();
