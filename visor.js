"use strict";
const {docs,pages,study}=window.DATOS,PROTO=Object.fromEntries(Object.entries(window.PROTO||{}).map(([k,v])=>[k.normalize("NFC"),v])),drugs=window.FARM,renal=window.RENAL,renalNotas=window.RENAL_NOTAS;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
const pdfUrl=(f,p)=>"../"+f.split("/").map(encodeURIComponent).join("/")+(p?"#page="+p:"");
const docFiles=d=>[d.f,...(d.junta||[]).map(j=>j.f)];
const findDoc=frag=>{for(const d of docs){if(norm(d.f).includes(norm(frag)))return d;const j=(d.junta||[]).find(j=>norm(j.f).includes(norm(frag)));if(j)return j}};
const KEY="visor-ucin-v1";
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let R=store.get(KEY,{}),FAV=store.get(KEY+"-fav",[]),REC=store.get(KEY+"-rec",[]);
let peso=null,stack=[{s:"home"}],tab="item",filtro="Todo",soloPend=true;
const saveR=()=>store.set(KEY,R);

/* Elementos revisables */
const ST={pendiente:"Pendiente",ok:"Validado",fix:"A corregir",block:"Bloqueado"};
const STD={pendiente:"Pendiente",ok:"Resuelta",fix:"Consultar",block:"Bloqueada"};
const items=()=>[
 ...DISC.map(d=>({id:"disc:"+d.id,tipo:"Discrepancias",t:d.tema,sub:d.grupo,nav:null,d})),
 ...FICHAS.map(f=>({id:"ficha:"+f.id,tipo:"Fichas",t:f.titulo,sub:f.fuente,nav:{s:"ficha",id:f.id}})),
 ...CALCS.map(c=>({id:"calc:"+c.id,tipo:"Calculadoras",t:c.t,sub:c.fuente,nav:{s:"calc",id:c.id}})),
 {id:"tabla:compat",tipo:"Fichas",t:"Compatibilidades",sub:"Foto IMG_6231, leída automáticamente",nav:{s:"compat"}},
 ...ESCALAS.map(e=>({id:"escala:"+e.id,tipo:"Escalas",t:e.t,sub:e.fuente,nav:{s:"escala",id:e.id}})),
 ...docs.map(d=>({id:"doc:"+d.f,tipo:"Protocolos",t:d.t,sub:d.v,nav:{s:"doc",f:d.f}})),
 ...drugs.map(d=>({id:"drug:"+d.n,tipo:"Fármacos",t:d.n,sub:"Guía 2025, p. "+d.p,nav:{s:"drug",n:d.n}})),
 ...renal.map(d=>({id:"renal:"+d.n,tipo:"Ajuste renal",t:d.n,sub:"GOSH, p. "+d.p,nav:{s:"rdrug",n:d.n}}))];
const est=id=>R[id]?.e||VALIDADOS[id]?.e||"pendiente";
const nota=id=>R[id]?.n??VALIDADOS[id]?.n??"";

function tagOf(k){return{HOSPITAL:"t-hosp",SENEO:"t-blue","GUÍA 2025":"t-blue",ESTUDIO:"t-grey"}[k]||"t-grey"}
const tag=k=>`<span class="tag ${tagOf(k)}">${esc(k)}</span>`;
const stTag=id=>{const e=est(id);return e==="pendiente"?"":`<span class="tag ${e==="ok"?"t-hosp":e==="fix"?"t-warn":"t-danger"}">${esc((id.startsWith("disc:")?STD:ST)[e])}</span>`};
const old=v=>{const m=/(20\d\d)/.exec(v||"");return m&&+m[1]<=2021};
const row=(nav,main,sub,right="")=>`<button class="row" data-nav='${esc(JSON.stringify(nav))}'><span class="main">${main}${sub?`<small>${sub}</small>`:""}</span>${right}<span class="chev">›</span></button>`;
const docRow=d=>row({s:"doc",f:d.f},esc(d.t),esc(d.v)+(d.lote===0?" · no vigente, pendiente de archivar":""),stTag("doc:"+d.f)+(old(d.v)?'<span class="tag t-warn">Revisar vigencia</span>':""));

