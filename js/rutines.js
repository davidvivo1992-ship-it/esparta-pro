// Metabolisme Esparta · Rutines (força i cardio)
//
// Mateixa mecànica per a les dues menes, però amb el vocabulari de
// cadascuna: la rutina de força es compta en repeticions; la de cardio
// en segons, rondes i intensitat. Així l'Ernest pot dissenyar un HIIT
// amb la mateixa eina amb què munta un dia d'empenta.
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null, mena:'forca' };
var esborrany = null;

var TIPUS = {
  forca: ['Força','Hipertròfia','Resistència','Mobilitat','Tècnica'],
  cardio: ['HIIT','Intervals','Continu','Circuit','Fartlek','Recuperació activa']
};
var BLOCS = {
  forca: ['Escalfament','Principal','Accessori','Core','Final'],
  cardio: ['Escalfament','Principal','Tornada a la calma']
};
var MESURES = [
  { v:'temps',     t:'Temps (segons)' },
  { v:'reps',      t:'Repeticions' },
  { v:'distancia', t:'Distància (metres)' }
];
var LLETRES = ['A','B','C','D','E','F'];
var MENES = [{ v:'forca', t:'Força' }, { v:'cardio', t:'Cardio' }];

function opcions(llista, buit){
  return [{ v:'', t: buit || '\u2014' }].concat(llista.map(function(x){ return { v:x, t:x }; }));
}
function esCardio(){ return vista.mena === 'cardio'; }

function barraMenes(){
  var b = h('div','display:flex;gap:1px;background:'+C.vora+';margin-bottom:18px;width:fit-content');
  MENES.forEach(function(m){
    var sel = vista.mena === m.v;
    var t = document.createElement('button');
    t.textContent = m.t;
    t.setAttribute('style','padding:10px 22px;background:'+(sel ? C.panell2 : C.panell)+';'+
      'border:none;border-top:2px solid '+(sel ? E.accent() : 'transparent')+';'+
      'color:'+(sel ? C.os : C.apagat)+';font-size:12px;font-weight:'+(sel ? '700' : '500')+';'+
      "letter-spacing:.08em;text-transform:uppercase;cursor:pointer;font-family:'Barlow',sans-serif");
    t.onclick = function(){
      if (vista.mena === m.v) return;
      vista = { mode:'llista', id:null, mena:m.v };
      E.repinta();
    };
    b.appendChild(t);
  });
  return b;
}

// ── Llista ─────────────────────────────────────────────────────────
function llista(cont){
  var card = esCardio();
  var accions = [];
  if (E.perfil.role === 'coach')
    accions.push(E.boto(card ? 'Nova sessió de cardio' : 'Nova rutina', function(){
      esborrany = { nom:'', tipus:'', notes:'', mena:vista.mena,
                    rondes:card ? 4 : '', descans_ronda_s:card ? 60 : '', exercicis:[] };
      vista = { mode:'editor', id:null, mena:vista.mena }; E.repinta();
    }));
  cont.appendChild(E.capcalera('Rutines',
    E.perfil.role === 'coach'
      ? (card ? 'Sessions de cardio: HIIT, intervals i circuits'
              : 'Sessions d\'entrenament reutilitzables')
      : 'Rutines en mode lectura', accions));

  var cos = E.cos();
  cont.appendChild(cos);
  cos.appendChild(barraMenes());
  var zona = h('div');
  zona.appendChild(E.carregant());
  cos.appendChild(zona);

  E.sb.from('routines')
    .select('id,nom,tipus,notes,rondes,created_at,routine_exercises(id)')
    .eq('mena', vista.mena)
    .is('deleted_at', null).order('created_at',{ascending:false})
    .then(function(r){
      E.buida(zona);
      if (r.error){ zona.appendChild(E.avis(r.error.message)); return; }
      var dades = r.data || [];
      if (!dades.length){
        zona.appendChild(E.buit(E.perfil.role === 'coach'
          ? (card
              ? 'Cap sessió de cardio encara. Prem «Nova sessió de cardio» i munta-la '+
                'amb exercicis de cardio de la biblioteca.'
              : 'Cap rutina encara. Prem «Nova rutina» i tria exercicis de la biblioteca.')
          : "L'entrenador encara no ha creat cap rutina d'aquesta mena."));
        return;
      }
      var box = h('div','display:flex;flex-direction:column;gap:7px');
      dades.forEach(function(x){
        var n = (x.routine_exercises || []).length;
        var f = h('div','display:flex;align-items:center;gap:15px;padding:14px 17px;'+
          'background:'+C.panell+';border:1px solid '+C.vora+';cursor:pointer');
        f.onmouseenter = function(){ f.style.borderColor = E.accent()+'66'; };
        f.onmouseleave = function(){ f.style.borderColor = C.vora; };
        f.onclick = function(){ vista = { mode:'fitxa', id:x.id, mena:vista.mena }; E.repinta(); };
        var t = h('div','flex:1;min-width:0');
        t.appendChild(h('div','font-size:15px;font-weight:600;color:'+C.os, x.nom));
        var sota = [n + (n === 1 ? ' exercici' : ' exercicis')];
        if (card && x.rondes) sota.push(x.rondes + ' rondes');
        t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
          sota.join(' \u00b7 ')));
        f.appendChild(t);
        if (x.tipus) f.appendChild(E.etiqueta(x.tipus, card ? C.oliva : C.or));
        box.appendChild(f);
      });
      zona.appendChild(box);
    });
}

