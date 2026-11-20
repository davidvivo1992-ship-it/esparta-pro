// Metabolisme Esparta · el pla d'UN Esparta: el cicle i el calendari real
//
// Un pla es un CICLE de N setmanes que torna a comencar. Per tant
// `assignment_days.setmana` no vol dir «la setmana del 17 de novembre», vol dir
// «la setmana 2 del cicle», i la casella d'aquell dilluns es la MATEIXA fila
// cada cop que el cicle hi torna. D'aqui venia el que va avisar l'Ernest amb
// una nota de veu el 20/11/2026: tocar els primers dies de la setmana que ve li
// canviava els de la setmana ja feta i completada, perque eren la mateixa fila.
//
// Des de la migracio 20 hi ha dos ambits a `assignment_days`:
//   · setmana_inici NULL  → fila del CICLE. Val cada cop que toca.
//   · setmana_inici data  → fila NOMES de la setmana real que comenca aquell
//                           dilluns, i manda sobre la del cicle.
// I `plan_assignments.mode_setmanes` decideix nomes com es presenta i que es
// deixa tocar:
//   · 'cicle'     → les N setmanes del pla, que es repeteixen (com sempre).
//   · 'calendari' → la tira de setmanes reals amb les seves dates. Les que ja
//                   han passat queden tancades: son el registre del que s'ha fet.
//
// Canviar de mode no mou cap dada: una setmana real segueix el cicle fins que
// algu la toca, i aleshores es desa a part.
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var DIES_C = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
var MESOS = ['gener','febrer','març','abril','maig','juny','juliol','agost',
             'setembre','octubre','novembre','desembre'];

var editant = null;    // assignment_id que s'esta editant
var mode = {};         // assignment_id -> mode triat en aquesta sessio
var horitzo = {};      // assignment_id -> quantes setmanes futures s'ensenyen
var esb = null;        // esborrany d'edicio (vegeu obreEsborrany)

function clau(s,d){ return 's'+s+'d'+d; }
function rang(n){ var l = []; for (var i = 1; i <= n; i++) l.push(i); return l; }

// ── Dates, sempre en UTC ───────────────────────────────────────────
// Parany ja caçat a plans.js: new Date('2026-11-02T00:00:00') es llegeix en
// hora local i toISOString() torna UTC, que a Espanya resta un dia. Tot el que
// compta dies va amb T00:00:00Z i setUTCDate.
function dataUTC(s){ return new Date(String(s).slice(0,10) + 'T00:00:00Z'); }
function iso(d){ return d.toISOString().slice(0,10); }
function diaSetmanaDe(d){ var n = d.getUTCDay(); return n === 0 ? 7 : n; }
function mesDies(s, n){
  var d = dataUTC(s); d.setUTCDate(d.getUTCDate() + n); return iso(d);
}
function dillunsDe(s){
  var d = dataUTC(s);
  d.setUTCDate(d.getUTCDate() - (diaSetmanaDe(d) - 1));
  return iso(d);
}
function avuiISO(){
  var d = new Date();
  return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
}
function diesEntre(a, b){ return Math.round((dataUTC(b) - dataUTC(a)) / 86400000); }

// Quina setmana del cicle toca a la setmana que comenca aquest dilluns.
// IMPORTANT: compta des de `data_inici` TAL COM ESTA, sense portar-la al seu
// dilluns, perque es exactament el que fa l'app de l'atleta (`avui.js`). Si es
// canvia aqui i no alla, la consola i el mobil diuen setmanes diferents.
function setmanaCicle(dilluns, inici, setmanes){
  var passats = diesEntre(inici, dilluns);
  if (passats < 0) passats = 0;
  return (Math.floor(passats / 7) % (setmanes || 1)) + 1;
}

// «17 – 23 de novembre», i amb els dos mesos si la setmana en canvia
function rangSetmana(dilluns){
  var a = dataUTC(dilluns), b = dataUTC(mesDies(dilluns, 6));
  var ma = MESOS[a.getUTCMonth()], mb = MESOS[b.getUTCMonth()];
  if (ma === mb) return a.getUTCDate() + ' – ' + b.getUTCDate() + ' de ' + mb;
  return a.getUTCDate() + ' de ' + ma + ' – ' + b.getUTCDate() + ' de ' + mb;
}
function dataCurta(s){
  if (!s) return '';
  var t = String(s).slice(0,10).split('-');
  return t[2] + '/' + t[1];
}

// ── Entrada ────────────────────────────────────────────────────────
//
// Si la migracio 20 encara no s'ha executat, la columna `mode_setmanes` no
// existeix i la consulta torna un 42703. En comptes de deixar la pantalla
// morta, es torna a demanar sense la columna i es treballa com sempre, amb un
// avis que diu que falta passar la migracio. Aixi desplegar abans d'executar
// el SQL no trenca res.
var senseMigracio = false;

function demanaAssignacio(athleteId, ambMode){
  var camps = 'id,data_inici,data_fi,estat,' + (ambMode ? 'mode_setmanes,' : '') +
    'pla:training_plans(id,nom,setmanes,descripcio)';
  return E.sb.from('plan_assignments').select(camps)
    .eq('athlete_id', athleteId).eq('estat','actiu')
    .order('created_at',{ascending:false}).limit(1);
}

E.plaAtleta = function(cos, athleteId){
  var zona = h('div','margin-top:26px');
  zona.appendChild(E.titol("Pla d'entrenament", 15));
  var cont = h('div','margin-top:11px');
  zona.appendChild(cont);
  cont.appendChild(E.carregant());
  cos.appendChild(zona);

  demanaAssignacio(athleteId, !senseMigracio)
    .then(function(r){
      if (r.error && /mode_setmanes/.test(r.error.message || '')){
        senseMigracio = true;
        return demanaAssignacio(athleteId, false);
      }
      return r;
    })
    .then(function(r){
      E.buida(cont);
      if (r.error){ cont.appendChild(E.avis(r.error.message)); return; }
      var a = (r.data || [])[0];
      if (!a){
        cont.appendChild(E.buit(E.perfil.role === 'coach'
          ? "Aquest Espartà no té cap pla actiu. Ve a «Plans», obre un pla i prem «Assignar»."
          : "Aquest Espartà no té cap pla actiu."));
        return;
      }
      pintaPla(cont, a, athleteId);
    });
};

