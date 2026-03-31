<script lang="ts">
	import { Button, Label, Input, Breadcrumb, BreadcrumbItem, Heading, Card } from 'flowbite-svelte';
	import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { flip } from 'svelte/animate';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import { toast } from '$lib/dashboard/stores/toast';
	import typia from 'typia';
	import { ghReadJsonData, ghWriteJsonData } from '$lib/dashboard/github';

	let { data } = $props();
	type SnsItem = {
		id: string;
		name: string;
		icon: string;
		url: string;
		color: string;
		order: number;
	};

	// Data state
	let items = $state<SnsItem[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	// Form state
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formIcon = $state('');
	let formUrl = $state('');
	let formColor = $state('#000000');
	let formOrder = $state(0);

	// Reordering state
	let isReordering = $state(false);
	let reorderedItems = $state<SnsItem[] | null>(null);
	let draggingIndex = $state<number | null>(null);

	// Derived
	let localSnsItems = $derived(reorderedItems ?? items.slice().sort((a, b) => a.order - b.order));

	onMount(async () => {
		try {
			const { data: sns_data } = await ghReadJsonData(data.token, 'sns.json', []);
			const validation = typia.validate<SnsItem[]>(sns_data);
			items = validation.success ? validation.data : [];
			formOrder = items.length > 0 ? Math.max(...items.map((s) => s.order), -1) + 1 : 0;
		} catch (e) {
			toast.error('データの読み込みに失敗しました: ' + e);
		} finally {
			loading = false;
		}
	});

	function startCreate() {
		editingId = null;
		formName = '';
		formIcon = '';
		formUrl = '';
		formColor = '#000000';
		formOrder = Math.max(...localSnsItems.map((s) => s.order), -1) + 1;
	}

	function startEdit(item: SnsItem) {
		editingId = item.id;
		formName = item.name;
		formIcon = item.icon;
		formUrl = item.url;
		formColor = item.color;
		formOrder = item.order;
	}

	function cancelEdit() {
		editingId = null;
		formName = '';
		formIcon = '';
		formUrl = '';
		formColor = '#000000';
		formOrder = 0;
	}

	function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (editingId === null) {
			handleCreate();
		} else {
			handleUpdate();
		}
	}

	async function handleCreate() {
		saving = true;
		try {
			const { data: raw_sns_data, sha } = await ghReadJsonData(data.token, 'sns.json', []);
			const validation = typia.validate<SnsItem[]>(raw_sns_data);
			const sns_data = validation.success ? validation.data : [];
			const newItem: SnsItem = {
				id: crypto.randomUUID(),
				name: formName,
				icon: formIcon,
				url: formUrl,
				color: formColor,
				order: Number(formOrder)
			};
			const updated = [...sns_data, newItem];
			await ghWriteJsonData(data.token, 'sns.json', updated, sha, `create sns: ${newItem.name}`);
			items = updated;
			toast.success('SNSを作成しました');
			startCreate();
		} catch (e) {
			toast.error('作成に失敗しました: ' + e);
		} finally {
			saving = false;
		}
	}

	async function handleUpdate() {
		if (!editingId) return;
		saving = true;
		try {
			const { data: raw_sns_data, sha } = await ghReadJsonData(data.token, 'sns.json', []);
			const validation = typia.validate<SnsItem[]>(raw_sns_data);
			const sns_data = validation.success ? validation.data : [];
			const updated = sns_data.map((s) =>
				s.id === editingId
					? {
							...s,
							name: formName,
							icon: formIcon,
							url: formUrl,
							color: formColor,
							order: Number(formOrder)
						}
					: s
			);
			await ghWriteJsonData(data.token, 'sns.json', updated, sha, `update sns: ${formName}`);
			items = updated;
			toast.success('SNSを更新しました');
			startCreate();
		} catch (e) {
			toast.error('更新に失敗しました: ' + e);
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id: string) {
		saving = true;
		try {
			const { data: raw_sns_data, sha } = await ghReadJsonData(data.token, 'sns.json', []);
			const validation = typia.validate<SnsItem[]>(raw_sns_data);
			const sns_data = validation.success ? validation.data : [];
			const deleted = sns_data.find((s) => s.id === id);
			const updated = sns_data.filter((s) => s.id !== id);
			await ghWriteJsonData(
				data.token,
				'sns.json',
				updated,
				sha,
				`delete sns: ${deleted?.name ?? id}`
			);
			items = updated;
			if (editingId === id) startCreate();
			toast.success('SNSを削除しました');
		} catch (e) {
			toast.error('削除に失敗しました: ' + e);
		} finally {
			saving = false;
		}
	}

	async function handleReorder() {
		saving = true;
		try {
			const { data: raw_sns_data, sha } = await ghReadJsonData(data.token, 'sns.json', []);
			const validation = typia.validate<SnsItem[]>(raw_sns_data);
			const sns_data = validation.success ? validation.data : [];
			const reordered = localSnsItems.map((item, index) => {
				const original = sns_data.find((s) => s.id === item.id);
				return original ? { ...original, order: index } : { ...item, order: index };
			});
			await ghWriteJsonData(data.token, 'sns.json', reordered, sha, 'reorder sns');
			items = reordered;
			isReordering = false;
			reorderedItems = null;
			toast.success('並び順を保存しました');
		} catch (e) {
			toast.error('保存に失敗しました: ' + e);
		} finally {
			saving = false;
		}
	}

	// DnD Logic
	function toggleReorder() {
		isReordering = !isReordering;
		if (isReordering) {
			reorderedItems = items.slice().sort((a, b) => a.order - b.order);
		} else {
			reorderedItems = null;
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
		if (!reorderedItems) reorderedItems = [...localSnsItems];

		const newItems = [...reorderedItems];
		const item = newItems[draggingIndex];
		newItems.splice(draggingIndex, 1);
		newItems.splice(targetIndex, 0, item);
		reorderedItems = newItems;
		draggingIndex = targetIndex;
	}

	function handleDragEnd() {
		draggingIndex = null;
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
				<Button size="sm" color="blue" onclick={handleReorder} disabled={saving}>保存</Button>
				<Button size="sm" color="alternative" onclick={toggleReorder}>キャンセル</Button>
			{:else}
				<Button color="alternative" size="sm" onclick={toggleReorder}>並び替え</Button>
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
				<form onsubmit={handleFormSubmit} class="space-y-4">
					<div>
						<Label for="name">名前</Label>
						<Input id="name" name="name" placeholder="Twitter" bind:value={formName} required />
					</div>

					<div>
						<Label for="icon">アイコン</Label>
						<Input
							id="icon"
							name="icon"
							placeholder="brand:twitter"
							bind:value={formIcon}
							required
						/>
						{#if formIcon}
							<div class="mt-2 flex items-center gap-2">
								<span class="text-sm text-gray-500 dark:text-gray-400">プレビュー:</span>
								<Icon icon={formIcon} width="32" height="32" color={formColor || '#000000'} />
							</div>
						{/if}
					</div>

					<div>
						<Label for="url">URL</Label>
						<Input
							id="url"
							name="url"
							placeholder="https://twitter.com/username"
							bind:value={formUrl}
							required
						/>
					</div>

					<div>
						<Label for="color">色</Label>
						<div class="flex items-center gap-2">
							<Input id="color" name="color" type="color" bind:value={formColor} required />
							<span class="text-sm text-gray-700 dark:text-gray-300">{formColor}</span>
						</div>
					</div>

					<div>
						<Label for="order">順序</Label>
						<Input id="order" name="order" type="number" min="0" bind:value={formOrder} required />
					</div>

					<div class="flex gap-2 pt-2">
						<Button type="submit" disabled={saving}>
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
				{#if loading}
					<p class="text-gray-500 dark:text-gray-400">読み込み中...</p>
				{:else if localSnsItems.length === 0}
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
</div>
