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
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 host.append(renderer.domElement);host.dataset.renderer='three';
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,100);
 camera.position.set(7,4.2,8.5);camera.lookAt(0,.2,0);
 scene.add(new THREE.HemisphereLight(0xfff5db,0x243b50,.65));
 const sun=new THREE.DirectionalLight(0xffdea2,2.8);sun.position.set(4,8,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;sun.shadow.normalBias=.025;scene.add(sun);
 const rim=new THREE.DirectionalLight(0xb7e5ff,1.7);rim.position.set(-4,3,-5);scene.add(rim);
 const materials=[],geometries=[],textures=[];
 // Small deterministic material maps: wood grain, woven canvas and riveted enamel.
 function surface(kind){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle=kind==='wood'?'#bc9a71':kind==='cloth'?'#eee3c8':'#ccd7d4';ctx.fillRect(0,0,256,256);
  let seed=41;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<1800;i++){const x=rand()*256,y=rand()*256;ctx.fillStyle=`rgba(45,31,20,${rand()*.12})`;ctx.fillRect(x,y,kind==='wood'?rand()*65+8:2,1);}
  if(kind==='wood'){ctx.strokeStyle='#4d2e1670';ctx.lineWidth=1.5;for(let y=4;y<256;y+=9){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(85,y+9,170,y-7,256,y+3);ctx.stroke();}}
  if(kind==='cloth'){ctx.strokeStyle='#9a8c6840';ctx.lineWidth=.6;for(let i=0;i<256;i+=4){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,256);ctx.moveTo(0,i);ctx.lineTo(256,i);ctx.stroke();}}
  if(kind==='metal'){ctx.strokeStyle='#50605c';ctx.lineWidth=2;ctx.strokeRect(3,3,250,250);for(const x of [9,247])for(let y=12;y<256;y+=32){ctx.fillStyle='#526664';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4e5b7';ctx.fillRect(x-1,y-2,2,1);}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t;
 }
 const grain=surface('wood'),weave=surface('cloth'),panels=surface('metal');
 const sky=document.createElement('canvas');sky.width=512;sky.height=256;const sk=sky.getContext('2d');const grad=sk.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#7bafcb');grad.addColorStop(.45,'#eff4dc');grad.addColorStop(.6,'#baccc8');grad.addColorStop(1,'#344a50');sk.fillStyle=grad;sk.fillRect(0,0,512,256);sk.fillStyle='#fff5d7';sk.fillRect(60,35,85,60);
 const envSource=new THREE.CanvasTexture(sky);envSource.colorSpace=THREE.SRGBColorSpace;envSource.mapping=THREE.EquirectangularReflectionMapping;
 const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(envSource);scene.environment=environment.texture;envSource.dispose();pmrem.dispose();
 const mat=(color,options={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.7,metalness:0,envMapIntensity:.55,...options});materials.push(m);return m;};
 const brass=mat(0xd3a64e,{metalness:.78,roughness:.32}),wood=mat(0x94663b,{map:grain,bumpMap:grain,bumpScale:.018}),teal=mat(0x287f82,{map:panels,metalness:.35,roughness:.38,bumpMap:panels,bumpScale:.012}),cream=mat(0xf4dfac,{map:weave,bumpMap:weave,bumpScale:.012,roughness:.92}),dark=mat(0x243332,{roughness:.95}),boxMat=mat(0xca9d64,{map:weave,bumpMap:weave,bumpScale:.01});
 const plane=new THREE.Group();scene.add(plane);
 const mesh=(g,m,parent=plane)=>{geometries.push(g);const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 const box=(w,h,d,m,x,y,z,parent=plane)=>{const o=mesh(new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;};
 const sphere=(r,m,x,y,z,sx=1,sy=1,sz=1,parent=plane)=>{const o=mesh(new THREE.SphereGeometry(r,20,12),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;};
 const cylinder=(r1,r2,h,m,x,y,z,parent=plane)=>{const o=mesh(new THREE.CylinderGeometry(r1,r2,h,16),m,parent);o.position.set(x,y,z);return o;};
 // Nose points +X. Rounded biplane with wooden ribs, teal boiler and open parcel bay.
 sphere(1,teal,0,0,0,1.8,.47,.49);
 for(const x of [-.95,.7]){const band=mesh(new THREE.TorusGeometry(.445,.025,8,40),brass);band.rotation.y=Math.PI/2;band.position.x=x;for(let i=0;i<10;i++){const a=i*Math.PI/5;sphere(.022,brass,x,Math.cos(a)*.46,Math.sin(a)*.46);}}
 for(const z of [-.48,.48]){const port=mesh(new THREE.TorusGeometry(.14,.025,8,24),brass);port.position.set(.8,.1,z);sphere(.125,dark,.8,.1,z,.95,.95,.22);}

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
  const p=sphere(.13,m,0,0,0,1,1,1,scene);p.castShadow=false;p.receiveShadow=false;smoke.push(p);
 }
 const trajectory=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(.25,.6,0),new THREE.Vector3(2,1.3,-.4),new THREE.Vector3(4,2.3,-3),new THREE.Vector3(1,4,-12)]);
 let destination=0;
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
  camera.position.set(7+(destination%3-1)*.65-fly*.3,4.2+(destination%2)*.4+fly*.4,8.5+(destination%3-1)*.4);camera.lookAt(fly*.4,.2+fly*.5,0);
  renderer.render(scene,camera);
  if(p<1)raf=requestAnimationFrame(render);
 };
 const onLost=e=>{e.preventDefault();host.closest('.flight-layer')?.classList.remove('has-3d');cancelAnimationFrame(raf);};canvas.addEventListener('webglcontextlost',onLost);
 return {
  stop(){cancelAnimationFrame(raf);},
  play(ms,place=0){destination=place;sun.color.setHex([0xffedbf,0xd6efff,0xe0dbff,0xffc898,0xf1e5ff,0xffdda6][place%6]);rim.color.setHex([0xbddbc6,0xa4dcff,0xccb9ff,0xffdf9f,0xc2e7ff,0xffd6b0][place%6]);if(disposed||gl.isContextLost()){host.closest('.flight-layer')?.classList.remove('has-3d');return false;}cancelAnimationFrame(raf);resize();duration=ms;elapsed=0;start=previous=performance.now();render(start);return true;},
  dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener('webglcontextlost',onLost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment.dispose();sun.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();}
 };
}