function modeDe(a){
  if (senseMigracio) return 'cicle';
  return mode[a.id] || a.mode_setmanes || 'cicle';
}

function pintaPla(cont, a, athleteId){
  E.buida(cont);
  var pla = a.pla || {};
  var setmanes = pla.setmanes || 1;
  var esCoach = E.perfil.role === 'coach';
  var m = modeDe(a);

  var cap = h('div','display:flex;align-items:flex-start;justify-content:space-between;'+
    'gap:14px;margin-bottom:13px;flex-wrap:wrap');
  var t = h('div','min-width:0');
  t.appendChild(h('div','font-size:15px;font-weight:600;color:'+C.os, pla.nom || 'Pla'));
  t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
    setmanes + (setmanes === 1 ? ' setmana' : ' setmanes') +
    ' · des del ' + E.data(a.data_inici)));
  cap.appendChild(t);
  if (esCoach){
    var b = E.boto(editant === a.id ? 'Tancar l\'editor'
                                    : (m === 'calendari' ? 'Programar les setmanes'
                                                         : 'Ajustar els dies'), function(){
      if (editant === a.id){ editant = null; esb = null; }
      else editant = a.id;
      pintaPla(cont, a, athleteId);
    }, editant === a.id ? 'buit' : null);
    b.style.padding = '8px 15px'; b.style.fontSize = '11.5px';
    cap.appendChild(b);
  }
  cont.appendChild(cap);

  if (esCoach) cont.appendChild(triaMode(a, setmanes, cont, athleteId));

  var zonaCal = h('div');
  cont.appendChild(zonaCal);
  zonaCal.appendChild(E.carregant());

  var calRutines = esCoach && editant === a.id;
  Promise.all([
    E.sb.from('assignment_days')
      .select('*,rutina:routines!assignment_days_routine_id_fkey(nom,tipus,deleted_at),'+
              'cardio_rutina:routines!assignment_days_cardio_routine_id_fkey'+
              '(nom,tipus,rondes,deleted_at)')
      .eq('assignment_id', a.id).limit(2000),
    E.sb.from('plan_days')
      .select('*,rutina:routines!plan_days_routine_id_fkey(nom,tipus,deleted_at),'+
              'cardio_rutina:routines!plan_days_cardio_routine_id_fkey'+
              '(nom,tipus,rondes,deleted_at)')
      .eq('plan_id', pla.id),
    calRutines
      ? E.sb.from('routines').select('id,nom,tipus').eq('mena','forca')
          .is('deleted_at',null).order('nom')
      : Promise.resolve({ data:[] }),
    calRutines
      ? E.sb.from('routines').select('id,nom,tipus,rondes').eq('mena','cardio')
          .is('deleted_at',null).order('nom')
      : Promise.resolve({ data:[] }),
    E.sb.from('workout_sessions').select('data,estat,setmana,dia_previst')
      .eq('athlete_id', athleteId).gte('data', a.data_inici)
      .order('data',{ascending:true}).limit(600)
  ]).then(function(r){
    E.buida(zonaCal);
    if (r[0].error){ zonaCal.appendChild(E.avis(r[0].error.message)); return; }

    var fonts = classifica(r[0].data || [], r[1].data || [], a, setmanes);
    var sessions = (r[4] && r[4].data) || [];
    E.CARDIO_RUTINES = (r[3] && r[3].data) || [];
    var rutines = (r[2] && r[2].data) || [];

    if (modeDe(a) === 'calendari')
      vistaCalendari(zonaCal, a, athleteId, cont, setmanes, fonts, sessions, rutines);
    else
      vistaCicle(zonaCal, a, athleteId, cont, setmanes, fonts, sessions, rutines);
  });
}

// ── D'on surt el contingut de cada setmana ─────────────────────────
//
// Tres fonts, de mes forta a mes feble:
//   1. les files datades d'aquesta setmana real  → «a part»
//   2. el cicle propi de l'Esparta               → «calendari propi»
//   3. la plantilla del pla                      → «segueix la plantilla»
//
// El cicle propi es tot o res, com ha estat sempre: si l'Esparta en te cap
// fila, el seu cicle manda sencer, tambe a les setmanes que hi te de descans.
// Si no, segueix la plantilla. Fixar una setmana a part NO el desenganxa de la
// plantilla: nomes afecta aquella setmana.
function classifica(propis, plantilla, a, setmanes){
  var datades = {}, cicleProp = {}, plan = {};
  propis.forEach(function(d){
    if (d.setmana_inici){
      var dl = String(d.setmana_inici).slice(0,10);
      (datades[dl] = datades[dl] || {})[d.dia_setmana] = d;
    } else {
      (cicleProp[d.setmana] = cicleProp[d.setmana] || {})[d.dia_setmana] = d;
    }
  });
  plantilla.forEach(function(d){
    (plan[d.setmana] = plan[d.setmana] || {})[d.dia_setmana] = d;
  });
  return {
    datades: datades, cicleProp: cicleProp, plan: plan,
    teCiclePropi: Object.keys(cicleProp).length > 0,
    inici: a.data_inici, setmanes: setmanes
  };
}

// El contingut del cicle per a una setmana del cicle
function cicleDe(fonts, slot){
  var font = fonts.teCiclePropi ? fonts.cicleProp : fonts.plan;
  return font[slot] || {};
}

// El contingut d'una setmana real, i d'on surt
function setmanaReal(fonts, dilluns){
  var slot = setmanaCicle(dilluns, fonts.inici, fonts.setmanes);
  if (fonts.datades[dilluns])
    return { dies:fonts.datades[dilluns], font:'data', slot:slot };
  return { dies:cicleDe(fonts, slot),
           font: fonts.teCiclePropi ? 'cicle' : 'plantilla', slot:slot };
}

