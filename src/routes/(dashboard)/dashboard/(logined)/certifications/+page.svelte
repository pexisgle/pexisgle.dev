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
		Fileupload,
		Spinner
	} from 'flowbite-svelte';
	import { EditOutline, TrashBinOutline, UploadOutline } from 'flowbite-svelte-icons';
	import { flip } from 'svelte/animate';
	import { onMount } from 'svelte';
	import { ghReadJsonData, ghWriteJsonData } from '$lib/github';
	import { toast } from '$lib/stores/toast';
	import typia from 'typia';

	let { data } = $props();

	type Certification = {
		id: string;
		name: string;
		date: string | null;
		status: string | null;
		order: number;
		createdAt: string;
		updatedAt: string;
	};

	function normalizeCertifications(raw: Partial<Certification>[]): Certification[] {
		const now = new Date().toISOString();
		return raw.map((item, index) => ({
			id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
			name: typeof item.name === 'string' ? item.name : '',
			date: typeof item.date === 'string' ? item.date : null,
			status: typeof item.status === 'string' ? item.status : null,
			order: typeof item.order === 'number' ? item.order : index,
			createdAt: typeof item.createdAt === 'string' ? item.createdAt : now,
			updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : now
		}));
	}

	// ── Core state ────────────────────────────────────────────────────────────
	let items = $state<Certification[]>([]);
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

	// ── Import / modal state ──────────────────────────────────────────────────
	let importModalOpen = $state(false);
	let importFile = $state<File | null>(null);

	// ── Reorder state ─────────────────────────────────────────────────────────
	let isReordering = $state(false);
	let reorderedCertifications = $state<Certification[] | null>(null);
	let draggingIndex = $state<number | null>(null);

	let localCertifications = $derived(
		reorderedCertifications ?? items.slice().sort((a, b) => a.order - b.order)
	);

	// ── Data loading ──────────────────────────────────────────────────────────
	onMount(async () => {
		try {
			const { data: certification_data, sha } = await ghReadJsonData<Certification[]>(
				data.token,
				'certifications.json',
				[]
			);
			items = normalizeCertifications(certification_data);
			currentSha = sha;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'データの読み込みに失敗しました');
		} finally {
			loading = false;
		}
	});

	async function refreshData() {
		const { data: certification_data, sha } = await ghReadJsonData<Certification[]>(
			data.token,
			'certifications.json',
			[]
		);
		items = normalizeCertifications(certification_data);
		currentSha = sha;
	}

	// ── Form helpers ──────────────────────────────────────────────────────────
	function startCreate() {
		editingId = null;
		formName = '';
		formDate = '';
		formStatus = '';
		formOrder = Math.max(...items.map((c) => c.order), -1) + 1;
		nameError = '';
	}

	function startEdit(item: Certification) {
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
			const now = new Date().toISOString();
			if (editingId === null) {
				const newItem: Certification = {
					id: crypto.randomUUID(),
					name: formName.trim(),
					date: formDate || null,
					status: formStatus || null,
					order: formOrder,
					createdAt: now,
					updatedAt: now
				};
				await ghWriteJsonData(
					data.token,
					'certifications.json',
					[...items, newItem],
					currentSha,
					`create certification: ${newItem.name}`
				);
				await refreshData();
				toast.success('資格を作成しました');
				// Reset for next entry
				formName = '';
				formDate = '';
				formStatus = '';
				formOrder = Math.max(...items.map((c) => c.order), 0) + 1;
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
					data.token,
					'certifications.json',
					updated,
					currentSha,
					`update certification: ${formName}`
				);
				await refreshData();
				toast.success('資格を更新しました');
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
			const newItems = items.filter((item) => item.id !== id);
			await ghWriteJsonData(
				data.token,
				'certifications.json',
				newItems,
				currentSha,
				`delete certification: ${id}`
			);
			await refreshData();
			toast.success('資格を削除しました');
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
			reorderedCertifications = items.slice().sort((a, b) => a.order - b.order);
		} else {
			reorderedCertifications = null;
		}
	}

	async function saveReorder() {
		saving = true;
		try {
			const newItems = localCertifications.map((item, index) => ({ ...item, order: index }));
			await ghWriteJsonData(
				data.token,
				'certifications.json',
				newItems,
				currentSha,
				'reorder certifications'
			);
			await refreshData();
			isReordering = false;
			reorderedCertifications = null;
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
		if (!reorderedCertifications) reorderedCertifications = [...localCertifications];
		const newItems = [...reorderedCertifications];
		const item = newItems[draggingIndex];
		newItems.splice(draggingIndex, 1);
		newItems.splice(targetIndex, 0, item);
		reorderedCertifications = newItems;
		draggingIndex = targetIndex;
	}

	function handleDragEnd() {
		draggingIndex = null;
	}

	// ── Import ────────────────────────────────────────────────────────────────
	async function handleImport() {
		if (!importFile) return;
		saving = true;
		try {
			const text = await importFile.text();
			const parsedRaw = JSON.parse(text);
			const validation = typia.validate<Certification[]>(parsedRaw);
			if (!validation.success) throw new Error('Invalid format: expected an array');
			const imported = validation.data;
			const newItems: Certification[] = normalizeCertifications(
				imported as Record<string, unknown>[]
			);
			await ghWriteJsonData(
				data.token,
				'certifications.json',
				newItems,
				currentSha,
				'import certifications'
			);
			await refreshData();
			importModalOpen = false;
			importFile = null;
			toast.success('インポートが完了しました');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'インポート中にエラーが発生しました');
		} finally {
			saving = false;
		}
	}

	// ── Utilities ─────────────────────────────────────────────────────────────
	function getStatusColor(status: string | null) {
		switch (status) {
			case 'Active':
				return 'green';
			case 'Inactive':
				return 'red';
			default:
				return 'blue';
		}
	}
</script>

<div class="px-4 pt-6">
	<Breadcrumb class="mb-4">
		<BreadcrumbItem home href="/dashboard">Dashboard</BreadcrumbItem>
		<BreadcrumbItem>資格</BreadcrumbItem>
	</Breadcrumb>

	<div class="mb-4 flex items-center justify-between">
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white"
			>資格</Heading
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
						{editingId === null ? '資格の新規作成' : '資格の編集'}
					</h3>
					<form onsubmit={handleSubmit} class="space-y-4">
						<div>
							<Label for="name">名前</Label>
							<Input id="name" name="name" placeholder="資格名" bind:value={formName} required />
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
								<option value="Active">Active</option>
								<option value="Inactive">Inactive</option>
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
					{#if localCertifications.length === 0}
						<p class="text-gray-500 dark:text-gray-400">資格情報がありません</p>
					{:else}
						{#each localCertifications as item, index (item.id)}
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

<!-- Import Modal -->
<Modal bind:open={importModalOpen} size="sm" title="資格をインポート" autoclose={false}>
	<div class="space-y-4">
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
			/>
			<Helper class="mt-2">資格データを含むJSONファイルを選択してください</Helper>
		</div>

		<div class="flex justify-end gap-2">
			<Button color="alternative" onclick={() => (importModalOpen = false)}>キャンセル</Button>
			<Button color="blue" disabled={!importFile || saving} onclick={handleImport}>
				{#if saving}<Spinner size="4" class="mr-1" />{/if}
				インポート
			</Button>
		</div>
	</div>
</Modal>
