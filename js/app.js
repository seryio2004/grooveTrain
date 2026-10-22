
(()=>{'use strict';
const $=id=>document.getElementById(id);
const { FIGS, svgFig } = window.GrooveFigures;
const state={bpm:95,level:1,mode:'levels',inst:'drums',source:'keyboard',editing:false,pattern:[],running:null,finishRAF:0,score:0,highLevel:0,micStream:null,micCtx:null,micReady:false,micNode:null,micInput:null,micOpening:false,micGeneration:0,micDetected:0,sessionId:0};
const pal=[0,0,2,3,4,1,1,4,4,1,6,2,4,6,0,0];
const difficulty=['Primeros pasos','Sencillo','Constante','Intermedio','Síncopas','Avanzado','Quintillos','Seisillos','Experto','Virtuoso'];
let audio=null,toastTimer=null,raf=0,hitFlash=0;
function colorByIndex(i){return pal[i%pal.length]}
function renderBoard(){const board=$('board');board.classList.toggle('editable',state.editing);board.innerHTML=state.pattern.map((id,i)=>`<button type="button" class="block" data-color="${colorByIndex(i)}" data-index="${i}" title="Bloque ${i+1}: ${FIGS[id].name}${state.editing?' · Pulsa para cambiar':''}" aria-label="Bloque ${i+1}. ${FIGS[id].name}. ${state.editing?'Editar figura':''}">${svgFig(FIGS[id])}<span class="block-index">${String(i+1).padStart(2,'0')}</span><span class="edit-sign">↻</span></button>`).join('');}
function choosePool(level){if(level<=1)return [[0,5],[6,5]];if(level===2)return [[0,5,6,7],[6,4,3,2]];if(level<=4)return [[0,1,2,5,6,7,8,9],[5,3,4,1,2,2,1,1]];if(level<=6)return [[0,1,2,3,5,6,7,8,9],[3,3,5,2,1,2,2,1,1]];return [[0,1,2,3,4,5,6,7,8,9],[2,2,3,4,4,1,2,2,1,1]];}
function makePattern(){const l=state.mode==='random'?1+Math.floor(Math.random()*10):state.level;const [pool,weights]=choosePool(l);const total=weights.reduce((a,b)=>a+b,0);state.pattern=Array.from({length:16},(_,i)=>{let r=Math.random()*total;for(let n=0;n<pool.length;n++){r-=weights[n];if(r<0)return pool[n]}return pool[0]});renderBoard();$('boardNote').textContent=`16 bloques · 4 compases · Cada bloque ocupa 1 pulso${state.mode==='random'?' · Aleatorio':''}`}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
function setTitle(t,sub,tag){$('phaseTitle').textContent=({'LISTO PARA JUGAR':'Listo','CUENTA DE ENTRADA':'1 · 2 · 3 · 4','01 / ESCUCHA':'Escucha','02 / PREPÁRATE':'Prepárate','03 / TU TURNO':'Toca','ESCUCHA COMPLETADA':'Escuchado','RETO SUPERADO':'¡Superado!','RESULTADO DEL RETO':'Resultado'})[tag]||t;$('phaseSubtitle').textContent=sub;$('stageTag').textContent=tag;}
function updateConfig(){
$('bpmBig').textContent=state.bpm;$('tempoValue').textContent=state.bpm+' BPM';$('bpmRange').value=state.bpm;
$('levelCaption').textContent=state.mode==='random'?'ALEATORIO':'NIVEL '+String(state.level).padStart(2,'0')+' / 10';$('levelValue').textContent=String(state.level).padStart(2,'0');$('levelWord').textContent=difficulty[state.level-1];
$('levelsMode').classList.toggle('selected',state.mode==='levels');$('randomMode').classList.toggle('selected',state.mode==='random');$('modeName').textContent=state.mode==='random'?'Infinito / Aleatorio':'Progresión';$('levelField').style.display=state.mode==='random'?'none':'';
$('levelDown').disabled=!!state.running || state.level===1;$('levelUp').disabled=!!state.running || state.level===10;
$('levelSquares').innerHTML=Array.from({length:10},(_,i)=>`<button type="button" data-level="${i+1}" class="${(i+1)<=state.highLevel?'passed ':''}${state.mode==='levels'&&i+1===state.level?'selected':''}" ${state.running?'disabled':''} aria-label="Nivel ${i+1}" title="Nivel ${i+1}" ${state.mode==='levels'&&i+1===state.level?'aria-current="step"':''}></button>`).join('');
const names={drums:'Batería',guitar:'Guitarra',bass:'Bajo'};$('instrumentName').textContent=names[state.inst];document.querySelectorAll('.inst').forEach(b=>{const sel=b.dataset.inst===state.inst;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',String(sel))});
$('sourceName').textContent=state.source==='mic'?'Micrófono':'Teclado / pantalla';$('keyboardSource').classList.toggle('selected',state.source==='keyboard');$('micSource').classList.toggle('selected',state.source==='mic');$('micSetup').classList.toggle('visible',state.source==='mic');
$('editBtn').textContent=state.editing?'✓ Listo':'✎ Editar';$('board').classList.toggle('editable',state.editing);
['bpmRange','regenBtn','editBtn','levelsMode','randomMode'].forEach(id=>$(id).disabled=!!state.running);document.querySelectorAll('.inst').forEach(b=>b.disabled=!!state.running);$('keyboardSource').disabled=!!state.running;$('micSource').disabled=!!state.running;$('listenBtn').disabled=!!state.running;$('challengeBtn').disabled=!!state.running;$('stopBtn').disabled=!state.running;
$('tapBtn').disabled=state.source==='mic';$('tapBtn').textContent=state.source==='mic'?'◉ Entrada por micro':'● Golpe · Espacio';
$('tapTip').textContent=state.source==='mic'?'Usa auriculares. Los ataques del micrófono se registran durante tu turno.':state.running?'Durante tu turno, pulsa Espacio o este botón.':'Pulsa para probar la entrada. Inicia Probar ritmo para evaluar el patrón.';
$('tapTip').classList.toggle('visible',true);
$('micDisconnect').disabled=!state.micReady || !!state.running;
}
function idle(){setTitle('¿Preparado para tocar?','Escucha el ritmo con metrónomo y luego repítelo mientras solo suena el pulso.','LISTO PARA JUGAR');$('statusTitle').textContent='01 / Escucha y aprende';$('statusDesc').textContent='Después, tú tocas con metrónomo';$('miniPhase').textContent='ESPERA';$('miniBeat').textContent='— / 16';$('miniHits').textContent='0';window.GrooveTrain.reset();document.querySelectorAll('.block').forEach(b=>b.classList.remove('active','correct','wrong'));}
function canChange(){if(state.running){toast('Espera a que termine o pulsa Parar.');return false}return true}
function makeNoise(ctx){const sr=ctx.sampleRate,length=Math.floor(sr*.14),b=ctx.createBuffer(1,length,sr),data=b.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);return b;}
function initAudio(){if(!audio){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)throw new Error('Este navegador no tiene Web Audio API');audio=new AudioContext();}return audio.resume().then(()=>audio)}
function oscSound(session,t,{freq=440,endFreq=freq,dur=.11,kind='sine',amp=.3}={}){const ctx=audio,o=ctx.createOscillator(),g=ctx.createGain();o.type=kind;o.frequency.setValueAtTime(freq,t);if(freq!==endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(15,endFreq),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,amp),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(session.gain);o.start(t);o.stop(t+dur+.02);}
function clickSound(session,t,accent=false){oscSound(session,t,{freq:accent?1250:970,endFreq:accent?680:540,dur:.047,kind:'triangle',amp:accent?.22:.12});}
function noteSound(session,t,beatIndex){if(state.inst==='drums'){
oscSound(session,t,{freq:175,endFreq:62,dur:.11,kind:'sine',amp:.35});oscSound(session,t,{freq:930,endFreq:330,dur:.03,kind:'triangle',amp:.06});
}else if(state.inst==='bass'){const pitches=[82.4,98,110,73.42],f=pitches[Math.floor(beatIndex/4)%4];oscSound(session,t,{freq:f,endFreq:f*.985,dur:.24,kind:'triangle',amp:.32});oscSound(session,t,{freq:f*2,endFreq:f*2,dur:.12,kind:'sine',amp:.045});
}else {const chords=[[196,246.94,293.66],[174.61,220,261.63],[146.83,196,246.94],[164.81,207.65,261.63]];chords[Math.floor(beatIndex/4)%4].forEach((f,i)=>oscSound(session,t+i*.004,{freq:f,endFreq:f,dur:.16,kind:'triangle',amp:.08}));}}
function scheduleSession(s){const beat=60/state.bpm,t0=audio.currentTime+.2,s0=t0+4*beat,s1=s0+16*beat,turn=s1+4*beat,end=turn+(s.challenge?16:0)*beat;
s.start=t0;s.sampleStart=s0;s.listenEnd=s1;s.userStart=turn;s.end=s.challenge?end:s1;s.beatSec=beat;s.expected=[];s.hits=[];s.lastIndex=-1;s.lastPhase='';s.audioId=state.sessionId;
const metronomeUntil=s.challenge?end:s1;for(let j=0;j<Math.ceil((metronomeUntil-t0)/beat-.0001);j++)clickSound(s,t0+j*beat,j%4===0);
state.pattern.forEach((idx,bi)=>{for(const frac of FIGS[idx].notes){const offset=(bi+frac)*beat;noteSound(s,s0+offset,bi);if(s.challenge)s.expected.push({t:offset,block:bi});}});
}
function clearSound(){if(!state.running)return;const s=state.running;if(s.gain&&audio){s.gain.gain.cancelScheduledValues(audio.currentTime);s.gain.gain.setTargetAtTime(0,audio.currentTime,.015)}state.running=null;state.sessionId++;cancelAnimationFrame(raf);raf=0;}
function setPlayingHeader(phase,beatNum){if(phase==='count'){setTitle('1, 2, 3, 4…','Cuenta cuatro pulsos. Escucharás el ritmo justo después.','CUENTA DE ENTRADA');$('statusTitle').textContent='PREPARADOS';$('statusDesc').textContent='Metrónomo de entrada';$('miniPhase').textContent='CUENTA';}
if(phase==='listen'){setTitle('Escucha el ritmo.','Cada bloque ocupa un pulso; memoriza cada golpe.','01 / ESCUCHA');$('statusTitle').textContent='01 / Escucha el patrón';$('statusDesc').textContent='Patrón + metrónomo';$('miniPhase').textContent='ESCUCHA';}
if(phase==='transition'){setTitle('¡Ahora tú!','Cuatro pulsos para empezar; después tocarás con el metrónomo.','02 / PREPÁRATE');$('statusTitle').textContent='02 / Cuenta atrás';$('statusDesc').textContent='El patrón dejará de sonar';$('miniPhase').textContent='ENTRADA';}
if(phase==='play'){setTitle('¡Toca tú!','Solo suena el metrónomo. Reproduce cada figura rítmica.','03 / TU TURNO');$('statusTitle').textContent='03 / Reproduce la secuencia';$('statusDesc').textContent='Metrónomo solo · estás grabando golpes';$('miniPhase').textContent='TOCANDO';}
$('miniBeat').textContent=(phase==='listen'||phase==='play')?((beatNum+1)+' / 16'):((beatNum%4+1)+' / 4');
}
function getPhase(s,now){if(now<s.sampleStart)return {name:'count',index:Math.max(0,Math.floor((now-s.start)/s.beatSec))};if(now<s.listenEnd)return {name:'listen',index:Math.floor((now-s.sampleStart)/s.beatSec)};if(s.challenge){if(now<s.userStart)return {name:'transition',index:Math.floor((now-s.listenEnd)/s.beatSec)};if(now<s.end)return {name:'play',index:Math.floor((now-s.userStart)/s.beatSec)};}return {name:'finished',index:16}}
function frame(){const s=state.running;if(!s)return;const now=audio.currentTime,{name,index}=getPhase(s,now);if(name==='finished'){if(now<s.end+.15){raf=requestAnimationFrame(frame);return}endSession();return}if(name!==s.lastPhase||index!==s.lastIndex){s.lastPhase=name;s.lastIndex=index;setPlayingHeader(name,index);window.GrooveTrain.setPhase(name);document.querySelectorAll('.block').forEach((b,i)=>b.classList.toggle('active',(name==='listen'||name==='play')&&i===index));}
const done=name==='listen'?(now-s.sampleStart)/(s.listenEnd-s.sampleStart):name==='play'?(now-s.userStart)/(s.end-s.userStart):0;window.GrooveTrain.setProgress(done,index);raf=requestAnimationFrame(frame)}
function endSession(){const s=state.running;if(!s)return;clearSound();document.querySelectorAll('.block').forEach(b=>b.classList.remove('active'));window.GrooveTrain.finish();updateConfig();if(!s.challenge){setTitle('¡Patrón escuchado!','Cuando quieras, inicia el reto para escucharlo de nuevo y repetirlo.','ESCUCHA COMPLETADA');$('miniPhase').textContent='LISTO';$('statusDesc').textContent='Puedes intentar reproducirlo cuando quieras';return}scoreSession(s);}
function scoreSession(s){const tol=Math.min(.135,.45*s.beatSec/Math.max(1,Math.max(...state.pattern.map(i=>FIGS[i].n))));
const {matched,goodBlocks,badBlocks}=window.GrooveRhythm.analyseHits(s.expected,s.hits,tol,s.beatSec);
const extras=s.hits.length-matched.length,missed=s.expected.length-matched.length,mean=matched.length?Math.round(matched.reduce((z,c)=>z+c.err,0)/matched.length*1000):null;
const bias=matched.length?Math.round(matched.reduce((z,c)=>z+c.delta,0)/matched.length*1000):0;
const score=Math.round(100*matched.length/Math.max(s.expected.length,s.hits.length,1));state.score=score;
document.querySelectorAll('.block').forEach((b,i)=>{b.classList.toggle('correct',goodBlocks.has(i));b.classList.toggle('wrong',badBlocks.has(i));});const passed=score>=85;
setTitle(passed?'¡Ritmo dominado!':'Sigue practicando.',passed?'Buen trabajo: puedes avanzar al siguiente nivel.':'Vuelve a escucharlo y mejora la precisión de los golpes.',passed?'RETO SUPERADO':'RESULTADO DEL RETO');
$('results').classList.add('open');$('resultTitle').textContent=score+' / 100 · '+(passed?'¡SUPERADO!':'INTÉNTALO OTRA VEZ');$('resultDetail').textContent='Se evalúan golpes detectados en su ventana temporal (no afinación, timbre ni técnica). Ventana máxima ±'+Math.round(tol*1000)+' ms por golpe.';$('resultList').innerHTML=`<span>✓ Aciertos: ${matched.length}/${s.expected.length}</span><span>✕ De más: ${extras}</span><span>○ Perdidos: ${missed}</span><span>⌁ Error medio: ${mean===null?'—':mean+' ms'}</span><span>${mean===null?'Sin golpes coincidentes':Math.abs(bias)<10?'● A tiempo':bias<0?'← Adelanto medio: '+Math.abs(bias)+' ms':'→ Retraso medio: '+bias+' ms'}</span>`;$('nextBtn').style.display=(passed && state.mode==='levels' && state.level<10)?'inline-flex':'none';$('miniPhase').textContent='RESULTADO';$('miniHits').textContent=String(s.hits.length);$('statusTitle').textContent=passed?'RETO COMPLETADO':'RETO TERMINADO';$('statusDesc').textContent=passed?'¡85 % alcanzado!':'Pulsa iniciar para reintentarlo';
if(passed&&state.mode==='levels'){state.highLevel=Math.max(state.highLevel,state.level);if(state.level<10){$('statusDesc').textContent='Siguiente nivel desbloqueado · pulsa Generar o +';}}updateConfig();}
async function start(challenge){if(state.running)return;if(state.source==='mic'&&challenge&&!state.micReady){toast('Antes de empezar, activa el micrófono o elige Espacio / clic.');return}try{await initAudio()}catch(e){toast('No se pudo activar el audio: '+e.message);return}if(state.running)return;
$('results').classList.remove('open');document.querySelectorAll('.block').forEach(b=>b.classList.remove('correct','wrong'));if(state.mode==='random'){makePattern()}
const s={challenge,gain:audio.createGain()};s.gain.connect(audio.destination);state.running=s;state.sessionId++;scheduleSession(s);updateConfig();frame();}
function abort(){if(!state.running)return;clearSound();updateConfig();idle();toast('Ejercicio detenido.');}
function flashHit(){const b=$('tapBtn');b.classList.add('hit');clearTimeout(hitFlash);hitFlash=setTimeout(()=>b.classList.remove('hit'),90);}
function recordHit(source, capturedTime){if(!audio)return;const s=state.running;if(!s||!s.challenge||state.source!==source)return;
const t=(capturedTime??audio.currentTime)-s.userStart-(source==='mic'?Number($('micOffset').value)/1000:0);
if(t<-.045||t>(s.end-s.userStart)+.07)return;
if(s.hits.some(hit=>Math.abs(t-hit)<.025))return;
s.hits.push(t);$('miniHits').textContent=String(s.hits.length);flashHit();}
async function manuallyTap(event){if(state.source==='mic')return;
// Preserve the event time even when audio needs resuming on the first tap.
const eventTime=event?.timeStamp??performance.now();
if(!audio || audio.state!=='running'){try{await initAudio()}catch(err){toast('No se pudo activar el audio: '+err.message);return}}
flashHit();
if(!state.running){$('miniHits').textContent=String(Number($('miniHits').textContent)+1);return}
const stamp=audio.getOutputTimestamp?.();
const capturedTime=stamp?.performanceTime>0?stamp.contextTime+(eventTime-stamp.performanceTime)/1000:audio.currentTime-(performance.now()-eventTime)/1000;
recordHit('keyboard',capturedTime);
}
function updateMicUI(){const on=state.micReady;$('micStatus').textContent=on?'Micro activo · usa auriculares · detecta ataques, no afinación':state.micOpening?'Solicitando acceso al micrófono…':'Usa auriculares · activa el micro y comprueba tus golpes';$('micConnect').disabled=on||state.micOpening;$('micDisconnect').disabled=!on||!!state.running;}
function stopMic(){state.micGeneration++;
if(state.micNode){state.micNode.port.onmessage=null;state.micNode.disconnect()}
if(state.micInput)state.micInput.disconnect();
if(state.micStream)state.micStream.getTracks().forEach(t=>t.stop());
state.micCtx=null;state.micStream=null;state.micNode=null;state.micInput=null;state.micReady=false;state.micOpening=false;state.micDetected=0;$('micMeter').style.width='0%';$('micHits').textContent='0 ataques';updateMicUI();}
async function openMic(){if(state.micReady||state.micOpening)return;if(!navigator.mediaDevices?.getUserMedia){toast('Micrófono no disponible: usa localhost o HTTPS en un navegador compatible.');return}
state.micOpening=true;const generation=++state.micGeneration;updateMicUI();let stream=null;
try{const ctx=await initAudio();if(!ctx.audioWorklet)throw new Error('Este navegador no admite el análisis de audio. Usa Chrome, Firefox o Safari actualizado.');
await ctx.audioWorklet.addModule('js/mic-processor.js');
stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,autoGainControl:false,noiseSuppression:false,channelCount:1},video:false});
if(generation!==state.micGeneration){stream.getTracks().forEach(t=>t.stop());return}
const src=ctx.createMediaStreamSource(stream),hp=ctx.createBiquadFilter(),node=new AudioWorkletNode(ctx,'groove-onsets');
hp.type='highpass';hp.frequency.value=40;src.connect(hp);hp.connect(node);node.connect(ctx.destination);
state.micStream=stream;state.micCtx=ctx;state.micInput=src;state.micNode=node;state.micReady=true;state.micOpening=false;state.micDetected=0;
node.port.postMessage({sensitivity:Number($('micThresh').value)});
node.port.onmessage=event=>{if(!state.micReady)return;const {rms,threshold,hit,time}=event.data;$('micMeter').style.width=Math.min(100,rms*450)+'%';
$('micMeter').parentElement.setAttribute('aria-valuenow',String(Math.round(Math.min(100,rms*450))));
$('micMeter').classList.toggle('above-threshold',rms>threshold);
if(hit){state.micDetected++;$('micHits').textContent=state.micDetected+' ataques';recordHit('mic',time);}};
stream.getTracks().forEach(track=>track.addEventListener('ended',()=>{if(state.micStream!==stream)return;if(state.running&&state.source==='mic')abort();stopMic();toast('El micrófono se ha desconectado.');}));
updateMicUI();toast('Micrófono activado. Comprueba el medidor y los ataques antes del reto.');
}catch(err){if(stream)stream.getTracks().forEach(t=>t.stop());if(generation!==state.micGeneration)return;stopMic();toast('No se pudo activar el micrófono: '+(err.name==='NotAllowedError'?'permiso denegado.':err.message));}}
function setLevel(n){if(!canChange())return;state.level=Math.max(1,Math.min(10,n));state.mode='levels';state.editing=false;makePattern();$('results').classList.remove('open');idle();updateConfig()}
$('levelSquares').addEventListener('click',e=>{const b=e.target.closest('button[data-level]');if(b)setLevel(Number(b.dataset.level))});
$('board').addEventListener('click',e=>{const b=e.target.closest('.block');if(!b||!state.editing||!canChange())return;const i=Number(b.dataset.index);state.pattern[i]=(state.pattern[i]+1)%FIGS.length;renderBoard();$('results').classList.remove('open')});
$('regenBtn').addEventListener('click',()=>{if(!canChange())return;makePattern();idle();$('results').classList.remove('open');toast('Nuevo patrón generado.');});
$('editBtn').addEventListener('click',()=>{if(!canChange())return;state.editing=!state.editing;updateConfig();toast(state.editing?'Toca un bloque para cambiar su figura.':'Edición terminada.');});
$('nextBtn').addEventListener('click',()=>setLevel(state.level+1));$('levelDown').addEventListener('click',()=>setLevel(state.level-1));$('levelUp').addEventListener('click',()=>setLevel(state.level+1));
$('levelsMode').addEventListener('click',()=>{if(!canChange())return;state.mode='levels';makePattern();idle();$('results').classList.remove('open');updateConfig()});
$('randomMode').addEventListener('click',()=>{if(!canChange())return;state.mode='random';state.editing=false;makePattern();idle();$('results').classList.remove('open');updateConfig();toast('Modo aleatorio: cada nuevo reto genera otra secuencia.')});
$('bpmRange').addEventListener('input',e=>{if(state.running)return;state.bpm=Math.max(50,Math.min(170,Number(e.target.value)||95));updateConfig()});
$('instruments').addEventListener('click',e=>{const b=e.target.closest('button[data-inst]');if(!b||!canChange())return;state.inst=b.dataset.inst;updateConfig();});
$('challengeBtn').addEventListener('click',()=>start(true));$('listenBtn').addEventListener('click',()=>start(false));$('stopBtn').addEventListener('click',abort);$('tapBtn').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();manuallyTap(e)});$('tapBtn').addEventListener('click',e=>{if(e.detail!==0)return;manuallyTap(e)});
document.addEventListener('keydown',e=>{if(e.code!=='Space'||e.repeat||e.altKey||e.ctrlKey||e.metaKey)return;const tag=e.target.tagName;if(e.target.isContentEditable||tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA')return;if(tag==='BUTTON'&&!state.running&&e.target.id!=='tapBtn')return;if(e.target.id==='tapBtn'){e.preventDefault();manuallyTap(e);return;}if(!state.running)return;e.preventDefault();manuallyTap(e)});
$('keyboardSource').addEventListener('click',()=>{if(!canChange())return;stopMic();state.source='keyboard';updateConfig()});$('micSource').addEventListener('click',()=>{if(!canChange())return;state.source='mic';updateConfig()});$('micConnect').addEventListener('click',openMic);$('micDisconnect').addEventListener('click',()=>{if(canChange())stopMic()});$('micThresh').addEventListener('input',()=>{$('threshText').textContent=$('micThresh').value;state.micNode?.port.postMessage({sensitivity:Number($('micThresh').value)})});$('micOffset').addEventListener('input',()=>{$('offsetText').textContent=$('micOffset').value+' ms'});
window.addEventListener('pagehide',()=>{if(state.running)clearSound();stopMic()});
makePattern();updateConfig();idle();updateMicUI();
})();
