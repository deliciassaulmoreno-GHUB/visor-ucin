/* Somatometría (INTERGROWTH-21st y Fenton 2013) y bilirrubina (AAP 2022) */
(function(){
const SO=window.SOMATO,BI=window.BILI;
/* Distribuciones */
const LG=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
function lgamma(x){if(x<0.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);x-=1;let a=LG[0];const t=x+7.5;for(let i=1;i<9;i++)a+=LG[i]/(x+i);return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a)}
function betacf(a,b,x){const E=1e-15,T=1e-300;let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;if(Math.abs(d)<T)d=T;d=1/d;let h=d;
 for(let m=1;m<=300;m++){const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<T)d=T;c=1+aa/c;if(Math.abs(c)<T)c=T;d=1/d;h*=d*c;
  aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<T)d=T;c=1+aa/c;if(Math.abs(c)<T)c=T;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<E)break}
 return h}
function ibeta(x,a,b){if(x<=0)return 0;if(x>=1)return 1;const bt=Math.exp(lgamma(a+b)-lgamma(a)-lgamma(b)+a*Math.log(x)+b*Math.log(1-x));return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b}
function pt(t,df){const p=0.5*ibeta(df/(df+t*t),df/2,0.5);return t>0?1-p:p}
function pnorm(z){return z<0?0.5*ibetaN(z):1-0.5*ibetaN(-z)}
function ibetaN(z){/* erfc(-z/√2) para z<=0, vía gamma incompleta */const x=z*z/2;return x===0?1:gammq(0.5,x)}
function gammq(a,x){if(x<a+1){let s=1/a,t=s;for(let n=1;n<500;n++){t*=x/(a+n);s+=t;if(Math.abs(t)<Math.abs(s)*1e-16)break}return 1-s*Math.exp(-x+a*Math.log(x)-lgamma(a))}
 let b=x+1-a,c=1e300,d=1/b,h=d;for(let i=1;i<500;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<1e-300)d=1e-300;c=b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<1e-16)break}
 return Math.exp(-x+a*Math.log(x)-lgamma(a))*h}
function qnorm(p){let lo=-10,hi=10;for(let i=0;i<200;i++){const m=(lo+hi)/2;if(pnorm(m)<p)lo=m;else hi=m}return(lo+hi)/2}
function pST3(y,mu,s,nu,tau){const z=(y-mu)/s;return z<0?2/(1+nu*nu)*pt(nu*z,tau):1/(1+nu*nu)*(1+2*nu*nu*(pt(z/nu,tau)-0.5))}
function qST3(p,mu,s,nu,tau){let lo=mu-30*s,hi=mu+30*s;for(let i=0;i<200;i++){const m=(lo+hi)/2;if(pST3(m,mu,s,nu,tau)<p)lo=m;else hi=m}return(lo+hi)/2}
/* INTERGROWTH-21st, tamaño al nacer. Peso en kg, talla y PC en cm. d = edad gestacional en días */
const VP={w:[-7.00303,1.325911,0.0571937,0.0373218],l:[1.307633,1.270022,0.4263885,6.757543],h:[0.7866522,0.887638,0.2513385,2.433481]};
function vpMS(m,sx,d){const g=d/7,c=VP[m],mu=m==="w"?c[0]+c[1]*Math.sqrt(g)+c[2]*(sx==="M"?1:0):c[0]+c[1]*g+c[2]*(sx==="M"?1:0);return{mu,s:Math.sqrt(c[3])}}
function igP(m,sx,d,y){if(d<168||d>300)return null;if(d>=231){const k=SO.ig[sx][m][d-231];const p=pST3(y,...k);return{p,z:qnorm(p)}}
 const{mu,s}=vpMS(m,sx,d),z=((m==="w"?Math.log(y):y)-mu)/s;return{p:pnorm(z),z}}
