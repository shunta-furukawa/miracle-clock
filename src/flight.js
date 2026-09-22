import * as THREE from './vendor/three.module.min.js';

// One small reusable scene per visit. No render loop runs while answering.
export function createFlight(host) {
 if(!host)return null;
 const canvas=document.createElement('canvas');
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true});
 if(!gl)return null;
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,context:gl,alpha:true,antialias:true});}catch{return null;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.append(renderer.domElement);host.dataset.renderer='three';
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);
 camera.position.set(7,4.2,8.5);camera.lookAt(0,.2,0);
 scene.add(new THREE.HemisphereLight(0xfff5db,0x547478,2.8));
 const sun=new THREE.DirectionalLight(0xffdea2,3.2);sun.position.set(4,8,5);scene.add(sun);
 const materials=[],geometries=[];
 const mat=(color)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.8,metalness:.12});materials.push(m);return m;};
 const brass=mat(0xc69b50),wood=mat(0x785134),teal=mat(0x337477),cream=mat(0xf1ddac),dark=mat(0x294144),boxMat=mat(0xc29160);
 const plane=new THREE.Group();scene.add(plane);
 const mesh=(g,m,parent=plane)=>{geometries.push(g);const o=new THREE.Mesh(g,m);parent.add(o);return o;};
 const box=(w,h,d,m,x,y,z,parent=plane)=>{const o=mesh(new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;};
 const sphere=(r,m,x,y,z,sx=1,sy=1,sz=1,parent=plane)=>{const o=mesh(new THREE.SphereGeometry(r,20,12),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;};
 const cylinder=(r1,r2,h,m,x,y,z,parent=plane)=>{const o=mesh(new THREE.CylinderGeometry(r1,r2,h,16),m,parent);o.position.set(x,y,z);return o;};
 // Nose points +X. Rounded biplane with wooden ribs, teal boiler and open parcel bay.
 sphere(1,teal,0,0,0,1.8,.47,.49);
 const nose=cylinder(.41,.41,.44,brass,1.55,0,0);nose.rotation.z=Math.PI/2;
 sphere(.32,brass,1.85,0,0,1,.85,.85);
 for(const y of [-.13,.95]){
  const wing=box(1.1,.10,5,cream,-.1,y,0);wing.rotation.z=-.025;
  for(const z of [-2.3,-1.5,-.7,.7,1.5,2.3])box(1.09,.014,.028,brass,-.1,y+.06,z);
  box(.065,.13,5.05,wood,-.65,y,0);
 }
 for(const z of [-1.75,1.75])for(const x of [-.4,.3]){const strut=cylinder(.025,.025,1.12,brass,x,.42,z);strut.rotation.z=x*.22;}
 box(.74,.08,1.8,cream,-1.56,.08,0);
 const fin=box(.74,.70,.07,teal,-1.51,.42,0);fin.rotation.z=.2;
 box(.78,.11,.83,wood,-.53,.49,0); // parcel shelf
 const cargo=new THREE.Group();plane.add(cargo);
 box(.6,.51,.58,boxMat,-.55,.79,0,cargo);
 box(.61,.04,.59,cream,-.55,.79,0,cargo);box(.055,.52,.60,cream,-.55,.79,0,cargo);
 const seal=sphere(.065,brass,-.20,.80,.12, .22,1,1,cargo);
 // Boiler chimney, exhaust, leather pilot seat and clock-like navigation jewel.
 cylinder(.12,.14,.48,dark,.55,.54,0);cylinder(.16,.16,.07,brass,.55,.81,0);
 sphere(.21,wood,.10,.45,0,1,.5,1);
 sphere(.14,brass,.82,.45,.02,1,.7,1);
 const propeller=new THREE.Group();propeller.position.set(2.1,0,0);plane.add(propeller);
 for(let k=0;k<3;k++){const blade=box(.065,1.35,.12,wood,0,0,0,propeller);blade.rotation.x=k*Math.PI/3;}
 sphere(.12,brass,2.16,0,0);
 for(const z of [-.43,.43]){const wheel=cylinder(.18,.18,.12,dark,.72,-.67,z);wheel.rotation.x=Math.PI/2;cylinder(.025,.025,.4,brass,.72,-.44,z);}
 // Small dock, rendered in perspective with the same materials as the airplane.
 const dock=new THREE.Group();scene.add(dock);
 for(let i=0;i<10;i++)box(.43,.14,3.5,wood,-1.75+i*.45,-.96,0,dock);
 for(const x of [-1.7,1.7])for(const z of [-1.65,1.65]){cylinder(.05,.05,1.2,brass,x,-.38,z,dock);sphere(.09,brass,x,.24,z,1,1,1,dock);}
 const smoke=[];
 for(let i=0;i<24;i++){
  const m=new THREE.MeshBasicMaterial({color:0xfff4d8,transparent:true,opacity:0,depthWrite:false});materials.push(m);
  const p=sphere(.13,m,0,0,0,1,1,1,scene);smoke.push(p);
 }
 const trajectory=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.25,.6,0),new THREE.Vector3(2,1.3,-.4),new THREE.Vector3(4,2.3,-3),new THREE.Vector3(1,4,-12)]);
 let raf=0,start=0,duration=0,disposed=false,elapsed=0,previous=0;
 const resize=()=>{const b=host.getBoundingClientRect();if(!b.width||!b.height)return;renderer.setSize(b.width,b.height,false);camera.aspect=b.width/b.height;camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(host);
 const render=now=>{
  if(disposed)return;
  if(document.hidden){previous=now;raf=requestAnimationFrame(render);return;}
  elapsed+=Math.min(100,now-previous);previous=now;
  const p=Math.min(1,elapsed/duration),fly=Math.max(0,(p-.18)/.82),e=fly*fly*(3-2*fly);
  cargo.position.y=Math.max(0,1-p/.18)*1.6; cargo.scale.setScalar(Math.min(1,.55+p*3));
  plane.position.copy(trajectory.getPoint(e));
  plane.rotation.set(Math.sin(p*6)*.03,-fly*.75,Math.sin(fly*Math.PI)*.17);
  propeller.rotation.x=elapsed*(.02+.09*Math.min(1,p*3));
  dock.position.y=-fly*.6;dock.scale.setScalar(1-fly*.3);
  for(let i=0;i<smoke.length;i++){
   const t=(p*3+i/smoke.length)%1,q=smoke[i];
   q.position.copy(plane.position).add(new THREE.Vector3(.48-t*2,.85+t*.9,(Math.sin(i*2.4)*.3)*(1+t)));
   q.scale.setScalar(.35+t*2.8);q.material.opacity=(1-t)*.36;
  }
  plane.scale.setScalar(1-fly*.15);
  renderer.render(scene,camera);
  if(p<1)raf=requestAnimationFrame(render);
 };
 const onLost=e=>{e.preventDefault();host.closest('.flight-layer')?.classList.remove('has-3d');cancelAnimationFrame(raf);};canvas.addEventListener('webglcontextlost',onLost);
 return {
  play(ms){if(disposed||gl.isContextLost()){host.closest('.flight-layer')?.classList.remove('has-3d');return false;}cancelAnimationFrame(raf);resize();duration=ms;elapsed=0;start=previous=performance.now();render(start);return true;},
  dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('webglcontextlost',onLost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 };
}
