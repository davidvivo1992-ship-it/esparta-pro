// Metabolisme Esparta · Espartans
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null, filtre:'tots' };

function fila(a){
  var p = a.usuari || {};
  var est = E.ESTATS[a.estat] || { t:a.estat, c:C.apagat };
  var f = h('div','display:flex;align-items:center;gap:14px;padding:13px 16px;'+
    'background:'+C.panell+';border:1px solid '+C.vora+';cursor:pointer');
  f.onmouseenter = function(){ f.style.borderColor = E.accent()+'66'; };
  f.onmouseleave = function(){ f.style.borderColor = C.vora; };
  f.onclick = function(){ vista = { mode:'fitxa', id:a.id, filtre:vista.filtre }; E.repinta(); };

  f.appendChild(h('div','width:36px;height:36px;flex-shrink:0;background:'+C.panell2+';'+
    'border:1px solid '+C.vora+';display:flex;align-items:center;justify-content:center;'+
    'font-weight:700;font-size:13px;color:'+C.pedra, E.inicials(p)));

  var t = h('div','flex:1;min-width:0');
  t.appendChild(h('div','font-size:14.5px;font-weight:600;color:'+C.os, E.nomComplet(p)));
  t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:2px',
    (E.OBJECTIUS[a.objectiu] || 'sense objectiu') + ' \u00b7 ' + (E.NIVELLS[a.nivell] || a.nivell)));
  f.appendChild(t);

  var d = h('div','display:flex;align-items:center;gap:16px;flex-shrink:0');
  d.appendChild(h('div','font-size:12px;color:'+C.apagat+';text-align:right',
    a.xp_total ? a.xp_total + ' XP' : '\u2014'));
  d.appendChild(E.etiqueta(est.t, est.c));
  f.appendChild(d);
  return f;
}

