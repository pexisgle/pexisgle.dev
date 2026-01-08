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
	import { enhance } from '$app/forms';
	import { flip } from 'svelte/animate';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { toast } from '$lib/stores/toast';

	let { data }: PageProps = $props();

	type Skill = (typeof data.skills)[number];

	let editingId: string | null = $state(null);
	let importModalOpen = $state(false);
	let importFile: File | null = $state(null);

	// Reordering state
	let isReordering = $state(false);
	let reorderedSkills = $state<Skill[] | null>(null);
	let localSkills = $derived(
		reorderedSkills ?? data.skills.slice().sort((a, b) => a.order - b.order)
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
				toast.success(editingId === null ? 'スキルを作成しました' : 'スキルを更新しました');
				const payload = (result.data ?? result) as { skill?: Skill };
				const skill = payload.skill;
				if (skill) {
					if (editingId === null) {
						// Create new - reset form for next entry
						form.set({
							...$form,
							id: undefined,
							name: '',
							icon: '',
							confidence: 3,
							order: Math.max(...localSkills.map((s) => s.order), 0) + 1
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
				toast.success('スキルを削除しました');
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
			confidence: 3,
			order: Math.max(...localSkills.map((s) => s.order), -1) + 1
		});
	}

	function startEdit(item: Skill) {
		editingId = item.id;
		form.set({
			...$form,
			id: item.id,
			name: item.name,
			icon: item.icon,
			confidence: item.confidence,
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
			confidence: 3,
			order: 0
		});
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
			reorderedSkills = data.skills.slice().sort((a, b) => a.order - b.order);
		} else {
			reorderedSkills = null;
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
		if (!reorderedSkills) reorderedSkills = [...localSkills];

		const newItems = [...reorderedSkills];
		const item = newItems[draggingIndex];
		newItems.splice(draggingIndex, 1);
		newItems.splice(targetIndex, 0, item);
		reorderedSkills = newItems;
		draggingIndex = targetIndex;
	}

	function handleDragEnd() {
		draggingIndex = null;
	}

	function getReorderedItemsJSON() {
		return JSON.stringify(
			localSkills.map((item, index) => ({
				id: item.id,
				order: index
			}))
		);
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
					{editingId === null ? 'スキルの新規作成' : 'スキルの編集'}
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
						<Input id="name" name="name" placeholder="HTML5" bind:value={$form.name} required />
						{#if $errors.name}
							<Helper color="red">{$errors.name}</Helper>
						{/if}
					</div>

					<div>
						<Label for="icon">アイコン</Label>
						<Input
							id="icon"
							name="icon"
							placeholder="skill-icons:html"
							bind:value={$form.icon}
							required
						/>
						{#if $errors.icon}
							<Helper color="red">{$errors.icon}</Helper>
						{/if}
						{#if $form.icon}
							<div class="mt-2 flex items-center gap-2">
								<span class="text-sm text-gray-500 dark:text-gray-400">プレビュー:</span>
								<Icon icon={$form.icon} width="32" height="32" />
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
							bind:value={$form.confidence}
							required
						/>
						{#if $errors.confidence}
							<Helper color="red">{$errors.confidence}</Helper>
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
				{#if localSkills.length === 0}
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
<Modal bind:open={importModalOpen} size="sm" title="スキルをインポート" autoclose={false}>
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
			<Helper class="mt-2">スキルデータを含むJSONファイルを選択してください</Helper>
		</div>

		<div class="flex justify-end gap-2">
			<Button color="alternative" onclick={() => (importModalOpen = false)}>キャンセル</Button>
			<Button type="submit" color="blue" disabled={!importFile}>インポート</Button>
		</div>
	</form>
</Modal>
