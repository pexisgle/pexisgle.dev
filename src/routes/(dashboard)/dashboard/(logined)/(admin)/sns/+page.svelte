<script lang="ts">
	import type { ActionResult } from '@sveltejs/kit';
	import {
		Button,
		Label,
		Input,
		Helper,
		Breadcrumb,
		BreadcrumbItem,
		Heading,
		Card,
		Modal,
		Fileupload
	} from 'flowbite-svelte';
	import {
		EditOutline,
		TrashBinOutline,
		DownloadOutline,
		UploadOutline
	} from 'flowbite-svelte-icons';
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import Icon from '@iconify/svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { toast } from '$lib/stores/toast';

	let { data }: PageProps = $props();

	type SnsItem = (typeof data.snsItems)[number];

	let editingId: string | null = $state(null);
	let importModalOpen = $state(false);
	let importFile: File | null = $state(null);

	// Reordering state
	let isReordering = $state(false);
	let reorderedSnsItems = $state<SnsItem[] | null>(null);
	let localSnsItems = $derived(
		reorderedSnsItems ?? data.snsItems.slice().sort((a: SnsItem, b: SnsItem) => a.order - b.order)
	);
	let draggingIndex: number | null = $state(null);

	// superForm for create/update
	// svelte-ignore state_referenced_locally
	const {
		form,
		enhance: formEnhance,
		errors
	} = superForm(data.form, {
		onError({ result }: { result: ActionResult }) {
			// Handle server errors
			console.error('Form submission error:', result);
			toast.error('フォームの送信中にエラーが発生しました');
		},
		onResult: ({ result }: { result: ActionResult }) => {
			if (result.type === 'failure') {
				toast.error('入力内容を確認してください');
			} else if (result.type === 'error') {
				toast.error(result.error.message);
			} else if (result.type === 'success') {
				toast.success(editingId === null ? 'SNSを作成しました' : 'SNSを更新しました');
				const payload = (result.data ?? result) as { snsItem?: SnsItem };
				const snsItem = payload.snsItem;
				if (snsItem) {
					if (editingId === null) {
						// Create new - reset form for next entry
						form.set({
							...$form,
							id: undefined,
							name: '',
							icon: '',
							url: '',
							color: '#000000',
							order: Math.max(...localSnsItems.map((s) => s.order), 0) + 1
						});
					} else {
						// Update existing - go back to create mode
						startCreate();
					}
				}
			}
		}
	});

	// superForm for delete
	// svelte-ignore state_referenced_locally
	const { enhance: deleteEnhance } = superForm(data.deleteForm, {
		id: 'delete-form',
		onError({ result }: { result: ActionResult }) {
			const message =
				result.type === 'error' && result.error.message
					? `削除中にエラーが発生しました: ${result.error.message}`
					: '削除中にエラーが発生しました';
			toast.error(message);
		},
		onResult: ({ result }: { result: ActionResult }) => {
			if (result.type === 'failure') {
				toast.error('削除できませんでした');
			} else if (result.type === 'error') {
				toast.error(result.error.message);
			} else if (result.type === 'success') {
				toast.success('SNSを削除しました');
			}
		}
	});

	// superForm for import
	// svelte-ignore state_referenced_locally
	const { enhance: importEnhance } = superForm(data.importForm, {
		id: 'import-form',
		dataType: 'form'
	});

	function startCreate() {
		editingId = null;
		form.set({
			...$form,
			id: undefined,
			name: '',
			icon: '',
			url: '',
			color: '#000000',
			order: Math.max(...localSnsItems.map((s) => s.order), -1) + 1
		});
	}

	function startEdit(item: SnsItem) {
		editingId = item.id;
		form.set({
			...$form,
			id: item.id,
			name: item.name,
			icon: item.icon,
			url: item.url,
			color: item.color,
			order: item.order
		});
	}

	function cancelEdit() {
		editingId = null;
		form.set({
			...$form,
			id: undefined,
			name: '',
			icon: '',
			url: '',
			color: '#000000',
			order: 0
		});
	}

	function exportJSON() {
		const cleanData = $state.snapshot(localSnsItems).map(({ name, icon, url, color, order }) => ({
			name,
			icon,
			url,
			color,
			order
		}));
		const dataStr = JSON.stringify(cleanData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `sns-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// DnD Logic
	function toggleReorder() {
		isReordering = !isReordering;
		if (isReordering) {
			reorderedSnsItems = data.snsItems.slice().sort((a, b) => a.order - b.order);
		} else {
			reorderedSnsItems = null;
		}
	}

	function handleDragStart(e: DragEvent, index: number) {
		draggingIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.dropEffect = 'move';
		}
	}

	function handleDragEnter(e: DragEvent, targetIndex: number) {
		if (draggingIndex === null || draggingIndex === targetIndex) return;
		if (!reorderedSnsItems) reorderedSnsItems = [...localSnsItems];

		const newItems = [...reorderedSnsItems];
		const item = newItems[draggingIndex];
		newItems.splice(draggingIndex, 1);
		newItems.splice(targetIndex, 0, item);
		reorderedSnsItems = newItems;
		draggingIndex = targetIndex;
	}

	function handleDragEnd() {
		draggingIndex = null;
	}

	function getReorderedItemsJSON() {
		return JSON.stringify(
			localSnsItems.map((item, index) => ({
				id: item.id,
				order: index
			}))
		);
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>SNS</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>SNS</Heading
		>
		<div class="flex gap-2">
			{#if isReordering}
				<form
					method="POST"
					action="?/reorder"
					use:enhance={() => {
						return async ({ result }: { result: ActionResult }) => {
							if (result.type === 'success') {
								toast.success('並び順を保存しました');
								isReordering = false;
								await window.location.reload();
							} else {
								toast.error('保存に失敗しました');
							}
						};
					}}
				>
					<input type="hidden" name="items" value={getReorderedItemsJSON()} />
					<Button type="submit" size="sm" color="blue">保存</Button>
				</form>
				<Button size="sm" color="alternative" onclick={toggleReorder}>キャンセル</Button>
			{:else}
				<Button color="alternative" size="sm" onclick={toggleReorder}>並び替え</Button>
				<Button color="alternative" size="sm" onclick={exportJSON} class="gap-2">
					<DownloadOutline class="h-4 w-4" />
					エクスポート
				</Button>
				<Button
					color="alternative"
					size="sm"
					onclick={() => (importModalOpen = true)}
					class="gap-2"
				>
					<UploadOutline class="h-4 w-4" />
					インポート
				</Button>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Left: Form -->
		<div>
			<Card class="h-fit p-6">
				<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
					{editingId === null ? 'SNSの新規作成' : 'SNSの編集'}
				</h3>
				<form
					method="POST"
					action="?/{editingId === null ? 'create' : 'update'}"
					use:formEnhance
					class="space-y-4"
				>
					{#if editingId}
						<input type="hidden" name="id" value={editingId} />
					{/if}

					<div>
						<Label for="name">名前</Label>
						<Input id="name" name="name" placeholder="Twitter" bind:value={$form.name} required />
						{#if $errors.name}
							<Helper color="red">{$errors.name}</Helper>
						{/if}
					</div>

					<div>
						<Label for="icon">アイコン</Label>
						<Input
							id="icon"
							name="icon"
							placeholder="brand:twitter"
							bind:value={$form.icon}
							required
						/>
						{#if $errors.icon}
							<Helper color="red">{$errors.icon}</Helper>
						{/if}
						{#if $form.icon}
							<div class="mt-2 flex items-center gap-2">
								<span class="text-sm text-gray-500 dark:text-gray-400">プレビュー:</span>
								<Icon icon={$form.icon} width="32" height="32" color={$form.color || '#000000'} />
							</div>
						{/if}
					</div>

					<div>
						<Label for="url">URL</Label>
						<Input
							id="url"
							name="url"
							placeholder="https://twitter.com/username"
							bind:value={$form.url}
							required
						/>
						{#if $errors.url}
							<Helper color="red">{$errors.url}</Helper>
						{/if}
					</div>

					<div>
						<Label for="color">色</Label>
						<div class="flex items-center gap-2">
							<Input id="color" name="color" type="color" bind:value={$form.color} required />
							<span class="text-sm text-gray-700 dark:text-gray-300">{$form.color}</span>
						</div>
						{#if $errors.color}
							<Helper color="red">{$errors.color}</Helper>
						{/if}
					</div>

					<div>
						<Label for="order">順序</Label>
						<Input
							id="order"
							name="order"
							type="number"
							min="0"
							bind:value={$form.order}
							required
						/>
						{#if $errors.order}
							<Helper color="red">{$errors.order}</Helper>
						{/if}
					</div>

					<div class="flex gap-2 pt-2">
						<Button type="submit">{editingId === null ? '作成' : '更新'}</Button>
						{#if editingId !== null}
							<Button type="button" color="alternative" onclick={cancelEdit}>キャンセル</Button>
						{/if}
					</div>
				</form>
			</Card>
		</div>

		<!-- Right: Preview/List -->
		<div>
			<div class="space-y-3">
				{#if localSnsItems.length === 0}
					<p class="text-gray-500 dark:text-gray-400">SNS情報がありません</p>
				{:else}
					{#each localSnsItems as item, index (item.id)}
						<div
							animate:flip={{ duration: 300 }}
							draggable={isReordering}
							ondragstart={(e) => handleDragStart(e, index)}
							ondragenter={(e) => handleDragEnter(e, index)}
							ondragend={handleDragEnd}
							role="listitem"
							class="transition-all {isReordering
								? 'cursor-move opacity-90 hover:opacity-100'
								: ''} {draggingIndex === index ? 'opacity-50' : ''}"
						>
							<Card class="border-l-4 p-4" style="border-left-color: {item.color}">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="mb-2 flex items-center gap-3">
											<Icon icon={item.icon} width="32" height="32" color={item.color} />
											<div>
												<h4 class="font-semibold text-gray-900 dark:text-white">
													{item.name}
												</h4>
												<div class="text-xs text-gray-500 dark:text-gray-400">
													順序: {item.order}
													{isReordering ? `→ ${index}` : ''}
												</div>
											</div>
										</div>
										<div class="mt-2 space-y-2">
											<div class="text-sm break-all text-gray-600 dark:text-gray-300">
												<a
													href={item.url}
													target="_blank"
													rel="noopener noreferrer"
													class="text-blue-500 hover:underline"
												>
													{item.url}
												</a>
											</div>
											<div class="flex items-center gap-2">
												<div class="h-4 w-4 rounded" style="background-color: {item.color}"></div>
												<span class="font-mono text-xs text-gray-600 dark:text-gray-400"
													>{item.color}</span
												>
											</div>
										</div>
									</div>
									<div class="flex gap-2">
										{#if !isReordering}
											<Button type="button" size="xs" color="light" onclick={() => startEdit(item)}>
												<EditOutline class="h-4 w-4" />
											</Button>
											<form method="POST" action="?/delete" use:deleteEnhance>
												<input type="hidden" name="id" value={item.id} />
												<Button type="submit" size="xs" color="red" class="p-2!">
													<TrashBinOutline class="h-4 w-4" />
												</Button>
											</form>
										{/if}
									</div>
								</div>
							</Card>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<!-- Create Button at bottom -->
</div>

<!-- Import Modal -->
<Modal bind:open={importModalOpen} size="sm" title="SNSをインポート" autoclose={false}>
	<form
		method="POST"
		action="?/import"
		enctype="multipart/form-data"
		use:importEnhance={{
			onResult: ({ result }: { result: ActionResult }) => {
				if (result.type === 'failure') {
					toast.error('インポートに失敗しました。ファイル形式を確認してください。');
				} else if (result.type === 'error') {
					toast.error(result.error.message);
				} else if (result.type === 'success') {
					toast.success('インポートが完了しました');
					window.location.reload();
				}
			},
			onError({ result }: { result: ActionResult }) {
				const message =
					result.type === 'error' && result.error.message
						? result.error.message
						: 'インポート中にエラーが発生しました';
				toast.error(message);
			}
		}}
		class="space-y-4"
	>
		<div>
			<Label for="import-file">JSONファイル</Label>
			<Fileupload
				id="import-file"
				name="file"
				accept=".json"
				onchange={(e) => {
					const target = e.target as HTMLInputElement;
					importFile = target.files?.[0] || null;
				}}
				required
			/>
			<Helper class="mt-2">SNSデータを含むJSONファイルを選択してください</Helper>
		</div>

		<div class="flex justify-end gap-2">
			<Button color="alternative" onclick={() => (importModalOpen = false)}>キャンセル</Button>
			<Button type="submit" color="blue" disabled={!importFile}>インポート</Button>
		</div>
	</form>
</Modal>