// ── La tria de mode: dues targetes, no un desplegable ──────────────
function miniTira(quin){
  var w = h('div','display:flex;gap:3px;margin:9px 0 10px');
  var caixes = quin === 'cicle'
    ? [{t:'1',c:C.or},{t:'2',c:C.or},{t:'1',c:C.or},{t:'2',c:C.or},{t:'1',c:C.or}]
    : [{t:'✓',c:C.apagat},{t:'✓',c:C.apagat},{t:'ara',c:C.or},
       {t:'nou',c:C.oliva},{t:'nou',c:C.oliva}];
  caixes.forEach(function(x){
    w.appendChild(h('div','flex:1;text-align:center;padding:4px 0;font-size:8.5px;'+
      'font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:'+x.c+';'+
      'border:1px solid '+x.c+'44;background:'+x.c+'11', x.t));
  });
  return w;
}

function triaMode(a, setmanes, cont, athleteId){
  var m = modeDe(a);
  var w = h('div','margin-bottom:16px');
  if (senseMigracio){
    w.appendChild(E.avis('Per poder programar setmana a setmana falta executar '+
      'la migració «20-setmanes-datades.sql» al SQL Editor de Supabase. Mentre '+
      'no s\'executi, el pla funciona com fins ara: les setmanes del cicle es '+
      'repeteixen.', C.ambre));
    return w;
  }
  w.appendChild(h('div','font-size:10px;letter-spacing:.13em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.or+';margin-bottom:9px','Com li programes les setmanes?'));

  var g = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(255px,1fr));'+
    'gap:10px');
  var opcions = [
    { id:'cicle', titol:'Igual cada setmana',
      que:'Programes les ' + setmanes + (setmanes === 1 ? ' setmana' : ' setmanes') +
          ' del pla i es repeteixen sense parar.',
      compte:'Una casella és «cada cop que toca aquest dia». Si la canvies, '+
             'canvia a totes les setmanes, també a les que ja s\'han fet.',
      quan:'Per a un pla que no varia.' },
    { id:'calendari', titol:'Setmana a setmana',
      que:'Cada setmana del calendari té la seva, amb les seves dates.',
      compte:'Les setmanes que ja han passat queden tancades: són el registre '+
             'del que s\'ha fet. Només toques les que venen.',
      quan:'Per a progressions de càrrega i per preparar només la setmana que ve.' }
  ];
  opcions.forEach(function(o){
    var actiu = m === o.id;
    var c = h('div','padding:13px 15px;background:'+(actiu ? C.panell2 : C.panell)+';'+
      'border:1px solid '+(actiu ? C.or+'99' : C.vora)+';cursor:pointer;'+
      'display:flex;flex-direction:column');
    if (!actiu){
      c.onmouseenter = function(){ c.style.borderColor = C.voraFort; };
      c.onmouseleave = function(){ c.style.borderColor = C.vora; };
    }
    var fila = h('div','display:flex;align-items:center;gap:8px');
    fila.appendChild(h('div','font-size:13.5px;font-weight:700;color:'+
      (actiu ? C.os : C.pedra), o.titol));
    if (actiu) fila.appendChild(E.etiqueta('Actiu', C.or));
    c.appendChild(fila);
    c.appendChild(miniTira(o.id));
    c.appendChild(h('div','font-size:12px;color:'+C.pedra+';line-height:1.5', o.que));
    c.appendChild(h('div','font-size:11.5px;color:'+(actiu ? C.or : C.apagat)+';'+
      'line-height:1.5;margin-top:6px', o.compte));
    c.appendChild(h('div','font-size:11px;color:'+C.apagat+';line-height:1.45;'+
      'margin-top:auto;padding-top:8px;font-style:italic', o.quan));
    if (!actiu) c.onclick = function(){ canviaMode(a, o.id, cont, athleteId); };
    g.appendChild(c);
  });
  w.appendChild(g);

  if (m === 'calendari')
    w.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.55;'+
      'margin-top:9px;max-width:680px',
      'Canviar de mode no mou res del que ja hi ha: cada setmana segueix el '+
      'cicle del pla fins que la toques, i aleshores es desa a part i deixa '+
      'de dependre\'n.'));
  return w;
}

function canviaMode(a, nou, cont, athleteId){
  mode[a.id] = nou;
  a.mode_setmanes = nou;
  esb = null;
  editant = null;
  pintaPla(cont, a, athleteId);
  // Es desa de fons: si falla, el mode torna enrere i es diu.
  E.sb.from('plan_assignments').update({ mode_setmanes:nou }).eq('id', a.id)
    .then(function(r){
      if (r.error){
        mode[a.id] = null; a.mode_setmanes = nou === 'cicle' ? 'calendari' : 'cicle';
        pintaPla(cont, a, athleteId);
        cont.insertBefore(E.avis('No s\'ha pogut desar el mode: ' + r.error.message),
          cont.firstChild);
      }
    });
}

// ── Que ha fet, de tot el que li tocava ───────────────────────────
// Al mode calendari es exacte: cada sessio cau a la setmana real de la seva
// data. Al mode cicle, una casella es «cada cop que toca aquest dia», i nomes
// s'hi pot pintar l'ULTIMA vegada, amb la data, que es l'unica manera que no
// enganyi.
function fetsPerData(sessions){
  var m = {};
  (sessions || []).forEach(function(x){ m[String(x.data).slice(0,10)] = x; });
  return m;
}
function fetsPerSlot(sessions, inici, setmanes){
  var m = {};
  (sessions || []).forEach(function(x){
    var sm = x.setmana || setmanaCicle(dillunsDe(x.data), inici, setmanes);
    var d = x.dia_previst || diaSetmanaDe(dataUTC(x.data));
    if (sm < 1 || sm > (setmanes || 1) || d < 1 || d > 7) return;
    m[clau(sm, d)] = x;   // ordenades per data: hi queda l'ultima
  });
  return m;
}
function segellDe(x){
  if (!x) return null;
  if (x.estat === 'completada') return { t:'✓ ' + dataCurta(x.data), c:C.oliva };
  if (x.estat === 'saltada')    return { t:'✕ ' + dataCurta(x.data), c:C.apagat };
  return { t:'a mitges ' + dataCurta(x.data), c:C.brasa };
}