function igV(m,sx,d,p){if(d>=231){const k=SO.ig[sx][m][d-231];return qST3(p,...k)}const{mu,s}=vpMS(m,sx,d),v=mu+qnorm(p)*s;return m==="w"?Math.exp(v):v}
/* Fenton 2013: P3, P10, P50, P90 y P97 leídos de la gráfica oficial. Peso en g */
const ZC=[0.03,0.1,0.5,0.9,0.97].map(qnorm);
function fen(m,sx,d){const a=SO.fen[sx][m];return a[d-SO.fen0]||null}
function fenZ(c,y){if(y<c[0])return{lt:true};if(y>c[4])return{gt:true};for(let i=0;i<4;i++)if(y<=c[i+1]){const z=ZC[i]+(ZC[i+1]-ZC[i])*(y-c[i])/(c[i+1]-c[i]);return{z,p:pnorm(z)}}}
/* AAP 2022 */
function bili(tab,ga,h){const t=BI[tab],keys=Object.keys(t).map(Number),k=String(Math.min(Math.max(ga,Math.min(...keys)),Math.max(...keys))),a=t[k];h=Math.max(1,h);
 if(h>=a.length)return a[a.length-1];const i=Math.floor(h),f=h-i;return a[i-1]+(a[Math.min(i,a.length-1)]-a[i-1])*f}
