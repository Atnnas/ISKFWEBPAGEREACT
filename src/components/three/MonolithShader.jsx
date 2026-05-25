"use client";
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MonolithMaterial = {
    uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() }
    },
    vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    #define TWO_PI 6.2831853072
    #define PI 3.14159265359

    precision highp float;
    uniform vec2 resolution;
    uniform float time;

    void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.05;
        float lineWidth = 0.002;

        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
            for(int i=0; i < 5; i++){
                color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
            }
        }
        
        gl_FragColor = vec4(color, 1.0);
    }
  `
};

const ShaderPlane = () => {
    const mesh = useRef();
    const uniforms = useMemo(
        () => ({
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(100, 100) }, // Default, updated on resize
        }),
        []
    );

    useFrame((state) => {
        const { clock, size } = state;
        mesh.current.material.uniforms.time.value = clock.getElapsedTime();
        mesh.current.material.uniforms.resolution.value.set(size.width, size.height);
    });

    return (
        <mesh ref={mesh}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={MonolithMaterial.vertexShader}
                fragmentShader={MonolithMaterial.fragmentShader}
                transparent={true}
            />
        </mesh>
    );
};

const MonolithShader = () => {
    return (
        <div className="w-full h-full absolute inset-0 rounded-3xl overflow-hidden -z-10 bg-black">
            <Canvas resize={{ scroll: false }}>
                <ShaderPlane />
            </Canvas>
        </div>
    );
};

export default MonolithShader;