// ── Les caselles ──────────────────────────────────────────────────
function activitatsDe(dia){
  var l = [];
  if (!dia) return l;
  if (dia.rutina) l.push({ t:dia.rutina.nom, gruix:'600',
    c: dia.rutina.deleted_at ? C.ambre : C.os, fant: !!dia.rutina.deleted_at });
  else if (dia.routine_id) l.push({ t:'Rutina', c:C.os, gruix:'600' });
  if (dia.cardio_rutina) l.push({ t:dia.cardio_rutina.nom, gruix:'600',
    c: dia.cardio_rutina.deleted_at ? C.ambre : C.oliva,
    fant: !!dia.cardio_rutina.deleted_at });
  else if (dia.cardio_routine_id) l.push({ t:'Cardio programat', c:C.oliva, gruix:'600' });
  else if (dia.cardio) l.push({ t:dia.cardio, c:C.oliva, gruix:'500' });
  if (dia.pesatge) l.push({ t:'Pesatge i mides', c:C.or, gruix:'600' });
  return l;
}
function teEntreno(dia){
  return !!(dia && (dia.routine_id || dia.cardio_routine_id || dia.cardio));
}

// Casella de nomes llegir. `etiqueta` ja ve feta: «Dl» o «Dl 17». `buit` es el
// que s'hi diu si no hi ha cap sessio: al cicle, «mai» (la casella es «cada cop
// que toca»); al calendari, «no consta» si el dia ja ha passat i res si encara
// ha d'arribar, que d'un dia que no ha vingut no se'n pot dir res.
function cellaLectura(dia, etiqueta, fet, apagada, buit){
  var c = h('div','background:'+C.panell+';padding:10px 11px;min-height:70px;'+
    'display:flex;flex-direction:column'+(apagada ? ';opacity:.72' : ''));
  c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.apagat+';margin-bottom:5px', etiqueta));
  var acts = activitatsDe(dia);
  if (!acts.length)
    c.appendChild(h('div','font-size:11px;color:'+C.apagat+';font-style:italic','descans'));
  else acts.forEach(function(x, i){
    c.appendChild(h('div','font-size:12px;font-weight:'+x.gruix+';color:'+x.c+';'+
      'line-height:1.35'+(i ? ';margin-top:4px' : ''), x.t));
    if (x.fant) c.appendChild(h('div','font-size:9.5px;color:'+C.ambre+';'+
      'margin-top:1px','ja no és a la biblioteca'));
  });
  // Nomes els dies amb entreno porten segell: un dia de pesatge no es una
  // sessio i no te sentit dir-ne «mai».
  if (teEntreno(dia)){
    var sg = segellDe(fet);
    if (sg || buit)
      c.appendChild(h('div','margin-top:auto;padding-top:6px;font-size:9.5px;'+
        'font-weight:'+(sg ? '600' : '400')+';color:'+(sg ? sg.c : C.apagat),
        sg ? sg.t : buit));
  }
  return c;
}

// ── L'esborrany d'edicio ──────────────────────────────────────────
function valDe(row){
  return { r:(row && row.routine_id) || '',
           c:{ routine_id:(row && row.cardio_routine_id) || '',
               text:(row && row.cardio) || '' },
           p:!!(row && row.pesatge) };
}
function teFeina(v){ return !!(v && (v.r || E.teCardio(v.c) || v.p)); }
function copiaVal(v){
  return { r:v.r, c:{ routine_id:v.c.routine_id, text:v.c.text }, p:v.p };
}
function diesDe(mapa){
  var o = {};
  for (var d = 1; d <= 7; d++) o[d] = valDe(mapa[d]);
  return o;
}

// ── Eines compartides per als dos editors ─────────────────────────
function einesEditor(rutines, miss, refresca){
  var opcions = [{ v:'', t:'Sense rutina' }];
  function refesOpcions(){
    rutines.sort(function(a,b){
      return String(a.nom||'').localeCompare(String(b.nom||''), 'ca');
    });
    opcions.length = 1;
    rutines.forEach(function(x){
      opcions.push({ v:x.id, t:x.nom + (x.tipus ? '  ·  ' + x.tipus : '') });
    });
  }
  refesOpcions();

  // Una rutina esborrada de la biblioteca pot seguir enganxada a un dia: el
  // desplegable nomes porta rutines vives, aixi que el dia sortia com a «Sense
  // rutina» pero es tornava a desar igual. Ara surt marcada i es pot treure.
  function opcionsDe(id){
    if (!id) return opcions;
    for (var i = 0; i < opcions.length; i++) if (opcions[i].v === id) return opcions;
    return opcions.concat([E.opcioFantasma(id)]);
  }
  function nomDe(id){
    for (var i = 0; i < rutines.length; i++) if (rutines[i].id === id) return rutines[i].nom;
    return E.nomFantasma(id);
  }
  function error(text){
    if (!miss) return;
    E.buida(miss);
    miss.appendChild(E.avis(text));
  }
  // Sobrecarrega: la mateixa sessio amb mes pes. La copia neix ara a la
  // biblioteca; el calendari encara s'ha de desar amb el boto de sota.
  function duplica(val){
    return E.duplicaRutina(val.r, E.nomSeguent(nomDe(val.r)))
      .then(function(nova){
        rutines.push(nova);
        refesOpcions();
        val.r = nova.id;
      })
      .catch(function(err){ error(err.message); });
  }
  // Les rutines d'una setmana sencera, cada una copiada un sol cop, perque dos
  // dies que comparteixen rutina segueixin compartint-la a la copia.
  function duplicaSetmana(dies){
    var ids = [];
    for (var d = 1; d <= 7; d++)
      if (dies[d].r && ids.indexOf(dies[d].r) === -1) ids.push(dies[d].r);
    var mapa = {}, cua = Promise.resolve();
    ids.forEach(function(id){
      cua = cua.then(function(){
        return E.duplicaRutina(id, E.nomSeguent(nomDe(id))).then(function(nova){
          mapa[id] = nova.id; rutines.push(nova);
        });
      });
    });
    return cua.then(function(){
      refesOpcions();
      for (var d = 1; d <= 7; d++)
        if (dies[d].r && mapa[dies[d].r]) dies[d].r = mapa[dies[d].r];
    }).catch(function(err){ error(err.message); });
  }
  return { opcions:opcions, opcionsDe:opcionsDe, nomDe:nomDe, error:error,
           duplica:duplica, duplicaSetmana:duplicaSetmana, rutines:rutines };
}

