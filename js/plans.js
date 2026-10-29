// Metabolisme Esparta · Plans d'entrenament
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null };
var esborrany = null;   // { nom, setmanes, descripcio, dies:{ 's1d3': routineId } }

var DIES = ['Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte','Diumenge'];
var DIES_C = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];

function clau(s, d){ return 's' + s + 'd' + d; }

// ── Llista ─────────────────────────────────────────────────────────
function llista(cont){
  var accions = [];
  if (E.perfil.role === 'coach')
    accions.push(E.boto('Nou pla', function(){
      esborrany = { nom:'', setmanes:4, descripcio:'', dies:{} };
      vista = { mode:'editor', id:null }; E.repinta();
    }));
  cont.appendChild(E.capcalera('Plans',
    E.perfil.role === 'coach' ? 'Calendaris de rutines per assignar als Espartans'
                              : 'Plans en mode lectura', accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('training_plans').select('id,nom,setmanes,descripcio,plan_days(id)')
      .is('deleted_at', null).order('created_at',{ascending:false}),
    E.sb.from('plan_assignments').select('plan_id,estat').eq('estat','actiu')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var dades = r[0].data || [], assig = r[1].data || [];
    var compte = {};
    assig.forEach(function(a){ compte[a.plan_id] = (compte[a.plan_id] || 0) + 1; });

    if (!dades.length){
      cos.appendChild(E.buit(E.perfil.role === 'coach'
        ? 'Cap pla encara. Un pla és un calendari: quina rutina toca cada dia de la setmana.'
        : "L'entrenador encara no ha creat cap pla."));
      return;
    }
    var box = h('div','display:flex;flex-direction:column;gap:7px');
    dades.forEach(function(x){
      var dies = (x.plan_days || []).length;
      var n = compte[x.id] || 0;
      var f = h('div','display:flex;align-items:center;gap:15px;padding:14px 17px;'+
        'background:'+C.panell+';border:1px solid '+C.vora+';cursor:pointer');
      f.onmouseenter = function(){ f.style.borderColor = E.accent()+'66'; };
      f.onmouseleave = function(){ f.style.borderColor = C.vora; };
      f.onclick = function(){ vista = { mode:'fitxa', id:x.id }; E.repinta(); };
      var t = h('div','flex:1;min-width:0');
      t.appendChild(h('div','font-size:15px;font-weight:600;color:'+C.os, x.nom));
      t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
        x.setmanes + (x.setmanes === 1 ? ' setmana' : ' setmanes') + ' \u00b7 ' +
        dies + (dies === 1 ? ' dia programat' : ' dies programats')));
      f.appendChild(t);
      if (n) f.appendChild(E.etiqueta(n + (n === 1 ? ' Espartà' : ' Espartans'), C.oliva));
      box.appendChild(f);
    });
    cos.appendChild(box);
  });
}

