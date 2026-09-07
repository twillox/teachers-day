import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { getAvatarConfig } from '../utils/avatars';
import type { Participant } from '../types';

interface PhysicsLobbyProps {
  participants: Participant[];
}

export default function PhysicsLobby({ participants }: PhysicsLobbyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<number | null>(null);
  
  // Keep track of which bodies belong to which participant
  const bodiesMap = useRef<Map<string, Matter.Body>>(new Map());
  // Keep track of DOM elements
  const elementsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    
    // Add boundaries (walls and floor)
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    
    const floor = Matter.Bodies.rectangle(cw / 2, ch + 25, cw, 50, { isStatic: true, friction: 0.5 });
    const wallL = Matter.Bodies.rectangle(-25, ch / 2, 50, ch * 2, { isStatic: true });
    const wallR = Matter.Bodies.rectangle(cw + 25, ch / 2, 50, ch * 2, { isStatic: true });
    
    Matter.World.add(engine.world, [floor, wallL, wallR]);

    // 2. Custom Render Loop (Updating DOM elements)
    const updateDOM = () => {
      bodiesMap.current.forEach((body, id) => {
        const el = elementsMap.current.get(id);
        if (el) {
          el.style.transform = `translate(${body.position.x - 100}px, ${body.position.y - 100}px) rotate(${body.angle}rad)`;
        }
      });
      Matter.Engine.update(engine, 1000 / 60);
      renderRef.current = requestAnimationFrame(updateDOM);
    };

    renderRef.current = requestAnimationFrame(updateDOM);

    // Resize handler
    const handleResize = () => {
      if (containerRef.current) {
        Matter.Body.setPosition(floor, { x: containerRef.current.clientWidth / 2, y: containerRef.current.clientHeight + 25 });
        Matter.Body.setPosition(wallR, { x: containerRef.current.clientWidth + 25, y: containerRef.current.clientHeight / 2 });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderRef.current) cancelAnimationFrame(renderRef.current);
      Matter.Engine.clear(engine);
    };
  }, []);

  // 3. Sync participants to Physics Bodies
  useEffect(() => {
    if (!engineRef.current || !containerRef.current) return;
    const engine = engineRef.current;
    const cw = containerRef.current.clientWidth;

    participants.forEach(p => {
      if (!bodiesMap.current.has(p.id)) {
        // Create new body
        // Radius is 100 (since width is 200px)
        const xPos = Math.random() * (cw - 200) + 100;
        const body = Matter.Bodies.circle(xPos, -200, 100, {
          restitution: 0.8, // Bouncy
          friction: 0.3,
          density: 0.05
        });
        
        // Random initial velocity/spin
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
        
        Matter.World.add(engine.world, body);
        bodiesMap.current.set(p.id, body);
      }
    });
  }, [participants]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {participants.map(p => {
        const avatar = getAvatarConfig(p.avatarId);
        const initial = p.name ? p.name.charAt(0).toUpperCase() : '';
        return (
          <div
            key={p.id}
            ref={el => { if (el) elementsMap.current.set(p.id, el); }}
            className="absolute top-0 left-0 w-[200px] h-[200px] flex items-center justify-center rounded-full pointer-events-auto -translate-y-[1000px]"
            style={{
              backgroundColor: avatar.color,
              boxShadow: 'inset -8px -8px 20px rgba(0,0,0,0.3), 8px 8px 20px rgba(0,0,0,0.5)',
            }}
          >
            <span className="text-white font-black text-8xl" style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.5)' }}>
              {initial}
            </span>
          </div>
        );
      })}
    </div>
  );
}