// Casella editable. Muta `val` i crida `refresca` quan cal repintar.
function cellaEditor(eines, val, etiqueta, refresca, fet){
  var opcionsDia = eines.opcionsDe(val.r);
  var fant = opcionsDia !== eines.opcions;
  var feina = teFeina(val);
  var c = h('div','background:'+C.panell+';border:1px solid '+
    (fant ? C.ambre+'66' : (feina ? E.accent()+'44' : C.vora))+';padding:9px 10px');
  c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
    'font-weight:700;color:'+(fant ? C.ambre : (feina ? E.accent() : C.apagat))+';'+
    'margin-bottom:6px', etiqueta));

  var sel = document.createElement('select');
  opcionsDia.forEach(function(o){
    var op = document.createElement('option');
    op.value = o.v; op.textContent = o.t;
    if (val.r === o.v) op.selected = true;
    sel.appendChild(op);
  });
  sel.setAttribute('style','width:100%;padding:7px 8px;background:'+C.fons+';'+
    'border:1px solid '+(fant ? C.ambre+'66' : 'rgba(194,176,106,.24)')+';'+
    'color:'+(fant ? C.ambre : C.os)+';font-size:11.5px;'+
    "font-family:'Barlow',sans-serif");
  sel.onchange = function(){ val.r = sel.value; refresca(); };
  c.appendChild(sel);

  if (val.r){
    var acc = h('div','display:flex;margin-top:6px');
    var bd = E.miniAccio('Duplicar', function(){
      bd.disabled = true; bd.textContent = 'Duplicant…';
      eines.duplica(val).then(refresca);
    });
    acc.appendChild(bd);
    c.appendChild(acc);
  }

  c.appendChild(E.controlCardio(val.c, function(v, rp){
    val.c = { routine_id:v.routine_id || '', text:v.text || '' };
    if (rp) refresca();
  }, 'petit'));

  var wp = h('label','display:flex;align-items:center;gap:5px;margin-top:7px;'+
    'font-size:9px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;'+
    'color:'+(val.p ? C.or : C.apagat)+';cursor:pointer');
  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!val.p;
  cb.setAttribute('style','width:14px;height:14px;margin:0;accent-color:'+C.or);
  cb.onchange = function(){ val.p = cb.checked; refresca(); };
  wp.appendChild(cb);
  wp.appendChild(document.createTextNode('Pesatge'));
  c.appendChild(wp);

  // El que ja s'ha fet aquell dia, per no programar a cegues
  var sg = segellDe(fet);
  if (sg) c.appendChild(h('div','margin-top:7px;font-size:9.5px;font-weight:600;'+
    'color:'+sg.c, sg.t));
  return c;
}

function capSetmana(text, color){
  return h('div','font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;'+
    'font-weight:700;color:'+(color || C.or), text);
}
function botoPetit(text, accio, titol, color){
  var b = E.boto(text, accio, 'buit');
  b.style.padding = '4px 10px'; b.style.fontSize = '10px';
  if (titol) b.title = titol;
  if (color){ b.style.borderColor = color + '66'; b.style.color = color; }
  return b;
}

// ═══ MODE CICLE ═══════════════════════════════════════════════════
// Les N setmanes del pla, que es repeteixen. Es el que hi havia i segueix sent
// el valor per defecte. L'unica cosa nova es que ara ho diu clar.
function vistaCicle(zona, a, athleteId, cont, setmanes, fonts, sessions, rutines){
  var esCoach = E.perfil.role === 'coach';
  var edita = esCoach && editant === a.id;
  var fets = fetsPerSlot(sessions, fonts.inici, setmanes);
  var ara = setmanaCicle(dillunsDe(avuiISO()), fonts.inici, setmanes);

  if (!fonts.teCiclePropi && !edita)
    zona.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-bottom:11px;'+
      'line-height:1.5','Segueix el calendari de la plantilla del pla.'));

  var datades = Object.keys(fonts.datades).length;
  if (datades)
    zona.appendChild(E.avis('Aquest Espartà té ' + datades +
      (datades === 1 ? ' setmana programada a part' : ' setmanes programades a part') +
      ', amb data pròpia, que aquí no es veuen i manen sobre el cicle. '+
      'Passa a «Setmana a setmana» per veure-les i tocar-les.', C.ambre));

  if (edita){
    zona.appendChild(E.avis('Estàs editant el CICLE. Cada casella és «cada cop que '+
      'toca aquest dia»: el que canviïs aquí li canvia totes les setmanes, també '+
      'les que ja ha fet. Si el que vols és preparar només la setmana que ve, '+
      'passa a «Setmana a setmana».', C.ambre));
    editorCicle(zona, a, athleteId, cont, setmanes, fonts, fets, rutines);
    return;
  }

  for (var s = 1; s <= setmanes; s++){
    var fila = h('div','margin-bottom:14px');
    if (setmanes > 1){
      var capS = h('div','display:flex;align-items:baseline;gap:9px;margin-bottom:7px');
      // L'accent de la consola es el blau pissarra: val per a vores i farciments,
      // pero com a text no arriba al 4,5:1. Per destacar la setmana en curs hi va
      // l'os, que es el valor mes fort que tenim.
      capS.appendChild(capSetmana('Setmana ' + s, s === ara ? C.os : C.or));
      if (s === ara) capS.appendChild(h('div','font-size:10px;padding:2px 7px;color:'+
        C.or+';border:1px solid '+C.vora,'la que toca ara'));
      fila.appendChild(capS);
    }
    var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:1px;'+
      'background:'+C.vora);
    var dies = cicleDe(fonts, s);
    for (var d = 1; d <= 7; d++)
      g.appendChild(cellaLectura(dies[d], DIES_C[d-1], fets[clau(s,d)], false, 'mai'));
    fila.appendChild(g);
    zona.appendChild(fila);
  }

  zona.appendChild(h('div','font-size:11px;color:'+C.apagat+';line-height:1.55;'+
    'margin-top:-4px;max-width:660px',
    'A sota de cada dia, l\'última vegada que el va fer: ✓ completat, '+
    '✕ marcat com a no fet, «a mitges» si el va obrir i no el va tancar. '+
    'El pla dona la volta cada ' + setmanes + (setmanes === 1 ? ' setmana' : ' setmanes') +
    ', per això hi va la data i no un simple tic.'));
}

