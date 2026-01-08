<script lang="ts">
	import {
		Button,
		Badge,
		Label,
		Input,
		Select,
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
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { toast } from '$lib/stores/toast';

	let { data }: PageProps = $props();

	type Award = (typeof data.awards)[number];

	let editingId: string | null = $state(null);
	let importModalOpen = $state(false);
	let importFile: File | null = $state(null);

	// Reordering state
	let isReordering = $state(false);
	// When reordering, we work on a local copy. When not, we reflect data.awards
	let reorderedAwards = $state<Award[] | null>(null);
	// displayAwards is what the UI renders
	let localAwards = $derived(
		reorderedAwards ?? data.awards.slice().sort((a, b) => a.order - b.order)
	);
	let draggingIndex: number | null = $state(null);

	// superForm for create/update
	// svelte-ignore state_referenced_locally
	const {
		form,
		enhance: formEnhance,
		errors
	} = superForm(data.form, {
		onError({ result }) {
			// Handle server errors
			console.error('Form submission error:', result);
			toast.error('フォームの送信中にエラーが発生しました');
		},
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				toast.error('入力内容を確認してください');
			} else if (result.type === 'error') {
				toast.error(result.error.message);
			} else if (result.type === 'success') {
				toast.success(editingId === null ? '受賞歴を作成しました' : '受賞歴を更新しました');
				const payload = (result.data ?? result) as { award?: Award };
				const award = payload.award;
				if (award) {
					if (editingId === null) {
						// Create new - reset form for next entry
						form.set({
							...$form,
							id: undefined,
							name: '',
							date: undefined,
							status: undefined,
							order: Math.max(...localAwards.map((a) => a.order), 0) + 1
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
		onError({ result }) {
			toast.error(
				result.error.message
					? `削除中にエラーが発生しました: ${result.error.message}`
					: '削除中にエラーが発生しました'
			);
		},
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				toast.error('削除できませんでした');
			} else if (result.type === 'error') {
				toast.error(result.error.message);
			} else if (result.type === 'success') {
				toast.success('受賞歴を削除しました');
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
			date: undefined,
			status: undefined,
			order: Math.max(...localAwards.map((a) => a.order), -1) + 1
		});
	}

	function startEdit(item: Award) {
		editingId = item.id;
		form.set({
			...$form,
			id: item.id,
			name: item.name,
			date: item.date ?? undefined,
			status: item.status ?? undefined,
			order: item.order
		});
	}

	function cancelEdit() {
		editingId = null;
		form.set({
			...$form,
			id: undefined,
			name: '',
			date: undefined,
			status: undefined,
			order: 0
		});
	}

	function getStatusColor(status: string | null) {
		switch (status) {
			case 'Gold':
				return 'yellow';
			case 'Silver':
				return 'gray';
			case 'Bronze':
				return 'orange';
			default:
				return 'blue';
		}
	}

	function exportJSON() {
		const cleanData = $state.snapshot(localAwards).map(({ name, date, status, order }) => ({
			name,
			date,
			status,
			order
		}));
		const dataStr = JSON.stringify(cleanData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `awards-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// DnD Logic
	function toggleReorder() {
		isReordering = !isReordering;
		if (isReordering) {
			// Initialize local copy for reordering
			reorderedAwards = data.awards.slice().sort((a, b) => a.order - b.order);
		} else {
			// Reset to server data if cancelling
			reorderedAwards = null;
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
		// Ensure we have a mutable array (should be true if dragging)
		if (!reorderedAwards) reorderedAwards = [...localAwards];

		const newItems = [...reorderedAwards];
		const item = newItems[draggingIndex];
		newItems.splice(draggingIndex, 1);
		newItems.splice(targetIndex, 0, item);
		reorderedAwards = newItems;
		draggingIndex = targetIndex;
	}

	function handleDragEnd() {
		draggingIndex = null;
	}

	function getReorderedItemsJSON() {
		return JSON.stringify(
			localAwards.map((item, index) => ({
				id: item.id,
				order: index
			}))
		);
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>受賞歴</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>受賞歴</Heading
		>
		<div class="flex gap-2">
			{#if isReordering}
				<form
					method="POST"
					action="?/reorder"
					use:enhance={() => {
						return async ({ result }) => {
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
					{editingId === null ? '受賞歴の新規作成' : '受賞歴の編集'}
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
						<Input id="name" name="name" placeholder="受賞名" bind:value={$form.name} required />
						{#if $errors.name}
							<Helper color="red">{$errors.name}</Helper>
						{/if}
					</div>

					<div>
						<Label for="date">日付</Label>
						<Input id="date" name="date" type="date" bind:value={$form.date} />
					</div>

					<div>
						<Label for="status">ステータス</Label>
						<Select
							id="status"
							name="status"
							bind:value={$form.status}
							placeholder="選択してください"
						>
							<option value="">なし</option>
							<option value="Gold">Gold</option>
							<option value="Silver">Silver</option>
							<option value="Bronze">Bronze</option>
						</Select>
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
				{#if localAwards.length === 0}
					<p class="text-gray-500 dark:text-gray-400">受賞歴がありません</p>
				{:else}
					{#each localAwards as item, index (item.id)}
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
							<Card class="border-l-4 border-l-blue-500 p-4">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="mb-2">
											<h4 class="font-semibold text-gray-900 dark:text-white">
												{item.name}
											</h4>
											<div class="text-xs text-gray-500 dark:text-gray-400">
												順序: {item.order}
												{isReordering ? `→ ${index}` : ''}
											</div>
										</div>
										<div class="mt-2 space-y-2">
											{#if item.date}
												<div class="text-sm text-gray-600 dark:text-gray-300">
													日付: {item.date}
												</div>
											{/if}
											{#if item.status}
												<div class="flex items-center gap-2">
													<span class="text-sm text-gray-600 dark:text-gray-300">
														ステータス:
													</span>
													<Badge color={getStatusColor(item.status)}>
														{item.status}
													</Badge>
												</div>
											{/if}
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
<Modal bind:open={importModalOpen} size="sm" title="受賞歴をインポート" autoclose={false}>
	<form
		method="POST"
		action="?/import"
		enctype="multipart/form-data"
		use:importEnhance={{
			onResult: ({ result }) => {
				if (result.type === 'failure') {
					toast.error('インポートに失敗しました。ファイル形式を確認してください。');
				} else if (result.type === 'error') {
					toast.error(result.error.message);
				} else if (result.type === 'success') {
					toast.success('インポートが完了しました');
					window.location.reload();
				}
			},
			onError({ result }) {
				toast.error(result.error.message || 'インポート中にエラーが発生しました');
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
			<Helper class="mt-2">受賞歴データを含むJSONファイルを選択してください</Helper>
		</div>

		<div class="flex justify-end gap-2">
			<Button color="alternative" onclick={() => (importModalOpen = false)}>キャンセル</Button>
			<Button type="submit" color="blue" disabled={!importFile}>インポート</Button>
		</div>
	</form>
</Modal>