// ── Fitxa ──────────────────────────────────────────────────────────
function fitxa(cont){
  var accions = [E.boto('Tornar', function(){ vista = { mode:'llista' }; E.repinta(); }, 'buit')];
  if (E.perfil.role === 'coach'){
    accions.unshift(E.boto('Assignar', function(){ vista.mode = 'assignar'; E.repinta(); }));
    accions.unshift(E.boto('Editar', function(){ carregaEsborrany(vista.id); }));
  }
  cont.appendChild(E.capcalera('Pla', null, accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('training_plans')
      .select('*,plan_days(*,'+
              'rutina:routines!plan_days_routine_id_fkey(nom,tipus,deleted_at),'+
              'cardio_rutina:routines!plan_days_cardio_routine_id_fkey'+
              '(nom,tipus,rondes,deleted_at))')
      .eq('id', vista.id).single(),
    E.sb.from('plan_assignments')
      .select('id,data_inici,data_fi,estat,'+
              'atleta:athletes(id,usuari:profiles!athletes_user_id_fkey(nom,cognoms))')
      .eq('plan_id', vista.id).order('created_at',{ascending:false})
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var x = r[0].data, dies = x.plan_days || [];
    var mapa = {};
    dies.forEach(function(d){ mapa[clau(d.setmana, d.dia_setmana)] = d; });

    var cap = h('div','margin-bottom:22px');
    cap.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:24px;"+
      'color:'+C.os, x.nom));
    cap.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';margin-top:6px',
      x.setmanes + (x.setmanes === 1 ? ' setmana' : ' setmanes')));
    if (x.descripcio) cap.appendChild(h('div','font-size:13.5px;color:'+C.pedra+';'+
      'line-height:1.6;margin-top:11px;max-width:640px;white-space:pre-wrap', x.descripcio));
    cos.appendChild(cap);

    // Calendari
    for (var s = 1; s <= x.setmanes; s++){
      var fila = h('div','margin-bottom:18px');
      fila.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.or+';margin-bottom:9px','Setmana ' + s));
      var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:'+C.vora);
      for (var d = 1; d <= 7; d++){
        var dia = mapa[clau(s, d)];
        var c = h('div','background:'+C.panell+';padding:11px 12px;min-height:82px');
        c.appendChild(h('div','font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;'+
          'font-weight:700;color:'+C.apagat+';margin-bottom:6px', DIES_C[d-1]));
        var res = 0;
        if (dia && dia.rutina){
          var fantR = !!dia.rutina.deleted_at;
          c.appendChild(h('div','font-size:12.5px;font-weight:600;color:'+
            (fantR ? C.ambre : C.os)+';line-height:1.35', dia.rutina.nom));
          if (fantR) c.appendChild(h('div','font-size:10px;color:'+C.ambre+';'+
            'margin-top:2px','ja no és a la biblioteca'));
          else if (dia.rutina.tipus) c.appendChild(h('div','font-size:10.5px;color:'+C.or+';'+
            'margin-top:3px', dia.rutina.tipus));
          res++;
        }
        if (dia && dia.cardio_rutina){
          var fantC = !!dia.cardio_rutina.deleted_at;
          var bc = h('div','line-height:1.35'+(res ? ';margin-top:5px' : ''));
          bc.appendChild(h('div','font-size:12.5px;font-weight:600;color:'+
            (fantC ? C.ambre : C.oliva), dia.cardio_rutina.nom));
          var sc = fantC ? 'ja no és a la biblioteca'
                 : [dia.cardio_rutina.tipus,
                    dia.cardio_rutina.rondes ? dia.cardio_rutina.rondes + ' rondes' : null]
                   .filter(Boolean).join(' \u00b7 ');
          if (sc) bc.appendChild(h('div','font-size:10.5px;color:'+
            (fantC ? C.ambre : C.apagat)+';margin-top:2px', sc));
          c.appendChild(bc);
          res++;
        } else if (dia && dia.cardio){
          c.appendChild(h('div','font-size:12.5px;color:'+C.oliva+';line-height:1.35'+
            (res ? ';margin-top:5px' : ''), dia.cardio));
          res++;
        }
        if (dia && dia.pesatge){
          c.appendChild(h('div','font-size:12px;font-weight:600;color:'+C.or+';'+
            'line-height:1.35'+(res ? ';margin-top:5px' : ''),'Pesatge i mides'));
          res++;
        }
        if (!res)
          c.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';font-style:italic','descans'));
        g.appendChild(c);
      }
      fila.appendChild(g);
      cos.appendChild(fila);
    }

    // Espartans assignats
    var as = h('div','margin-top:26px');
    as.appendChild(E.titol('Espartans amb aquest pla', 15));
    var la = h('div','margin-top:11px;display:flex;flex-direction:column;gap:1px;background:'+C.vora);
    var da = (r[1].data || []);
    if (r[1].error) la.appendChild(E.avis(r[1].error.message));
    else if (!da.length) la.appendChild(E.buit('Aquest pla no està assignat a ningú.'));
    var colorAssig = { actiu:C.oliva, pausa:C.ambre, finalitzat:C.apagat };
    var caixes = {};
    da.forEach(function(a){
      var f = h('div','display:flex;align-items:center;justify-content:space-between;gap:14px;'+
        'background:'+C.panell+';padding:12px 15px');
      var t = h('div','min-width:0');
      t.appendChild(h('div','font-size:14px;font-weight:600;color:'+C.os,
        E.nomComplet(a.atleta && a.atleta.usuari)));
      t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:2px',
        'des del ' + E.data(a.data_inici) + (a.data_fi ? ' fins al ' + E.data(a.data_fi) : '')));
      f.appendChild(t);
      var dr = h('div','display:flex;gap:9px;align-items:center;flex-shrink:0');
      dr.appendChild(E.etiqueta(a.estat, colorAssig[a.estat] || C.apagat));
      if (E.perfil.role === 'coach' && a.estat === 'actiu'){
        var bf = E.boto('Finalitzar', function(){
          E.sb.from('plan_assignments').update({ estat:'finalitzat',
            data_fi:new Date().toISOString().slice(0,10) }).eq('id', a.id)
            .then(function(){ E.repinta(); });
        }, 'buit');
        bf.style.padding = '6px 12px'; bf.style.fontSize = '11px';
        dr.appendChild(bf);
      }
      caixes[a.id] = dr;
      f.appendChild(dr);
      la.appendChild(f);
    });
    as.appendChild(la);

    // Qui te calendari propi ja no segueix la plantilla: els canvis que es facin
    // aqui no li arriben mai. Val mes que es vegi, i que se li pugui desfer.
    var missA = h('div','margin-top:10px');
    as.appendChild(missA);
    var idsA = da.map(function(a){ return a.id; });
    if (idsA.length)
      E.sb.from('assignment_days').select('assignment_id').in('assignment_id', idsA)
        .then(function(rp){
          var teProp = {};
          (rp.data || []).forEach(function(x){ teProp[x.assignment_id] = true; });
          da.forEach(function(a){
            var dr = caixes[a.id];
            if (!teProp[a.id] || !dr) return;
            var et = E.etiqueta('Calendari propi', C.ambre);
            et.title = 'Aquest Espartà té el calendari ajustat a mà. Els canvis '+
              'que facis a la plantilla del pla no li arriben.';
            dr.insertBefore(et, dr.firstChild);
            if (E.perfil.role !== 'coach') return;
            var bt = E.boto('Seguir la plantilla', function(){
              E.buida(missA);
              var conf = h('div','padding:12px 14px;background:'+C.ambre+'22;'+
                'border-left:3px solid '+C.ambre);
              conf.appendChild(h('div','font-size:13px;color:'+C.os+';line-height:1.5;'+
                'margin-bottom:10px', E.nomComplet(a.atleta && a.atleta.usuari) +
                ' tornarà a seguir el calendari del pla. Els ajustos que tingui dia '+
                'a dia es perden. Les sessions ja registrades no es toquen.'));
              var bs = E.boto('Sí, seguir la plantilla', function(){
                E.sb.from('assignment_days').delete().eq('assignment_id', a.id)
                  .then(function(rr){
                    E.buida(missA);
                    if (rr.error){ missA.appendChild(E.avis(rr.error.message)); return; }
                    E.repinta();
                  });
              });
              bs.style.padding = '8px 15px'; bs.style.fontSize = '12px';
              conf.appendChild(bs);
              missA.appendChild(conf);
            }, 'buit');
            bt.style.padding = '6px 12px'; bt.style.fontSize = '11px';
            dr.appendChild(bt);
          });
        });

    cos.appendChild(as);
  });
}