function editorCicle(zona, a, athleteId, cont, setmanes, fonts, fets, rutines){
  if (!rutines.length && !(E.CARDIO_RUTINES || []).length){
    zona.appendChild(E.buit('No hi ha rutines a la biblioteca.'));
    return;
  }
  if (!esb || esb.assig !== a.id || esb.mena !== 'cicle'){
    esb = { assig:a.id, mena:'cicle', cicle:{} };
    for (var s0 = 1; s0 <= setmanes; s0++) esb.cicle[s0] = diesDe(cicleDe(fonts, s0));
  }

  var caixa = h('div');
  zona.appendChild(caixa);
  var miss = h('div','margin-top:6px');
  var eines = einesEditor(rutines, miss, function(){ pinta(); });

  function pinta(){
    E.buida(caixa);
    caixa.appendChild(h('div','font-size:12px;color:'+C.apagat+';line-height:1.55;'+
      'margin-bottom:12px;max-width:680px',
      'Els canvis afecten NOMÉS aquest Espartà: la plantilla del pla i la resta '+
      'd\'atletes no es toquen. Cada dia pot tenir rutina de pesos, cardio i '+
      'pesatge a la vegada; deixa-ho tot buit per fer-ne un dia de descans.'));

    for (var s = 1; s <= setmanes; s++){
      (function(setmana){
        var fila = h('div','margin-bottom:18px');
        var capS = h('div','display:flex;align-items:center;gap:11px;margin-bottom:8px;'+
          'flex-wrap:wrap');
        capS.appendChild(capSetmana('Setmana ' + setmana));
        if (setmana > 1){
          capS.appendChild(botoPetit('Copiar l\'anterior', function(){
            for (var d = 1; d <= 7; d++)
              esb.cicle[setmana][d] = copiaVal(esb.cicle[setmana-1][d]);
            pinta();
          }));
          var teRut = false;
          for (var dd = 1; dd <= 7; dd++) if (esb.cicle[setmana-1][dd].r) teRut = true;
          if (teRut){
            var bd = botoPetit('Copiar-la duplicant les rutines', function(){
              bd.disabled = true; bd.textContent = 'Duplicant…';
              for (var d = 1; d <= 7; d++)
                esb.cicle[setmana][d] = copiaVal(esb.cicle[setmana-1][d]);
              eines.duplicaSetmana(esb.cicle[setmana]).then(pinta);
            }, 'Fa una còpia nova de cada rutina de la setmana ' + (setmana-1) +
               ' i les posa en aquesta, per pujar-hi les càrregues sense tocar '+
               'la setmana anterior.', C.or);
            capS.appendChild(bd);
          }
        }
        fila.appendChild(capS);
        var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:8px');
        for (var d2 = 1; d2 <= 7; d2++)
          // Abans aqui hi havia DIES[d2-1].slice(0,2), que per a tots set dies
          // dona «Di»: les set caselles de la setmana es deien igual.
          g.appendChild(cellaEditor(eines, esb.cicle[setmana][d2], DIES_C[d2-1],
            pinta, fets[clau(setmana,d2)]));
        fila.appendChild(g);
        caixa.appendChild(fila);
      })(s);
    }

    var fantasmes = compteFantasmes(eines, esb.cicle, rang(setmanes));
    if (fantasmes)
      caixa.appendChild(E.avis('Hi ha ' + fantasmes +
        (fantasmes === 1 ? ' dia amb una rutina' : ' dies amb una rutina') +
        ' que ja no és a la biblioteca. Surten marcades: tria «Sense rutina» i '+
        'desa per treure-les del planning d\'aquest Espartà.', C.ambre));
  }
  pinta();
  carregaNomsFantasma(esb.cicle, rang(setmanes), eines, pinta);

  zona.appendChild(miss);
  var b = E.boto('Desar el cicle', function(){
    E.buida(miss);
    b.disabled = true; b.textContent = 'Desant…';
    var files = [];
    for (var s = 1; s <= setmanes; s++)
      for (var d = 1; d <= 7; d++){
        var v = esb.cicle[s][d];
        if (!teFeina(v)) continue;
        files.push(filaDe(a.id, null, s, d, v));
      }
    // Nomes les files del cicle: les setmanes datades no es toquen.
    var fora = E.sb.from('assignment_days').delete().eq('assignment_id', a.id);
    if (!senseMigracio) fora = fora.is('setmana_inici', null);
    fora
      .then(function(r){
        if (r.error) throw new Error(r.error.message);
        if (!files.length) return { error:null };
        return E.sb.from('assignment_days').insert(files);
      }).then(function(r){
        if (r && r.error) throw new Error(r.error.message);
        editant = null; esb = null;
        pintaPla(cont, a, athleteId);
      }).catch(function(err){
        b.disabled = false; b.textContent = 'Desar el cicle';
        miss.appendChild(E.avis(err.message));
      });
  });
  b.style.marginTop = '8px';
  zona.appendChild(b);
}

function filaDe(assigId, dilluns, slot, dia, v){
  var vc = E.valorCardio(v.c);
  var f = { assignment_id:assigId, setmana:slot, dia_setmana:dia,
            routine_id: v.r || null,
            cardio: (vc.text || '').trim() || null,
            cardio_routine_id: vc.routine_id || null,
            pesatge: !!v.p };
  // Sense la migracio 20 la columna no existeix i enviar-la fa petar l'insert
  if (!senseMigracio) f.setmana_inici = dilluns || null;
  return f;
}

// `blocs` es { clau -> dies }, i `claus` quines mirar
function compteFantasmes(eines, blocs, claus){
  var n = 0;
  claus.forEach(function(x){
    var dies = blocs[x];
    if (!dies) return;
    for (var d = 1; d <= 7; d++)
      if (dies[d].r && eines.opcionsDe(dies[d].r) !== eines.opcions) n++;
  });
  return n;
}