function llista(cont){
  var accions = [];
  if (E.perfil.role === 'coach')
    accions.push(E.boto("Alta d'Espartà", function(){
      vista = { mode:'alta', filtre:vista.filtre }; E.repinta();
    }));
  cont.appendChild(E.capcalera('Espartans',
    E.perfil.role === 'coach' ? 'La teva tropa' : 'Espartans que tens assignats', accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  E.sb.from('athletes')
    .select('id,estat,nivell,objectiu,xp_total,created_at,'+
            'usuari:profiles!athletes_user_id_fkey(nom,cognoms,email,telefon)')
    .order('created_at', { ascending:false })
    .then(function(r){
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var dades = r.data || [];
      if (!dades.length){
        cos.appendChild(E.buit(E.perfil.role === 'coach'
          ? "Cap Espartà encara. Prem «Alta d'Espartà» per començar."
          : "Encara no t'han assignat cap Espartà."));
        return;
      }

      var filtres = h('div','display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap');
      var opcions = [{v:'tots',t:'Tots'}].concat(E.opcionsDe(E.ESTATS));
      opcions.forEach(function(o){
        var n = o.v === 'tots' ? dades.length
              : dades.filter(function(a){ return a.estat === o.v; }).length;
        if (o.v !== 'tots' && !n) return;
        var sel = vista.filtre === o.v;
        var b = document.createElement('button');
        b.textContent = o.t + ' \u00b7 ' + n;
        b.setAttribute('style','padding:6px 13px;font-size:12px;font-weight:600;cursor:pointer;'+
          "font-family:'Barlow',sans-serif;background:"+(sel ? E.accent()+'22' : 'transparent')+';'+
          'border:1px solid '+(sel ? E.accent() : C.vora)+';'+
          'color:'+(sel ? C.os : C.pedra));
        b.onclick = function(){ vista.filtre = o.v; E.repinta(); };
        filtres.appendChild(b);
      });
      cos.appendChild(filtres);

      var visibles = vista.filtre === 'tots' ? dades
        : dades.filter(function(a){ return a.estat === vista.filtre; });
      var box = h('div','display:flex;flex-direction:column;gap:7px');
      visibles.forEach(function(a){ box.appendChild(fila(a)); });
      cos.appendChild(box);
    });
}

// ── Fitxa ──────────────────────────────────────────────────────────
function fitxa(cont){
  var accions = [E.boto('Tornar', function(){
    vista = { mode:'llista', filtre:vista.filtre }; E.repinta();
  }, 'buit')];
  if (E.perfil.es_propietari)
    accions.unshift(E.boto('Esborrar', function(){
      vista.mode = 'esborrar'; E.repinta();
    }, 'perill'));
  if (E.perfil.role === 'coach')
    accions.unshift(E.boto('Editar', function(){
      vista.mode = 'editar'; E.repinta();
    }));
  cont.appendChild(E.capcalera("Fitxa de l'Espartà", null, accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  // Obrir la fitxa ensenya pesatges, perimetres i notes de salut:
  // queda anotat qui ho ha fet i de qui.
  E.registra('obre_fitxa', 'athletes', vista.id);

  Promise.all([
    E.sb.from('athletes')
      .select('*,usuari:profiles!athletes_user_id_fkey(nom,cognoms,email,telefon),'+
              'entrenador:profiles!athletes_coach_id_fkey(nom,cognoms),'+
              'nutricionista:profiles!athletes_nutritionist_id_fkey(nom,cognoms)')
      .eq('id', vista.id).single(),
    E.sb.from('measurements').select('*')
      .eq('athlete_id', vista.id).order('data',{ascending:false}).limit(10),
    E.sb.from('workout_sessions').select('data,estat,rpe,dia_previst')
      .eq('athlete_id', vista.id).order('data',{ascending:false}).limit(10),
    E.sb.from('athlete_notes')
      .select('id,cos,visibilitat,created_at,autor:profiles!athlete_notes_autor_id_fkey(nom,cognoms)')
      .eq('athlete_id', vista.id).order('created_at',{ascending:false}).limit(12)
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var a = r[0].data, p = a.usuari || {};
    var est = E.ESTATS[a.estat] || { t:a.estat, c:C.apagat };

    var cap = h('div','display:flex;align-items:center;gap:16px;margin-bottom:22px');
    cap.appendChild(h('div','width:56px;height:56px;flex-shrink:0;background:'+E.accent()+';'+
      "display:flex;align-items:center;justify-content:center;font-family:'Cinzel',serif;"+
      'font-weight:700;font-size:20px;color:#fff', E.inicials(p)));
    var ct = h('div');
    ct.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:22px;"+
      'color:'+C.os, E.nomComplet(p)));
    ct.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';margin-top:2px',
      (p.email || '') + (p.telefon ? ' \u00b7 ' + p.telefon : '')));
    cap.appendChild(ct);
    var e = E.etiqueta(est.t, est.c); e.style.marginLeft = 'auto';
    cap.appendChild(e);
    cos.appendChild(cap);

    var dades = [
      ['Objectiu', E.OBJECTIUS[a.objectiu] || '\u2014'],
      ['Nivell', E.NIVELLS[a.nivell] || a.nivell],
      ['Experiència', (a.xp_total || 0) + ' XP'],
      ['Sexe', E.SEXES[a.sexe] || '\u2014'],
      ['Alçada', a.altura_cm ? a.altura_cm + ' cm' : '\u2014'],
      ['Naixement', a.data_naixement ? E.data(a.data_naixement) : '\u2014'],
      ['Entrenador', E.nomComplet(a.entrenador)],
      ['Nutricionista', a.nutricionista ? E.nomComplet(a.nutricionista) : 'sense assignar'],
      ['Alta', E.data(a.created_at)]
    ];
    var g = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));'+
      'gap:1px;background:'+C.vora+';margin-bottom:26px');
    dades.forEach(function(d){
      var c = h('div','background:'+C.panell+';padding:13px 16px');
      c.appendChild(h('div','font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;'+
        'color:'+C.apagat+';font-weight:700;margin-bottom:4px', d[0]));
      c.appendChild(h('div','font-size:14px;color:'+C.os+';font-weight:500', d[1]));
      g.appendChild(c);
    });
    cos.appendChild(g);

    var cols = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px');

    // Pesatges
    var mesures = h('div');
    var capM = h('div','display:flex;align-items:center;justify-content:space-between;gap:10px');
    capM.appendChild(E.titol('Pesatges', 15));
    var bAfegir = E.boto('Afegir', function(){ E.formPesatge(vista.id, capM); }, 'buit');
    bAfegir.style.padding = '6px 13px'; bAfegir.style.fontSize = '11px';
    capM.appendChild(bAfegir);
    mesures.appendChild(capM);

    var lm = h('div','margin-top:11px;display:flex;flex-direction:column;gap:1px;background:'+C.vora);
    var dm = r[1].data || [];
    if (!dm.length) lm.appendChild(E.buit('Cap pesatge registrat.'));
    dm.forEach(function(m){
      var nPer = (E.PERIMETRES || []).filter(function(p){ return m[p[0]] != null; }).length;
      var nFot = (E.FOTOS || []).filter(function(p){ return m[p[0]]; }).length;
      var nNot = (m.notes_entrenador ? 1 : 0) + (m.notes_nutricionista ? 1 : 0);
      var ampliat = true;   // sempre s'obre: dins hi ha les notes dels dos
      var f = h('div','display:flex;justify-content:space-between;align-items:center;gap:12px;'+
        'background:'+C.panell+';padding:11px 14px'+(ampliat ? ';cursor:pointer' : ''));
      var esq = h('div','display:flex;gap:10px;align-items:baseline;min-width:0');
      esq.appendChild(h('div','font-size:12.5px;color:'+C.pedra, E.data(m.data)));
      if (ampliat){
        var marques = [];
        if (nPer) marques.push(nPer + ' perímetres');
        if (nFot) marques.push(nFot + (nFot === 1 ? ' foto' : ' fotos'));
        if (nNot) marques.push(nNot === 1 ? '1 nota' : '2 notes');
        esq.appendChild(h('div','font-size:10.5px;color:'+C.or, marques.join(' \u00b7 ')));
      }
      f.appendChild(esq);
      var v = h('div','display:flex;gap:13px;align-items:baseline;flex-shrink:0');
      v.appendChild(h('div','font-size:14px;font-weight:600;color:'+C.os,
        m.pes_kg ? m.pes_kg + ' kg' : '\u2014'));
      if (m.greix_pct) v.appendChild(h('div','font-size:12px;color:'+C.apagat,
        m.greix_pct + '%'));
      f.appendChild(v);
      if (ampliat) f.onclick = function(){ E.detallPesatge(m, f); };
      lm.appendChild(f);
    });
    mesures.appendChild(lm);
    cols.appendChild(mesures);

    // Sessions
    var sess = h('div');
    sess.appendChild(E.titol('Últimes sessions', 15));
    var ls = h('div','margin-top:11px;display:flex;flex-direction:column;gap:1px;background:'+C.vora);
    var ds = r[2].data || [];
    if (!ds.length) ls.appendChild(E.buit('Cap sessió registrada.'));
    var colorEstat = { completada:C.oliva, pendent:C.ambre, en_curs:E.accent(), saltada:C.accio };
    var DIES = ['dilluns','dimarts','dimecres','dijous','divendres','dissabte','diumenge'];
    ds.forEach(function(s){
      var f = h('div','display:flex;justify-content:space-between;align-items:center;'+
        'background:'+C.panell+';padding:10px 14px');
      var esqS = h('div','min-width:0');
      esqS.appendChild(h('div','font-size:12.5px;color:'+C.pedra, E.data(s.data)));
      // Setmana flexible: l'Esparta pot fer avui l'entreno d'un altre dia
      var real = new Date(s.data + 'T00:00:00').getDay();
      real = real === 0 ? 7 : real;
      if (s.dia_previst && s.dia_previst !== real)
        esqS.appendChild(h('div','font-size:10.5px;color:'+C.or+';margin-top:2px',
          'entreno de ' + DIES[s.dia_previst - 1]));
      f.appendChild(esqS);
      var v = h('div','display:flex;gap:12px;align-items:center');
      if (s.rpe) v.appendChild(h('div','font-size:11.5px;color:'+C.apagat,'RPE '+s.rpe));
      v.appendChild(E.etiqueta(String(s.estat).replace('_',' '), colorEstat[s.estat] || C.apagat));
      f.appendChild(v);
      ls.appendChild(f);
    });
    sess.appendChild(ls);
    cols.appendChild(sess);

    // Nutrició en lectura: l'entrenador veu quin pla de dieta té actiu
    var nutri = h('div');
    nutri.appendChild(E.titol('Dieta activa', 15));
    var ld = h('div','margin-top:11px');
    ld.appendChild(E.carregant());
    nutri.appendChild(ld);
    cols.appendChild(nutri);
    var fa14 = new Date(Date.now() - 13*86400000).toISOString().slice(0,10);
    Promise.all([
      E.sb.from('diet_assignments')
        .select('data_inici,pla:diet_plans(nom,kcal_obj,prot_obj,notes,'+
                'diet_plan_options(tipus_apat))')
        .eq('athlete_id', vista.id).eq('estat','actiu')
        .order('created_at',{ascending:false}).limit(1),
      E.sb.from('meal_logs').select('data,tipus_apat,fet')
        .eq('athlete_id', vista.id).gte('data', fa14)
    ])
      .then(function(rr){
        var rd = rr[0], logs = (rr[1].data || []).filter(function(x){ return x.fet; });
        E.buida(ld);
        if (rd.error){ ld.appendChild(E.avis(rd.error.message)); return; }
        var ad = (rd.data || [])[0];
        if (!ad || !ad.pla){
          ld.appendChild(E.buit('Sense pla de dieta actiu.'));
          return;
        }
        var t = h('div','background:'+C.panell+';border:1px solid '+C.vora+';'+
          'border-left:3px solid '+C.verd+';padding:13px 15px');
        t.appendChild(h('div','font-size:14.5px;font-weight:600;color:'+C.os, ad.pla.nom));
        var meta = [ad.pla.kcal_obj + ' kcal'];
        if (ad.pla.prot_obj) meta.push(ad.pla.prot_obj + 'g proteïna');
        meta.push('des del ' + E.data(ad.data_inici));
        t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:4px',
          meta.join(' \u00b7 ')));
        // Constancia: quants apats marca de tots els que li toquen
        var perDia = Object.keys((ad.pla.diet_plan_options || []).reduce(function(m, o){
          m[o.tipus_apat] = 1; return m;
        }, {})).length;
        if (perDia){
          var pct = Math.round(logs.length / (perDia * 14) * 100);
          if (pct > 100) pct = 100;
          var fc = h('div','display:flex;align-items:baseline;gap:9px;margin-top:11px;'+
            'padding-top:11px;border-top:1px solid '+C.vora);
          fc.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:19px;"+
            'color:'+(pct >= 80 ? C.oliva : pct >= 50 ? C.ambre : C.accio), pct + '%'));
          fc.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.4',
            'de constància amb la dieta · ' + logs.length + ' de ' + (perDia * 14) +
            ' àpats en 14 dies'));
          t.appendChild(fc);
        }
        if (ad.pla.notes) t.appendChild(h('div','font-size:12.5px;color:'+C.pedra+';'+
          'line-height:1.55;margin-top:9px;white-space:pre-wrap', ad.pla.notes));
        ld.appendChild(t);
      });

    cos.appendChild(cols);

    // El pla d'aquest Esparta, amb calendari propi editable
    if (E.plaAtleta) E.plaAtleta(cos, vista.id);

    // Missatges: el mateix fil que veu l'Esparta a la seva app
    if (E.filMissatges) E.filMissatges(cos, vista.id, E.nomComplet(p));

    // Notes
    var notes = h('div','margin-top:26px');
    notes.appendChild(E.titol('Notes de seguiment', 15));
    notes.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
      'Visibles per a l\'entrenador i la nutricionista. L\'Espartà no les veu.'));

    var nt = document.createElement('textarea');
    nt.rows = 2;
    nt.placeholder = 'Escriu una nota…';
    nt.setAttribute('style','width:100%;padding:11px 13px;margin-top:11px;background:'+C.fons+';'+
      'border:1px solid rgba(194,176,106,.24);color:'+C.os+";font-size:14px;font-family:'Barlow',sans-serif");
    notes.appendChild(nt);
    var missN = h('div','margin-top:9px');
    notes.appendChild(missN);
    var bn = E.boto('Desar nota', function(){
      E.buida(missN);
      if (!nt.value.trim()) return;
      bn.disabled = true; bn.textContent = 'Desant…';
      E.sb.from('athlete_notes').insert({
        athlete_id: vista.id, autor_id: E.perfil.id,
        cos: nt.value.trim(), visibilitat: 'professionals'
      }).then(function(rr){
        bn.disabled = false; bn.textContent = 'Desar nota';
        if (rr.error){ missN.appendChild(E.avis(rr.error.message)); return; }
        E.repinta();
      });
    });
    bn.style.marginTop = '4px';
    notes.appendChild(bn);

    var ln = h('div','margin-top:16px;display:flex;flex-direction:column;gap:1px;background:'+C.vora);
    var dn = r[3].data || [];
    if (!dn.length && !r[3].error) ln.appendChild(E.buit('Cap nota encara.'));
    if (r[3].error) ln.appendChild(E.avis(r[3].error.message));
    dn.forEach(function(n){
      var f = h('div','background:'+C.panell+';padding:12px 15px');
      var m = h('div','display:flex;gap:10px;align-items:baseline;margin-bottom:5px');
      m.appendChild(h('div','font-size:11.5px;font-weight:700;color:'+C.pedra,
        E.nomComplet(n.autor)));
      m.appendChild(h('div','font-size:11px;color:'+C.apagat, E.data(n.created_at)));
      f.appendChild(m);
      f.appendChild(h('div','font-size:13.5px;color:'+C.os+';line-height:1.5;'+
        'white-space:pre-wrap', n.cos));
      ln.appendChild(f);
    });
    notes.appendChild(ln);
    cos.appendChild(notes);
  });
}

