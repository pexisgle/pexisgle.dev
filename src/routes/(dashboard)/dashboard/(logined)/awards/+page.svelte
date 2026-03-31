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
		Spinner
	} from 'flowbite-svelte';
	import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { ghReadJsonData, ghWriteJsonData } from '$lib/dashboard/github';
	import { toast } from '$lib/dashboard/stores/toast';
	import typia from 'typia';

	let { data } = $props();

	type Award = {
		id: string;
		name: string;
		date: string | null;
		status: string | null;
		order: number;
		createdAt: string;
		updatedAt: string;
	};

	// ── Core state ────────────────────────────────────────────────────────────
	let items = $state<Award[]>([]);
	let currentSha = $state<string | null>(null);
	let loading = $state(true);
	let saving = $state(false);

	// ── Form state ────────────────────────────────────────────────────────────
	let formName = $state('');
	let formDate = $state('');
	let formStatus = $state('');
	let formOrder = $state(0);
	let editingId = $state<string | null>(null);
	let nameError = $state('');

	// ── Reorder state ─────────────────────────────────────────────────────────
	let isReordering = $state(false);
	let reorderedAwards = $state<Award[] | null>(null);
	let draggingIndex = $state<number | null>(null);

	let localAwards = $derived(reorderedAwards ?? items.slice().sort((a, b) => a.order - b.order));

	// ── Data loading ──────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			const token = data.token;
			const { data: award_data, sha } = await ghReadJsonData(token, 'awards.json', []);
			const validation = typia.validate<Award[]>(award_data); // Log validation errors but proceed with raw data
			items = validation.success ? validation.data : [];
			currentSha = sha;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'データの読み込みに失敗しました');
		} finally {
			loading = false;
		}
	});

	async function refreshData() {
		const token = data.token;
		const { data: award_data, sha } = await ghReadJsonData(token, 'awards.json', []);
		const validation = typia.validate<Award[]>(award_data);
		items = validation.success ? validation.data : [];
		currentSha = sha;
	}

	// ── Form helpers ──────────────────────────────────────────────────────────
	function startCreate() {
		editingId = null;
		formName = '';
		formDate = '';
		formStatus = '';
		formOrder = Math.max(...items.map((a) => a.order), -1) + 1;
		nameError = '';
	}

	function startEdit(item: Award) {
		editingId = item.id;
		formName = item.name;
		formDate = item.date ?? '';
		formStatus = item.status ?? '';
		formOrder = item.order;
		nameError = '';
	}

	function cancelEdit() {
		startCreate();
	}

	// ── Mutations ─────────────────────────────────────────────────────────────
	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!formName.trim()) {
			nameError = '名前を入力してください';
			return;
		}
		nameError = '';
		saving = true;
		try {
			const token = data.token;
			const now = new Date().toISOString();
			if (editingId === null) {
				const newItem: Award = {
					id: crypto.randomUUID(),
					name: formName.trim(),
					date: formDate || null,
					status: formStatus || null,
					order: formOrder,
					createdAt: now,
					updatedAt: now
				};
				await ghWriteJsonData(
					token,
					'awards.json',
					[...items, newItem],
					currentSha,
					`create award: ${newItem.name}`
				);
				await refreshData();
				toast.success('受賞歴を作成しました');
				// Reset for next entry
				formName = '';
				formDate = '';
				formStatus = '';
				formOrder = Math.max(...items.map((a) => a.order), 0) + 1;
			} else {
				const updated = items.map((item) =>
					item.id === editingId
						? {
								...item,
								name: formName.trim(),
								date: formDate || null,
								status: formStatus || null,
								order: formOrder,
								updatedAt: now
							}
						: item
				);
				await ghWriteJsonData(
					token,
					'awards.json',
					updated,
					currentSha,
					`update award: ${formName}`
				);
				await refreshData();
				toast.success('受賞歴を更新しました');
				startCreate();
			}
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'フォームの送信中にエラーが発生しました');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		saving = true;
		try {
			const token = data.token;
			const newItems = items.filter((item) => item.id !== id);
			await ghWriteJsonData(token, 'awards.json', newItems, currentSha, `delete award: ${id}`);
			await refreshData();
			toast.success('受賞歴を削除しました');
		} catch (e) {
			toast.error(
				e instanceof Error
					? `削除中にエラーが発生しました: ${e.message}`
					: '削除中にエラーが発生しました'
			);
		} finally {
			saving = false;
		}
	}

	// ── Reorder ───────────────────────────────────────────────────────────────
	function toggleReorder() {
		isReordering = !isReordering;
		if (isReordering) {
			reorderedAwards = items.slice().sort((a, b) => a.order - b.order);
		} else {
			reorderedAwards = null;
		}
	}

	async function saveReorder() {
		saving = true;
		try {
			const token = data.token;
			const newItems = localAwards.map((item, index) => ({ ...item, order: index }));
			await ghWriteJsonData(token, 'awards.json', newItems, currentSha, 'reorder awards');
			await refreshData();
			isReordering = false;
			reorderedAwards = null;
			toast.success('並び順を保存しました');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : '保存に失敗しました');
		} finally {
			saving = false;
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

	// ── Utilities ─────────────────────────────────────────────────────────────
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
				<Button size="sm" color="blue" disabled={saving} onclick={saveReorder}>
					{#if saving}<Spinner size="4" class="mr-1" />{/if}
					保存
				</Button>
				<Button size="sm" color="alternative" onclick={toggleReorder}>キャンセル</Button>
			{:else}
				<Button color="alternative" size="sm" onclick={toggleReorder}>並び替え</Button>
			{/if}
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Spinner size="8" />
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Left: Form -->
			<div>
				<Card class="h-fit p-6">
					<h3 class="mb-4 text-lg font-medium text-gray-900 dark:text-white">
						{editingId === null ? '受賞歴の新規作成' : '受賞歴の編集'}
					</h3>
					<form onsubmit={handleSubmit} class="space-y-4">
						<div>
							<Label for="name">名前</Label>
							<Input id="name" name="name" placeholder="受賞名" bind:value={formName} required />
							{#if nameError}
								<Helper color="red">{nameError}</Helper>
							{/if}
						</div>

						<div>
							<Label for="date">日付</Label>
							<Input id="date" name="date" type="date" bind:value={formDate} />
						</div>

						<div>
							<Label for="status">ステータス</Label>
							<Select
								id="status"
								name="status"
								bind:value={formStatus}
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
								bind:value={formOrder}
								required
							/>
						</div>

						<div class="flex gap-2 pt-2">
							<Button type="submit" disabled={saving}>
								{#if saving}<Spinner size="4" class="mr-1" />{/if}
								{editingId === null ? '作成' : '更新'}
							</Button>
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
												<Button
													type="button"
													size="xs"
													color="light"
													onclick={() => startEdit(item)}
												>
													<EditOutline class="h-4 w-4" />
												</Button>
												<Button
													type="button"
													size="xs"
													color="red"
													class="p-2!"
													disabled={saving}
													onclick={() => handleDelete(item.id)}
												>
													<TrashBinOutline class="h-4 w-4" />
												</Button>
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
	{/if}
</div>