// Els noms de les rutines esborrades, per ensenyar-les pel seu nom i no per un codi
function carregaNomsFantasma(blocs, claus, eines, pinta){
  var idsF = [], idsC = [];
  claus.forEach(function(x){
    var dies = blocs[x];
    if (!dies) return;
    for (var d = 1; d <= 7; d++){
      if (dies[d].r) idsF.push(dies[d].r);
      if (dies[d].c && dies[d].c.routine_id) idsC.push(dies[d].c.routine_id);
    }
  });
  if (!idsF.length && !idsC.length) return;
  Promise.all([E.carregaFantasmes(idsF, eines.rutines),
               E.carregaFantasmes(idsC, E.CARDIO_RUTINES || [])])
    .then(function(c){ if (c[0] || c[1]) pinta(); });
}

// ═══ MODE CALENDARI ═══════════════════════════════════════════════
// La tira de setmanes reals. Les passades, tancades. Tocar-ne una la desa amb
// la seva data i deixa de dependre del cicle: nomes canvia aquella setmana.
function setmanesVisibles(a, fonts){
  var dlAra = dillunsDe(avuiISO());
  var dlInici = dillunsDe(fonts.inici);
  var enrere = 2;                                   // dues setmanes de context
  var endavant = horitzo[a.id] == null ? 4 : horitzo[a.id];
  var des = mesDies(dlAra, -7 * enrere);
  if (diesEntre(dlInici, des) < 0) des = dlInici;
  var fins = mesDies(dlAra, 7 * endavant);
  // Una setmana ja programada a part fora de l'horitzo no es pot amagar
  Object.keys(fonts.datades).forEach(function(dl){
    if (diesEntre(fins, dl) > 0) fins = dl;
    if (diesEntre(dl, des) > 0) des = dl;
  });
  if (a.data_fi){
    var dlFi = dillunsDe(a.data_fi);
    if (diesEntre(dlFi, fins) > 0) fins = dlFi;
  }
  // Un pla que encara no ha comencat, o amb data de fi abans de l'horitzo,
  // podria deixar la tira buida. Com a minim, la setmana d'inici.
  if (diesEntre(des, fins) < 0) fins = des;
  var l = [];
  for (var dl = des; diesEntre(dl, fins) >= 0; dl = mesDies(dl, 7)) l.push(dl);
  return l;
}