// ── Editar ─────────────────────────────────────────────────────────
function editar(cont){
  cont.appendChild(E.capcalera("Editar l'Espartà", 'Estat, objectiu i assignació de nutricionista',
    [E.boto('Cancel\u00b7lar', function(){ vista.mode = 'fitxa'; E.repinta(); }, 'buit')]));
  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('athletes').select('*,usuari:profiles!athletes_user_id_fkey(nom,cognoms,email,telefon)')
      .eq('id', vista.id).single(),
    E.sb.from('profiles').select('id,nom,cognoms').eq('role','nutritionist').order('nom')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var a = r[0].data, p = a.usuari || {};
    var nutris = r[1].data || [];

    var f = E.targeta();
    f.style.maxWidth = '620px';
    f.appendChild(E.titol(E.nomComplet(p), 18));
    f.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';margin:3px 0 18px', p.email || ''));

    var est = E.camp({ et:'Estat', tipus:'select', valor:a.estat, opcions:E.opcionsDe(E.ESTATS) });
    var obj = E.camp({ et:'Objectiu', tipus:'select', valor:a.objectiu || '',
      opcions:[{v:'',t:'\u2014'}].concat(E.opcionsDe(E.OBJECTIUS)) });
    var niv = E.camp({ et:'Nivell', tipus:'select', valor:a.nivell, opcions:E.opcionsDe(E.NIVELLS) });
    var sex = E.camp({ et:'Sexe', tipus:'select', valor:a.sexe || '',
      opcions:[{v:'',t:'\u2014'}].concat(E.opcionsDe(E.SEXES)) });
    var alt = E.camp({ et:'Alçada (cm)', tipus:'number', pas:'0.1', valor:a.altura_cm || '' });
    var nai = E.camp({ et:'Data de naixement', tipus:'date', valor:a.data_naixement || '' });
    var nut = E.camp({ et:'Nutricionista', tipus:'select', valor:a.nutritionist_id || '',
      opcions:[{v:'',t:'Sense assignar'}].concat(nutris.map(function(n){
        return { v:n.id, t:E.nomComplet(n) };
      })) });

    var g = h('div','display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:8px');
    [est,obj,niv,sex,alt,nai].forEach(function(c){ g.appendChild(c); });
    f.appendChild(g);
    var gn = h('div','margin-bottom:18px');
    gn.appendChild(nut);
    if (!nutris.length)
      gn.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:6px;line-height:1.5',
        'Encara no hi ha cap nutricionista donada d\'alta al sistema.'));
    f.appendChild(gn);

    var miss = h('div','margin-bottom:14px');
    f.appendChild(miss);

    var b = E.boto('Desar canvis', function(){
      E.buida(miss);
      b.disabled = true; b.textContent = 'Desant…';
      E.sb.from('athletes').update({
        estat: est.control.value,
        objectiu: obj.control.value || null,
        nivell: niv.control.value,
        sexe: sex.control.value || null,
        altura_cm: alt.control.value || null,
        data_naixement: nai.control.value || null,
        nutritionist_id: nut.control.value || null
      }).eq('id', vista.id).then(function(rr){
        b.disabled = false; b.textContent = 'Desar canvis';
        if (rr.error){ miss.appendChild(E.avis(rr.error.message)); return; }
        vista.mode = 'fitxa'; E.repinta();
      });
    });
    f.appendChild(b);
    cos.appendChild(f);
  });
}

