<script lang="ts">
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
	import Icon from '@iconify/svelte';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import { getToken } from '$lib/auth';
	import { ghReadJsonData, ghWriteJsonData } from '$lib/github';

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

	// Import state
	let importModalOpen = $state(false);
	let importFile = $state<File | null>(null);

	// Derived
	let localSkills = $derived(reorderedItems ?? items.slice().sort((a, b) => a.order - b.order));

	onMount(async () => {
		try {
			const token = getToken();
			const { data } = await ghReadJsonData<Skill[]>(token, 'skills.json', []);
			items = data;
			formOrder = data.length > 0 ? Math.max(...data.map((s) => s.order), -1) + 1 : 0;
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
			const token = getToken();
			const { data, sha } = await ghReadJsonData<Skill[]>(token, 'skills.json', []);
			const newItem: Skill = {
				id: crypto.randomUUID(),
				name: formName,
				icon: formIcon,
				confidence: Number(formConfidence),
				order: Number(formOrder)
			};
			const updated = [...data, newItem];
			await ghWriteJsonData(token, 'skills.json', updated, sha, `create skill: ${newItem.name}`);
			items = updated;
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
			const token = getToken();
			const { data, sha } = await ghReadJsonData<Skill[]>(token, 'skills.json', []);
			const updated = data.map((s) =>
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
			await ghWriteJsonData(token, 'skills.json', updated, sha, `update skill: ${formName}`);
			items = updated;
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
			const token = getToken();
			const { data, sha } = await ghReadJsonData<Skill[]>(token, 'skills.json', []);
			const deleted = data.find((s) => s.id === id);
			const updated = data.filter((s) => s.id !== id);
			await ghWriteJsonData(
				token,
				'skills.json',
				updated,
				sha,
				`delete skill: ${deleted?.name ?? id}`
			);
			items = updated;
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
			const token = getToken();
			const { data, sha } = await ghReadJsonData<Skill[]>(token, 'skills.json', []);
			const reordered = localSkills.map((item, index) => {
				const original = data.find((s) => s.id === item.id);
				return original ? { ...original, order: index } : { ...item, order: index };
			});
			await ghWriteJsonData(token, 'skills.json', reordered, sha, 'reorder skills');
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

	async function handleImport() {
		if (!importFile) return;
		saving = true;
		try {
			const text = await importFile.text();
			const parsed = JSON.parse(text) as Skill[];
			if (!Array.isArray(parsed)) throw new Error('Invalid format: expected an array');
			const token = getToken();
			const { sha } = await ghReadJsonData<Skill[]>(token, 'skills.json', []);
			const withIds = parsed.map((item, index) => ({
				...item,
				id: item.id ?? crypto.randomUUID(),
				order: item.order ?? index
			}));
			await ghWriteJsonData(token, 'skills.json', withIds, sha, 'import skills');
			items = withIds;
			importModalOpen = false;
			importFile = null;
			toast.success('インポートが完了しました');
		} catch (e) {
			toast.error('インポートに失敗しました: ' + e);
		} finally {
			saving = false;
		}
	}

	function handleImportFormSubmit(e: SubmitEvent) {
		e.preventDefault();
		handleImport();
	}

	function exportJSON() {
		const cleanData = $state.snapshot(localSkills).map(({ name, icon, confidence, order }) => ({
			name,
			icon,
			confidence,
			order
		}));
		const dataStr = JSON.stringify(cleanData, null, 2);
		const blob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `skills-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
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

<!-- Import Modal -->
<Modal bind:open={importModalOpen} size="sm" title="スキルをインポート" autoclose={false}>
	<form onsubmit={handleImportFormSubmit} class="space-y-4">
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
			<Helper class="mt-2">スキルデータを含むJSONファイルを選択してください</Helper>
		</div>

		<div class="flex justify-end gap-2">
			<Button type="button" color="alternative" onclick={() => (importModalOpen = false)}>
				キャンセル
			</Button>
			<Button type="submit" color="blue" disabled={!importFile || saving}>インポート</Button>
		</div>
	</form>
</Modal>
