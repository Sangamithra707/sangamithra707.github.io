import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class Viewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.frameId = null;

        this.init();
    }

    init() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color(0x27272a); // Removed per user request to use image only

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        this.camera.position.set(2, 1, 3);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // --- Simple Lighting Setup ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        //this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        //mainLight.position.set(5, 10, 7);
        //mainLight.castShadow = true;
        //this.scene.add(mainLight);

        // --- Environment Setup ---
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('assets/environment.jpg', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            // Set background to grey as requested, but keep reflection environment
            // this.scene.background = new THREE.Color(0x18181b); // Grey background
            this.scene.background = texture;
            this.scene.environment = texture; // Image reflections
        });

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = false; // Disable zoom for card viewers by default

        // Handle Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    loadModel(url) {
        const loader = new GLTFLoader();
        loader.load(url, (gltf) => {
            if (this.model) this.scene.remove(this.model);

            this.model = gltf.scene;

            // Center Model
            const box = new THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;
            this.model.scale.setScalar(scale);

            this.model.position.sub(center.multiplyScalar(scale));

            this.scene.add(this.model);
        }, undefined, (error) => {
            console.error('An error happened', error);
        });
    }

    loadPlaceholder() {
        // Create a cool placeholder geometry
        const geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            roughness: 0.3,
            metalness: 0.7
        });

        this.model = new THREE.Mesh(geometry, material);
        this.scene.add(this.model);
    }

    onWindowResize() {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    animate() {
        this.frameId = requestAnimationFrame(this.animate.bind(this));

        if (this.controls) this.controls.update();
        if (this.model) this.model.rotation.y += 0.005; // Auto rotate

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        cancelAnimationFrame(this.frameId);
        this.renderer.dispose();
        // Dispose geometries/materials...
    }
}