// ── Alta ───────────────────────────────────────────────────────────
// No hi ha paperera: la cascada de la base de dades s'ho emporta tot.
// Per aixo primer es compta que hi ha, es diu en veu alta, i es demana
// que s'escrigui el correu. Nomes ho veu el propietari.
function esborrar(cont){
  cont.appendChild(E.capcalera("Esborrar l'Espart\u00e0", 'Aix\u00f2 no es pot desfer',
    [E.boto('Cancel\u00b7lar', function(){ vista.mode = 'fitxa'; E.repinta(); }, 'buit')]));
  var cos = E.cos();
  cos.appendChild(E.carregant('Mirant qu\u00e8 hi ha desat\u2026'));
  cont.appendChild(cos);

  function compta(taula){
    return E.sb.from(taula).select('id', { count:'exact', head:true })
      .eq('athlete_id', vista.id);
  }

  Promise.all([
    E.sb.from('athletes')
      .select('id,estat,usuari:profiles!athletes_user_id_fkey(nom,cognoms,email)')
      .eq('id', vista.id).single(),
    compta('measurements'),
    compta('workout_sessions'),
    compta('athlete_messages'),
    compta('athlete_notes'),
    compta('meal_logs')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var a = r[0].data, p = a.usuari || {};
    var correu = (p.email || '').trim();

    var f = E.targeta();
    f.style.maxWidth = '620px';
    f.style.borderLeft = '3px solid ' + C.accio;

    f.appendChild(E.titol(E.nomComplet(p), 18));
    f.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';margin:3px 0 16px', correu));

    var dades = [
      ['Pesatges', r[1].count || 0],
      ['Sessions', r[2].count || 0],
      ['Missatges', r[3].count || 0],
      ['Notes', r[4].count || 0],
      ['\u00c0pats', r[5].count || 0]
    ];
    var total = dades.reduce(function(n, d){ return n + d[1]; }, 0);

    f.appendChild(h('div','font-size:10px;letter-spacing:.13em;text-transform:uppercase;'+
      'color:'+C.apagat+';font-weight:700;margin-bottom:8px', 'Es perdr\u00e0 per sempre'));
    var g = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:9px');
    dades.forEach(function(d){
      var c = h('div','background:'+C.fons+';border:1px solid '+C.vora+';padding:11px 13px');
      c.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:21px;"+
        'line-height:1;color:'+(d[1] ? C.os : C.apagat), String(d[1])));
      c.appendChild(h('div','font-size:10px;letter-spacing:.1em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.apagat+';margin-top:6px', d[0]));
      g.appendChild(c);
    });
    f.appendChild(g);

    f.appendChild(h('div','font-size:12.5px;color:'+C.pedra+';line-height:1.55;margin-top:14px',
      total
        ? "Tamb\u00e9 s'esborren el seu compte, el seu pla, la seva dieta, les fotos dels "
          + 'pesatges i les seves ins\u00edgnies. No en queda c\u00f2pia enlloc.'
        : "Aquest Espart\u00e0 no t\u00e9 res desat: segurament \u00e9s una prova. "
          + "S'esborren el compte i la fitxa."));

    if (a.estat !== 'baixa' && total){
      f.appendChild(h('div','height:12px'));
      f.appendChild(E.avis("Si \u00e9s un client que ha plegat, no cal esborrar-lo: posa'l "
        + "en estat Baixa des d'Editar. Perd l'acc\u00e9s a l'app i tu conserves "
        + "tot l'historial.", C.ambre));
    }

    f.appendChild(h('div','height:16px'));
    var camp = E.camp({ et:'Escriu ' + correu + ' per confirmar', marca:correu });
    camp.control.setAttribute('autocomplete','off');
    f.appendChild(camp);

    var miss = h('div','margin:13px 0');
    f.appendChild(miss);

    var b = E.boto('Esborrar per sempre', function(){
      E.buida(miss);
      if (camp.control.value.trim().toLowerCase() !== correu.toLowerCase()){
        miss.appendChild(E.avis('El correu no coincideix. Escriu-lo tal com surt a dalt.'));
        return;
      }
      b.disabled = true; b.textContent = 'Esborrant\u2026';
      E.crida('administracio', {
        accio:'esborrar_atleta', athlete_id: vista.id,
        confirmacio: camp.control.value.trim()
      }).then(function(rr){
        b.disabled = false; b.textContent = 'Esborrar per sempre';
        if (rr.error){ miss.appendChild(E.avis(rr.error)); return; }
        vista = { mode:'llista', filtre:'tots' };
        E.repinta();
      });
    }, 'perill');
    f.appendChild(b);
    cos.appendChild(f);
  });
}