/* Pantallas */
const S={
 home(){return{t:"Neonatología",h:`<input class="search" id="q" type="search" placeholder="Buscar protocolo, fármaco, dosis…" aria-label="Buscar">
  <h2>Menú</h2><div class="grid"><button class="tile wide big-tile m1" data-nav='{"s":"prot"}'>Protocolos</button>
  <button class="tile wide big-tile m2" data-nav='{"s":"fgrupo"}'>Fármacos</button>
  <button class="tile wide big-tile m3" data-nav='{"s":"farm"}'>Calculadoras y escalas</button>
  <div class="gap"></div>${["Hemodinámica","Respiratorio","Metabólico renal","Digestivo","Hematológico","Infeccioso","Neurológico","Prematuro","Recién nacido sano","Procedimientos"].map(t=>{const i=ESPEC.findIndex(e=>e[0]===t);return`<button class="tile ai" data-nav='${esc(JSON.stringify({s:"esp",i}))}'>${esc(t)}</button>`}).join("")}</div>
  ${FAV.length?`<h2>Favoritos</h2>${FAV.map(navRow).join("")}`:""}
  ${REC.length?`<h2>Recientes</h2>${REC.slice(0,4).map(navRow).join("")}`:""}`}},
 prot(){return{t:"Protocolos",h:`<div class="grid">${MENU2.map(m=>`<button class="tile" data-nav='${esc(JSON.stringify({s:"lista",m}))}'>${esc(m==="Neurologico"?"Neurológico":m==="Protocolos Sociedad Española"?"Sociedad Española":m==="Recién nacido Sano"?"Recién nacido sano":m)}</button>`).join("")}</div>`}},
 lista(n){if(n.m==="Protocolos Sociedad Española"&&!n.b){const pdf=docs.filter(d=>d.menu===n.m&&!d.bloque);return{t:"Sociedad Española",h:`<div class="grid">${SENEO_BLOQ.map((t,i)=>{const k=docs.filter(d=>d.bloque===i+1).length;return`<button class="tile wide" data-nav='${esc(JSON.stringify({s:"lista",m:n.m,b:i+1}))}'>${esc(t)}<small>${k?k+" de "+SENEO_N[i]+" capítulos":"Pendiente"}</small></button>`}).join("")}</div><h2>Libro completo</h2>${pdf.map(docRow).join("")}`}}
  if(n.b){const l=docs.filter(d=>d.bloque===n.b);return{t:SENEO_BLOQ[n.b-1],h:l.map(docRow).join("")||"<p>Pendiente de transcribir.</p>"}}
  const l=docs.filter(d=>d.menu===n.m),f=FICHAS.filter(x=>x.menu===n.m);return{t:n.m==="Neurologico"?"Neurológico":n.m,h:`${f.length?"<h2>Fichas rápidas</h2>"+f.map(x=>row({s:"ficha",id:x.id},esc(x.titulo),esc(x.fuente),stTag("ficha:"+x.id))).join(""):""}<h2>Protocolos</h2>${l.map(docRow).join("")||"<p>No disponible en el material.</p>"}`}},
 esp(n){const e=ESPEC[n.i],f=FICHAS.filter(x=>x.menu===e[2]),st=study.filter(x=>x.startsWith(e[1]+"/"));
  const g={};st.forEach(x=>{const p=x.slice(e[1].length+1).split("/");const k=p.length>1?p[0]:"General";(g[k]=g[k]||[]).push(x)});
  return{t:e[0],h:`${e[0]==="Hemodinámica"?`<details><summary>Árbol del boceto (sin revisar)</summary><ul>${ARBOL.map(a=>`<li>${esc(a)}</li>`).join("")}</ul></details>`:""}
  ${f.length?"<h2>Fichas rápidas</h2>"+f.map(x=>row({s:"ficha",id:x.id},esc(x.titulo),esc(x.fuente),stTag("ficha:"+x.id))).join(""):""}
  <h2>Material de estudio · ${st.length} archivos</h2><div class="note n-info">Solo inventariado, sin revisar.</div>
  ${Object.keys(g).sort((a,b)=>a.localeCompare(b,"es",{numeric:true})).map(k=>`<details><summary>${esc(k)} (${g[k].length})</summary>${g[k].map(x=>`<p><a target="_blank" rel="noopener" href="${esc(pdfUrl(x))}">${esc(x.split("/").pop())}</a></p>`).join("")}</details>`).join("")}`}},
 doc(n){const d=docs.find(x=>x.f===n.f),pg=pages[d.f]||[],isImg=/\.png$/i.test(d.f),ds=DISC.filter(x=>x.doc&&docFiles(d).some(f=>norm(f).includes(norm(x.doc)))),pr=docFiles(d).map(f=>PROTO[f.normalize("NFC")]).filter(Boolean);
  return{t:d.t,h:`<p>${tag(d.menu.includes("Sociedad")||d.t.includes("seNeo")?"SENEO":"HOSPITAL")} <span class="tag t-grey">${esc(d.v)}</span> ${old(d.v)?'<span class="tag t-warn">Revisar vigencia</span>':""}</p>
  ${d.lote===0?'<div class="note n-danger">Versión no vigente según la propuesta. Pendiente de archivar.</div>':""}
  ${ds.map(x=>`<div class="note n-warn"><b>${esc(x.tema)}:</b> ${esc(x.prop)}</div>`).join("")}
  ${pr.length?`${d.sinpdf&&!d.pdf?"":`<div class="note n-warn">Transcrito del PDF para la app. Pendiente de tu validación.</div>`}${pr.map(x=>`<div class="proto">${x.h}</div>`).join('<hr class="pjunta">')}
  ${d.pdf?`<div class="src">Original: <a target="_blank" rel="noopener" href="${esc(pdfUrl(d.pdf,d.pag))}">${esc(d.pdf.split("/").pop())}, página ${d.pag}</a></div>`:d.sinpdf?"":`<div class="src">Original: ${docFiles(d).map(f=>`<a target="_blank" rel="noopener" href="${esc(pdfUrl(f))}">${esc(f.split("/").pop())}</a>`).join("<br>")}</div>`}`:`
  ${isImg?`<img class="fig" src="${esc(pdfUrl(d.f))}" alt="${esc(d.t)}">`:`<a class="btn primary" target="_blank" rel="noopener" href="${esc(pdfUrl(d.f))}">Abrir PDF original</a>`}
  <p class="kv"><b>Lectura en esta revisión:</b> ${{c:"completa",p:"parcial",t:"solo título y fecha"}[d.l]}</p>
  ${pg.length&&!isImg?`<div class="note n-warn">Texto extraído automáticamente: puede tener tablas desordenadas y haber perdido el símbolo µ. Compruébalo siempre en el PDF.</div>${pg.map(([p,t])=>`<details><summary>Página ${p}</summary><p class="pre">${esc(t)}</p><a class="btn" target="_blank" rel="noopener" href="${esc(pdfUrl(d.f,p))}">Abrir en la página ${p}</a></details>`).join("")}`:""}
  ${!pg.length&&!isImg?'<div class="note n-info">Sin texto extraído. Abre el PDF para consultarlo.</div>':""}
  <div class="src">${esc(d.f)}</div>`}`}},
 ficha(n){const f=FICHAS.find(x=>x.id===n.id),d=f.doc&&findDoc(f.doc),ds=DISC.filter(x=>(f.disc||[]).includes(x.id));
  return{t:f.titulo,h:`<div class="note n-danger"><b>Borrador sin validar.</b> En la app real estos números no se verían hasta validarlos.</div>${tag(f.tag)}${ds.map(x=>`<div class="note n-warn"><b>${esc(x.tema)}:</b> ${esc(x.prop)}</div>`).join("")}${f.html}
  <div class="src"><b>Fuente:</b> ${esc(f.fuente)}${d?`<br><a href="${esc(pdfUrl(d.f,f.pag))}" target="_blank" rel="noopener">Abrir original</a>`:""}</div>`}},
 somato(){return{t:"Somatometría",h:["c-ig","c-fenton"].map(id=>{const c=CALCS.find(x=>x.id===id);return row({s:"calc",id},esc(c.t),esc(id==="c-ig"?"Al nacer, de 24+0 a 42+6 semanas":"De 22 a 42 semanas, percentil aproximado"),stTag("calc:"+id)||testTag(c))}).join("")}},
 fgrupo(){return{t:"Fármacos",h:`<div class="grid">
  <button class="tile wide big-tile" data-nav='{"s":"farmacos"}'>Fármacos<small>${drugs.length} de la Guía 2025 y ajuste renal</small></button>
  <button class="tile wide big-tile" data-nav='{"s":"compat"}'>Compatibilidades<small>${COMPAT.n.length} fármacos en Y</small></button></div>`}},
 farm(){const n=CALCS.filter(c=>!["c-ig","c-fenton","c-bili"].includes(c.id)).length;return{t:"Calculadoras y escalas",h:`<div class="grid">
  <button class="tile wide big-tile" data-nav='{"s":"calcs"}'>Calculadoras<small>${n} en ${CALC_ARBOL.length} grupos</small></button>
  <button class="tile wide big-tile" data-nav='{"s":"escalas"}'>Escalas<small>${ESCALAS.length} disponibles</small></button>
  <button class="tile wide big-tile" data-nav='{"s":"somato"}'>Somatometría<small>INTERGROWTH-21st y Fenton 2013</small></button>
  <button class="tile wide big-tile" data-nav='{"s":"calc","id":"c-bili"}'>Bilirrubina<small>≥35 semanas, AAP 2022</small></button>
</div>`}},
 compat(){const o=COMPAT.n.map((n,i)=>`<option value="${i}">${esc(n)}</option>`).join("");return{t:"Compatibilidades",h:`<div class="note n-danger"><b>Leída de una foto, sin validar.</b> Sin fecha ni leyenda. Compara siempre con el recorte de la foto y consulta a Farmacia.</div>
  <label class="field"><span>Fármaco A</span><select id="ca"><option value="">Elegir…</option>${o}</select></label>
  <label class="field"><span>Fármaco B (vacío para ver todos los de A)</span><select id="cb"><option value="">Todos</option>${o}</select></label>
  <div id="cres" aria-live="polite"></div>
  <p><button class="btn" id="ctabla">Ver la tabla completa</button></p>
  <div class="src"><b>Fuente:</b> foto <code>farmacos/IMG_6231.HEIC</code>. Asterisco en la columna de fosfato: referido a fosfatos sódicos.</div>`}},
 calcs(){return{t:"Calculadoras",h:`<div class="grid">${CALC_ARBOL.map((g,i)=>`<button class="tile wide" data-nav='${esc(JSON.stringify(g.id?{s:"calc",id:g.id}:{s:"cgrupo",p:[i]}))}'>${i+1}. ${esc(g.t)}</button>`).join("")}</div>`}},
 cgrupo(n){let g={hijos:CALC_ARBOL};for(const k of n.p)g=g.hijos[k];const sub=g.hijos.every(h=>typeof h==="object");
  return{t:g.t,h:sub?`<div class="grid">${g.hijos.map((h,k)=>`<button class="tile wide" data-nav='${esc(JSON.stringify({s:"cgrupo",p:[...n.p,k]}))}'>${esc(h.t)}</button>`).join("")}</div>`:g.hijos.map(id=>{const c=CALCS.find(x=>x.id===id);return row({s:"calc",id},esc(c.t),esc(c.fuente),c.bloq?'<span class="tag t-danger">Bloqueada</span>':(stTag("calc:"+id)||testTag(c)))}).join("")}},
 escalas(){return{t:"Escalas",h:ESCALAS.map(e=>row({s:"escala",id:e.id},esc(e.t)+" "+tag(e.tag),esc(e.fuente),stTag("escala:"+e.id))).join("")}},
 escala(n){const e=ESCALAS.find(x=>x.id===n.id),c=e.calc,fotos=[...(e.src||[]),...(e.imgs||[]).map(i=>"img/"+i)];return{t:e.t,h:`${tag(e.tag)}${e.nota?`<div class="note n-info">${esc(e.nota)}</div>`:""}
  ${c?`<form id="sf"${c.cols===3?' class="c3"':""}>${c.items.map((it,i)=>`${it.g&&it.g!==(c.items[i-1]||{}).g&&it.g.length>2?`<h2>${esc(it.g)}</h2>`:""}<label class="field"><span>${esc(it.t)}</span><select data-i="${i}"><option value="">${esc(c.sinElegir||"Elegir…")}</option>${it.o.map((o,k)=>`<option value="${k}">${esc(o[0])} (${String(o[1]).replace("-","−")})</option>`).join("")}</select></label>`).join("")}</form><div class="result" id="sres" aria-live="polite"></div><p><button class="btn" id="slimpia" type="button">Limpiar</button></p>`:""}
  ${fotos.map(i=>`<img class="fig" src="${esc(i)}" alt="${esc(e.t)}">`).join("")}<div class="src"><b>Fuente:</b> ${esc(e.fuente)}<br><a target="_blank" rel="noopener" href="${esc(pdfUrl(e.f,e.pag))}">Abrir original</a></div>`}},
 farmacos(){return{t:"Fármacos",h:`<input class="search" id="qd" type="search" placeholder="Buscar fármaco" aria-label="Buscar fármaco"><div id="dl" style="margin-top:10px">${catList()}</div>`}},
 abx(){return{t:"Antibióticos según protocolo",h:`<div class="grid">${ABX.map((x,i)=>`<button class="tile wide" data-nav='${esc(JSON.stringify({s:"abxdoc",i}))}'>${esc(x)}</button>`).join("")}</div>`}},
 abxdoc(n){const p=PROTO["1. Protocolos/Fármacos/Antibióticos según protocolo/"+ABX[n.i]];return{t:ABX[n.i],h:`<div class="note n-warn">Transcrito del PDF «Antibióticos» para la app. Pendiente de tu validación.</div><div class="proto">${p.h}</div>`}},
 fcat(n){const c=FARM_CATS[n.i],l=drugs.filter(d=>d.p>=c[1]&&d.p<=c[2]);return{t:c[0],h:l.map(d=>row({s:"drug",n:d.n},esc(d.n),"p. "+d.p,stTag("drug:"+d.n))).join("")}},
 renal(){return{t:"Ajuste renal",h:`<div class="note n-warn">${esc(renalAviso)}</div><input class="search" id="qr" type="search" placeholder="Buscar fármaco" aria-label="Buscar fármaco de ajuste renal"><div class="list" style="margin-top:10px">${row({s:"rnotas"},"Notas generales","Antes de ajustar la dosis")}</div><div id="rl" class="list">${renalList("")}</div>`}},
 rnotas(){return{t:"Notas generales",h:`<div class="mono"><p class="mono-cat">AJUSTE SEGÚN FUNCIÓN RENAL</p><h3 class="mono-n">Notas generales</h3><section>${renalNotas.map(l=>`<p>${esc(l)}</p>`).join("")}</section></div><div class="src"><b>Fuente:</b> ${esc(renalFuente)}, p. 2-3<br><a target="_blank" rel="noopener" href="${esc(pdfUrl("farmacos/"+renalPdf,2))}">Abrir original</a></div>`}},
 rdrug(n){const d=renal.find(x=>x.n===n.n),sec=(h,c)=>`<section><h4>${h}</h4>${c}</section>`,fila=(a,b)=>`<tr><th>${esc(a)}</th><td>${esc(b)}</td></tr>`;return{t:d.n,h:`<div class="mono"><p class="mono-cat">AJUSTE SEGÚN FUNCIÓN RENAL</p><h3 class="mono-n">${esc(d.n)}</h3><div class="note n-warn">${esc(renalAviso)}</div>
  ${d.av.map(l=>`<div class="note n-danger">${esc(l)}</div>`).join("")}
  ${sec("Eliminación habitual",`<p>${esc(d.cl)}</p>`)}${sec("Dosis normal",d.dose.map(l=>`<p>${esc(l)}</p>`).join(""))}
  ${sec("Ajuste de dosis",`<table class="ftab rtab"><tbody>${d.ir.map(([a,b])=>fila(a,b)).join("")}${fila("HD",d.hd)}${fila("DP",d.pd)}${fila("Intraperitoneal",d.ip)}${fila("CVVH",d.cv)}</tbody></table>`)}
  ${d.no.length?sec("Notas",d.no.map(l=>`<p>${esc(l)}</p>`).join("")):""}</div>
  ${d.g?`<div class="list">${row({s:"drug",n:d.g},"Ver ficha de la Guía 2025",esc(d.g))}</div>`:""}
  <div class="src"><b>Fuente:</b> ${esc(renalFuente)}, p. ${d.p}<br><a target="_blank" rel="noopener" href="${esc(pdfUrl("farmacos/"+renalPdf,d.p))}">Abrir original</a></div>`}},
 drug(n){const d=drugs.find(x=>x.n===n.n),u=pdfUrl("farmacos/"+guia,d.p),lab=t=>{const m=/^([^:]{2,34}:)(.*)$/.exec(t);return m&&!/^https?/.test(t)?`<b>${esc(m[1])}</b>${esc(m[2])}`:esc(t)};
  return{t:d.n,h:`<div class="mono"><p class="mono-cat">${esc(d.c)}</p><h3 class="mono-n">${esc(d.n)}</h3>${d.pres?`<p class="mono-p">${esc(d.pres)}</p>`:""}
  ${d.s.map(x=>{const dosis=/^DOSIS/.test(x.h);return`<section>${x.h?`<h4>${esc(x.h)}</h4>`:""}${x.l.map(([t,c])=>t[0]==="@"?tabHtml(t.slice(1).replace(".png","")):`<p class="${c==="g"?"mono-ok":c==="r"?"mono-no":""}">${dosis?lab(t):esc(t)}</p>`).join("")}</section>`}).join("")}</div>
  <div class="src"><b>Fuente:</b> Guía Farmacoterapéutica Neonatal 2025, p. ${d.p}<br><a target="_blank" rel="noopener" href="${esc(u)}">Abrir original</a></div>`}},
 calc(n){const c=CALCS.find(x=>x.id===n.id),d=c.doc&&findDoc(c.doc),val=est("calc:"+c.id)==="ok",url=c.orig||(d&&pdfUrl(d.f,c.pag));
  if(c.bloq)return{t:c.t,h:`<div class="note n-danger"><b>Calculadora bloqueada.</b> ${esc(c.bloq)}.</div>${d?`<a class="btn" target="_blank" rel="noopener" href="${esc(pdfUrl(d.f))}">Abrir original</a>`:""}`};
  return{t:c.t,h:`<div class="note n-warn">Solo para comprobar. La prescripción se hace en FARHOS.</div>
  <p class="kv"><b>Fórmula:</b> ${esc(c.formula)}</p><form id="cf">${c.fields.map(f=>f.sel?`<label class="field"><span>${esc(f.l)}</span><select name="${f.k}">${f.sel.map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`:`<label class="field"><span data-lab="${f.k}">${esc(f.l)} (${esc(f.u)})</span><input name="${f.k}" type="${f.type||"text"}" inputmode="${f.type?"none":f.im||"decimal"}" autocomplete="off" ${f.ro?'readonly placeholder="Se calcula con el EB"':""} value="${f.k==="peso"?(peso??""):(f.d??"")}"></label>`).join("")}</form>
  <div class="result" id="res" aria-live="polite">Introduce los datos.</div>${c.html==="BILI"?`<div id="bchart" class="bchart"></div><p class="kv"><b>Factores de riesgo de neurotoxicidad (protocolo 9a):</b> enfermedad hemolítica autoinmune; déficit de G6PDH u otras patologías hemolíticas; sepsis; albúmina &lt;3 g/dl; inestabilidad clínica significativa en las 24 h previas. La edad gestacional ya está incluida en las curvas.</p><p class="kv">Las tablas de la AAP se han cotejado con las gráficas del protocolo 9a: diferencia máxima de 0,3 mg/dl.</p>`:""}${c.html==="NUTRI"?`<h2>Composición por 100 ml</h2><div class="tscroll"><table class="nut">${NUTRI.map((r,i)=>`<tr>${r.map((x,j)=>i===0||j===0?`<th>${esc(x)}</th>`:`<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</table></div><p class="kv">*1 mcg vitamina D= 40 UI / 0,025 mcg vitamina D= 1 UI${val?"":". Copia de la foto, con el fósforo corregido a mg"}.</p>`:""}${P50[c.id]?p50Html(P50[c.id],val):""}${P7[c.id]?`${val?"":"<h2>Protocolo 7, literal</h2>"}<table class="lit"><tr><th class="lit-t">${esc(P7[c.id].t)}</th></tr>${P7[c.id].l.map(x=>`<tr><td>${esc(x)}</td></tr>`).join("")}</table>${val?"":`<p class="kv">Versión 1, junio 2024. Copia literal.</p>`}`:""}
  ${val?"":`<p class="kv">${c.test?`<b>Caso de prueba:</b> ${testOk(c)?"✓ correcto":"✗ falla"} (${esc(JSON.stringify(c.test.in))} → ${esc(c.test.out)})`:`<b>Caso de prueba:</b> ${esc(c.sinCaso)}`}</p>`}
  <div class="src"><b>Fuente:</b> ${esc(c.fuente)}${url?`<br><a target="_blank" rel="noopener" href="${esc(url)}">Abrir original</a>`:""}</div>`}},
 buscar(n){return{t:"Buscar",h:`<input class="search" id="q" type="search" value="${esc(n.q)}" placeholder="Buscar…" aria-label="Buscar"><div id="sr">${searchHtml(n.q)}</div>`}}
};
const guia="GUIA_FARMACOTERAPÉUTICA_SEGURNEO_2025V7.pdf";
const renalPdf="NEO. Ajuste de fármacos según hemofiltro.pdf",renalFuente="Great Ormond Street, Paediatric Drug Dosage Adjustments in Renal Impairment or on RRT (2011, revisión 2014)";
const renalAviso="Documento pediátrico con revisión caducada (septiembre 2014). Las dosis pueden diferir de la Guía 2025. Confirmar con farmacia.";
const tile=(e)=>`<button class="tile${e[0]==="Prematuro"?" new":""}" data-nav='${esc(JSON.stringify({s:"esp",i:ESPEC.indexOf(e)}))}'>${esc(e[0])}</button>`;
const CK={G:["Compatible","n-ok"],R:["Incompatible","n-danger"],Y:["Amarillo: condicionada, sin leyenda","n-warn"],W:["Sin dato en la tabla. No significa compatible","n-info"]};
const cell=(i,j)=>{const[x,y]=COMPAT.c[i][j];return`<span class="crop" role="img" aria-label="Casilla de la foto: ${esc(COMPAT.n[i])} y ${esc(COMPAT.n[j])}" style="background-position:${-(x-55)}px ${-(y-55)}px"></span>`};
const guiaAviso=(a,b)=>COMPAT_GUIA.some(p=>p.includes(a)&&p.includes(b));
function compatRes(){const a=$("#ca").value,b=$("#cb").value,o=$("#cres");if(a===""){o.innerHTML="";return}const i=+a,N=COMPAT.n;
 if(b!==""){const j=+b;if(i===j){o.innerHTML='<div class="note n-info">Elige dos fármacos distintos.</div>';return}const v=COMPAT.m[i][j],k=CK[v];
  o.innerHTML=`<div class="note ${k[1]}"><b>${esc(k[0])}</b></div>${guiaAviso(N[i],N[j])?'<div class="note n-danger"><b>Discrepancia:</b> la Guía 2025 cita esta pareja en incompatibilidades.</div>':""}${N[i]==="Heparina sódica"&&N[j]==="Vancomicina"||N[j]==="Heparina sódica"&&N[i]==="Vancomicina"?'<div class="note n-info">La Guía 2025 la cita como incompatible con heparina &gt;1 U/ml.</div>':""}<p class="kv"><b>Comprueba en la foto</b> (las dos casillas deben coincidir):</p><p>${cell(i,j)} ${cell(j,i)}</p>`;return}
 const g={R:[],Y:[],G:[],W:[]};N.forEach((n,j)=>{if(j!==i)g[COMPAT.m[i][j]].push(n)});
 o.innerHTML=[["R","Incompatibles"],["Y","Amarillo"],["G","Compatibles"],["W","Sin dato"]].map(([k,t])=>`<details ${k==="R"?"open":""}><summary>${t} (${g[k].length})</summary><p>${g[k].map(n=>esc(n)+(guiaAviso(N[i],n)?" ⚠":"")).join(" · ")||"Ninguno"}</p></details>`).join("")+(N.some(n=>guiaAviso(N[i],n))?'<p class="kv">⚠ La Guía 2025 la cita en incompatibilidades.</p>':"")}
const p50Html=(x,val)=>`${val?"":"<h2>Protocolo 50, literal</h2>"}<table class="lit"><tr><th colspan="2" class="lit-t">${esc(x.t)}</th></tr><tr><td colspan="2">${esc(x.d)}</td></tr>
 <tr><th colspan="2">DOSIFICACIÓN</th></tr><tr><td colspan="2">${x.dos.map(esc).join("<br>")}</td></tr><tr><th colspan="2">PREPARACIÓN</th></tr>
 ${[["PRESENTACIÓN",x.pre],["CONCENTRACIÓN",x.con],["DILUCIÓN Y ADMINISTRACIÓN",x.dil],["TIEMPO",x.tie],["VÍA",x.via]].map(([k,v])=>`<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}
 ${[["ESTABILIDAD",x.est],["MONITORIZACIÓN",x.mon],["PRECAUCIONES",x.prec]].map(([k,v])=>`<tr><th colspan="2">${k}</th></tr><tr><td colspan="2">${esc(v)}</td></tr>`).join("")}</table>${x.nota?`<div class="note n-warn">${esc(x.nota)}</div>`:""}${val?"":`<p class="kv">Fecha de revisión: Junio de 2018. Copia literal, con sus posibles erratas${x.nota?", salvo la corrección indicada":""}.</p>`}`;
const tabHtml=k=>(TABLAS[k]||[]).map(x=>x.H?`<h4>${esc(x.H)}</h4>`:x.B?`<p><b>${esc(x.B)}</b></p>`:x.P?`<p>${esc(x.P)}</p>`:`<table class="ftab">${x.T.map((r,i)=>`<tr>${r.map(c=>{const o=typeof c==="string"?{t:c}:c,g=(o.r?` rowspan="${o.r}"`:"")+(o.c?` colspan="${o.c}"`:""),e=i===0||o.b?"th":"td";return`<${e}${g}>${esc(o.t).replace(/\//g,"/<wbr>")}</${e}>`}).join("")}</tr>`).join("")}</table>`).join("");
const SENEO_BLOQ=["1. El recién nacido sano","2. El período perinatal","3. Patologías en el período neonatal","4. El alta hospitalaria","5. El seguimiento ambulatorio","6. Técnicas neonatales"],SENEO_N=[7,14,61,3,9,14];
const ABX=["Profilaxis antibiótica en cirugía","Pautas antibióticos"];
const catList=()=>`<div class="grid"><button class="tile wide" data-nav='${esc(JSON.stringify({s:"abx"}))}'>Antibióticos según protocolo<small>Profilaxis en cirugía y pautas</small></button><button class="tile wide" data-nav='${esc(JSON.stringify({s:"renal"}))}'>Ajuste según función renal<small>${renal.length}</small></button>${FARM_CATS.map((c,i)=>`<button class="tile" data-nav='${esc(JSON.stringify({s:"fcat",i}))}'>${esc(c[0])}<small>${drugs.filter(d=>d.p>=c[1]&&d.p<=c[2]).length}</small></button>`).join("")}</div>`;
const drugList=q=>drugs.filter(d=>norm(d.n).includes(norm(q))).map(d=>row({s:"drug",n:d.n},esc(d.n),"p. "+d.p,stTag("drug:"+d.n))).join("")||"<p>No disponible en el material.</p>";
const renalList=q=>renal.filter(d=>norm(d.n+" "+d.en).includes(norm(q))).map(d=>row({s:"rdrug",n:d.n},esc(d.n),"p. "+d.p,stTag("renal:"+d.n))).join("")||"<p>No disponible en el material.</p>";
const navTitle=n=>n.s==="rdrug"?n.n:n.s==="ficha"?FICHAS.find(x=>x.id===n.id)?.titulo:n.s==="doc"?docs.find(x=>x.f===n.f)?.t:n.s==="calc"?CALCS.find(x=>x.id===n.id)?.t:n.s==="drug"?n.n:n.s==="escala"?ESCALAS.find(x=>x.id===n.id)?.t:n.s==="compat"?"Compatibilidades":"";
const navRow=n=>row(n,esc(navTitle(n)));
const testOk=c=>{if(!c.test)return false;try{return c.run(c.test.in).some(r=>r.v===c.test.out)}catch{return false}};
const testTag=c=>c.test?(testOk(c)?'<span class="tag t-hosp">Prueba ✓</span>':'<span class="tag t-danger">Prueba ✗</span>'):'<span class="tag t-warn">Sin caso</span>';

/* Búsqueda */
let VOC=null;
function vocab(){if(VOC)return VOC;VOC=new Set;const add=t=>norm(t).split(/[^a-z0-9]+/).forEach(w=>w.length>3&&VOC.add(w));
 FICHAS.forEach(f=>{add(f.titulo);add(f.sin)});docs.forEach(d=>add(d.t));drugs.forEach(d=>add(d.n));Object.values(pages).flat().forEach(p=>add(p[1]));return VOC}
function lev(a,b){const m=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){let p=m[0];m[0]=i;for(let j=1;j<=b.length;j++){const t=m[j];m[j]=Math.min(m[j]+1,m[j-1]+1,p+(a[i-1]!==b[j-1]));p=t}}return m[b.length]}
function fix(w){const v=vocab();if(w.length<5||v.has(w))return w;let best=w,bd=3;for(const x of v){if(Math.abs(x.length-w.length)>2||x[0]!==w[0])continue;const d=lev(w,x);if(d<bd){bd=d;best=x}}return best}
function terms(q){const ws=norm(q).split(/\s+/).filter(Boolean).map(fix);return ws.map(w=>[w,...(SINONIMOS[w]||"").split(" ").filter(Boolean)])}
const hit=(txt,ts)=>{const n=norm(txt);return ts.every(g=>g.some(w=>n.includes(w)))};
function snip(t,ts){const n=norm(t),w=ts.flat().find(x=>n.includes(x));const i=Math.max(0,n.indexOf(w)-45);let s=esc(t.slice(i,i+130));return(i?"…":"")+s.replace(new RegExp("("+w+")","i"),"<mark>$1</mark>")+"…"}
function searchHtml(q){if(norm(q).trim().length<2)return"<p>Escribe al menos dos letras.</p>";const ts=terms(q);let h="";
 const fi=FICHAS.filter(f=>hit(f.titulo+" "+f.sin,ts));
 if(fi.length)h+="<h2>Fichas</h2>"+fi.map(f=>row({s:"ficha",id:f.id},esc(f.titulo)+" "+tag(f.tag),esc(f.fuente))).join("");
 if(hit("compatibilidades compatibilidad incompatibilidad en y",ts))h+="<h2>Tablas</h2>"+row({s:"compat"},"Compatibilidades","Foto sin validar");
 const se=ESCALAS.filter(e=>hit(e.t,ts));if(se.length)h+="<h2>Escalas</h2>"+se.map(e=>row({s:"escala",id:e.id},esc(e.t),esc(e.fuente))).join("");
 const ca=CALCS.filter(c=>hit(c.t,ts));if(ca.length)h+="<h2>Calculadoras</h2>"+ca.map(c=>row({s:"calc",id:c.id},esc(c.t),esc(c.fuente))).join("");
 const dr=drugs.filter(d=>hit(d.n,ts));if(dr.length)h+="<h2>Fármacos</h2>"+dr.slice(0,12).map(d=>row({s:"drug",n:d.n},esc(d.n)+" "+tag("GUÍA 2025"),"p. "+d.p)).join("");
 const rn=renal.filter(d=>hit(d.n+" "+d.en,ts));if(rn.length)h+="<h2>Ajuste renal</h2>"+rn.map(d=>row({s:"rdrug",n:d.n},esc(d.n),"GOSH, p. "+d.p)).join("");
 const dc=docs.filter(d=>hit(d.t,ts));if(dc.length)h+="<h2>Protocolos</h2>"+dc.map(docRow).join("");
 const pg=[];for(const d of docs)for(const[p,t]of pages[d.f]||[])if(hit(t,ts))pg.push({d,p,t});
 if(pg.length)h+=`<h2>Dentro de los protocolos · ${pg.length}</h2>`+pg.slice(0,25).map(x=>row({s:"doc",f:x.d.f},esc(x.d.t)+` · p. ${x.p}`,snip(x.t,ts))).join("");
 const gp=(pages["farmacos/"+guia]||Object.entries(pages).find(([k])=>k.startsWith("farmacos/"))?.[1]||[]).filter(([p,t])=>hit(t,ts));
 if(gp.length)h+=`<h2>Dentro de la Guía 2025 · ${gp.length}</h2>`+gp.slice(0,10).map(([p,t])=>`<p><a target="_blank" rel="noopener" href="${esc(pdfUrl("farmacos/"+guia,p))}">Página ${p}</a><br><small>${snip(t,ts)}</small></p>`).join("");
 const es=study.filter(f=>hit(f.split("/").pop(),ts));if(es.length)h+=`<h2>Material de estudio · ${es.length}</h2>`+es.slice(0,10).map(f=>`<p><a target="_blank" rel="noopener" href="${esc(pdfUrl(f))}">${esc(f.split("/").pop())}</a> ${tag("ESTUDIO")}</p>`).join("");
 return h||"<div class='note n-info'>No disponible en el material.</div><p class='kv'>SENeo 2023 todavía no entra en la búsqueda porque falta su OCR.</p>"}

/* Render */
function cur(){return stack[stack.length-1]}
function render(){const n=cur(),r=S[n.s](n);$("#title").textContent=r.t;$("#screen").innerHTML=r.h;$("#screen").scrollTop=0;
 $("#back").style.visibility=stack.length>1?"visible":"hidden";
 const fv=["ficha","doc","calc","drug","escala"].includes(n.s);$("#fav").style.visibility=fv?"visible":"hidden";$("#fav").textContent=isFav(n)?"★":"☆";
 if(n.s==="calc")calcRun();if(n.s==="escala"&&$("#sf"))escRun();renderPanel()}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isFav=n=>FAV.some(x=>same(x,n));
function go(n){stack.push(n);if(["ficha","doc","calc","drug","escala"].includes(n.s)){REC=[n,...REC.filter(x=>!same(x,n))].slice(0,8);store.set(KEY+"-rec",REC)}render()}
const rowsHtml=out=>out.map(r=>r.w?`<div class="note n-danger">${esc(r.w)}</div>`:r.n?`<div><small>${esc(r.n)}</small></div>`:`<div><small>${esc(r.l)}</small><span class="big">${esc(r.v)}</span></div>`).join("");
function escPts(c){return[...document.querySelectorAll("#sf select")].map(s=>{const it=c.items[+s.dataset.i];return s.value===""?(c.sinElegir?0:null):it.o[+s.value][1]})}
function escRun(){const c=ESCALAS.find(x=>x.id===cur().id).calc;$("#sres").innerHTML=rowsHtml(c.res(escPts(c),c.items))}
function calcRun(){const n=cur(),c=CALCS.find(x=>x.id===n.id),f=$("#cf");if(!f)return;const v={};let ok=true;
 c.fields.forEach(x=>{const e=f.elements[x.k];if(x.sel||x.type)v[x.k]=e.value;else{const s=e.value.replace(",",".").replace("−","-");v[x.k]=parseFloat(s);if(Number.isNaN(v[x.k])&&!x.opt)ok=false}});
 if(c.auto)c.auto(v,f);
 if(c.label){const l=f.querySelector('[data-lab="dosis"]');if(l)l.textContent=c.label(v)}
 if("peso" in v&&!Number.isNaN(v.peso))peso=v.peso;
 if(!ok||v.ritmo===0||v.vol===0){$("#res").textContent="Introduce los datos.";return}
 let out=c.run(v);if("peso" in v&&(v.peso<.3||v.peso>6))out=[{w:"Peso fuera de 300-6.000 g: revísalo"},...out];
 $("#res").innerHTML=rowsHtml(out);if(c.after)c.after(v)}

/* Panel de revisión */
function idOf(n){return{ficha:"ficha:"+n.id,doc:"doc:"+n.f,calc:"calc:"+n.id,drug:"drug:"+n.n,rdrug:"renal:"+n.n,escala:"escala:"+n.id,compat:"tabla:compat"}[n.s]}
function reviewBox(id,labels=ST){const e=est(id);return`<div class="states" data-id="${esc(id)}">${Object.entries(labels).map(([k,l])=>`<button class="s-${k}${k===e?" on":""}" data-st="${k}" aria-pressed="${k===e}">${esc(l)}</button>`).join("")}</div><label class="field"><span>Nota o decisión</span><textarea data-note="${esc(id)}">${esc(nota(id))}</textarea></label>`}
function discCard(d){const id="disc:"+d.id,doc=d.doc&&findDoc(d.doc);return`<div class="card"><h4>${esc(d.tema)} <span class="tag ${d.riesgo==="alto"?"t-danger":d.riesgo==="medio"?"t-warn":"t-grey"}">${esc(d.riesgo)}</span></h4><p>${esc(d.a)}</p>${d.b?`<p>${esc(d.b)}</p>`:""}<p class="kv"><b>Propuesta:</b> ${esc(d.prop)}</p>${doc?`<p><a target="_blank" rel="noopener" href="${esc(pdfUrl(doc.f))}">Abrir ${esc(doc.t)}</a></p>`:""}${reviewBox(id,STD)}</div>`}
function renderPanel(){document.querySelectorAll(".tabs button").forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle("on",on);b.setAttribute("aria-selected",on)});
 const P=$("#panelBody"),keep=P.scrollTop;
 if(tab==="item"){const n=cur(),id=idOf(n);
  if(!id){P.innerHTML=`<h3>Revisión</h3><p>Navega por la app de la izquierda. Al abrir una ficha, calculadora, protocolo o fármaco podrás marcarlo aquí.</p>${summary()}`;return}
  const rel=DISC.filter(d=>{const c=n.s==="calc"?CALCS.find(x=>x.id===n.id):n.s==="ficha"?FICHAS.find(x=>x.id===n.id):null;const fs=n.s==="doc"?docFiles(docs.find(x=>x.f===n.f)):[c?.doc&&findDoc(c.doc)?.f].filter(Boolean);return d.doc&&fs.some(f=>norm(f).includes(norm(d.doc)))});
  P.innerHTML=`<h3>${esc(navTitle(n))}</h3>${reviewBox(id)}${rel.length?`<h2>Discrepancias relacionadas</h2>${rel.map(discCard).join("")}`:""}`;P.scrollTop=keep}
 else if(tab==="todo"){const all=items(),tipos=["Todo","Discrepancias","Fichas","Calculadoras","Escalas","Protocolos","Fármacos","Ajuste renal"];
  const l=all.filter(i=>(filtro==="Todo"||i.tipo===filtro)&&(!soloPend||est(i.id)==="pendiente"));
  const order=i=>i.d?({alto:0,medio:1,bajo:2}[i.d.riesgo]):3;
  const sh=[...l].sort((a,b)=>order(a)-order(b)).slice(0,60);
  P.innerHTML=`${summary()}<div class="filters">${tipos.map(t=>`<button data-f="${t}" class="${t===filtro?"on":""}">${t}</button>`).join("")}</div>
  <label class="kv"><input type="checkbox" id="sp" ${soloPend?"checked":""}> Solo pendientes (${l.length})</label>
  ${sh.map(i=>i.d?discCard(i.d):`<button class="row" data-nav='${esc(JSON.stringify(i.nav))}'><span class="main">${esc(i.t)}<small>${esc(i.tipo)} · ${esc(i.sub)}</small></span>${stTag(i.id)}<span class="chev">›</span></button>`).join("")||"<p>Nada pendiente aquí.</p>"}
  ${l.length>60?`<p class="kv">Se muestran 60 de ${l.length}. Filtra por tipo o revisa y seguirán apareciendo.</p>`:""}`;P.scrollTop=keep}
 else{P.innerHTML=`${summary()}<h3>Guardar y compartir</h3><p>Tus marcas se guardan en este navegador. Exporta de vez en cuando para no perderlas.</p>
  <p><button class="btn primary" id="exp">Descargar copia (JSON)</button> <button class="btn" id="cp">Copiar resumen</button> <label class="btn">Importar copia<input id="im" type="file" accept=".json" hidden></label></p>
  <label class="field"><span>Resumen para pegar en el chat con Claude</span><textarea id="md" rows="12" readonly>${esc(md())}</textarea></label>`}}
function summary(){const all=items(),t={};for(const i of all){t[i.tipo]=t[i.tipo]||[0,0];t[i.tipo][1]++;if(est(i.id)!=="pendiente")t[i.tipo][0]++}
 const done=Object.values(t).reduce((a,b)=>a+b[0],0);return`<p class="kv"><b>Revisado:</b> ${done} de ${all.length}</p><div class="progress"><i style="width:${done/all.length*100}%"></i></div><p class="kv">${Object.entries(t).map(([k,v])=>`${k} ${v[0]}/${v[1]}`).join(" · ")}</p>`}
function md(){const l=items().filter(i=>est(i.id)!=="pendiente"||nota(i.id));if(!l.length)return"Sin revisiones todavía.";return"# Revisión del visor\n\n"+l.map(i=>`- **${i.tipo}: ${i.t}** · ${(i.id.startsWith("disc:")?STD:ST)[est(i.id)]}${nota(i.id)?` · ${nota(i.id)}`:""}`).join("\n")}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;t.setAttribute("role","status");document.body.append(t);setTimeout(()=>t.remove(),1800)}

/* Eventos */
document.addEventListener("click",e=>{const nv=e.target.closest("[data-nav]");
 if(nv){go(JSON.parse(nv.dataset.nav));$("#panel").classList.remove("open");return}
 const st=e.target.closest("[data-st]");if(st){const id=st.parentElement.dataset.id;R[id]={...R[id],e:st.dataset.st,ts:new Date().toISOString()};saveR();const y=$("#screen").scrollTop;render();$("#screen").scrollTop=y;return}
 const tb=e.target.closest("[data-tab]");if(tb){tab=tb.dataset.tab;renderPanel();return}
 const f=e.target.closest("[data-f]");if(f){filtro=f.dataset.f;renderPanel();return}
 if(e.target.closest(".fig")){const i=e.target,z=document.createElement("div");z.className="zoom";z.innerHTML=`<button>Cerrar</button><img src="${esc(i.getAttribute("src"))}" alt="${esc(i.alt)}">`;z.querySelector("button").onclick=()=>z.remove();document.body.append(z);return}
 if(e.target.id==="ctabla"){const z=document.createElement("div");z.className="zoom";z.innerHTML=`<button>Cerrar</button><img src="img/compat.jpg" alt="Tabla de compatibilidad">`;z.querySelector("button").onclick=()=>z.remove();document.body.append(z);return}
 if(e.target.id==="slimpia"){$("#sf").reset();escRun();return}
 if(e.target.id==="exp"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(R,null,1)],{type:"application/json"}));a.download="revision_visor_ucin.json";a.click();return}
 if(e.target.id==="cp"){navigator.clipboard?.writeText(md()).then(()=>toast("Resumen copiado"),()=>{$("#md").select();toast("Selecciona y copia el texto")});return}});