// ── Assignar ───────────────────────────────────────────────────────
function assignar(cont){
  cont.appendChild(E.capcalera('Assignar el pla', 'Tria un Espartà i la data d\'inici',
    [E.boto('Cancel\u00b7lar', function(){ vista.mode = 'fitxa'; E.repinta(); }, 'buit')]));
  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('training_plans').select('nom,setmanes').eq('id', vista.id).single(),
    E.sb.from('athletes').select('id,estat,usuari:profiles!athletes_user_id_fkey(nom,cognoms)')
      .neq('estat','baixa')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var pla = r[0].data, atl = r[1].data || [];
    if (!atl.length){
      cos.appendChild(E.buit('No hi ha cap Espartà actiu per assignar.'));
      return;
    }

    var f = E.targeta();
    f.style.maxWidth = '580px';
    f.appendChild(E.titol(pla.nom, 18));
    f.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';margin:4px 0 18px',
      pla.setmanes + (pla.setmanes === 1 ? ' setmana' : ' setmanes')));

    var avui = new Date().toISOString().slice(0,10);
    var at = E.camp({ et:'Espartà', tipus:'select',
      opcions:[{v:'',t:'Tria un Espartà\u2026'}].concat(atl.map(function(a){
        return { v:a.id, t:E.nomComplet(a.usuari) +
          (a.estat !== 'actiu' ? '  \u00b7  ' + (E.ESTATS[a.estat]||{}).t : '') };
      })) });
    var di = E.camp({ et:'Data d\'inici', tipus:'date', valor:avui });
    var g = h('div','display:grid;grid-template-columns:2fr 1fr;gap:13px;margin-bottom:16px');
    g.appendChild(at); g.appendChild(di);
    f.appendChild(g);

    var miss = h('div','margin-bottom:14px');
    f.appendChild(miss);

    var b = E.boto('Assignar', function(){
      E.buida(miss);
      if (!at.control.value){ miss.appendChild(E.avis('Tria un Espartà.')); return; }
      b.disabled = true; b.textContent = 'Assignant…';
      // Un pla actiu per Espartà: es finalitzen els anteriors
      E.sb.from('plan_assignments').update({ estat:'finalitzat',
        data_fi: di.control.value || avui })
        .eq('athlete_id', at.control.value).eq('estat','actiu')
        .then(function(){
          return E.sb.from('plan_assignments').insert({
            athlete_id: at.control.value, plan_id: vista.id, coach_id: E.perfil.id,
            data_inici: di.control.value || avui, estat: 'actiu'
          });
        }).then(function(rr){
          b.disabled = false; b.textContent = 'Assignar';
          if (rr.error){ miss.appendChild(E.avis(rr.error.message)); return; }
          if (E.avisa) E.avisa(at.control.value, 'Tens pla nou',
            'El teu entrenador t\'ha assignat un pla nou. Mira l\'Agenda.', 'agenda');
          vista.mode = 'fitxa'; E.repinta();
        });
    });
    f.appendChild(b);
    cos.appendChild(f);

    cos.appendChild(h('div','max-width:580px;margin-top:13px;font-size:12px;color:'+C.apagat+';'+
      'line-height:1.55','Si l\'Espartà ja tenia un pla actiu, es marcarà com a finalitzat. '+
      'Les sessions ja registrades no es toquen.'));
  });
}