function alta(cont){
  cont.appendChild(E.capcalera("Alta d'Espartà",
    "Es crea el compte i es prepara l'accés de l'Espartà",
    [E.boto('Cancel\u00b7lar', function(){
      vista = { mode:'llista', filtre:vista.filtre }; E.repinta();
    }, 'buit')]));
  var cos = E.cos();
  cont.appendChild(cos);

  var f = E.targeta();
  f.style.maxWidth = '620px';

  var nom = E.camp({ et:'Nom', marca:'Leònidas' });
  var cog = E.camp({ et:'Cognoms', marca:'de Esparta' });
  var cor = E.camp({ et:'Correu', tipus:'email', marca:'esparta@correu.cat' });
  var nai = E.camp({ et:'Data de naixement', tipus:'date' });
  var sex = E.camp({ et:'Sexe', tipus:'select', opcions:[{v:'',t:'\u2014'}].concat(E.opcionsDe(E.SEXES)) });
  var alt = E.camp({ et:'Alçada (cm)', tipus:'number', pas:'0.1', marca:'178' });
  var obj = E.camp({ et:'Objectiu', tipus:'select',
    opcions:[{v:'',t:'\u2014'}].concat(E.opcionsDe(E.OBJECTIUS)) });
  var niv = E.camp({ et:'Nivell', tipus:'select', valor:'recluta', opcions:E.opcionsDe(E.NIVELLS) });

  var g = h('div','display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:18px');
  [nom,cog,cor,nai,sex,alt,obj,niv].forEach(function(c){ g.appendChild(c); });
  f.appendChild(g);

  var missatge = h('div','margin-bottom:14px');
  f.appendChild(missatge);

  var b = E.boto("Donar d'alta", function(){
    E.buida(missatge);
    if (!nom.control.value.trim() || !cor.control.value.trim()){
      missatge.appendChild(E.avis('El nom i el correu són obligatoris.'));
      return;
    }
    b.disabled = true; b.textContent = 'Creant…';

    // Tot passa per una sola crida: o surt l'Espartà sencer, o surt
    // l'error de debo. Res a mitges, i cap compte orfe.
    E.crida('alta-esparta', {
      nom: nom.control.value.trim(),
      cognoms: cog.control.value.trim(),
      correu: cor.control.value.trim(),
      data_naixement: nai.control.value || null,
      sexe: sex.control.value || null,
      altura_cm: alt.control.value || null,
      objectiu: obj.control.value || null,
      nivell: niv.control.value
    }).then(function(r){
      b.disabled = false; b.textContent = "Donar d'alta";
      if (r.error){ missatge.appendChild(E.avis(r.error)); return; }
      resultat(cont, r, cor.control.value.trim(),
        (nom.control.value.trim() + ' ' + cog.control.value.trim()).trim());
    });
  });
  f.appendChild(b);
  cos.appendChild(f);

  cos.appendChild(h('div','max-width:620px;margin-top:14px;font-size:12px;color:'+C.apagat+';'+
    'line-height:1.55', "Es crea el compte i es prepara un enllaç perquè es posi la "+
    'contrasenya. El telèfon i les dades de salut es completen després des de la seva fitxa.'));
}