// ── Fitxa ──────────────────────────────────────────────────────────
function fitxa(cont){
  var accions = [E.boto('Tornar', function(){
    vista = { mode:'llista', mena:vista.mena }; E.repinta();
  }, 'buit')];
  if (E.perfil.role === 'coach')
    accions.unshift(E.boto('Editar', function(){ carregaEsborrany(vista.id); }));
  cont.appendChild(E.capcalera(esCardio() ? 'Sessió de cardio' : 'Rutina', null, accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  E.sb.from('routines')
    .select('*,routine_exercises(*,exercici:exercises(nom,grup_muscular,youtube_url,imatges))')
    .eq('id', vista.id).single()
    .then(function(r){
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var x = r.data, card = x.mena === 'cardio';
      var ex = (x.routine_exercises || []).sort(function(a,b){ return a.ordre - b.ordre; });

      var cap = h('div','margin-bottom:22px');
      cap.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:24px;"+
        'color:'+C.os, x.nom));
      var meta = h('div','display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap');
      if (x.tipus) meta.appendChild(E.etiqueta(x.tipus, card ? C.oliva : C.or));
      meta.appendChild(h('div','font-size:12px;color:'+C.apagat,
        ex.length + (ex.length === 1 ? ' exercici' : ' exercicis')));
      if (card){
        if (x.rondes) meta.appendChild(h('div','font-size:12px;color:'+C.or+';font-weight:600',
          x.rondes + ' rondes'));
        meta.appendChild(h('div','font-size:12px;color:'+C.apagat,
          '\u2248 ' + E.duradaCardio(x, ex) + ' min'));
      }
      cap.appendChild(meta);
      if (x.notes) cap.appendChild(h('div','font-size:13.5px;color:'+C.pedra+';line-height:1.6;'+
        'margin-top:11px;max-width:640px;white-space:pre-wrap', x.notes));
      cos.appendChild(cap);

      if (!ex.length){ cos.appendChild(E.buit('Aquesta rutina no té exercicis.')); return; }

      var blocActual = null;
      var box = h('div','display:flex;flex-direction:column;gap:1px;background:'+C.vora);
      ex.forEach(function(e, i){
        if (e.bloc && e.bloc !== blocActual){
          blocActual = e.bloc;
          box.appendChild(h('div','background:'+C.panell2+';padding:8px 16px;font-size:10px;'+
            'letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:'+C.or, e.bloc));
        }
        var ant = ex[i-1], seg = ex[i+1];
        var supAnt = ant && ant.superserie === e.superserie && e.superserie;
        var supSeg = seg && seg.superserie === e.superserie && e.superserie;
        if (e.superserie && !supAnt && supSeg){
          var n = 1, j = i;
          while (ex[j+1] && ex[j+1].superserie === e.superserie){ n++; j++; }
          box.appendChild(h('div','background:'+C.panell+';padding:9px 16px;font-size:10.5px;'+
            'letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:'+C.or+';'+
            'border-left:3px solid '+C.or,
            (card ? 'Bloc seguit ' : 'Supersèrie ') + e.superserie +
            ' \u00b7 ' + n + ' exercicis seguits, sense descans'));
        }
        var f = h('div','background:'+C.panell+';padding:13px 16px;display:flex;'+
          'gap:15px;align-items:center' +
          (e.superserie ? ';border-left:3px solid '+C.or : ''));
        f.appendChild(h('div',"width:22px;flex-shrink:0;font-family:'Cinzel',serif;"+
          'font-weight:700;font-size:15px;color:'+C.apagat, String(i+1)));
        var t = h('div','flex:1;min-width:0');
        t.appendChild(h('div','font-size:14.5px;font-weight:600;color:'+C.os,
          (e.exercici && e.exercici.nom) || 'Exercici'));
        var sota = [];
        if (e.exercici && e.exercici.grup_muscular) sota.push(e.exercici.grup_muscular);
        if (e.intensitat) sota.push(e.intensitat);
        if (e.tempo) sota.push('tempo ' + e.tempo);
        if (e.rir != null) sota.push('RIR ' + e.rir);
        if (e.notes) sota.push(e.notes);
        if (sota.length) t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
          sota.join(' \u00b7 ')));
        f.appendChild(t);
        var d = h('div','display:flex;gap:18px;align-items:baseline;flex-shrink:0;text-align:right');
        d.appendChild(h('div','font-size:14px;font-weight:600;color:'+C.os,
          e.series + ' \u00d7 ' + E.mesuraPeca(e)));
        if (e.descans_s) d.appendChild(h('div','font-size:11.5px;color:'+C.apagat,
          e.descans_s + 's de descans'));
        f.appendChild(d);
        box.appendChild(f);

        if (e.descans_post_s && !supSeg && seg){
          box.appendChild(h('div','background:'+C.fons+';padding:6px 16px;font-size:11px;'+
            'color:'+C.apagat+';letter-spacing:.06em',
            '\u00b7 descans ' + e.descans_post_s + 's abans del següent \u00b7'));
        }
      });
      cos.appendChild(box);

      if (card && x.rondes > 1)
        cos.appendChild(h('div','margin-top:11px;padding:11px 16px;background:'+C.panell2+';'+
          'border-left:3px solid '+C.or+';font-size:12.5px;color:'+C.pedra+';line-height:1.55',
          'Tot això, ' + x.rondes + ' vegades' +
          (x.descans_ronda_s ? ', amb ' + x.descans_ronda_s + ' segons de descans entre rondes.'
                             : ' seguides.')));
    });
}

