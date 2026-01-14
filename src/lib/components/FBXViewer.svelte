<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
	import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
	import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	interface Props {
		src: string;
	}

	let { src }: Props = $props();

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let renderer: THREE.WebGLRenderer | undefined;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let controls: OrbitControls | undefined;
	let animationId: number | undefined;
	let mixer: THREE.AnimationMixer | undefined;
	let clock: THREE.Clock;

	onMount(() => {
		init();

		return () => {
			cleanup();
		};
	});

	function init() {
		if (!container) return;

		// Scene setup
		scene = new THREE.Scene();
		scene.background = null;

		// Camera setup
		const width = container.clientWidth;
		const height = container.clientHeight;
		camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
		camera.position.set(0, 1, 3);

		// Renderer setup (use bound canvas to avoid direct DOM manipulation)
		renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
			powerPreference: 'high-performance'
		});
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setSize(width, height);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		// do not append canvas manually; Svelte manages it via bind:this

		// Controls setup
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.target.set(0, 0, 0);
		controls.update();

		// Lighting setup
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(5, 5, 5);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);

		const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight2.position.set(-5, 3, -5);
		scene.add(directionalLight2);

		// Clock for animations
		clock = new THREE.Clock();

		// Load model
		loadModel();

		// Start animation loop
		animate();

		// Handle window resize
		window.addEventListener('resize', handleResize);
	}

	function loadModel() {
		const fileExtension = src.split('.').pop()?.toLowerCase();

		const processModel = (
			model: THREE.Group | THREE.Object3D,
			animations?: THREE.AnimationClip[]
		) => {
			// Setup animations if present
			if (animations && animations.length > 0) {
				mixer = new THREE.AnimationMixer(model);
				animations.forEach((clip) => {
					const action = mixer!.clipAction(clip);
					action.play();
				});
			}

			// Enable shadows and smooth shading
			model.traverse((child: THREE.Object3D) => {
				if ((child as THREE.Mesh).isMesh) {
					const mesh = child as THREE.Mesh;
					mesh.castShadow = true;
					mesh.receiveShadow = true;

					// Compute vertex normals for smooth shading
					if (mesh.geometry) {
						mesh.geometry.computeVertexNormals();
					}

					// Ensure smooth shading on materials
					if (mesh.material) {
						const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
						materials.forEach((mat: THREE.Material) => {
							// Set smooth shading for supported materials
							if (
								mat instanceof THREE.MeshStandardMaterial ||
								mat instanceof THREE.MeshPhongMaterial ||
								mat instanceof THREE.MeshLambertMaterial
							) {
								mat.flatShading = false;
							}
							mat.side = THREE.FrontSide;

							// Improve material appearance for PBR materials
							if (mat instanceof THREE.MeshStandardMaterial) {
								mat.metalness = Math.min(mat.metalness, 0.5);
								mat.roughness = Math.max(mat.roughness, 0.5);
							}

							mat.needsUpdate = true;
						});
					}
				}
			});

			// Center the model
			const box = new THREE.Box3().setFromObject(model);
			const center = box.getCenter(new THREE.Vector3());
			model.position.sub(center);

			// Scale to fit
			const size = box.getSize(new THREE.Vector3());
			const maxDim = Math.max(size.x, size.y, size.z);
			const scale = 2 / maxDim;
			model.scale.setScalar(scale);

			scene.add(model);
		};

		const onProgress = (xhr: ProgressEvent) => {
			if (xhr.lengthComputable) {
				const percentComplete = (xhr.loaded / xhr.total) * 100;
				console.log(`Model ${percentComplete.toFixed(2)}% loaded`);
			}
		};

		const onError = (error: unknown) => {
			console.error('Error loading model:', error);
		};

		if (fileExtension === 'fbx') {
			// Load FBX
			const fbxLoader = new FBXLoader();
			fbxLoader.load(
				src,
				(object: THREE.Group) => {
					processModel(object, object.animations);
				},
				onProgress,
				onError
			);
		} else if (fileExtension === 'glb' || fileExtension === 'gltf') {
			// Load GLTF/GLB
			const gltfLoader = new GLTFLoader();

			// Setup DRACO loader for compressed models
			const dracoLoader = new DRACOLoader();
			dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
			gltfLoader.setDRACOLoader(dracoLoader);

			gltfLoader.load(
				src,
				(gltf: GLTF) => {
					processModel(gltf.scene, gltf.animations);
				},
				onProgress,
				onError
			);
		} else {
			console.error(`Unsupported file format: ${fileExtension}`);
		}
	}

	function handleResize() {
		if (!container || !camera || !renderer) return;

		const width = container.clientWidth;
		const height = container.clientHeight;

		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
	}

	function animate() {
		if (!renderer || !scene || !camera) return;

		animationId = requestAnimationFrame(animate);

		const delta = clock.getDelta();

		// Update animation mixer
		if (mixer) {
			mixer.update(delta);
		}

		// Update controls
		if (controls) {
			controls.update();
		}

		// Render scene
		renderer.render(scene, camera);
	}

	function cleanup() {
		// Cancel animation frame
		if (animationId !== undefined) {
			cancelAnimationFrame(animationId);
		}

		// Remove event listener
		window.removeEventListener('resize', handleResize);

		// Dispose controls
		if (controls) {
			controls.dispose();
		}

		// Dispose renderer
		if (renderer) {
			renderer.dispose();
		}

		// Clear scene
		if (scene) {
			scene.traverse((object: THREE.Object3D) => {
				if ((object as THREE.Mesh).isMesh) {
					const mesh = object as THREE.Mesh;
					if (mesh.geometry) {
						mesh.geometry.dispose();
					}
					if (mesh.material) {
						if (Array.isArray(mesh.material)) {
							mesh.material.forEach((material: THREE.Material) => material.dispose());
						} else {
							mesh.material.dispose();
						}
					}
				}
			});
		}
	}
</script>

<div class="model-viewer" bind:this={container}>
	<canvas class="three-canvas" bind:this={canvas} />
</div>

<style lang="sass">
.model-viewer
	width: 100%
	height: 400px
	border-radius: 0.5rem
	overflow: hidden
	position: relative
	
	:global(canvas)
		display: block
		width: 100%
		height: 100%
</style>