// ── Què ha passat amb l'alta ────────────────────────────────────
// L'enllaç es dona SEMPRE, hagi sortit el correu o no. Mentre el
// servidor de correu del projecte no estigui configurat, aquesta és
// l'única manera que l'Espartà pugui entrar: passar-li l'enllaç a mà.
function resultat(cont, r, correu, nomSencer){
  E.buida(cont);
  cont.appendChild(E.capcalera("Espartà donat d'alta", nomSencer || correu,
    [E.boto('Anar a la llista', function(){
      vista = { mode:'llista', filtre:'tots' }; E.repinta();
    })]));
  var cos = E.cos();
  var f = E.targeta();
  f.style.maxWidth = '620px';

  if (r.compte_reaprofitat){
    f.appendChild(E.avis('Aquest correu ja tenia un compte a mitges d\'una alta '+
      'anterior que va fallar. S\'ha aprofitat en comptes de crear-ne un altre.', C.ambre));
    f.appendChild(h('div','height:9px'));
  }

  f.appendChild(E.targetaAcces(r, correu));

  cos.appendChild(f);
  cont.appendChild(cos);
}

E.seccions.push({
  id:'espartans', etiqueta:'Espartans', icona:'\u2694', rols:['coach','nutritionist'],
  pinta: function(cont){
    if (E.novaAlta){ E.novaAlta = false; vista = { mode:'alta', filtre:'tots' }; }
    if (vista.mode === 'esborrar' && vista.id && E.perfil.es_propietari) return esborrar(cont);
    if (vista.mode === 'editar' && vista.id && E.perfil.role === 'coach') return editar(cont);
    if (vista.mode === 'fitxa' && vista.id) return fitxa(cont);
    if (vista.mode === 'alta' && E.perfil.role === 'coach') return alta(cont);
    return llista(cont);
  }
});
})();