// ── Editor ─────────────────────────────────────────────────────────
function carregaEsborrany(id){
  E.sb.from('routines').select('*,routine_exercises(*)').eq('id', id).single()
    .then(function(r){
      if (r.error) return;
      var x = r.data;
      esborrany = {
        nom: x.nom, tipus: x.tipus || '', notes: x.notes || '', mena: x.mena || 'forca',
        rondes: x.rondes == null ? '' : x.rondes,
        descans_ronda_s: x.descans_ronda_s == null ? '' : x.descans_ronda_s,
        exercicis: (x.routine_exercises || []).sort(function(a,b){ return a.ordre - b.ordre; })
          .map(function(e){
            return { exercise_id:e.exercise_id, bloc:e.bloc || '', series:e.series,
                     tipus_mesura:e.tipus_mesura || 'reps',
                     reps:e.reps || '', temps_s:e.temps_s == null ? '' : e.temps_s,
                     distancia_m:e.distancia_m == null ? '' : e.distancia_m,
                     intensitat:e.intensitat || '',
                     tempo:e.tempo || '', descans_s:e.descans_s || '',
                     descans_post_s:e.descans_post_s == null ? '' : e.descans_post_s,
                     superserie:e.superserie || '',
                     rir:e.rir == null ? '' : e.rir, notes:e.notes || '' };
          })
      };
      vista = { mode:'editor', id:id, mena:esborrany.mena };
      E.repinta();
    });
}