window.CREC={pnorm,qnorm,pST3,qST3,igP,igV,fen,fenZ,bili};
if(!window.CALCS)return;
/* Calculadoras */
const SEXO=["Niña","Niño"],DIAS=["0","1","2","3","4","5","6"];
const sxOf=v=>v.sexo==="Niño"?"M":"F",gaOf=v=>Math.round(v.sg)*7+(+v.sd||0),gaTxt=d=>`${Math.floor(d/7)}+${d%7}`;
const pTxt=p=>p<0.001?"<P0,1":p>0.999?">P99,9":"P"+fmt(p*100,p<0.1||p>0.9?1:0);
const cls=p=>p<0.03?"menor de P3":p<0.1?"entre P3 y P10 (PEG)":p>0.97?"mayor de P97":p>0.9?"entre P90 y P97 (GEG)":"entre P10 y P90 (AEG)";
const MED=[["w","Peso","peso",1],["l","Longitud","talla",0],["h","Perímetro cefálico","pc",0]];
const SF=[{k:"sexo",l:"Sexo",sel:SEXO},{k:"sg",l:"Edad gestacional",u:"semanas",im:"numeric"},{k:"sd",l:"Días",sel:DIAS},{k:"peso",l:"Peso",u:"kg",opt:true},{k:"talla",l:"Longitud",u:"cm",opt:true},{k:"pc",l:"Perímetro cefálico",u:"cm",opt:true}];
window.CALCS.push(
 {id:"c-ig",t:"Percentiles INTERGROWTH-21st al nacer",fuente:"INTERGROWTH-21st Newborn Size Standards (Villar 2014 y 2016). Parámetros oficiales tomados del paquete gigs (LSHTM, rOpenSci)",orig:"https://intergrowth21.com/tools-resources/newborn-size",
  formula:"24+0 a 32+6 semanas: ecuaciones de muy prematuros (normal; peso en logaritmo). 33+0 a 42+6: parámetros mu, sigma, nu y tau por día (t asimétrica). Percentil = función de distribución en el valor medido",
  fields:SF,
  run:v=>{const sx=sxOf(v),d=gaOf(v);if(!(d>=168&&d<=300))return[{w:"INTERGROWTH-21st al nacer cubre de 24+0 a 42+6 semanas"}];
   const r=[{n:`${v.sexo}, ${gaTxt(d)} semanas`}];let alguno=false;
   for(const[m,l,k,kg]of MED){const y=v[k];if(Number.isNaN(y)||y==null)continue;alguno=true;const val=kg?y:y,res=CREC.igP(m,sx,d,val);
    r.push({l,v:`${pTxt(res.p)} · z ${fmt(res.z,2)}`});r.push({n:m==="w"?`Peso ${cls(res.p)}`:`${l} ${cls(res.p).replace(/ \((PEG|AEG|GEG)\)/,"")}`});
    const ref=[0.03,0.1,0.5,0.9,0.97].map(p=>CREC.igV(m,sx,d,p));r.push({n:`P3 ${ref.map((x,i)=>(i?["","P10 ","P50 ","P90 ","P97 "][i]:"")+(kg?fmt(x*1000,0)+" g":fmt(x,1)+" cm")).join(" · ")}`})}
   return alguno?r:[{w:"Introduce peso, longitud o perímetro cefálico"}]},
  test:{in:{sexo:"Niño",sg:40,sd:"0",peso:3.4,talla:NaN,pc:NaN},out:"P52 · z 0,04"}},
 {id:"c-fenton",t:"Percentiles Fenton 2013",fuente:"Gráficas oficiales Fenton 2013 (niñas y niños), ucalgary.ca/fenton, leídas por ordenador. El protocolo 6a recomienda Fenton hasta las 44 semanas",orig:"https://live-ucalgary.ucalgary.ca/resource/preterm-growth-chart/2013-preterm-growth-chart",
  formula:"Curvas P3, P10, P50, P90 y P97 leídas de la gráfica oficial, día a día. El percentil se interpola entre las dos curvas vecinas: es aproximado. Rango: peso desde 22+3 (niñas) o 22+4 (niños), longitud y PC desde 23+3/23+4, hasta 42+0",
  fields:SF,
  run:v=>{const sx=sxOf(v),d=gaOf(v);const r=[{n:`${v.sexo}, ${gaTxt(d)} semanas. Percentil aproximado, leído de la gráfica`}];let alguno=false;
   for(const[m,l,k,kg]of MED){const y=v[k];if(Number.isNaN(y)||y==null)continue;alguno=true;const c=CREC.fen(m,sx,d);
    if(!c){r.push({w:`${l}: fuera del rango leído de la gráfica (hasta 42+0)`});continue}
    const val=kg?y*1000:y,res=CREC.fenZ(c,val);
    r.push({l,v:res.lt?"< P3":res.gt?"> P97":`≈ ${pTxt(res.p)}`});
    if(!res.lt&&!res.gt)r.push({n:m==="w"?`Peso ${cls(res.p)}`:`${l} ${cls(res.p).replace(/ \((PEG|AEG|GEG)\)/,"")}`});
    r.push({n:`P3 ${c.map((x,i)=>(i?["","P10 ","P50 ","P90 ","P97 "][i]:"")+(kg?fmt(x,0)+" g":fmt(x,1)+" cm")).join(" · ")}`})}
   return alguno?r:[{w:"Introduce peso, longitud o perímetro cefálico"}]},
  test:{in:{sexo:"Niña",sg:30,sd:"0",peso:1.3,talla:NaN,pc:NaN},out:"≈ P49"}},
 {id:"c-bili",t:"Bilirrubina ≥35 semanas (AAP 2022)",doc:"9.a Protocolo",fuente:"AAP 2022 (Kemper, Pediatrics 2022;150:e2022058859), tablas suplementarias 1-4, como en BiliTool. Protocolo 9a, junio 2024",html:"BILI",
  formula:"Umbral por edad gestacional (semanas cumplidas) y horas de vida, con o sin factores de riesgo de neurotoxicidad. Escalada de cuidados = umbral de exanguinotransfusión − 2 mg/dl",
  fields:[{k:"ga",l:"Edad gestacional (semanas cumplidas)",sel:["35","36","37","38","39","40 o más"]},{k:"fr",l:"Factores de riesgo de neurotoxicidad",sel:["No","Sí"]},{k:"nac",l:"Nacimiento",u:"fecha y hora",type:"datetime-local",opt:true},{k:"mue",l:"Muestra",u:"fecha y hora",type:"datetime-local",opt:true},{k:"h",l:"Horas de vida",u:"h",opt:true},{k:"tipo",l:"Medición",sel:["Sérica (BiliS)","Transcutánea (BiliTc)"]},{k:"bt",l:"Bilirrubina",u:"mg/dl"}],
  auto:(v,f)=>{if(v.nac&&v.mue){const h=(new Date(v.mue)-new Date(v.nac))/36e5;if(h>=0){v.h=Math.round(h*10)/10;f.elements.h.value=fmt(v.h,1)}}},
  run:v=>{const ga=parseInt(v.ga),fr=v.fr==="Sí",h=v.h;if(Number.isNaN(h)||h==null)return[{w:"Introduce las horas de vida, o nacimiento y muestra"}];if(h<0)return[{w:"La muestra es anterior al nacimiento"}];
   const ft=CREC.bili(fr?"ft1":"ft0",ga,h),et=CREC.bili(fr?"et1":"et0",ga,h),esc_=et-2,bt=v.bt,tc=v.tipo.startsWith("Trans"),r=[];
   if(h<1)r.push({w:"Menos de 1 hora de vida: se usa el umbral de la hora 1"});if(h>336)r.push({n:"Más de 14 días: se mantiene el último umbral de la tabla"});
   r.push({l:"Umbral de fototerapia",v:fmt(ft,1)+" mg/dl"},{l:"Escalada de cuidados",v:fmt(esc_,1)+" mg/dl"},{l:"Umbral de exanguinotransfusión",v:fmt(et,1)+" mg/dl"});
   const dif=bt-ft;r.push({n:`${fmt(h,1)} h de vida. Bilirrubina ${fmt(bt,1)} mg/dl: ${dif>=0?fmt(dif,1)+" por encima":fmt(-dif,1)+" por debajo"} del umbral de fototerapia`});
   if(tc){if(bt>=15||ft-bt<3)r.push({w:"BiliTc ≥15 o a menos de 3 mg/dl del umbral de fototerapia: confirmar con BiliS (protocolo 9a). No iniciar tratamiento con BiliTc"});else r.push({n:"BiliTc solo sirve de cribado. Nunca iniciar tratamiento con BiliTc"});return r}
   if(bt>=et)r.push({w:"Supera el umbral de exanguinotransfusión"});else if(bt>=esc_)r.push({w:"Escalada de cuidados: a 2 mg/dl o menos del umbral de exanguinotransfusión"});else if(bt>=ft)r.push({w:"Supera el umbral de fototerapia"});else if(ft-bt<2)r.push({n:"A menos de 2 mg/dl del umbral de fototerapia"});
   return r},
  after:v=>{const el=document.getElementById("bchart");if(el)el.innerHTML=biliSvg(parseInt(v.ga),v.fr==="Sí",v.h,v.bt)},
  test:{in:{ga:"39",fr:"No",h:48,tipo:"Sérica (BiliS)",bt:15},out:"16,4 mg/dl"}}
);
function biliSvg(ga,fr,h,bt){const W=340,H=230,L=34,R=8,T=10,B=28,xm=168,ymax=fr?26:30,ymin=4,X=x=>L+(W-L-R)*x/xm,Y=y=>T+(H-T-B)*(1-(y-ymin)/(ymax-ymin));
 const path=(t,off=0)=>{let d="";for(let x=1;x<=xm;x+=1)d+=(x===1?"M":"L")+X(x).toFixed(1)+" "+Y(CREC.bili(t,ga,x)+off).toFixed(1);return d};
 let g="";for(let y=ymin;y<=ymax;y+=2)g+=`<line x1="${L}" x2="${W-R}" y1="${Y(y)}" y2="${Y(y)}" class="bg-l"/><text x="${L-4}" y="${Y(y)+3}" class="bg-t" text-anchor="end">${y}</text>`;
 for(let x=0;x<=xm;x+=24)g+=`<line y1="${T}" y2="${H-B}" x1="${X(x)}" x2="${X(x)}" class="bg-l"/><text x="${X(x)}" y="${H-B+13}" class="bg-t" text-anchor="middle">${x}</text>`;
 const pt_=Number.isFinite(h)&&Number.isFinite(bt)&&h<=xm&&bt>=ymin&&bt<=ymax?`<circle cx="${X(Math.max(h,1))}" cy="${Y(bt)}" r="4.5" class="bg-p"/>`:"";
 return`<svg viewBox="0 0 ${W} ${H}" class="bgraf" role="img" aria-label="Gráfica de umbrales de bilirrubina">${g}<path d="${path(fr?"ft1":"ft0")}" class="bg-ft"/><path d="${path(fr?"et1":"et0",-2)}" class="bg-esc"/><path d="${path(fr?"et1":"et0")}" class="bg-et"/>${pt_}<text x="${(L+W-R)/2}" y="${H-2}" class="bg-t" text-anchor="middle">Horas de vida</text></svg>
 <p class="bg-ley"><span class="k-ft"></span>Fototerapia <span class="k-esc"></span>Escalada <span class="k-et"></span>Exanguinotransfusión</p>`}
window.biliSvg=biliSvg;
})();
