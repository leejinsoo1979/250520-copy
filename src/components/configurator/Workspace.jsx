import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Workspace = ({ components, selectedComponent, onSelect }) => {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update components when they change
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing components
    sceneRef.current.children = sceneRef.current.children.filter(
      child => child.isLight || child.isHelper
    );

    // Add new components
    components.forEach(component => {
      const mesh = createComponentMesh(component);
      sceneRef.current.add(mesh);
    });
  }, [components]);

  const createComponentMesh = (component) => {
    let geometry;
    let material;

    switch (component.type) {
      case 'shelf':
        geometry = new THREE.BoxGeometry(2, 0.1, 1);
        material = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
        break;
      case 'drawer':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
        break;
      case 'rod':
        geometry = new THREE.CylinderGeometry(0.05, 0.05, 2);
        material = new THREE.MeshPhongMaterial({ color: 0x808080 });
        break;
      case 'door':
        geometry = new THREE.BoxGeometry(0.1, 2, 1);
        material = new THREE.MeshPhongMaterial({ color: 0xa0522d });
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshPhongMaterial({ color: 0x808080 });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      component.position.x,
      component.position.y,
      component.position.z
    );
    mesh.userData.componentId = component.id;

    return mesh;
  };

  return <div ref={containerRef} className="workspace" />;
};

export default Workspace; 