function editor(cont){
  var nou = !vista.id;
  var card = esCardio();
  if (!esborrany) esborrany = { nom:'', tipus:'', notes:'', mena:vista.mena,
    rondes:card ? 4 : '', descans_ronda_s:card ? 60 : '', exercicis:[] };

  cont.appendChild(E.capcalera(
    nou ? (card ? 'Nova sessió de cardio' : 'Nova rutina')
        : (card ? 'Editar la sessió de cardio' : 'Editar rutina'),
    card ? 'Tria exercicis de cardio i defineix temps, rondes i intensitat'
         : 'Tria exercicis de la biblioteca i defineix sèries i repeticions',
    [E.boto('Cancel\u00b7lar', function(){
      esborrany = null;
      vista = nou ? { mode:'llista', mena:vista.mena }
                  : { mode:'fitxa', id:vista.id, mena:vista.mena };
      E.repinta();
    }, 'buit')]));

  var cos = E.cos();
  cos.appendChild(E.carregant('Carregant la biblioteca…'));
  cont.appendChild(cos);

  E.sb.from('exercises').select('id,nom,grup_muscular,imatges')
    .eq('mena', vista.mena).is('deleted_at', null).order('nom')
    .then(function(r){
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var biblio = r.data || [];
      if (!biblio.length){
        cos.appendChild(E.buit(card
          ? 'Primer cal tenir exercicis de cardio. Ve a «Exercicis», pestanya Cardio, '+
            'i crea\'n algun (córrer, corda, burpees…).'
          : 'Primer cal tenir exercicis a la biblioteca. Ve a «Exercicis» i crea\'n algun.'));
        return;
      }
      var mapa = {};
      biblio.forEach(function(x){ mapa[x.id] = x; });

      // ── Capçalera de la rutina ────────────────────────────────
      var dalt = E.targeta();
      dalt.style.marginBottom = '20px';
      var nom = E.camp({ et:card ? 'Nom de la sessió' : 'Nom de la rutina',
        marca:card ? 'HIIT 30/30 \u00b7 cinta' : 'Empenyer A \u00b7 força',
        valor:esborrany.nom });
      var tip = E.camp({ et:'Tipus', tipus:'select', valor:esborrany.tipus,
        opcions:opcions(TIPUS[vista.mena]) });
      var g = h('div','display:grid;grid-template-columns:2fr 1fr;gap:13px;margin-bottom:13px');
      g.appendChild(nom); g.appendChild(tip);
      dalt.appendChild(g);

      var resum = null;
      if (card){
        var ron = E.camp({ et:'Rondes', tipus:'number', valor:esborrany.rondes,
          marca:'4' });
        var dro = E.camp({ et:'Descans entre rondes (s)', tipus:'number',
          valor:esborrany.descans_ronda_s, marca:'60' });
        var g2 = h('div','display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:6px');
        g2.appendChild(ron); g2.appendChild(dro);
        dalt.appendChild(g2);
        dalt.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.5;'+
          'margin-bottom:13px','Rondes buit o 1 vol dir una passada única. '+
          'Amb 4, l\'Espartà repetirà tota la llista quatre vegades.'));
        resum = h('div','padding:11px 14px;background:'+C.fons+';border:1px solid '+C.vora+';'+
          'margin-bottom:13px;font-size:12.5px;color:'+C.or);
        dalt.appendChild(resum);
        ron.control.oninput = function(){ esborrany.rondes = ron.control.value; refrescaResum(); };
        dro.control.oninput = function(){ esborrany.descans_ronda_s = dro.control.value; refrescaResum(); };
      }

      var notes = E.camp({ et:'Notes per a l\'Espartà', tipus:'textarea', files:2,
        marca:card ? 'Si et falta l\'aire, allarga el descans abans de baixar el ritme…'
                   : 'Escalfar 10 minuts abans de la primera sèrie…',
        valor:esborrany.notes });
      dalt.appendChild(notes);
      cos.appendChild(dalt);
      nom.control.oninput = function(){ esborrany.nom = nom.control.value; };
      tip.control.onchange = function(){ esborrany.tipus = tip.control.value; };
      notes.control.oninput = function(){ esborrany.notes = notes.control.value; };

      function refrescaResum(){
        if (!resum) return;
        var peces = esborrany.exercicis.map(function(e){
          return { tipus_mesura:e.tipus_mesura, temps_s:parseInt(e.temps_s,10) || 0,
                   series:parseInt(e.series,10) || 1,
                   descans_s:parseInt(e.descans_s,10) || 0,
                   descans_post_s:parseInt(e.descans_post_s,10) || 0 };
        });
        var min = E.duradaCardio({ rondes:parseInt(esborrany.rondes,10) || 1,
          descans_ronda_s:parseInt(esborrany.descans_ronda_s,10) || 0 }, peces);
        resum.textContent = esborrany.exercicis.length
          ? 'La sessió durarà uns ' + min + ' minuts'
          : 'Afegeix exercicis i aquí veuràs quant durarà';
      }

      // ── Llista d'exercicis ────────────────────────────────────
      var capE = h('div','display:flex;align-items:center;justify-content:space-between;'+
        'gap:12px;margin-bottom:13px;flex-wrap:wrap');
      capE.appendChild(E.titol(card ? 'Els trams de la sessió' : 'Exercicis de la rutina', 16));
      var selNou = E.camp({ et:'Afegir de la biblioteca', tipus:'select',
        opcions:[{v:'',t:'Tria un exercici\u2026'}].concat(biblio.map(function(x){
          return { v:x.id, t:x.nom + (x.grup_muscular ? '  \u00b7  ' + x.grup_muscular : '') };
        })) });
      selNou.style.minWidth = '300px';
      var grupAfegir = h('div','display:flex;gap:9px;align-items:flex-end;flex-wrap:wrap');
      grupAfegir.appendChild(selNou);
      var bImp = E.boto(card ? 'Importar d\'una altra sessió' : 'Importar d\'una rutina',
        function(){ dialegImportar(); }, 'buit');
      bImp.style.padding = '10px 15px'; bImp.style.fontSize = '11.5px';
      grupAfegir.appendChild(bImp);
      capE.appendChild(grupAfegir);
      cos.appendChild(capE);

      var zonaImp = h('div','margin-bottom:14px');
      cos.appendChild(zonaImp);

      // Copia els exercicis d'una altra rutina de la mateixa mena.
      function dialegImportar(){
        E.buida(zonaImp);
        var box = h('div','background:'+C.panell+';border:1px solid '+E.accent()+'55;'+
          'padding:15px 17px');
        box.appendChild(E.titol('Importar exercicis d\'una altra rutina', 15));
        box.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';line-height:1.55;'+
          'margin:5px 0 13px','Els exercicis s\'afegeixen al final. Fes-ho servir per '+
          'reutilitzar el teu escalfament dins de cada sessió.'));
        var carr = E.carregant('Buscant rutines…');
        box.appendChild(carr);
        zonaImp.appendChild(box);

        E.sb.from('routines').select('id,nom,tipus').eq('mena', vista.mena)
          .is('deleted_at', null).order('nom')
          .then(function(rr){
            carr.remove();
            if (rr.error){ box.appendChild(E.avis(rr.error.message)); return; }
            var altres = (rr.data || []).filter(function(x){ return x.id !== vista.id; });
            if (!altres.length){
              box.appendChild(E.buit('No hi ha cap altra rutina d\'aquesta mena per importar.'));
              return;
            }
            var sel = E.camp({ et:'Rutina d\'origen', tipus:'select',
              opcions:[{v:'',t:'Tria una rutina\u2026'}].concat(altres.map(function(x){
                return { v:x.id, t:x.nom + (x.tipus ? '  \u00b7  ' + x.tipus : '') };
              })) });
            var blo = E.camp({ et:'Assignar al bloc', tipus:'select', valor:'Escalfament',
              opcions:opcions(BLOCS[vista.mena], 'Mantenir el bloc original') });
            var g3 = h('div','display:grid;grid-template-columns:2fr 1fr;gap:11px;margin-bottom:13px');
            g3.appendChild(sel); g3.appendChild(blo);
            box.appendChild(g3);
            var missI = h('div','margin-bottom:11px');
            box.appendChild(missI);
            var fila2 = h('div','display:flex;gap:8px');
            var bOk = E.boto('Importar', function(){
              E.buida(missI);
              if (!sel.control.value){
                missI.appendChild(E.avis('Tria una rutina.')); return;
              }
              bOk.disabled = true; bOk.textContent = 'Important…';
              E.sb.from('routine_exercises').select('*').eq('routine_id', sel.control.value)
                .order('ordre').then(function(d){
                  bOk.disabled = false; bOk.textContent = 'Importar';
                  if (d.error){ missI.appendChild(E.avis(d.error.message)); return; }
                  var files = d.data || [];
                  if (!files.length){
                    missI.appendChild(E.avis('Aquella rutina no té exercicis.')); return;
                  }
                  files.forEach(function(e){
                    esborrany.exercicis.push({
                      exercise_id: e.exercise_id,
                      bloc: blo.control.value || e.bloc || '',
                      series: e.series,
                      tipus_mesura: e.tipus_mesura || 'reps',
                      reps: e.reps || '',
                      temps_s: e.temps_s == null ? '' : e.temps_s,
                      distancia_m: e.distancia_m == null ? '' : e.distancia_m,
                      intensitat: e.intensitat || '',
                      tempo: e.tempo || '',
                      descans_s: e.descans_s || '',
                      descans_post_s: e.descans_post_s == null ? '' : e.descans_post_s,
                      superserie: e.superserie || '',
                      rir: e.rir == null ? '' : e.rir, notes: e.notes || ''
                    });
                  });
                  E.buida(zonaImp);
                  pintaExercicis();
                });
            });
            bOk.style.padding = '9px 16px'; bOk.style.fontSize = '12px';
            var bNo = E.boto('Tancar', function(){ E.buida(zonaImp); }, 'buit');
            bNo.style.padding = '9px 16px'; bNo.style.fontSize = '12px';
            fila2.appendChild(bOk); fila2.appendChild(bNo);
            box.appendChild(fila2);
          });
      }

      var contenidor = h('div','display:flex;flex-direction:column;gap:9px');
      cos.appendChild(contenidor);

      selNou.control.onchange = function(){
        var id = selNou.control.value;
        if (!id) return;
        esborrany.exercicis.push(card
          ? { exercise_id:id, bloc:'Principal', series:1, tipus_mesura:'temps',
              temps_s:40, reps:'', distancia_m:'', intensitat:'',
              tempo:'', descans_s:20, descans_post_s:'', superserie:'', rir:'', notes:'' }
          : { exercise_id:id, bloc:'Principal', series:3, tipus_mesura:'reps',
              reps:'8-10', temps_s:'', distancia_m:'', intensitat:'',
              tempo:'', descans_s:90, descans_post_s:120, superserie:'', rir:'', notes:'' });
        selNou.control.value = '';
        pintaExercicis();
      };

      function pintaExercicis(){
        E.buida(contenidor);
        refrescaResum();
        if (!esborrany.exercicis.length){
          contenidor.appendChild(E.buit(card
            ? 'Encara no hi ha cap tram. Fes servir el selector de dalt: cada tram és '+
              'un exercici amb el seu temps i el seu descans.'
            : 'Encara no has afegit cap exercici. Fes servir el selector de dalt.'));
          return;
        }
        esborrany.exercicis.forEach(function(e, i){
          var x = mapa[e.exercise_id] || { nom:'Exercici' };
          var mateixSup = e.superserie &&
            ((esborrany.exercicis[i-1] && esborrany.exercicis[i-1].superserie === e.superserie) ||
             (esborrany.exercicis[i+1] && esborrany.exercicis[i+1].superserie === e.superserie));
          var f = h('div','background:'+C.panell+';border:1px solid '+
            (mateixSup ? C.or+'55' : C.vora)+';padding:13px 15px'+
            (mateixSup ? ';border-left:3px solid '+C.or : ''));

          var cap = h('div','display:flex;align-items:center;gap:12px;margin-bottom:11px');
          if (e.superserie) cap.appendChild(h('div','flex-shrink:0;width:24px;height:24px;'+
            'background:'+C.or+'22;border:1px solid '+C.or+';display:flex;align-items:center;'+
            "justify-content:center;font-family:'Cinzel',serif;font-weight:700;font-size:12px;"+
            'color:'+C.or, e.superserie));
          cap.appendChild(h('div',"width:22px;flex-shrink:0;font-family:'Cinzel',serif;"+
            'font-weight:700;font-size:15px;color:'+C.apagat, String(i+1)));
          var nm = h('div','flex:1;min-width:0');
          nm.appendChild(h('div','font-size:14.5px;font-weight:600;color:'+C.os, x.nom));
          if (x.grup_muscular) nm.appendChild(h('div','font-size:11px;color:'+C.apagat+';'+
            'margin-top:2px', x.grup_muscular));
          cap.appendChild(nm);

          var ctrl = h('div','display:flex;gap:5px;flex-shrink:0');
          function petit(txt, fn, actiu){
            var b = document.createElement('button');
            b.textContent = txt;
            b.disabled = !actiu;
            b.setAttribute('style','width:29px;height:29px;background:transparent;'+
              'border:1px solid '+C.vora+';color:'+(actiu ? C.pedra : '#3a3733')+';'+
              'cursor:'+(actiu?'pointer':'default')+';font-size:13px;line-height:1');
            b.onclick = fn;
            return b;
          }
          ctrl.appendChild(petit('\u2191', function(){
            var t = esborrany.exercicis[i-1];
            esborrany.exercicis[i-1] = e; esborrany.exercicis[i] = t;
            pintaExercicis();
          }, i > 0));
          ctrl.appendChild(petit('\u2193', function(){
            var t = esborrany.exercicis[i+1];
            esborrany.exercicis[i+1] = e; esborrany.exercicis[i] = t;
            pintaExercicis();
          }, i < esborrany.exercicis.length - 1));
          var esb = petit('\u00d7', function(){
            esborrany.exercicis.splice(i,1); pintaExercicis();
          }, true);
          esb.style.borderColor = C.carmesi+'66'; esb.style.color = C.accio;
          ctrl.appendChild(esb);
          cap.appendChild(ctrl);
          f.appendChild(cap);

          var bloc = E.camp({ et:'Bloc', tipus:'select', valor:e.bloc,
            opcions:opcions(BLOCS[vista.mena]) });
          var sup = E.camp({ et:card ? 'Bloc seguit' : 'Supersèrie', tipus:'select',
            valor:e.superserie,
            opcions:[{v:'',t:card ? 'Tram solt' : 'Exercici solt'}].concat(LLETRES.map(function(l){
              return { v:l, t:'Grup ' + l };
            })) });
          var ser = E.camp({ et:card ? 'Repeticions del tram' : 'Sèries', tipus:'number',
            valor:e.series });
          var mes = E.camp({ et:'Es mesura en', tipus:'select', valor:e.tipus_mesura,
            opcions:MESURES });
          var des = E.camp({ et:'Descans (s)', tipus:'number', valor:e.descans_s });
          var dpo = E.camp({ et:'Descans fins al següent (s)', tipus:'number',
            valor:e.descans_post_s });

          // El camp de la quantitat canvia segons com es mesuri
          var quant = h('div');
          function pintaQuant(){
            E.buida(quant);
            var c;
            if (e.tipus_mesura === 'temps'){
              c = E.camp({ et:'Segons de feina', tipus:'number', valor:e.temps_s, marca:'40' });
              c.control.oninput = function(){ e.temps_s = c.control.value; refrescaResum(); };
            } else if (e.tipus_mesura === 'distancia'){
              c = E.camp({ et:'Metres', tipus:'number', valor:e.distancia_m, marca:'400' });
              c.control.oninput = function(){ e.distancia_m = c.control.value; };
            } else {
              c = E.camp({ et:'Reps', valor:e.reps, marca:card ? '20' : '8-10' });
              c.control.oninput = function(){ e.reps = c.control.value; };
            }
            quant.appendChild(c);
          }
          pintaQuant();

          var gg = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:9px');
          [bloc, sup, ser, mes].forEach(function(c){ gg.appendChild(c); });
          gg.appendChild(quant);
          f.appendChild(gg);

          var extra = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));'+
            'gap:9px;margin-top:9px');
          extra.appendChild(des);
          extra.appendChild(dpo);
          if (card){
            var itn = E.camp({ et:'Intensitat', valor:e.intensitat,
              marca:'9 km/h  ·  RPE 8  ·  zona 4' });
            itn.control.oninput = function(){ e.intensitat = itn.control.value; };
            extra.appendChild(itn);
          } else {
            var tem = E.camp({ et:'Tempo', marca:'3-1-1', valor:e.tempo });
            var rir = E.camp({ et:'RIR', tipus:'number', pas:'0.5', valor:e.rir });
            tem.control.oninput = function(){ e.tempo = tem.control.value; };
            rir.control.oninput = function(){ e.rir = rir.control.value; };
            extra.appendChild(tem); extra.appendChild(rir);
          }
          f.appendChild(extra);

          bloc.control.onchange = function(){ e.bloc = bloc.control.value; };
          sup.control.onchange = function(){ e.superserie = sup.control.value; pintaExercicis(); };
          ser.control.oninput  = function(){ e.series = ser.control.value; refrescaResum(); };
          mes.control.onchange = function(){
            e.tipus_mesura = mes.control.value;
            pintaQuant();
            refrescaResum();
          };
          des.control.oninput  = function(){ e.descans_s = des.control.value; refrescaResum(); };
          dpo.control.oninput  = function(){ e.descans_post_s = dpo.control.value; refrescaResum(); };

          contenidor.appendChild(f);
        });
      }
      pintaExercicis();

      var miss = h('div','margin-top:18px');
      cos.appendChild(miss);

      var fila = h('div','display:flex;gap:9px;margin-top:14px;flex-wrap:wrap');
      var etiq = nou ? (card ? 'Crear la sessió' : 'Crear rutina') : 'Desar canvis';
      var b = E.boto(etiq, function(){
        E.buida(miss);
        if (!esborrany.nom.trim()){
          miss.appendChild(E.avis(card ? 'La sessió necessita un nom.'
                                       : 'La rutina necessita un nom.')); return;
        }
        if (!esborrany.exercicis.length){
          miss.appendChild(E.avis('Afegeix com a mínim un exercici.')); return;
        }
        b.disabled = true; b.textContent = 'Desant…';

        var caps = { nom:esborrany.nom.trim(), tipus:esborrany.tipus || null,
                     notes:esborrany.notes.trim() || null, mena:vista.mena,
                     rondes: card ? (parseInt(esborrany.rondes, 10) || null) : null,
                     descans_ronda_s: card
                       ? (parseInt(esborrany.descans_ronda_s, 10) || null) : null };
        var p;
        if (nou){
          caps.coach_id = E.perfil.id;
          p = E.sb.from('routines').insert(caps).select('id').single();
        } else {
          caps.updated_at = new Date().toISOString();
          p = E.sb.from('routines').update(caps).eq('id', vista.id).select('id').single()
            .then(function(r){
              if (r.error) return r;
              return E.sb.from('routine_exercises').delete().eq('routine_id', vista.id)
                .then(function(d){ return d.error ? d : r; });
            });
        }

        p.then(function(r){
          if (r.error) throw new Error(r.error.message);
          var rid = r.data.id;
          var files = esborrany.exercicis.map(function(e, i){
            return {
              routine_id: rid, exercise_id: e.exercise_id, ordre: i + 1,
              bloc: e.bloc || null,
              series: parseInt(e.series, 10) || 1,
              tipus_mesura: e.tipus_mesura || 'reps',
              reps: String(e.reps || '').trim() || null,
              temps_s: e.temps_s === '' ? null : parseInt(e.temps_s, 10),
              distancia_m: e.distancia_m === '' ? null : parseInt(e.distancia_m, 10),
              intensitat: String(e.intensitat || '').trim() || null,
              tempo: String(e.tempo || '').trim() || null,
              descans_s: e.descans_s === '' ? null : parseInt(e.descans_s, 10),
              descans_post_s: e.descans_post_s === '' ? null : parseInt(e.descans_post_s, 10),
              superserie: String(e.superserie || '').trim() || null,
              rir: e.rir === '' ? null : e.rir,
              notes: String(e.notes || '').trim() || null
            };
          });
          return E.sb.from('routine_exercises').insert(files).then(function(d){
            if (d.error) throw new Error(d.error.message);
            return rid;
          });
        }).then(function(rid){
          esborrany = null;
          vista = { mode:'fitxa', id:rid, mena:vista.mena };
          E.repinta();
        }).catch(function(err){
          b.disabled = false; b.textContent = etiq;
          miss.appendChild(E.avis(err.message));
        });
      });
      fila.appendChild(b);

      if (!nou){
        var esb = E.boto(card ? 'Esborrar la sessió' : 'Esborrar rutina', function(){
          E.buida(miss);
          var conf = h('div','padding:12px 14px;background:'+C.carmesi+'22;'+
            'border-left:3px solid '+C.carmesi);
          conf.appendChild(h('div','font-size:13px;color:'+C.os+';line-height:1.5;margin-bottom:10px',
            "S'amagarà de la llista. Les sessions ja registrades es conserven."));
          var bs = E.boto('Sí, esborrar', function(){
            E.sb.from('routines').update({ deleted_at:new Date().toISOString() })
              .eq('id', vista.id).then(function(rr){
                if (rr.error){ E.buida(miss); miss.appendChild(E.avis(rr.error.message)); return; }
                esborrany = null; vista = { mode:'llista', mena:vista.mena }; E.repinta();
              });
          }, 'perill');
          bs.style.padding = '8px 15px'; bs.style.fontSize = '12px';
          conf.appendChild(bs);
          miss.appendChild(conf);
        }, 'perill');
        fila.appendChild(esb);
      }
      cos.appendChild(fila);
    });
}

E.seccions.push({
  id:'rutines', etiqueta:'Rutines', icona:'\u25A4', rols:['coach','nutritionist'],
  pinta: function(cont){
    if (vista.mode === 'editor' && E.perfil.role === 'coach') return editor(cont);
    if (vista.mode === 'fitxa' && vista.id) return fitxa(cont);
    return llista(cont);
  }
});
})();