// ── Editor ─────────────────────────────────────────────────────────
function carregaEsborrany(id){
  E.sb.from('training_plans').select('*,plan_days(*)').eq('id', id).single()
    .then(function(r){
      if (r.error) return;
      var x = r.data, dies = {};
      (x.plan_days || []).forEach(function(d){
        dies[clau(d.setmana, d.dia_setmana)] = { routine_id:d.routine_id || '',
          cardio:d.cardio || '', cardio_routine_id:d.cardio_routine_id || '',
          pesatge:!!d.pesatge };
      });
      esborrany = { nom:x.nom, setmanes:x.setmanes, descripcio:x.descripcio || '', dies:dies };
      vista = { mode:'editor', id:id };
      E.repinta();
    });
}

function editor(cont){
  var nou = !vista.id;
  if (!esborrany) esborrany = { nom:'', setmanes:4, descripcio:'', dies:{} };

  cont.appendChild(E.capcalera(nou ? 'Nou pla' : 'Editar pla',
    'Assigna una rutina a cada dia de la setmana',
    [E.boto('Cancel\u00b7lar', function(){
      esborrany = null;
      vista = nou ? { mode:'llista' } : { mode:'fitxa', id:vista.id };
      E.repinta();
    }, 'buit')]));

  var cos = E.cos();
  cos.appendChild(E.carregant('Carregant rutines…'));
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('routines').select('id,nom,tipus').eq('mena','forca')
      .is('deleted_at', null).order('nom'),
    E.sb.from('routines').select('id,nom,tipus,rondes').eq('mena','cardio')
      .is('deleted_at', null).order('nom')
  ]).then(function(rr){
      var r = rr[0];
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var rutines = r.data || [];
      E.CARDIO_RUTINES = (rr[1] && rr[1].data) || [];
      if (!rutines.length && !E.CARDIO_RUTINES.length){
        cos.appendChild(E.buit('Primer calen rutines. Ve a «Rutines» i crea\'n alguna, '+
          'de força o de cardio.'));
        return;
      }
      var opcionsRut = [{ v:'', t:'Sense rutina' }]
        .concat(rutines.map(function(x){
          return { v:x.id, t:x.nom + (x.tipus ? '  \u00b7  ' + x.tipus : '') };
        }));
      // Una rutina esborrada de la biblioteca pot seguir enganxada a un dia. El
      // desplegable nomes porta rutines vives, aixi que el dia sortia com a
      // «Sense rutina» pero es tornava a desar igual. Ara surt marcada.
      function opcionsDe(id){
        if (!id) return opcionsRut;
        for (var i = 0; i < opcionsRut.length; i++)
          if (opcionsRut[i].v === id) return opcionsRut;
        return opcionsRut.concat([E.opcioFantasma(id)]);
      }
      function diaDe(k){
        var v = esborrany.dies[k];
        if (!v || typeof v !== 'object')
          esborrany.dies[k] = v = { routine_id:'', cardio:'', cardio_routine_id:'',
                                    pesatge:false };
        if (v.cardio_routine_id === undefined) v.cardio_routine_id = '';
        return v;
      }
      function teFeina(v){
        return !!(v && (v.routine_id || v.cardio_routine_id || (v.cardio||'').trim() ||
                        v.pesatge));
      }

      var dalt = E.targeta();
      dalt.style.marginBottom = '20px';
      var nom = E.camp({ et:'Nom del pla', marca:'Bloc de força \u00b7 tardor',
        valor:esborrany.nom });
      var set = E.camp({ et:'Setmanes', tipus:'number', valor:esborrany.setmanes });
      var g = h('div','display:grid;grid-template-columns:2fr 1fr;gap:13px;margin-bottom:13px');
      g.appendChild(nom); g.appendChild(set);
      dalt.appendChild(g);
      var des = E.camp({ et:'Descripció', tipus:'textarea', files:2,
        marca:'Progressió de càrrega, dos dies d\'empenyer i dos d\'estirar…',
        valor:esborrany.descripcio });
      dalt.appendChild(des);
      cos.appendChild(dalt);

      nom.control.oninput = function(){ esborrany.nom = nom.control.value; };
      des.control.oninput = function(){ esborrany.descripcio = des.control.value; };

      var zona = h('div');
      cos.appendChild(zona);

      set.control.onchange = function(){
        var n = parseInt(set.control.value, 10);
        if (!n || n < 1) n = 1;
        if (n > 16) n = 16;
        esborrany.setmanes = n;
        set.control.value = n;
        pintaCalendari();
      };

      var fantasmes = 0;
      function pintaCalendari(){
        E.buida(zona);
        fantasmes = 0;
        var avisF = h('div');
        zona.appendChild(avisF);
        for (var s = 1; s <= esborrany.setmanes; s++){
          (function(setmana){
            var fila = h('div','margin-bottom:20px');
            var capS = h('div','display:flex;align-items:center;gap:12px;margin-bottom:9px');
            capS.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
              'font-weight:700;color:'+C.or,'Setmana ' + setmana));
            if (setmana > 1){
              var bc = E.boto('Copiar la setmana ' + (setmana-1), function(){
                for (var d = 1; d <= 7; d++){
                  var o = diaDe(clau(setmana-1,d));
                  esborrany.dies[clau(setmana,d)] = { routine_id:o.routine_id,
                    cardio:o.cardio, cardio_routine_id:o.cardio_routine_id || '',
                    pesatge:o.pesatge };
                }
                pintaCalendari();
              }, 'buit');
              bc.style.padding = '5px 11px'; bc.style.fontSize = '10.5px';
              capS.appendChild(bc);
            }
            fila.appendChild(capS);

            var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:9px');
            for (var d = 1; d <= 7; d++){
              (function(dia){
                var k = clau(setmana, dia);
                var val = diaDe(k);
                var actiu = teFeina(val);
                var opcionsDia = opcionsDe(val.routine_id);
                var fant = opcionsDia !== opcionsRut;
                if (fant) fantasmes++;
                var c = h('div','background:'+C.panell+';border:1px solid '+
                  (fant ? C.ambre+'66' : (actiu ? E.accent()+'44' : C.vora))+';'+
                  'padding:10px 11px');
                c.appendChild(h('div','font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;'+
                  'font-weight:700;color:'+(fant ? C.ambre : (actiu ? E.accent() : C.apagat))+';'+
                  'margin-bottom:7px', DIES[dia-1]));
                var sel = document.createElement('select');
                opcionsDia.forEach(function(o){
                  var op = document.createElement('option');
                  op.value = o.v; op.textContent = o.t;
                  if (val.routine_id === o.v) op.selected = true;
                  sel.appendChild(op);
                });
                sel.setAttribute('style','width:100%;padding:8px 9px;background:'+C.fons+';'+
                  'border:1px solid '+(fant ? C.ambre+'66' : 'rgba(194,176,106,.24)')+';'+
                  'color:'+(fant ? C.ambre : C.os)+';font-size:12px;'+
                  "font-family:'Barlow',sans-serif");
                sel.onchange = function(){
                  val.routine_id = sel.value;
                  pintaCalendari();
                };
                c.appendChild(sel);

                // Un dia pot tenir pesos, cardio i pesatge alhora
                c.appendChild(E.controlCardio(
                  { routine_id:val.cardio_routine_id || '', text:val.cardio || '' },
                  function(v, rp){
                    val.cardio_routine_id = v.routine_id || '';
                    val.cardio = v.text || '';
                    if (rp) pintaCalendari();
                  }));

                var wp = h('label','display:flex;align-items:center;gap:6px;margin-top:8px;'+
                  'font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;'+
                  'font-weight:700;color:'+(val.pesatge ? C.or : C.apagat)+';cursor:pointer');
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = !!val.pesatge;
                cb.setAttribute('style','width:15px;height:15px;margin:0;accent-color:'+C.or);
                cb.onchange = function(){ val.pesatge = cb.checked; pintaCalendari(); };
                wp.appendChild(cb);
                wp.appendChild(document.createTextNode('Pesatge'));
                c.appendChild(wp);
                g.appendChild(c);
              })(d);
            }
            fila.appendChild(g);
            zona.appendChild(fila);
          })(s);
        }
        if (fantasmes)
          avisF.appendChild(E.avis('Hi ha ' + fantasmes +
            (fantasmes === 1 ? ' dia amb una rutina' : ' dies amb una rutina') +
            ' que ja no és a la biblioteca. Surten marcades: tria «Sense rutina» '+
            'i desa per treure-les del pla i del planning de l\'Espartà.', C.ambre));
      }

      // Els noms de les rutines esborrades, per poder-les ensenyar pel seu nom
      var idsF = [], idsC = [];
      Object.keys(esborrany.dies).forEach(function(k){
        var v = esborrany.dies[k];
        if (!v || typeof v !== 'object') return;
        if (v.routine_id) idsF.push(v.routine_id);
        if (v.cardio_routine_id) idsC.push(v.cardio_routine_id);
      });
      pintaCalendari();
      if (idsF.length || idsC.length)
        Promise.all([E.carregaFantasmes(idsF, rutines),
                     E.carregaFantasmes(idsC, E.CARDIO_RUTINES)])
          .then(function(c){ if (c[0] || c[1]) pintaCalendari(); });

      var miss = h('div','margin-top:18px');
      cos.appendChild(miss);

      var fila = h('div','display:flex;gap:9px;margin-top:14px;flex-wrap:wrap');
      var b = E.boto(nou ? 'Crear pla' : 'Desar canvis', function(){
        E.buida(miss);
        if (!esborrany.nom.trim()){
          miss.appendChild(E.avis('El pla necessita un nom.')); return;
        }
        var programats = Object.keys(esborrany.dies).filter(function(k){
          var v = esborrany.dies[k];
          return v && (v.routine_id || v.cardio_routine_id || (v.cardio||'').trim() ||
                       v.pesatge);
        });
        if (!programats.length){
          miss.appendChild(E.avis('Programa com a mínim un dia.')); return;
        }
        b.disabled = true; b.textContent = 'Desant…';

        var caps = { nom:esborrany.nom.trim(), setmanes:esborrany.setmanes,
                     descripcio:esborrany.descripcio.trim() || null };
        var p;
        if (nou){
          caps.coach_id = E.perfil.id;
          p = E.sb.from('training_plans').insert(caps).select('id').single();
        } else {
          caps.updated_at = new Date().toISOString();
          p = E.sb.from('training_plans').update(caps).eq('id', vista.id).select('id').single()
            .then(function(r){
              if (r.error) return r;
              return E.sb.from('plan_days').delete().eq('plan_id', vista.id)
                .then(function(d){ return d.error ? d : r; });
            });
        }

        p.then(function(r){
          if (r.error) throw new Error(r.error.message);
          var pid = r.data.id;
          var files = [];
          for (var s = 1; s <= esborrany.setmanes; s++){
            for (var d = 1; d <= 7; d++){
              var v = esborrany.dies[clau(s,d)];
              if (!v || !(v.routine_id || v.cardio_routine_id || (v.cardio||'').trim() ||
                          v.pesatge)) continue;
              files.push({ plan_id:pid, setmana:s, dia_setmana:d,
                routine_id: v.routine_id || null,
                cardio: (v.cardio || '').trim() || null,
                cardio_routine_id: v.cardio_routine_id || null,
                pesatge: !!v.pesatge });
            }
          }
          return E.sb.from('plan_days').insert(files).then(function(d){
            if (d.error) throw new Error(d.error.message);
            return pid;
          });
        }).then(function(pid){
          esborrany = null;
          vista = { mode:'fitxa', id:pid };
          E.repinta();
        }).catch(function(err){
          b.disabled = false; b.textContent = nou ? 'Crear pla' : 'Desar canvis';
          miss.appendChild(E.avis(err.message));
        });
      });
      fila.appendChild(b);

      if (!nou){
        var esb = E.boto('Esborrar pla', function(){
          E.buida(miss);
          var conf = h('div','padding:12px 14px;background:'+C.carmesi+'22;'+
            'border-left:3px solid '+C.carmesi);
          conf.appendChild(h('div','font-size:13px;color:'+C.os+';line-height:1.5;margin-bottom:10px',
            "S'amagarà de la llista. Les assignacions i sessions es conserven."));
          var bs = E.boto('Sí, esborrar', function(){
            E.sb.from('training_plans').update({ deleted_at:new Date().toISOString() })
              .eq('id', vista.id).then(function(rr){
                if (rr.error){ E.buida(miss); miss.appendChild(E.avis(rr.error.message)); return; }
                esborrany = null; vista = { mode:'llista' }; E.repinta();
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
  id:'plans', etiqueta:'Plans', icona:'\u2637', rols:['coach','nutritionist'],
  pinta: function(cont){
    if (vista.mode === 'editor' && E.perfil.role === 'coach') return editor(cont);
    if (vista.mode === 'assignar' && vista.id && E.perfil.role === 'coach') return assignar(cont);
    if (vista.mode === 'fitxa' && vista.id) return fitxa(cont);
    return llista(cont);
  }
});
})();