function vistaCalendari(zona, a, athleteId, cont, setmanes, fonts, sessions, rutines){
  var esCoach = E.perfil.role === 'coach';
  var edita = esCoach && editant === a.id;
  var fets = fetsPerData(sessions);
  var avui = avuiISO();
  var dlAra = dillunsDe(avui);
  var llista = setmanesVisibles(a, fonts);

  if (edita && !rutines.length && !(E.CARDIO_RUTINES || []).length){
    zona.appendChild(E.buit('No hi ha rutines a la biblioteca.'));
    return;
  }

  if (!esb || esb.assig !== a.id || esb.mena !== 'calendari')
    esb = { assig:a.id, mena:'calendari', setm:{}, tocades:{}, treure:{} };
  // Les setmanes que encara no son a l'esborrany parteixen del que es veu ara
  llista.forEach(function(dl){
    if (!esb.setm[dl]){
      var sr = setmanaReal(fonts, dl);
      esb.setm[dl] = { dies:diesDe(sr.dies), font:sr.font, slot:sr.slot };
    }
  });

  var caixa = h('div');
  zona.appendChild(caixa);
  var miss = h('div','margin-top:10px');
  var eines = einesEditor(rutines, miss, function(){ pinta(); });

  function esPassada(dl){ return diesEntre(dl, dlAra) > 0; }
  function fixada(dl){ return !!esb.tocades[dl] ||
    (!!fonts.datades[dl] && !esb.treure[dl]); }

  function pinta(){
    E.buida(caixa);
    caixa.appendChild(h('div','font-size:12px;color:'+C.apagat+';line-height:1.55;'+
      'margin-bottom:14px;max-width:690px',
      edita
        ? 'Cada setmana és la seva. Les que ja han passat surten tancades i no es '+
          'poden tocar: són el registre del que va fer. Les que venen es poden '+
          'canviar lliurement, i només es desa la setmana que toques.'
        : 'Les setmanes reals amb les seves dates. A sota de cada dia, què va '+
          'passar aquell dia exactament.'));

    llista.forEach(function(dl, i){
      var passada = esPassada(dl);
      var actual = dl === dlAra;
      var editable = edita && !passada;
      var w = esb.setm[dl];
      var fila = h('div','margin-bottom:16px;padding-left:11px;border-left:2px solid '+
        (actual ? C.or : (passada ? C.vora : C.oliva+'55')));

      var capS = h('div','display:flex;align-items:center;gap:9px;margin-bottom:8px;'+
        'flex-wrap:wrap');
      capS.appendChild(h('div','font-size:12.5px;font-weight:700;color:'+
        (passada ? C.pedra : C.os), rangSetmana(dl)));
      if (actual) capS.appendChild(E.etiqueta('En curs', C.or));
      else if (passada) capS.appendChild(E.etiqueta('Tancada', C.apagat));
      else if (dl === mesDies(dlAra, 7)) capS.appendChild(E.etiqueta('La que ve', C.oliva));
      capS.appendChild(h('div','font-size:10px;color:'+
        (fixada(dl) ? C.oliva : C.apagat),
        fixada(dl) ? 'programada a part'
                   : 'segueix el ' + (fonts.teCiclePropi ? 'cicle' : 'pla') +
                     ' · setmana ' + w.slot + ' de ' + setmanes));
      fila.appendChild(capS);

      if (editable){
        var acc = h('div','display:flex;gap:7px;margin-bottom:8px;flex-wrap:wrap');
        if (i > 0){
          var ant = llista[i-1];
          acc.appendChild(botoPetit('Copiar la del ' + dataCurta(ant), function(){
            for (var d = 1; d <= 7; d++)
              w.dies[d] = copiaVal(esb.setm[ant].dies[d]);
            esb.tocades[dl] = true; delete esb.treure[dl];
            pinta();
          }, 'Posa en aquesta setmana el mateix que la de dalt.'));

          var teRut = false;
          for (var dd = 1; dd <= 7; dd++) if (esb.setm[ant].dies[dd].r) teRut = true;
          if (teRut){
            var bd = botoPetit('Copiar-la duplicant les rutines', function(){
              bd.disabled = true; bd.textContent = 'Duplicant…';
              for (var d = 1; d <= 7; d++)
                w.dies[d] = copiaVal(esb.setm[ant].dies[d]);
              esb.tocades[dl] = true; delete esb.treure[dl];
              eines.duplicaSetmana(w.dies).then(pinta);
            }, 'Fa una còpia nova de cada rutina de la setmana de dalt i les posa '+
               'en aquesta, per pujar-hi les càrregues sense tocar-la.', C.or);
            acc.appendChild(bd);
          }
        }
        var venen = llista.slice(i+1).filter(function(x){ return !esPassada(x); });
        if (venen.length)
          acc.appendChild(botoPetit('Aplicar-la a les ' + venen.length + ' que venen',
            function(){
              venen.forEach(function(x){
                for (var d = 1; d <= 7; d++)
                  esb.setm[x].dies[d] = copiaVal(w.dies[d]);
                esb.tocades[x] = true; delete esb.treure[x];
              });
              esb.tocades[dl] = true; delete esb.treure[dl];
              pinta();
            }, 'Deixa totes les setmanes que venen iguals a aquesta.'));
        if (fixada(dl))
          acc.appendChild(botoPetit('Tornar al cicle', function(){
            esb.treure[dl] = true; delete esb.tocades[dl];
            var sr = { dies:cicleDe(fonts, w.slot) };
            w.dies = diesDe(sr.dies);
            pinta();
          }, 'Treu la programació pròpia d\'aquesta setmana i la torna a fer '+
             'seguir el cicle del pla.', C.ambre));
        fila.appendChild(acc);
      }

      var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);'+
        (editable ? 'gap:8px' : 'gap:1px;background:'+C.vora));
      // De lectura es pinten les files tal com van sortir de la base de dades,
      // que son les que porten el nom de la rutina del join.
      var lect = editable ? null : setmanaReal(fonts, dl).dies;
      for (var d2 = 1; d2 <= 7; d2++){
        (function(dia){
          var dataDia = mesDies(dl, dia - 1);
          var et = DIES_C[dia-1] + ' ' + dataUTC(dataDia).getUTCDate();
          if (editable)
            g.appendChild(cellaEditor(eines, w.dies[dia], et, function(){
              esb.tocades[dl] = true; delete esb.treure[dl];
              pinta();
            }, fets[dataDia]));
          else
            g.appendChild(cellaLectura(lect[dia], et, fets[dataDia], passada,
              diesEntre(dataDia, avui) > 0 ? 'no consta' : null));
        })(d2);
      }
      fila.appendChild(g);

      if (edita && passada)
        fila.appendChild(h('div','font-size:10.5px;color:'+C.apagat+';margin-top:6px;'+
          'font-style:italic','Tancada: el que ja s\'ha fet no es toca.'));
      caixa.appendChild(fila);
    });

    var mes = h('div','display:flex;gap:8px;margin-top:4px;flex-wrap:wrap');
    mes.appendChild(botoPetit('Veure 4 setmanes més', function(){
      horitzo[a.id] = (horitzo[a.id] == null ? 4 : horitzo[a.id]) + 4;
      pintaPla(cont, a, athleteId);
    }));
    caixa.appendChild(mes);

    // Nomes mentre s'edita: sense editar, `eines` no porta la biblioteca
    // carregada i qualsevol rutina semblaria esborrada.
    var claus = edita ? llista.filter(function(dl){ return !esPassada(dl); }) : [];
    var fantasmes = compteFantasmes(eines, blocDies(), claus);
    if (fantasmes)
      caixa.appendChild(E.avis('Hi ha ' + fantasmes +
        (fantasmes === 1 ? ' dia amb una rutina' : ' dies amb una rutina') +
        ' que ja no és a la biblioteca, a les setmanes que venen. Surten marcades: '+
        'tria «Sense rutina» i desa.', C.ambre));
  }
  function blocDies(){
    var o = {};
    llista.forEach(function(dl){ o[dl] = esb.setm[dl].dies; });
    return o;
  }

  pinta();
  if (edita) carregaNomsFantasma(blocDies(), llista, eines, pinta);

  if (!edita) return;
  zona.appendChild(miss);

  var b = E.boto('Desar les setmanes que he tocat', function(){
    E.buida(miss);
    var tocades = Object.keys(esb.tocades).filter(function(dl){ return !esPassada(dl); });
    var treure  = Object.keys(esb.treure).filter(function(dl){ return !esPassada(dl); });
    if (!tocades.length && !treure.length){
      miss.appendChild(E.avis('No has canviat cap setmana.', C.ambre));
      return;
    }
    b.disabled = true; b.textContent = 'Desant…';

    var files = [];
    tocades.forEach(function(dl){
      var w = esb.setm[dl];
      var cap = false;
      for (var d = 1; d <= 7; d++){
        if (!teFeina(w.dies[d])) continue;
        cap = true;
        files.push(filaDe(a.id, dl, w.slot, d, w.dies[d]));
      }
      // Una setmana de descans sencer tambe s'ha de poder fixar: si no hi
      // deixessim res, no es distingiria d'una setmana que segueix el cicle.
      // Hi va una fila buida que nomes diu «aquesta setmana es a part».
      if (!cap) files.push(filaDe(a.id, dl, w.slot, 1, valDe(null)));
    });

    var fora = tocades.concat(treure);
    E.sb.from('assignment_days').delete().eq('assignment_id', a.id)
      .in('setmana_inici', fora)
      .then(function(r){
        if (r.error) throw new Error(r.error.message);
        if (!files.length) return { error:null };
        return E.sb.from('assignment_days').insert(files);
      }).then(function(r){
        if (r && r.error) throw new Error(r.error.message);
        editant = null; esb = null;
        pintaPla(cont, a, athleteId);
      }).catch(function(err){
        b.disabled = false; b.textContent = 'Desar les setmanes que he tocat';
        miss.appendChild(E.avis(err.message));
      });
  });
  b.style.marginTop = '10px';
  zona.appendChild(b);

  zona.appendChild(h('div','font-size:11px;color:'+C.apagat+';line-height:1.5;'+
    'margin-top:8px;max-width:660px',
    'Es desa només el que has tocat. Les setmanes que segueixen el cicle del pla '+
    'hi segueixen, i les que ja han passat no es toquen mai.'));
}
})();
