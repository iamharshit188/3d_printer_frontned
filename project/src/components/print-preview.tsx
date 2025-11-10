
"use client";

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { ShapeData } from './slice-view-layout';

interface PrintPreviewProps {
  shapeData: ShapeData | null;
  progress: number;
  isPrinting: boolean;
  nozzlePosition: { x: number; y: number; z: number };
}

export function PrintPreview({ shapeData, progress, isPrinting, nozzlePosition }: PrintPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const armPartsRef = useRef<any>(null);
  const requestRef = useRef<number>();
  const isPrintingRef = useRef(isPrinting);
  const progressRef = useRef(progress);
  const nozzlePositionRef = useRef(nozzlePosition);

  // Update refs to get the latest state inside the animation loop
  useEffect(() => {
    isPrintingRef.current = isPrinting;
  }, [isPrinting]);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    nozzlePositionRef.current = nozzlePosition;
  }, [nozzlePosition]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('hsl(var(--background))');
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.localClippingEnabled = true;
    currentMount.appendChild(renderer.domElement);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 15, 40);
    camera.lookAt(scene.position);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(15, 25, 10);
    scene.add(directionalLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-15, 10, -15);
    scene.add(backLight);

    // Helpers
    const gridHelper = new THREE.GridHelper(30, 30, 0xcccccc, 0xdddddd);
    gridHelper.position.y = -5;
    scene.add(gridHelper);
    
    // Materials
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('hsl(var(--primary))'),
      side: THREE.DoubleSide,
      clippingPlanes: [],
      clipShadows: true,
      roughness: 0.4,
      metalness: 0.1,
    });
    
    const wireframeMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('hsl(var(--primary))').multiplyScalar(0.7),
        linewidth: 1,
        transparent: true,
        opacity: 0.5,
    });

    const createRoboticArm = () => {
      const armMaterial = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.6, metalness: 0.3 });
      const jointMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.5, metalness: 0.7 });

      const base = new THREE.Group();
      const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 32), armMaterial);
      basePlate.position.y = -4.5;
      base.add(basePlate);
      
      const shoulder = new THREE.Group();
      const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(2, 7, 2), armMaterial);
      lowerArm.position.y = 3.5;
      shoulder.add(lowerArm);
      shoulder.position.y = -3.5;

      const elbow = new THREE.Group();
      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 1.5), armMaterial);
      upperArm.position.x = 4;
      elbow.add(upperArm);
      elbow.position.y = 7;
      
      const wrist = new THREE.Group();
      wrist.position.x = 8;

      const nozzleGroup = new THREE.Group();
      const nozzleHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16), jointMaterial);
      const nozzleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 'hsl(var(--accent))', emissiveIntensity: 0 });
      const nozzleMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1, 16), nozzleMaterial);
      nozzleMesh.position.y = -1.2;
      nozzleGroup.add(nozzleHolder, nozzleMesh);
      nozzleGroup.position.y = -1;
      wrist.add(nozzleGroup);
      
      elbow.add(wrist);
      shoulder.add(elbow);
      base.add(shoulder);
      scene.add(base);
      base.position.set(-18, 0, 0);

      armPartsRef.current = {
          base,
          shoulder,
          elbow,
          wrist,
          nozzle: nozzleMesh,
      };
  };
    
    createRoboticArm();

    let font: THREE.Font | null = null;
    const fontLoader = new FontLoader();
    fontLoader.load('/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
        font = loadedFont;
        updateShape();
        setIsLoading(false);
    }, undefined, () => setIsLoading(false));

    const updateShape = () => {
      if (meshRef.current) {
        scene.remove(meshRef.current);
        meshRef.current.geometry.dispose();
      }
      if (!shapeData) {
        if(rendererRef.current && cameraRef.current) rendererRef.current.render(scene, cameraRef.current);
        return;
      }

      let geometry: THREE.BufferGeometry | null = null;

      if (shapeData.type === 'shape') {
        const size = 8;
        switch (shapeData.id) {
          case 'cube': geometry = new THREE.BoxGeometry(size, size, size); break;
          case 'sphere': geometry = new THREE.SphereGeometry(size / 2, 32, 16); break;
          case 'pyramid': geometry = new THREE.ConeGeometry(size / 2, size, 4); break;
          case 'torus': geometry = new THREE.TorusGeometry(size / 2, size / 4, 16, 100); break;
        }
      } else if (shapeData.type === 'word' && font) {
        const textGeom = new TextGeometry(shapeData.id, { font, size: 5, height: 1.5, curveSegments: 12 });
        textGeom.center();
        geometry = textGeom;
      } else if (shapeData.type === 'drawing' && shapeData.points && shapeData.points.length > 1) {
        const shape = new THREE.Shape();
        const scaledPoints = shapeData.points.map(p => ({x: (p.x - 150) / 10, y: -(p.y - 100) / 10}));
        shape.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        scaledPoints.slice(1).forEach(p => shape.lineTo(p.x, p.y));
        geometry = new THREE.ExtrudeGeometry(shape, { depth: 1.5, bevelEnabled: false });
        geometry.center();
      }

      if (geometry) {
        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        mesh.position.y = 0;
        scene.add(mesh);
        mesh.add(new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wireframeMaterial));
      }
      
      if(rendererRef.current && cameraRef.current) rendererRef.current.render(scene, cameraRef.current);
    };

    updateShape();

    const animate = () => {
        requestRef.current = requestAnimationFrame(animate);

        const mesh = meshRef.current;
        const armParts = armPartsRef.current;

        if (!rendererRef.current || !cameraRef.current || !armParts) return;

        if (mesh) {
            const printing = isPrintingRef.current;
            if (!printing) {
                mesh.rotation.y += 0.005;
            }

            const clipPlanes = (mesh.material as THREE.MeshStandardMaterial).clippingPlanes!;
            if (!clipPlanes[0]) {
                 const bboxInitial = new THREE.Box3().setFromObject(mesh);
                 clipPlanes[0] = new THREE.Plane(new THREE.Vector3(0, -1, 0), bboxInitial.max.y);
            }
            
            const bbox = new THREE.Box3().setFromObject(mesh);
            const height = bbox.max.y - bbox.min.y;
            const targetConstant = printing ? bbox.min.y + (height * progressRef.current) / 100 : bbox.max.y;
            
            clipPlanes[0].constant += (targetConstant - clipPlanes[0].constant) * 0.1;
        }
        
        if (isPrintingRef.current) {
            const clipPlaneConstant = mesh?.material.clippingPlanes?.[0]?.constant ?? -5;
            const nPos = nozzlePositionRef.current;
            
            const targetPosition = new THREE.Vector3(
              (nPos.x - 150) / 15,
              clipPlaneConstant + 0.8,
              (nPos.y - 100) / 15,
            );
            
            // Simplified Inverse Kinematics
            const shoulderPivotWorldPos = new THREE.Vector3();
            armParts.shoulder.getWorldPosition(shoulderPivotWorldPos);

            const L1 = 7; // lowerArm length
            const L2 = 8; // upperArm length
            
            const targetToBase = new THREE.Vector3().subVectors(targetPosition, armParts.base.position);
            const baseTargetAngle = Math.atan2(targetToBase.z, targetToBase.x) + Math.PI;
            armParts.base.rotation.y += (baseTargetAngle - armParts.base.rotation.y) * 0.1;

            const baseRotationMatrix = new THREE.Matrix4().makeRotationY(-armParts.base.rotation.y);
            const relativeTarget = targetPosition.clone().sub(shoulderPivotWorldPos).applyMatrix4(baseRotationMatrix);

            const D = Math.sqrt(relativeTarget.x * relativeTarget.x + relativeTarget.y * relativeTarget.y);
            
            if (D < L1 + L2 - 0.1) {
              const cosElbow = Math.max(-1, Math.min(1, (D*D - L1*L1 - L2*L2) / (2 * L1 * L2)));
              const elbowAngle = Math.acos(cosElbow);
              
              const beta = Math.atan2(relativeTarget.y, relativeTarget.x);
              const cosShoulderAlpha = Math.max(-1, Math.min(1, (L1*L1 + D*D - L2*L2) / (2 * L1 * D)));
              const shoulderAngle = beta - Math.acos(cosShoulderAlpha);
              
              armParts.shoulder.rotation.z += (shoulderAngle - armParts.shoulder.rotation.z) * 0.1;
              armParts.elbow.rotation.z += ((Math.PI - elbowAngle) - armParts.elbow.rotation.z) * 0.1;

              const wristPitch = -Math.PI / 2 - shoulderAngle - armParts.elbow.rotation.z;
              armParts.wrist.rotation.z += (wristPitch - armParts.wrist.rotation.z) * 0.1;
            }

            if(armParts.nozzle) (armParts.nozzle.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 - Math.random() * 0.2;
        } else {
            armParts.base.rotation.y += (0 - armParts.base.rotation.y) * 0.05;
            armParts.shoulder.rotation.z += (Math.PI / 4 - armParts.shoulder.rotation.z) * 0.05;
            armParts.elbow.rotation.z += (Math.PI / 2 - armParts.elbow.rotation.z) * 0.05;
            armParts.wrist.rotation.z += (-Math.PI*0.75 - armParts.wrist.rotation.z) * 0.05;
            if(armParts.nozzle) (armParts.nozzle.material as THREE.MeshStandardMaterial).emissiveIntensity *= 0.9;
        }

        renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      rendererRef.current.setSize(clientWidth, clientHeight);
      cameraRef.current.aspect = clientWidth / clientHeight;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if(requestRef.current) cancelAnimationFrame(requestRef.current);
      if (currentMount && rendererRef.current) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      rendererRef.current?.dispose();
    };
  }, [shapeData]);


  return (
    <div ref={mountRef} className="w-full h-full min-h-[300px] md:min-h-[400px] lg:min-h-full relative">
       {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <p className="text-muted-foreground">Loading 3D assets...</p>
        </div>
      )}
    </div>
  );
}