document.addEventListener("input",e=>{const t=e.target;
 if(t.id==="q"){const pos=t.selectionStart;if(cur().s==="buscar"){cur().q=t.value;$("#sr").innerHTML=searchHtml(t.value)}else{stack.push({s:"buscar",q:t.value});render();const q=$("#q");q.focus();q.setSelectionRange(pos,pos)}return}
 if(t.id==="qr"){$("#screen").querySelector("#rl").innerHTML=renalList(t.value);return}
 if(t.id==="qd"){const b=$("#screen").querySelector("#dl");b.innerHTML=t.value.trim()?drugList(t.value):catList();return}
 if(t.closest("#cf")){calcRun();return}
 if(t.dataset.note){const id=t.dataset.note;R[id]={...R[id],e:est(id),n:t.value,ts:new Date().toISOString()};saveR()}});
document.addEventListener("change",e=>{if(e.target.closest("#sf"))escRun();if(e.target.id==="ca"||e.target.id==="cb")compatRes();if(e.target.id==="sp"){soloPend=e.target.checked;renderPanel()}
 if(e.target.id==="im"){const f=e.target.files[0];if(!f)return;f.text().then(t=>{const o=JSON.parse(t);if(typeof o!=="object"||!o)throw 0;R={...R,...o};saveR();render();toast("Copia importada")}).catch(()=>toast("Archivo no válido"))}
 if(e.target.closest("#cf"))calcRun()});
$("#back").onclick=()=>{if(stack.length>1){stack.pop();render()}};
$("#fav").onclick=()=>{const n=cur();FAV=isFav(n)?FAV.filter(x=>!same(x,n)):[...FAV,n];store.set(KEY+"-fav",FAV);render()};
const setTheme=t=>{document.documentElement.dataset.theme=t;store.set(KEY+"-tema",t)};
$("#night").onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
$("#panelOpen").onclick=()=>$("#panel").classList.add("open");
$("#panelClose").onclick=()=>$("#panel").classList.remove("open");
setTheme(store.get(KEY+"-tema",matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));
render();
