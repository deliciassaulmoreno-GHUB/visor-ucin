// Ítems y puntos transcritos de las imágenes originales de cada escala.
(()=>{
const O=(...a)=>a;
const D=(...p)=>p.map(n=>["Dibujo con puntuación "+String(n).replace("-","−"),n]);
const faltan=(p)=>p.filter(x=>x===null).length;
const suma=(p)=>p.reduce((a,b)=>a+(b||0),0);
const tot=(l,v,p)=>{const f=faltan(p);return f?[{l,v},{w:`Falta${f>1?"n":""} ${f} ítem${f>1?"s":""}: la puntuación está incompleta`}]:[{l,v}]};
const CAL={
"e-alix":{items:[
 {t:"Alerta",o:O(["Se despierta sin dificultad y se mantiene alerta durante más de 30 seg",0],["Despierta con ligera dificultad ante el estímulo no-nociceptivo. Alerta ligeramente reducida (7-30 seg)",1],["Clara dificultad para despertar ante el estímulo nociceptivo. Mantiene la alerta pocos segundos (≤ 6 seg)",2],["Despierta con enorme dificultad ante el estímulo nociceptivo y vuelve rápidamente al sueño. Nunca alcanza el llanto",6],["No se despierta al aplicar estímulos nociceptivos",8])},
 {t:"Postura (tono muscular)",o:O(["Flexión y aducción adecuadas de las extremidades",0],["Pobre flexión y aducción de extremidades superiores",1],["Pobre flexión y aducción de extremidades superiores e inferiores",2],["Hipotonía grave o postura tónica (no persistente)",6],["Postura flácida o tónica mantenida (descerebración o decorticación)",8])},
 {t:"Actividad motora espontánea",o:O(["Movimientos con fluidez, variabilidad y complejidad",0],["Movimientos fluidos y variables, pero existen temblores y sacudidas excesivas",1],["Disminuidos; monótonos con variabilidad y complejidad pobres",2],["Actividad muy disminuida",6],["No hay actividad o existe temblor continuo en reposo",8])},
 {t:"Respuesta motora al aplicar estímulos",o:O(["Movimientos alternantes y vigorosos de extremidades",0],["Respuesta motora normal, pero movimientos escasos",1],["Movimientos de retirada que incluyen más allá de la extremidad estimulada",2],["Movimientos de retirada que incluyen solo la extremidad estimulada",6],["Actividad ausente o esterotipada; puede recordar a posturas de decorticación o descerebración",8])},
 {t:"Reflejos miotáticos",o:O(["Normal",0],["Hiperactivos",1],["Hipoactivos",2],["Ausentes",6],["Respuesta inmediata sin latencia ni acostumbramiento",8])},
 {t:"Patrón respiratorio",o:O(["Espontánea (A) or Kussmaul (B)",0],["Respiración periódica",2],["Hiperpnea central (A), apneústica (B), Biot (C), atáxica (D) o apnea",8])},
 {t:"Convulsiones clínicas",o:O(["Ausentes",0],["Única (≤ 1/h)",6],["Repetidas (> 1/h) o status",8])},
 {t:"Crisis en el EEG integrado por amplitud",o:O(["Ausentes",0],["Única (≤ 1/h)",6],["Repetidas (>1/h) or status",8])},
 {t:"Patrón de fondo en el EEG integrado por amplitud",o:O(["VCN. CVS",0],["VCN. No CVS",1],["Voltaje discontinuo",2],["Brote supresión",6],["Bajo voltaje o trazado plano",8])}],
 res:p=>{const s=suma(p),r=tot("Puntuación",s+" / 72",p);if(!faltan(p))r.push({l:"Interpretación",v:s<=3?"Sin encefalopatía":s<=7?"Encefalopatía leve":s<=30?"Encefalopatía moderada":"Encefalopatía severa"});r.push({n:"≤3 sin encefalopatía · 4-7 leve · 8-30 moderada · >30 severa"});return r}},
"e-pipp":{items:[
 {g:"f",t:"Cambio de frecuencia cardiaca (lpm)",o:O(["0 - 4",0],["5 - 14",1],["15 - 24",2],[">24",3])},
 {g:"f",t:"Descenso de saturación (%)",o:O(["0 - 2",0],["3 - 5",1],["6 - 8",2],[">8 o aumento de O2",3])},
 {g:"f",t:"Entrecejo fruncido (seg)",o:O(["Ninguno (<3)",0],["Mínimo (3-10)",1],["Moderado (11-20)",2],["Máximo (>20)",3])},
 {g:"f",t:"Ojos apretados (seg)",o:O(["Ninguno (<3)",0],["Mínimo (3-10)",1],["Moderado (11-20)",2],["Máximo (>20)",3])},
 {g:"f",t:"Surco nasolabial (seg)",o:O(["Ninguno (<3)",0],["Mínimo (3-10)",1],["Moderado (11-20)",2],["Máximo (>20)",3])},
 {t:"Edad gestacional",o:O([">36 semanas",0],["32 semanas - 35 semanas 6 días",1],["28 semanas - 31 semanas 6 días",2],["<28 semanas",3])},
 {t:"Estado basal de comportamiento",o:O(["Activo y despierto",0],["Tranquilo y despierto",1],["Activo y dormido",2],["Tranquilo y dormido",3])}],
 res:p=>{const s=suma(p.slice(0,5)),f=faltan(p.slice(0,5));const r=[{l:"Subtotal fisiológico y facial",v:String(s)}];if(f)return[...r,{w:`Falta${f>1?"n":""} ${f} ítem${f>1?"s":""} del subtotal`}];if(s===0)return[...r,{l:"Puntuación total",v:"0"},{n:"Subtotal 0: no se suman edad gestacional ni estado basal"}];if(faltan(p.slice(5)))return[...r,{w:"Faltan edad gestacional o estado basal"}];const t=s+p[5]+p[6];r.push({l:"Puntuación total",v:String(t)});if(t>12)r.push({w:"Más de 12: indica la necesidad de usar analgesia (Control del dolor en el recién nacido)"});return r}},
"e-comfort":{items:[
 {t:"Nivel de conciencia",o:O(["Profundamente dormido",1],["Ligeramente dormido",2],["Somnoliento",3],["Despierto",4],["Hiperalerta",5])},
 {t:"Respuesta respiratoria",o:O(["No respiración espontánea ni tos",1],["Mínimo esfuerzo respiratorio",2],["Tos ocasional o resistencia contra el respirador",3],["Lucha contra el respirador y tos frecuente",4],["Lucha contra el respirador y tos constante",5])},
 {t:"Presión arterial",o:O(["Por debajo de la media",1],["En la media",2],["Infrecuentes elevaciones >15% sobre la media",3],["Frecuentes elevaciones >15% sobre la media",4],["Constantes elevaciones >15% sobre la media",5])},
 {t:"Tono muscular",o:O(["Musculatura totalmente relajada",1],["Reducción del tono muscular",2],["Tono muscular normal",3],["Aumento del tono muscular (flexión dedos/pies)",4],["Rigidez muscular",5])},
 {t:"Calma-agitación",o:O(["Calma",1],["Ligera ansiedad",2],["Ansiedad",3],["Mucha ansiedad",4],["Pánico",5])},
 {t:"Movimientos físicos",o:O(["No movimiento",1],["Movimientos ocasionales",2],["Movimientos frecuentes",3],["Movimientos vigorosos de extremidad",4],["Movimientos vigorosos de cabeza y tronco",5])},
 {t:"Frecuencia cardiaca",o:O(["Por debajo de la media",1],["En la media",2],["Infrecuentes elevaciones >15% sobre la media",3],["Frecuentes elevaciones >15% sobre la media",4],["Constantes elevaciones >15% sobre la media",5])},
 {t:"Presión facial",o:O(["Músculos faciales totalmente relajados",1],["Tono muscular facial normal",2],["Tensión en algunos músculos faciales",3],["Tensión en todos los músculos faciales",4],["Tensión extrema en la musculatura facial",5])}],
 res:p=>{const s=suma(p),r=tot("Puntuación",s+" / 40",p);if(!faltan(p))r.push({l:"Interpretación",v:s===10?"Sedación muy profunda o profunda":s<10?"Sedación muy profunda":s<=17?"Sedación profunda":s<=26?"Sedación superficial":"No sedación"});if(!faltan(p)&&s===10)r.push({n:"La tabla incluye 10 en dos tramos: 8-10 y 10-17"});return r}},
"e-comfortb":{items:[
 {t:"Nivel de conciencia",o:O(["Profundamente dormido",1],["Ligeramente dormido",2],["Somnoliento",3],["Despierto y alerta",4],["Despierto e hiperalerta",5])},
 {t:"Tono muscular",o:O(["Musculatura totalmente relajada",1],["Reducción del tono muscular",2],["Tono muscular normal",3],["Tono muscular aumentado (flexión dedos/pies)",4],["Rigidez muscular extrema",5])},
 {t:"Respuesta respiratoria (una de las dos)",o:O(["Con VM: no respiración espontánea ni tos",1],["Con VM: respiración espontánea, acoplado al respirador",2],["Con VM: tos ocasional o resistencia contra el respirador",3],["Con VM: respira activamente contra el respirador o tos frecuente",4],["Con VM: lucha contra el respirador; tos constante, atragantamiento",5],["Sin VM: respiración tranquila, sin ruidos respiratorios",1],["Sin VM: reducción del tono muscular",2],["Sin VM: tono muscular normal",3],["Sin VM: aumento del tono muscular (flexión dedos/pies)",4],["Sin VM: rigidez muscular",5])},
 {t:"Calma-agitación",o:O(["Calma",1],["Ligera ansiedad",2],["Ansiedad",3],["Mucha ansiedad",4],["Pánico",5])},
 {t:"Movimientos físicos",o:O(["Ningún movimiento",1],["Movimientos ocasionales (≤3)",2],["Movimientos frecuentes (>3)",3],["Movimientos vigorosos de extremidades",4],["Movimientos vigorosos incluyendo cabeza y tronco",5])},
 {t:"Tensión facial",o:O(["Músculos faciales totalmente relajados",1],["Tono muscular facial normal",2],["Tensión en algunos músculos faciales (no mantenida)",3],["Tensión en todos los músculos faciales (mantenida)",4],["Tensión extrema en la musculatura facial, haciendo muecas",5])}],
 res:p=>{const s=suma(p),r=tot("Puntuación",s+" / 30",p);if(!faltan(p))r.push({l:"Interpretación",v:s<=8?"Sedación muy profunda/sobresedación":s<=10?"Sedación profunda":s<=22?"Sedación superficial/indeterminada":"Agitación/infrasedación"});return r}},
"e-silverman":{items:[
 {t:"Aleteo nasal",o:O(["Ausente",0],["Mínima",1],["Marcada",2])},
 {t:"Quejido espiratorio",o:O(["Ausente",0],["Audible con el estetoscopio",1],["Audible",2])},
 {t:"Tiraje intercostal",o:O(["Ausente",0],["Apenas visible",1],["Marcada",2])},
 {t:"Retracción esternal",o:O(["Sin retracción",0],["Apenas visibles",1],["Marcada",2])},
 {t:"Disociación toracoabdominal",o:O(["Sincronizado",0],["Retraso en inspiración",1],["Bamboleo",2])}],
 res:p=>{const s=suma(p),r=tot("Puntuación",s+" / 10",p);if(!faltan(p))r.push({l:"Interpretación",v:s===0?"Sin asfixia ni dificultad respiratoria":s<=3?"Dificultad respiratoria leve":s<=6?"Dificultad respiratoria moderada":"Dificultad respiratoria grave"});if(!faltan(p)&&s>=7)r.push({n:"El tramo 7-10 sale de «Valoraciones neonatales»; la foto no lo incluye"});return r}},
"e-finnegan":{cols:3,sinElegir:"No",items:[
 ["1. Llanto",["Agudo",2],["Continuo",3]],["2. Duración del sueño tras la toma",["<1 hora",3],["<2 horas",2],["<3 horas",1]],["3. Reflejo de Moro",["Aumentado",2],["Muy aumentado",3]],["4. Temblores",["Leves con estímulo",1],["Moderados con estímulo",2],["Leves espontáneos",3],["Moderados espontáneos",4]],["5. Hipertonía",["Sí",2]],["6. Excoriaciones cutáneas",["Sí",1]],["7. Mioclonías",["Sí",3]],["8. Convulsiones",["Sí",5]],["9. Sudoración",["Sí",1]],["10. Fiebre",["<38,4",1],[">38,4",2]],["11. Bostezos",["Sí",1]],["12. Cutis marmorata",["Sí",1]],["13. Congestión nasal",["Sí",1]],["14. Estornudos",["Sí",1]],["15. Aleteo nasal",["Sí",2]],["16. Frecuencia respiratoria",[">60",1],[">60 y tiraje",2]],["17. Succión excesiva",["Sí",1]],["18. Inapetencia",["Sí",2]],["19. Regurgitaciones",["Sí",2]],["20. Vómitos",["Sí",3]],["21. Diarrea",["Pastosa",2],["Acuosa",3]]
 ].map(([t,...o])=>({t,o})),
 res:p=>{const s=suma(p);return[{l:"Puntuación",v:String(s)},{l:"Interpretación",v:s<=7?"No SA":s<=12?"SA leve-moderado":s<=16?"SA moderado-grave":"Casos graves"},{n:"Para neonatos hijos de madres adictas a opioides. No es válida para mayores de 2-3 meses de edad"}]}},
"e-ballard":{items:[
 {g:"n",t:"Postura",o:D(0,1,2,3,4)},
 {g:"n",t:"Ventana cuadrada (muñeca)",o:O([">90°",-1],["90°",0],["60°",1],["45°",2],["30°",3],["0°",4])},
 {g:"n",t:"Rebote de brazos",o:O(["180°",0],["140-180°",1],["110-140°",2],["90-110°",3],["<90°",4])},
 {g:"n",t:"Ángulo poplíteo",o:O(["180°",-1],["160°",0],["140°",1],["120°",2],["100°",3],["90°",4],["<90°",5])},
 {g:"n",t:"Signo de la bufanda",o:D(-1,0,1,2,3,4)},
 {g:"n",t:"Talón - oreja",o:D(-1,0,1,2,3,4)},
 {t:"Piel",o:O(["Pegajosa, quebradiza, transparente",-1],["Gelatinosa, roja, traslúcida",0],["Rosa pálido, venas visibles",1],["Descamación superficial y/o eritema",2],["Áreas pálidas y agrietadas, venas raras",3],["Gruesa, agrietado profundo",4],["Dura, agrietada y arrugada",5])},
 {t:"Lanugo",o:O(["Ausente",-1],["Escaso",0],["Abundante",1],["Fino",2],["Áreas libres",3],["Casi no hay lanugo",4])},
 {t:"Superficie plantar",o:O(["Longitud < 40 mm",-2],["Longitud 40-50 mm",-1],["Longitud > 50 mm sin pliegues",0],["Marcas rojas mortecinas",1],["Pliegues transversos anteriores",2],["Pliegues en los 2/3 anteriores",3],["Pliegues cubre toda la planta",4])},
 {t:"Mamas",o:O(["No perceptibles",-1],["Apenas perceptibles",0],["Areola plana, sin glándula",1],["Glándula de 1-2 mm",2],["Glándula de 3-4 mm",3],["Glándula de 5-10 mm",4])},
 {t:"Ojos - oreja",o:O(["Fusión palpebral fuerte",-2],["Fusión palpebral leve",-1],["Párpados abiertos, pabellón permanece arrugado",0],["Pabellón ligeramente curvado, blando. Despliegue lento",1],["Pabellón bien curvado, blando. Despliegue rápido",2],["Pabellón bien formado y firme. Despliegue instantáneo",3],["Cartílago grueso, pabellón enhiesto",4])},
 {t:"Genitales (masculinos o femeninos)",o:O(["M: escroto aplanado, liso",-1],["M: escroto vacío, con vagas rugosidades",0],["M: testes en parte alta del canal, pliegues muy escasos",1],["M: testes en descenso, rugosidades escasas",2],["M: testes en descenso, rugosidades abundantes",3],["M: testes colgantes, rugosidades profundas",4],["F: clítoris prominente, labios aplanados",-1],["F: clítoris prominente, labios menores pequeños",0],["F: clítoris prominente, labios menores mayor tamaño",1],["F: labios mayores y pequeños igualmente prominentes",2],["F: labios mayores grandes, labios menores pequeños",3],["F: labios mayores cubren clítoris y labios menores",4])}],
 res:p=>{const s=suma(p),n=suma(p.slice(0,6)),r=[{n:`Madurez neuromuscular ${String(n).replace("-","−")} · madurez física ${String(s-n).replace("-","−")}`},...tot("Puntuación total",String(s).replace("-","−"),p)];if(!faltan(p)){const w=24+s*.4;if(s<-10||s>50)r.push({w:"Fuera de la tabla (−10 a 50 puntos)"});else{const ex=s%5===0;r.push({l:"Edad gestacional",v:(ex?"":"≈ ")+fmt(w,1)+" semanas"});if(!ex)r.push({n:"Valor interpolado: la tabla va de 5 en 5 puntos"})}}return r}}
};
const H=(g,t,...o)=>({g,t,o});
const C=(n,p)=>["Columna "+n+" (ver dibujo)",p];
CAL["e-hammer"]={items:[
 H("Función neurológica","Fisonomía",["Sonrisa o respuesta a los estímulos, cerrando los ojos o haciendo muecas",3],["Cierra los ojos, pero no bien. Rostro poco expresivo",1],["Rostro sin expresión. Ninguna respuesta a los estímulos",0]),
 H("Función neurológica","Ojos",["Movimiento conjugado normal de los ojos",3],["Desviación ocular intermitente o movimientos intermitentes anormales",1],["Desviación ocular constante o movimientos constantemente anormales",0]),
 H("Función neurológica","Respuesta auditiva",["Respuesta bilateral a los estímulos",3],["Respuesta dudosa o asimétrica a los estímulos",1],["Ninguna respuesta a los estímulos",0]),
 H("Función neurológica","Respuesta visual",["Seguimiento del objeto en un arco completo",3],["Seguimiento del objeto en un arco parcial o asimétrico",1],["Ningún seguimiento del objeto",0]),
 H("Función neurológica","Succión/deglución",["Succión y deglución buenas",3],["Succión y/o deglución deficientes",1],["Ningún reflejo de succión ni deglución",0]),
 H("Postura","Cabeza (posición sentada)",["Derecha, en el eje",3],["Inclinación lateral, trasera o delantera ligera",1],["Inclinación lateral, trasera o delantera marcada",0]),
 H("Postura","Tronco (posición sentada)",["Derecho",3],["Curvatura ligera o curvatura lateral",1],["Curvatura muy pronunciada, inclinación trasera o delantera marcada",0]),
 H("Postura","Brazos (al descanso)",["En posición neutral, derechos en el eje o ligeramente doblado",3],["Ligera rotación interna o externa",1],["Rotación interna o externa pronunciada o postura distónica, hemipléjica",0]),
 H("Postura","Manos",["Manos abiertas",3],["Pulgar retraído en la palma o puño cerrado intermitentemente",1],["Pulgar retraído en la palma o puño cerrado continuamente",0]),
 H("Postura","Piernas",["Sentado con espalda recta y piernas extendidas o poco flexionadas; piernas en posición central",3],["Ligera rotación externa",2],["Sentado, espalda recta, rodillas flexionadas a 15-20°; rotación interna o externa pronunciada de caderas",1],["No puede quedarse sentado a menos de flexionar mucho las rodillas; extensión o flexión fija o contracturas",0]),
 H("Postura","Pies",["Centrados en posición neutral, dedos derechos, entre flexión y extensión",3],["Rotación interna o externa ligera",2],["Tendencia intermitente a caminar de puntillas o a extender/flexionar los dedos",1],["Rotación interna o externa marcada del tobillo, tendencia continua",0]),
 H("Movimientos","Cantidad",["Normal",3],["Excesivo o lento",1],["Mínimo o ninguno",0]),
 H("Movimientos","Calidad",["Libre, alternativo, suave",3],["Brusco, ligero temblor",1],["Reducido y sincrónico, espasmos, atetoide, ataxia, tremulaciones, mioclónico o distónico",0]),
 H("Tono muscular","Prueba de la bufanda",C(1,3),C(3,1),C(4,0)),
 H("Tono muscular","Elevación pasiva del hombro",["Resistencia pero superable",3],["Ninguna resistencia",1],["Resistencia insuperable",0]),
 H("Tono muscular","Pronación y supinación",["Completas, ninguna resistencia",3],["Completas, resistencia a superar",1],["Imposibles, resistencia pronunciada",0]),
 H("Tono muscular","Ángulo de los aductores",["150-60°",3],["150-160°",2],[">170°",1],["<80°",0]),
 H("Tono muscular","Ángulo poplíteo",["170°-110°",3],["150-160°",2],["~90° o > 170°",1],["<80°",0]),
 H("Tono muscular","Dorsiflexión del pie",["30°-85°",3],["20-30°",2],["<20 o 90°",1],[">90°",0]),
 H("Tono muscular","Llevarlo a la posición sentada",C(1,3),C(3,1),C(4,0)),
 H("Tono muscular","Suspensión ventral",C(1,3),C(3,1),C(4,0)),
 H("Reflejos y reacciones","Reflejos tendinosos",["Fácilmente suscitado",3],["Medianamente vivos",2],["Vivos",1],["Clonus o ausentes",0]),
 H("Reflejos y reacciones","Reflejo de protección lateral",["Brazos y manos extendidos",3],["Brazo medio flexionado",1],["Brazo completamente extendido",0]),
 H("Reflejos y reacciones","Suspensión vertical",["Gesticula simétricamente",3],["Gesticula una pierna más que la otra o gesticula poco",1],["No gesticula, ni siquiera con estimulación, o cruza las piernas",0]),
 H("Reflejos y reacciones","Inclinación lateral",C(1,3),C(2,2),C(3,1),C(4,0)),
 H("Reflejos y reacciones","Reflejo del paracaídas (después de 6 meses)",C(1,3),C(3,1),["Sin esa reacción",0])],
 res:(p,it)=>{const g={};it.forEach((x,i)=>{g[x.g]=(g[x.g]||0)+(p[i]||0)});return[...tot("Total",suma(p)+" / 78",p),{n:Object.entries(g).map(([k,v])=>k+" "+v).join(" · ")},{n:"La hoja no incluye puntos de corte"}]}};
Object.entries(CAL).forEach(([id,c])=>{const e=ESCALAS.find(x=>x.id===id);if(e)e.calc=c});
})();
