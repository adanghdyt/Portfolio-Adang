// Simpan state global supaya bisa dibersihkan saat modal ditutup
window._viewer = null;

// Inisialisasi 3D Viewer ke dalam #viewer3d
function init3DScene(modelPath) {
  const mount = document.getElementById('viewer3d') || document.body;
  mount.innerHTML = ''; // bersihkan kanvas lama

  // 1) Scene, Camera, Renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    (mount.clientWidth || window.innerWidth) / (mount.clientHeight || window.innerHeight),
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const w = mount.clientWidth || window.innerWidth;
  const h = mount.clientHeight || window.innerHeight;
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0xffffff); // latar putih
  mount.appendChild(renderer.domElement);

  // 2) OrbitControls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // 3) Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 6, 5);
  scene.add(dirLight);

  // 4) Load GLB/GLTF
  const loader = new THREE.GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      scene.add(gltf.scene);
      camera.position.set(0, 1, 5);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    undefined,
    (err) => console.error('GLTF load error:', err)
  );

  // 5) Render loop
  let rafId = null;
  function animate() {
    rafId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // 6) Responsif
  function onResize() {
    const W = mount.clientWidth || window.innerWidth;
    const H = mount.clientHeight || window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }
  window.addEventListener('resize', onResize);

  // 7) Simpan handle untuk dibersihkan saat modal ditutup
  window._viewer = {
    renderer, scene, camera, controls, rafId, resizeHandler: onResize,
    dispose() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      window.removeEventListener('resize', this.resizeHandler);

      this.scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            m.map?.dispose?.();
            m.normalMap?.dispose?.();
            m.roughnessMap?.dispose?.();
            m.metalnessMap?.dispose?.();
            m.emissiveMap?.dispose?.();
            m.dispose?.();
          });
        }
      });

      this.renderer.dispose?.();
      this.renderer.domElement?.parentNode?.removeChild(this.renderer.domElement);
      window._viewer = null;
    }
  };
}
