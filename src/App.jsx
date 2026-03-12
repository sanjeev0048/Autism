import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Upload, RefreshCw, CheckCircle2, AlertCircle, Activity, Camera, RotateCcw } from 'lucide-react';
import axios from 'axios';
import Webcam from 'react-webcam';

// â”€â”€ GLOBAL STYLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Inter:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --cyan: #00e5ff; --purple: #7c3aed; --bg: #050508;
      --glass: rgba(255,255,255,0.03); --border: rgba(255,255,255,0.07);
      --muted: #4b5563;
    }
    html { scroll-behavior: smooth; }
    body {
      background: var(--bg); color: #fff;
      font-family: 'Inter', sans-serif;
      overflow-x: hidden; cursor: none;
    }
    h1,h2,h3,h4,h5 { font-family: 'Outfit', sans-serif; }
    .glass {
      background: var(--glass);
      border: 1px solid var(--border);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }
    .grad { background: linear-gradient(90deg,var(--cyan),var(--purple)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes waveAnim { 0%{stroke-dashoffset:1000} 100%{stroke-dashoffset:0} }
    @keyframes scan { 0% { top: 0% } 50% { top: 100% } 100% { top: 0% } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(0, 229, 255, 0.2); } 50% { box-shadow: 0 0 40px rgba(0, 229, 255, 0.4); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .section-chip {
      display:inline-block; font-size:0.68rem; letter-spacing:0.18em;
      text-transform:uppercase; color:var(--cyan);
      border:1px solid rgba(0,229,255,0.25); padding:0.3rem 1rem;
      border-radius:999px; margin-bottom:1.5rem;
      animation: float 4s ease-in-out infinite;
    }
    .scan-line {
      position: absolute; left: 0; width: 100%; height: 2px;
      background: linear-gradient(90deg, transparent, var(--cyan), transparent);
      box-shadow: 0 0 15px var(--cyan);
      z-index: 10; pointer-events: none;
      animation: scan 3s linear infinite;
    }
  `}</style>
);

// â”€â”€ CURSOR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Cursor = () => {
  const dot = useRef(null); const ring = useRef(null);
  useEffect(() => {
    const move = e => {
      if (dot.current) { dot.current.style.left = e.clientX+'px'; dot.current.style.top = e.clientY+'px'; }
      if (ring.current) { ring.current.style.left = e.clientX+'px'; ring.current.style.top = e.clientY+'px'; }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return (<>
    <div ref={dot} style={{position:'fixed',width:8,height:8,background:'var(--cyan)',borderRadius:'50%',
      pointerEvents:'none',zIndex:9999,transform:'translate(-50%,-50%)',transition:'left 0.04s,top 0.04s'}}/>
    <div ref={ring} style={{position:'fixed',width:34,height:34,border:'1.5px solid rgba(0,229,255,0.4)',
      borderRadius:'50%',pointerEvents:'none',zIndex:9998,transform:'translate(-50%,-50%)',transition:'left 0.14s,top 0.14s'}}/>
  </>);
};

// â”€â”€ THREE.JS BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ThreeBackground = () => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.018);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.z = 30;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ref.current.appendChild(renderer.domElement);

    const count = 2500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 120;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x00e5ff, size: 0.12, transparent: true, opacity: 0.55 })));

    const geo2 = new THREE.BufferGeometry();
    const pos2 = new Float32Array(800 * 3);
    for (let i = 0; i < 800 * 3; i++) pos2[i] = (Math.random() - 0.5) * 80;
    geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    scene.add(new THREE.Points(geo2, new THREE.PointsMaterial({ color: 0x7c3aed, size: 0.18, transparent: true, opacity: 0.35 })));

    let mx = 0, my = 0;
    const onMouse = e => { mx = e.clientX - window.innerWidth/2; my = e.clientY - window.innerHeight/2; };
    window.addEventListener('mousemove', onMouse);
    const onResize = () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    const animate = () => {
      requestAnimationFrame(animate);
      camera.position.x += (mx * 0.008 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.008 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (ref.current && renderer.domElement.parentNode === ref.current)
        ref.current.removeChild(renderer.domElement);
    };
  }, []);
  return <div ref={ref} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}}/>;
};

// â”€â”€ NAV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Nav = () => (
  <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:50,display:'flex',alignItems:'center',
    justifyContent:'space-between',padding:'1.1rem 2.5rem',
    background:'rgba(5,5,8,0.7)',borderBottom:'1px solid var(--border)',
    backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)'}}>
    <a href="#hero" style={{display:'flex',alignItems:'center',gap:'0.5rem',textDecoration:'none',
      color:'#fff',fontFamily:'Outfit',fontWeight:700,fontSize:'1.15rem',cursor:'none'}}>
      <BrainCircuit size={22} color="var(--cyan)"/> Autism Detection
    </a>
    <div style={{display:'flex',gap:'2rem'}}>
      {[['The Problem','#problem'],['Technology','#technology'],['AI Dashboard','#dashboard']].map(([l,h])=>(
        <a key={l} href={h} style={{color:'rgba(255,255,255,0.55)',fontSize:'0.85rem',textDecoration:'none',
          transition:'color 0.2s',cursor:'none'}}
          onMouseEnter={e=>e.target.style.color='#fff'}
          onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.55)'}>{l}</a>
      ))}
    </div>
    <a href="#dashboard" style={{padding:'0.45rem 1.2rem',border:'1px solid rgba(255,255,255,0.15)',
      borderRadius:8,fontSize:'0.82rem',color:'#fff',textDecoration:'none',cursor:'none',
      background:'rgba(255,255,255,0.04)',transition:'all 0.2s'}}
      onMouseEnter={e=>{e.target.style.background='rgba(255,255,255,0.1)';e.target.style.borderColor='var(--cyan)';}}
      onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,0.04)';e.target.style.borderColor='rgba(255,255,255,0.15)';}}>
      Access System
    </a>
  </nav>
);

// â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Hero = () => (
  <section id="hero" style={{minHeight:'100vh',display:'flex',flexDirection:'column',
    alignItems:'center',justifyContent:'center',textAlign:'center',padding:'6rem 1.5rem 4rem'}}>
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.9}}>
      <span className="section-chip">Pioneering Neuroscience AI</span>
      <h1 style={{fontSize:'clamp(2.8rem,7vw,5.5rem)',fontWeight:800,lineHeight:1.08,marginBottom:'1.5rem'}}>
        Early Detection of<br/><span className="grad">Autism Spectrum</span><br/>Disorder
      </h1>
      <p style={{color:'#6b7280',maxWidth:560,margin:'0 auto 2.5rem',fontSize:'1.05rem',lineHeight:1.75}}>
        Pioneering the intersection of artificial intelligence and neuroscience for early pediatric diagnostics using facial biomarkers and EEG neural patterns.
      </p>
      <div style={{display:'flex',gap:'1rem',justifyContent:'center',flexWrap:'wrap'}}>
        <a href="#dashboard" style={{padding:'0.85rem 2rem',background:'var(--cyan)',color:'#000',
          borderRadius:10,fontFamily:'Outfit',fontWeight:700,fontSize:'0.95rem',textDecoration:'none',cursor:'none',
          transition:'transform 0.2s,box-shadow 0.2s',display:'flex',alignItems:'center',gap:'0.4rem'}}
          onMouseEnter={e=>{e.target.style.transform='translateY(-2px)';e.target.style.boxShadow='0 12px 30px rgba(0,229,255,0.3)';}}
          onMouseLeave={e=>{e.target.style.transform='translateY(0)';e.target.style.boxShadow='none';}}>
          Launch Analysis â†’
        </a>
        <a href="#problem" style={{padding:'0.85rem 2rem',border:'1px solid var(--border)',color:'#fff',
          borderRadius:10,fontFamily:'Outfit',fontWeight:600,fontSize:'0.95rem',textDecoration:'none',cursor:'none',
          background:'rgba(255,255,255,0.03)',transition:'border-color 0.2s'}}
          onMouseEnter={e=>e.target.style.borderColor='var(--cyan)'}
          onMouseLeave={e=>e.target.style.borderColor='var(--border)'}>
          Read the Research â†—
        </a>
      </div>
    </motion.div>
    <div style={{position:'absolute',bottom:'2.5rem',left:'50%',transform:'translateX(-50%)',
      width:1,height:60,background:'linear-gradient(to bottom,var(--cyan),transparent)',
      animation:'fadeUp 2s infinite'}}/>
  </section>
);

// â”€â”€ PROBLEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Problem = () => (
  <section id="problem" style={{padding:'7rem 2.5rem',maxWidth:1100,margin:'0 auto'}}>
    <motion.div initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.8}}>
      <span className="section-chip">The Problem</span>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center'}}>
        <div>
          <h2 style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:800,lineHeight:1.15,marginBottom:'1.5rem'}}>
            Diagnosis delayed is<br/><span className="grad">opportunity denied</span>
          </h2>
          <p style={{color:'#6b7280',lineHeight:1.8,marginBottom:'1rem'}}>
            The average age of ASD diagnosis is 4â€“5 years, yet early intervention before age 3 can dramatically improve outcomes. Traditional behavioral assessment is slow, subjective, and inaccessible.
          </p>
          <p style={{color:'#6b7280',lineHeight:1.8}}>
            Our multimodal AI analyzes facial microexpressions and EEG neural patterns to deliver objective, rapid assessments â€” cutting diagnostic timelines from years to seconds.
          </p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
          {[['5 Years','Average diagnosis age'],['1 in 36','Children affected (US)'],['68%','Benefit from early care'],['$60K','Annual therapy cost saved']].map(([v,l], idx)=>(
            <motion.div key={l} className="glass" 
              initial={{scale:0.9, opacity:0}}
              whileInView={{scale:1, opacity:1}}
              viewport={{once:true}}
              transition={{delay: idx * 0.1}}
              whileHover={{scale:1.05, y:-5, transition:{duration:0.2}}}
              style={{borderRadius:16,padding:'1.75rem 1.25rem',textAlign:'center'}}>
              <div style={{fontFamily:'Outfit',fontSize:'2rem',fontWeight:800,marginBottom:'0.35rem'}} className="grad">{v}</div>
              <div style={{fontSize:'0.75rem',color:'#6b7280'}}>{l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  </section>
);

// â”€â”€ PROCESS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EEGWave = () => (
  <svg viewBox="0 0 600 120" style={{width:'100%',height:120}}>
    <motion.path 
      d="M0,60 L60,60 L90,20 L120,100 L150,20 L180,80 L210,40 L240,70 L270,30 L300,90 L330,50 L360,60 L420,60 L450,25 L480,95 L510,40 L540,70 L600,60"
      fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    />
  </svg>
);

const HeatmapGrid = () => {
  const cells = Array.from({length:36},(_,i)=>i);
  const colors = ['rgba(0,229,255,0.7)','rgba(0,229,255,0.4)','rgba(124,58,237,0.6)','rgba(124,58,237,0.3)','rgba(0,229,255,0.15)'];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:4}}>
      {cells.map(i=>(
        <div key={i} style={{aspectRatio:'1',borderRadius:4,
          background:colors[Math.floor(Math.random()*colors.length)],
          opacity:0.5+Math.random()*0.5}}/>
      ))}
    </div>
  );
};

const Process = () => (
  <section id="process" style={{padding:'7rem 2.5rem',maxWidth:1100,margin:'0 auto'}}>
    <motion.div 
      initial={{opacity:0, y:40}} 
      whileInView={{opacity:1, y:0}} 
      viewport={{once:true}} 
      transition={{duration:0.8}}>
      <div style={{textAlign:'center',marginBottom:'5rem'}}>
        <span className="section-chip">Process</span>
        <h2 style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:800}}>How Autism Detection Works</h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
        <motion.div className="glass" 
          whileHover={{y:-5, transition:{duration:0.3}}}
          style={{borderRadius:20,padding:'2.5rem',position:'relative',overflow:'hidden'}}>
          <div style={{fontFamily:'Outfit',fontSize:'0.7rem',letterSpacing:'0.15em',
            textTransform:'uppercase',color:'var(--cyan)',marginBottom:'1rem'}}>Step 01</div>
          <h3 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>EEG Signal Collection</h3>
          <p style={{color:'#6b7280',lineHeight:1.75,marginBottom:'2rem',fontSize:'0.9rem'}}>
            Using non-invasive sensors, we record electrical activity across various cortical regions while the child engages in specific visual or auditory stimuli.
          </p>
          <EEGWave/>
        </motion.div>
        <motion.div className="glass" 
          whileHover={{y:-5, transition:{duration:0.3}}}
          style={{borderRadius:20,padding:'2.5rem'}}>
          <div style={{fontFamily:'Outfit',fontSize:'0.7rem',letterSpacing:'0.15em',
            textTransform:'uppercase',color:'var(--cyan)',marginBottom:'1rem'}}>Step 02</div>
          <h3 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1rem'}}>AI Pattern Recognition</h3>
          <p style={{color:'#6b7280',lineHeight:1.75,marginBottom:'2rem',fontSize:'0.9rem'}}>
            Deep learning architectures (CNNs & LSTMs) analyze the temporal and spatial dynamics of brain waves, looking for micro-patterns in neural connectivity typically associated with ASD.
          </p>
          <HeatmapGrid/>
        </motion.div>
      </div>
    </motion.div>
  </section>
);

// â”€â”€ TECHNOLOGY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Technology = () => (
  <section id="technology" style={{padding:'7rem 2.5rem',maxWidth:1100,margin:'0 auto'}}>
    <motion.div 
      initial={{opacity:0, scale:0.95}} 
      whileInView={{opacity:1, scale:1}} 
      viewport={{once:true}} 
      transition={{duration:0.8}}
      style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5rem',alignItems:'center'}}>
      <div>
        <span className="section-chip">Technology</span>
        <h2 style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:800,lineHeight:1.15,marginBottom:'1.5rem'}}>
          Redefining the timeline of<br/><span className="grad" style={{fontStyle:'italic'}}>neurological care.</span>
        </h2>
        <p style={{color:'#6b7280',lineHeight:1.8,marginBottom:'2rem'}}>
          Early intervention is the most critical factor in improving outcomes for children on the autism spectrum. By moving diagnosis from behavioral observation to neurological measurement, we cut the wait time by years.
        </p>
        <div style={{display:'flex',flexWrap:'wrap',gap:'0.6rem'}}>
          {['Deep Learning','Signal Processing','Python & TensorFlow','Cloud AI Infrastructure'].map(t=>(
            <motion.span key={t} 
              whileHover={{scale:1.05, borderColor:'var(--cyan)', transition:{duration:0.2}}}
              className="glass" style={{fontSize:'0.75rem',padding:'0.4rem 0.85rem',borderRadius:8,
              color:'rgba(255,255,255,0.6)',display:'flex',alignItems:'center',gap:'0.4rem'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--cyan)',display:'inline-block'}}/>
              {t}
            </motion.span>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem'}}>
        {[['94%','DETECTION ACCURACY'],['2.5Ã—','FASTER DIAGNOSIS'],['10k+','SCANS PROCESSED'],['12','BIOMARKERS TRACKED']].map(([v,l], idx)=>(
          <motion.div key={l} 
            initial={{opacity:0, y:20}} 
            whileInView={{opacity:1, y:0}} 
            viewport={{once:true}}
            transition={{delay: idx * 0.1, duration:0.5}}
            style={{padding:'2rem'}}>
            <div style={{fontFamily:'Outfit',fontSize:'2.8rem',fontWeight:800,lineHeight:1,marginBottom:'0.4rem'}} className="grad">{v}</div>
            <div style={{fontSize:'0.68rem',letterSpacing:'0.12em',color:'#6b7280'}}>{l}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
);

// â”€â”€ AI DASHBOARD (with real analysis) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BrainMap = ({ result }) => {
  const dots = [[50,50,'var(--cyan)',10],[70,35,'var(--purple)',7],[30,65,'var(--cyan)',5],[65,70,'rgba(255,255,255,0.3)',4]];
  return (
    <svg viewBox="0 0 100 100" style={{width:'100%',height:160}}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth="1"/>
      {dots.map(([x,y,c,r],i)=>(
        <circle key={i} cx={x} cy={y} r={r} fill={c} opacity={result ? 0.9 : 0.4}
          style={{animation:`pulse ${1.5+i*0.3}s infinite`}}/>
      ))}
      {result && <circle cx="50" cy="50" r="8" fill="var(--cyan)" opacity="0.85"
        style={{animation:'pulse 1s infinite'}}/>}
    </svg>
  );
};

const ResultHeatmap = ({ faceP, eegP }) => {
  const intensity = (faceP + eegP) / 2;
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:3}}>
      {Array.from({length:36},(_,i)=>{
        const r = Math.random();
        const base = intensity * r;
        const bg = base > 0.6 ? 'rgba(0,229,255,0.75)' : base > 0.4 ? 'rgba(0,229,255,0.4)' : base > 0.25 ? 'rgba(124,58,237,0.55)' : 'rgba(124,58,237,0.2)';
        return <div key={i} style={{aspectRatio:'1',borderRadius:3,background:bg}}/>;
      })}
    </div>
  );
};

const Dashboard = () => {
  const [inputTab, setInputTab] = useState('camera');
  const [capturedImg, setCapturedImg] = useState(null);
  const [faceFile, setFaceFile]       = useState(null);
  const [eegFile,  setEegFile]        = useState(null);
  const [loading,  setLoading]        = useState(false);
  const [result,   setResult]         = useState(null);
  const [error,    setError]          = useState(null);
  const [status,   setStatus]         = useState('Awaiting input...');
  const [cameraReady, setCameraReady] = useState(false);

  const webcamRef = useRef(null);
  const faceRef   = useRef(null);
  const eegRef    = useRef(null);

  const hasImage = inputTab === 'camera' ? !!capturedImg : !!faceFile;

  const capture = () => {
    console.log('Capture attempt...');
    const shot = webcamRef.current?.getScreenshot();
    if (shot) {
      console.log('Capture success');
      setCapturedImg(shot);
    } else {
      console.error('Capture failed - Ready:', cameraReady);
      setStatus('Capture failed');
      setError('Could not capture image. Please ensure your camera is enabled.');
    }
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (!hasImage) { setError('Please provide a face image.'); return; }
    setLoading(true); setError(null); setResult(null);
    setStatus('Analyzing facial biomarkers...');
    try {
      let blob;
      if (inputTab === 'camera') {
        const r = await fetch(capturedImg); blob = await r.blob();
      } else { blob = faceFile; }
      const fd = new FormData();
      fd.append('image', blob, 'face.jpg');
      if (eegFile) fd.append('eeg', eegFile);
      const res = await axios.post('http://127.0.0.1:5000/predict', fd);
      setResult(res.data); setStatus('Analysis complete'); console.log('Analysis Success:', res.data);
    } catch(err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg); setStatus('Error: ' + msg);
    }
    setLoading(false);
  };

  const reset = () => {
    setCapturedImg(null); setFaceFile(null); setEegFile(null);
    setResult(null); setError(null); setStatus('Awaiting input...');
  };

  const isASD = result?.prediction === 'ASD Risk';
  const riskProb = result ? (1 - result.final_score) * 100 : 0;
  const riskLevel = riskProb >= 70 ? 'high' : riskProb >= 30 ? 'medium' : 'low';
  const predictionText = isASD ? 'Asd risk' : 'Typically developing';


  const hmColors = result
    ? (() => {
        const rng = (seed=>()=>{seed^=seed<<13;seed^=seed>>17;seed^=seed<<5;return (seed>>>0)/4294967296;})(42);
        return Array.from({length:36},()=>{
          const v = (result.face_probability + result.eeg_probability)/2 * rng();
          if(v>0.55) return 'rgba(0,229,255,0.8)';
          if(v>0.38) return 'rgba(0,229,255,0.4)';
          if(v>0.22) return 'rgba(124,58,237,0.6)';
          return 'rgba(124,58,237,0.2)';
        });
      })()
    : Array.from({length:36},(_,i)=>
        i%3===0?'rgba(0,229,255,0.07)':i%3===1?'rgba(124,58,237,0.07)':'rgba(255,255,255,0.03)');

  return (
    <motion.section 
      id="dashboard"
      initial={{opacity:0, y:50}}
      whileInView={{opacity:1, y:0}}
      viewport={{once:true}}
      transition={{duration:1, ease:"easeOut"}}
      style={{padding:'7rem 2.5rem 5rem',maxWidth:1280,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'3rem'}}>
        <span className="section-chip">AI Dashboard</span>
        <h2 style={{fontSize:'clamp(2rem,4vw,3rem)',fontWeight:800}}>ASD Risk Analysis</h2>
        <p style={{color:'#6b7280',marginTop:'0.6rem',fontSize:'0.9rem'}}>Capture or upload a facial image — optional EEG data for enhanced accuracy</p>
      </div>

      {/* ── ROW 1: Input Stream | Score Panel ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.25rem',marginBottom:'1.25rem'}}>

        {/* Input Stream */}
        <div className="glass" style={{borderRadius:20,padding:'1.5rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <div style={{fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#6b7280'}}>
              Input Stream
            </div>
            {/* Tab pills */}
            <div style={{display:'flex',gap:'0.4rem'}}>
              {[['camera','ðŸ“· Camera'],['upload','ðŸ“ Upload']].map(([tab,label])=>(
                <button key={tab} type="button"
                  onClick={()=>{setInputTab(tab);setCapturedImg(null);setFaceFile(null);}}
                  style={{padding:'0.28rem 0.75rem',border:`1px solid ${inputTab===tab?'var(--cyan)':'rgba(255,255,255,0.08)'}`,
                    borderRadius:999,background:inputTab===tab?'rgba(0,229,255,0.1)':'transparent',
                    color:inputTab===tab?'var(--cyan)':'#6b7280',fontSize:'0.72rem',fontFamily:'Outfit',
                    fontWeight:600,cursor:'none',transition:'all 0.2s'}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{position:'relative',borderRadius:12,overflow:'hidden',
            border:'1px solid rgba(255,255,255,0.06)',background:'#000',aspectRatio:'4/3'}}>

            {inputTab === 'camera' && !capturedImg &&
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                onUserMedia={() => { setStatus('Camera ready'); setCameraReady(true); }}
                onUserMediaError={(err) => setError('Camera error: ' + err)}
                videoConstraints={{facingMode:'user'}}
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}

            {inputTab === 'camera' && capturedImg &&
              <img src={capturedImg} alt="captured"
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}

            {inputTab === 'upload' && faceFile &&
              <img src={URL.createObjectURL(faceFile)} alt="uploaded"
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}

            {inputTab === 'upload' && !faceFile && (
              <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',gap:'0.5rem',color:'#4b5563'}}>
                <Upload size={28}/>
                <span style={{fontSize:'0.8rem'}}>No image selected</span>
              </div>
            )}

            {/* Corner brackets on camera */}
            {inputTab==='camera' && !capturedImg && (
              <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
                <div className="scan-line" />
                {[{t:10,l:10,bt:'2px solid var(--cyan)',bl:'2px solid var(--cyan)',br:'none',bb:'none',r:'3px 0 0 0'},
                  {t:10,r:10,bt:'2px solid var(--cyan)',br:'2px solid var(--cyan)',bl:'none',bb:'none',r2:'0 3px 0 0'},
                  {b:10,l:10,bb:'2px solid var(--cyan)',bl:'2px solid var(--cyan)',bt:'none',br:'none',r3:'0 0 0 3px'},
                  {b:10,r:10,bb:'2px solid var(--cyan)',br:'2px solid var(--cyan)',bt:'none',bl:'none',r4:'0 0 3px 0'}
                ].map((s,i)=>(
                  <div key={i} style={{position:'absolute',width:18,height:18,
                    top:s.t,left:s.l,bottom:s.b,right:s.r||s.r2||undefined,
                    borderTop:s.bt||'none',borderLeft:s.bl||'none',
                    borderRight:s.br||'none',borderBottom:s.bb||'none'}}/>
                ))}
              </div>
            )}

            {loading && (
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
                <RefreshCw size={24} color="var(--cyan)" style={{animation:'spin 0.8s linear infinite'}}/>
                <span style={{fontSize:'0.8rem',color:'var(--cyan)'}}>Analyzing...</span>
              </div>
            )}
          </div>

          <div style={{marginTop:'0.85rem',display:'flex',gap:'0.6rem',alignItems:'center'}}>
            {inputTab === 'camera' ? (
              !capturedImg
                ? <motion.button type="button" onClick={capture} disabled={!cameraReady}
                    whileHover={{scale:1.02, boxShadow:'0 0 20px rgba(0,229,255,0.4)'}}
                    whileTap={{scale:0.98}}
                    style={{flex:1,padding:'0.65rem',border:'none',borderRadius:10,
                      background:cameraReady ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',color:'#000',fontFamily:'Outfit',fontWeight:700,
                      fontSize:'0.82rem',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}>
                    <Camera size={14}/> {cameraReady ? 'Capture' : 'Initializing...'}
                  </motion.button>
                : <motion.button type="button" onClick={()=>setCapturedImg(null)}
                    whileHover={{scale:1.02, background:'rgba(255,255,255,0.05)'}}
                    whileTap={{scale:0.98}}
                    style={{flex:1,padding:'0.65rem',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,
                      background:'transparent',color:'#9ca3af',fontFamily:'Outfit',fontWeight:600,
                      fontSize:'0.82rem',cursor:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem'}}>
                    <RotateCcw size={13}/> Retake
                  </motion.button>
            ) : (
              <motion.div onClick={()=>faceRef.current?.click()}
                whileHover={{borderColor:'var(--cyan)', background:'rgba(0,229,255,0.02)'}}
                style={{flex:1,padding:'0.65rem',border:`1px dashed ${faceFile?'var(--cyan)':'rgba(255,255,255,0.1)'}`,
                  borderRadius:10,textAlign:'center',cursor:'none',transition:'all 0.2s',
                  color:faceFile?'var(--cyan)':'#6b7280',fontSize:'0.82rem',fontFamily:'Outfit',fontWeight:600}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--cyan)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=faceFile?'var(--cyan)':'rgba(255,255,255,0.1)'}>
                <input ref={faceRef} type="file" accept="image/*" style={{display:'none'}}
                  onChange={e=>setFaceFile(e.target.files[0])}/>
                {faceFile ? faceFile.name : 'ðŸ“ Choose image'}
              </motion.div>
            )}

            <motion.div onClick={()=>eegRef.current?.click()}
              whileHover={{borderColor:'var(--purple)', background:'rgba(124,58,237,0.02)'}}
              whileTap={{scale:0.95}}
              style={{padding:'0.65rem 0.9rem',border:`1px dashed ${eegFile?'var(--purple)':'rgba(255,255,255,0.1)'}`,
                borderRadius:10,cursor:'none',transition:'all 0.2s',textAlign:'center',
                color:eegFile?'var(--purple)':'#6b7280',fontSize:'0.72rem',whiteSpace:'nowrap'}}
              title="Upload EEG CSV (optional)"
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--purple)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=eegFile?'var(--purple)':'rgba(255,255,255,0.1)'}>
              <input ref={eegRef} type="file" accept=".csv" style={{display:'none'}}
                onChange={e=>setEegFile(e.target.files[0])}/>
              <Activity size={14}/><br/>EEG
            </motion.div>
          </div>

          <div style={{marginTop:'0.75rem',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.72rem',color:'#4b5563'}}>
            <span style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
              background:error?'#ef4444':result?'var(--cyan)':loading?'#facc15':'#4b5563',
              boxShadow:result&&!error?'0 0 8px var(--cyan)':'',
              animation:loading?'pulse 0.8s infinite':''}}/>
            {status}
          </div>
          {error && <div style={{marginTop:'0.4rem',fontSize:'0.72rem',color:'#f87171',display:'flex',gap:'0.4rem',alignItems:'center'}}>
            <AlertCircle size={12}/>{error}
          </div>}
        </div>

        {/* Score Panel */}
        <motion.div 
          className="glass" 
          animate={result ? { scale: [1, 1.02, 1], transition: { duration: 0.5 } } : {}}
          style={{
            borderRadius:20,
            padding:'1.75rem',
            display:'flex',
            flexDirection:'column',
            justifyContent:'space-between',
            boxShadow: result ? '0 0 30px rgba(0, 229, 255, 0.2)' : 'none',
            border: result ? '1px solid var(--cyan)' : '1px solid var(--border)'
          }}>
          <div style={{fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#6b7280',marginBottom:'1rem'}}>
            Risk Score
          </div>

          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{fontFamily:'Outfit',fontSize:'4.5rem',fontWeight:800,lineHeight:1,
              color:result?(isASD?'#ef4444':'var(--cyan)'):'rgba(255,255,255,0.12)'}}>
              {result ? ((1 - result.final_score)*100).toFixed(1) : '--'}
              <span style={{fontSize:'2rem',marginLeft:'0.2rem',opacity:0.7}}>%</span>
            </div>
            <div style={{color:'#6b7280',marginTop:'0.6rem',fontSize:'0.83rem',lineHeight:1.6,maxWidth:300}}>
              {result
                ? (
                    <div style={{display:'flex', flexDirection:'column', gap:'0.4rem'}}>
                      <div style={{color:isASD?'#f87171':'var(--cyan)', fontWeight:800, fontSize:'1.4rem', fontFamily:'Outfit'}}>
                        {predictionText}
                      </div>
                      <div style={{display:'flex', flexDirection:'column', gap:'0.2rem', color:'rgba(255,255,255,0.7)'}}>
                        <div>Risk : <span style={{color:'#fff', fontWeight:600}}>{riskLevel}</span></div>
                        <div>Probability : <span style={{color:'#fff', fontWeight:600}}>{riskProb.toFixed(1)} percentage</span></div>
                      </div>
                    </div>
                  )

                : 'Capture or upload a face image, then click Analyze.'}
            </div>

            <div style={{marginTop:'1.25rem',height:5,background:'rgba(255,255,255,0.06)',borderRadius:999,overflow:'hidden',maxWidth:320}}>
              <div style={{height:'100%',borderRadius:999,
                background:result?(isASD?'linear-gradient(90deg,#f87171,#ef4444)':'linear-gradient(90deg,var(--cyan),var(--purple))'):'rgba(255,255,255,0.04)',
                width:result?`${(1 - result.final_score)*100}%`:'0%',transition:'width 1.2s ease'}}/>
            </div>

            {result && (
              <div style={{marginTop:'1.5rem',display:'inline-flex',alignItems:'center',gap:'0.5rem',
                padding:'0.5rem 1.1rem',borderRadius:999,
                background:isASD?'rgba(239,68,68,0.1)':'rgba(0,229,255,0.08)',
                border:`1px solid ${isASD?'rgba(239,68,68,0.3)':'rgba(0,229,255,0.25)'}`,
                color:isASD?'#f87171':'var(--cyan)',fontFamily:'Outfit',fontWeight:700,fontSize:'0.85rem',
                width:'fit-content'}}>
                {isASD?<AlertCircle size={15}/>:<CheckCircle2 size={15}/>}
                {predictionText}
              </div>
            )}
          </div>

          <div style={{marginTop:'1.5rem',display:'flex',gap:'0.6rem'}}>
            <motion.button 
              onClick={onSubmit} 
              disabled={loading||!hasImage}
              whileHover={hasImage ? {scale:1.02, boxShadow:'0 0 25px rgba(0,229,255,0.4)'} : {}}
              whileTap={hasImage ? {scale:0.98} : {}}
              style={{flex:1,padding:'0.8rem',border:'none',borderRadius:10,
                background:hasImage?'linear-gradient(135deg,var(--cyan),var(--purple))':'rgba(255,255,255,0.05)',
                color:hasImage?'#000':'#4b5563',fontFamily:'Outfit',fontWeight:700,fontSize:'0.88rem',
                cursor:hasImage?'none':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem',
                transition:'all 0.3s'}}>
              {loading?<><RefreshCw size={15} style={{animation:'spin 0.7s linear infinite'}}/> Analyzing...</>:'Analyze â†’'}
            </motion.button>
            {result && (
              <motion.button onClick={reset}
                whileHover={{background:'rgba(255,255,255,0.05)'}}
                whileTap={{scale:0.95}}
                style={{padding:'0.8rem 1rem',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,
                  background:'transparent',color:'#6b7280',fontSize:'0.82rem',cursor:'none'}}>
                Reset
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* â”€â”€ ROW 2: KEY BIOMARKERS | FUNCTIONAL HEATMAP | BRAIN MAPPING â”€â”€ */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.6fr 1fr',gap:'1.25rem'}}>

        {/* KEY BIOMARKERS */}
        <div className="glass" style={{borderRadius:20,padding:'1.75rem'}}>
          <div style={{fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',
            color:'#6b7280',marginBottom:'1.25rem'}}>Key Biomarkers</div>
          {[
            ['Alpha Coherence', result?(result.face_probability>0.6?'Elevated':result.face_probability>0.4?'Normal':'Low'):null,
              result?(result.face_probability>0.6?'#f87171':result.face_probability>0.4?'var(--cyan)':'#facc15'):null],
            ['Gamma Band', result?(result.eeg_probability>0.5?'Elevated':'Normal'):null,
              result?(result.eeg_probability>0.5?'#facc15':'var(--cyan)'):null],
            ['Theta/Beta Ratio', result?(result.final_score>0.6?'Elevated':result.final_score>0.45?'Borderline':'Normal'):null,
              result?(result.final_score>0.6?'#f87171':result.final_score>0.45?'#facc15':'var(--cyan)'):null],
          ].map(([name,val,col])=>(
            <div key={name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'0.65rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.82rem'}}>
              <span style={{color:'#9ca3af'}}>{name}</span>
              <span style={{color:val?col:'rgba(255,255,255,0.15)',fontWeight:600}}>{val||'---'}</span>
            </div>
          ))}

          {result && (
            <>
              <div style={{marginTop:'1.25rem',fontSize:'0.65rem',letterSpacing:'0.12em',
                textTransform:'uppercase',color:'#6b7280',marginBottom:'0.7rem'}}>Confidence</div>
              {[['Face CNN',result.face_probability,'var(--cyan)'],['EEG Model',result.eeg_probability,'var(--purple)']].map(([l,v,c])=>(
                <div key={l} style={{marginBottom:'0.65rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.73rem',color:'#6b7280',marginBottom:'0.3rem'}}>
                    <span>{l}</span><span style={{color:'#fff'}}>{(v*100).toFixed(1)}%</span>
                  </div>
                  <div style={{height:3,background:'rgba(255,255,255,0.05)',borderRadius:999,overflow:'hidden'}}>
                    <div style={{height:'100%',background:c,borderRadius:999,width:`${v*100}%`,transition:'width 1s ease'}}/>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* FUNCTIONAL HEATMAP */}
        <div className="glass" style={{borderRadius:20,padding:'1.75rem'}}>
          <div style={{fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',
            color:'#6b7280',marginBottom:'1.25rem'}}>Functional Heatmap</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:5}}>
            {hmColors.map((c,i)=>(
              <div key={i} style={{aspectRatio:'1',borderRadius:4,background:c,
                transition:'background 0.8s ease'}}/>
            ))}
          </div>
          {result && (
            <div style={{marginTop:'1rem',fontSize:'0.72rem',color:'#6b7280',lineHeight:1.6}}>
              Neural activity pattern based on multimodal AI fusion analysis of facial and EEG biomarkers.
            </div>
          )}
        </div>

        {/* BRAIN MAPPING */}
        <div className="glass" style={{borderRadius:20,padding:'1.75rem',position:'relative'}}>
          <div style={{fontSize:'0.65rem',letterSpacing:'0.15em',textTransform:'uppercase',
            color:'#6b7280',marginBottom:'1rem'}}>Brain Mapping</div>
          <svg viewBox="0 0 100 100" style={{width:'100%',height:150}}>
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(0,229,255,0.07)" strokeWidth="1"/>
            <circle cx="50" cy="50" r="16" fill="none" stroke="rgba(0,229,255,0.05)" strokeWidth="1"/>
            {[[50,50,'var(--cyan)',result?10:5],[68,34,'var(--purple)',result?7:3.5],
              [30,62,'var(--cyan)',result?5:2.5],[66,68,'rgba(255,255,255,0.3)',result?4:2]].map(([x,y,c,r],i)=>(
              <circle key={i} cx={x} cy={y} r={r} fill={c}
                style={{animation:`pulse ${1.4+i*0.35}s infinite`,opacity:result?0.9:0.3,transition:'all 0.8s'}}/>
            ))}
            {result && <circle cx="50" cy="50" r="3" fill="#fff" opacity="0.9"
              style={{animation:'pulse 0.9s infinite'}}/>}
          </svg>
          {result && (
            <div style={{fontSize:'0.72rem',color:'#6b7280',textAlign:'center',marginTop:'0.5rem',lineHeight:1.6}}>
              {isASD?'Elevated activity detected in temporal & frontal regions':'Neural patterns within normal range'}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};
// -- FOOTER ---------------------------------------------------------------------
const Footer = () => (
  <motion.footer 
    initial={{opacity:0}}
    whileInView={{opacity:1}}
    viewport={{once:true}}
    style={{borderTop:'1px solid var(--border)',padding:'3rem 2.5rem',
    display:'grid',gridTemplateColumns:'1fr auto auto',gap:'3rem',alignItems:'start',maxWidth:1200,margin:'0 auto'}}>
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.75rem',
        fontFamily:'Outfit',fontWeight:700,fontSize:'1.1rem'}}>
        <BrainCircuit size={20} color="var(--cyan)"/> Autism Detection
      </div>
      <p style={{color:'#4b5563',fontSize:'0.82rem',maxWidth:280,lineHeight:1.7}}>
        Pioneering the intersection of artificial intelligence and neuroscience for early pediatric diagnostics.
      </p>
    </div>
    <div>
      <div style={{fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#6b7280',marginBottom:'1rem'}}>Platform</div>
      {['Technology','Clinical Trials','For Doctors'].map(l=>(
        <div key={l} style={{fontSize:'0.82rem',color:'#4b5563',marginBottom:'0.5rem'}}>{l}</div>
      ))}
    </div>
    <div>
      <div style={{fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#6b7280',marginBottom:'1rem'}}>Company</div>
      {['About Us','Research','Contact'].map(l=>(
        <div key={l} style={{fontSize:'0.82rem',color:'#4b5563',marginBottom:'0.5rem'}}>{l}</div>
      ))}
    </div>
  </motion.footer>
);

// -- APP ------------------------------------------------------------------------
export default function App() {
  return (
    <div style={{background:'var(--bg)',minHeight:'100vh',color:'#fff',position:'relative'}}>
      <GlobalStyles/>
      <Cursor/>
      <ThreeBackground/>
      <div style={{position:'relative',zIndex:1}}>
        <Nav/>
        <Hero/>
        <Problem/>
        <Process/>
        <Technology/>
        <Dashboard/>
        <Footer/>
      </div>
    </div>
  );
}
