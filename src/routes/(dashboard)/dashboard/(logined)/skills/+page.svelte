<script lang="ts">
	import { Button, Label, Input, Breadcrumb, BreadcrumbItem, Heading, Card } from 'flowbite-svelte';
	import { EditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import Icon from '@iconify/svelte';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { toast } from '$lib/dashboard/stores/toast';
	import typia from 'typia';
	import { ghReadJsonData, ghWriteJsonData } from '$lib/dashboard/github';

	let { data } = $props();

	type Skill = {
		id: string;
		name: string;
		icon: string;
		confidence: number;
		order: number;
	};

	// Data state
	let items = $state<Skill[]>([]);
	let loading = $state(true);
	let saving = $state(false);

	// Form state
	let editingId = $state<string | null>(null);
	let formName = $state('');
	let formIcon = $state('');
	let formConfidence = $state(3);
	let formOrder = $state(0);

	// Reordering state
	let isReordering = $state(false);
	let reorderedItems = $state<Skill[] | null>(null);
	let draggingIndex = $state<number | null>(null);
	// Derived
	let localSkills = $derived(reorderedItems ?? items.slice().sort((a, b) => a.order - b.order));

	onMount(async () => {
		try {
			const { data: skill_data } = await ghReadJsonData(data.token, 'skills.json', []);
			const validation = typia.validate<Skill[]>(skill_data);
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
		formConfidence = 3;
		formOrder = Math.max(...localSkills.map((s) => s.order), -1) + 1;
	}

	function startEdit(item: Skill) {
		editingId = item.id;
		formName = item.name;
		formIcon = item.icon;
		formConfidence = item.confidence;
		formOrder = item.order;
	}

	function cancelEdit() {
		editingId = null;
		formName = '';
		formIcon = '';
		formConfidence = 3;
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
			const { data: skill_data, sha } = await ghReadJsonData(data.token, 'skills.json', []);
			if (!typia.is<Skill[]>(skill_data)) {
				toast.error('既存のデータが不正な形式です');
				return;
			}
			const newItem: Skill = {
				id: crypto.randomUUID(),
				name: formName,
				icon: formIcon,
				confidence: Number(formConfidence),
				order: Number(formOrder)
			};
			items = [...skill_data, newItem];
			await ghWriteJsonData(data.token, 'skills.json', items, sha, `create skill: ${newItem.name}`);
			toast.success('スキルを作成しました');
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
			const { data: raw_skill_data, sha } = await ghReadJsonData(data.token, 'skills.json', []);
			const validation = typia.validate<Skill[]>(raw_skill_data);
			const skill_data = validation.success ? validation.data : [];
			items = skill_data.map((s) =>
				s.id === editingId
					? {
							...s,
							name: formName,
							icon: formIcon,
							confidence: Number(formConfidence),
							order: Number(formOrder)
						}
					: s
			);
			await ghWriteJsonData(data.token, 'skills.json', items, sha, `update skill: ${formName}`);
			toast.success('スキルを更新しました');
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
			const { data: raw_skill_data, sha } = await ghReadJsonData(data.token, 'skills.json', []);
			const validation = typia.validate<Skill[]>(raw_skill_data);
			const skill_data = validation.success ? validation.data : [];
			const deleted = skill_data.find((s) => s.id === id);
			const items = skill_data.filter((s) => s.id !== id);
			await ghWriteJsonData(
				data.token,
				'skills.json',
				items,
				sha,
				`delete skill: ${deleted?.name ?? id}`
			);
			if (editingId === id) startCreate();
			toast.success('スキルを削除しました');
		} catch (e) {
			toast.error('削除に失敗しました: ' + e);
		} finally {
			saving = false;
		}
	}

	async function handleReorder() {
		saving = true;
		try {
			const { data: raw_skill_data, sha } = await ghReadJsonData(data.token, 'skills.json', []);
			const validation = typia.validate<Skill[]>(raw_skill_data);
			const skill_data = validation.success ? validation.data : [];
			const reordered = localSkills.map((item, index) => {
				const original = skill_data.find((s) => s.id === item.id);
				return original ? { ...original, order: index } : { ...item, order: index };
			});
			await ghWriteJsonData(data.token, 'skills.json', reordered, sha, 'reorder skills');
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
		if (!reorderedItems) reorderedItems = [...localSkills];

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
		<BreadcrumbItem>スキル</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>スキル</Heading
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
					{editingId === null ? 'スキルの新規作成' : 'スキルの編集'}
				</h3>
				<form onsubmit={handleFormSubmit} class="space-y-4">
					<div>
						<Label for="name">名前</Label>
						<Input id="name" name="name" placeholder="HTML5" bind:value={formName} required />
					</div>

					<div>
						<Label for="icon">アイコン</Label>
						<Input
							id="icon"
							name="icon"
							placeholder="skill-icons:html"
							bind:value={formIcon}
							required
						/>
						{#if formIcon}
							<div class="mt-2 flex items-center gap-2">
								<span class="text-sm text-gray-500 dark:text-gray-400">プレビュー:</span>
								<Icon icon={formIcon} width="32" height="32" />
							</div>
						{/if}
					</div>

					<div>
						<Label for="confidence">信頼度 (1-5)</Label>
						<Input
							id="confidence"
							name="confidence"
							type="number"
							min="1"
							max="5"
							bind:value={formConfidence}
							required
						/>
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
				{:else if localSkills.length === 0}
					<p class="text-gray-500 dark:text-gray-400">スキル情報がありません</p>
				{:else}
					{#each localSkills as item, index (item.id)}
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
										<div class="mb-2 flex items-center gap-3">
											{#if item.icon.startsWith('/') || item.icon.startsWith('http')}
												<img src={item.icon} alt={item.name} class="h-8 w-8" />
											{:else}
												<Icon icon={item.icon} width="32" height="32" />
											{/if}
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
										<div class="mt-2">
											<div class="text-sm text-gray-600 dark:text-gray-300">
												信頼度: {item.confidence}/5
											</div>
											<div class="mt-1 text-sm">
												{'★'.repeat(item.confidence)}{'☆'.repeat(5 - item.confidence)}
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
