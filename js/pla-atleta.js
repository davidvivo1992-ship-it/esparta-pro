// Metabolisme Esparta · el pla d'UN Esparta, editable sense tocar la plantilla
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var DIES = ['Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte','Diumenge'];
var DIES_C = ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'];
var editant = null;   // assignment_id que s'esta editant

function clau(s,d){ return 's'+s+'d'+d; }

E.plaAtleta = function(cos, athleteId){
  var zona = h('div','margin-top:26px');
  zona.appendChild(E.titol("Pla d'entrenament", 15));
  var cont = h('div','margin-top:11px');
  zona.appendChild(cont);
  cont.appendChild(E.carregant());
  cos.appendChild(zona);

  E.sb.from('plan_assignments')
    .select('id,data_inici,data_fi,estat,pla:training_plans(id,nom,setmanes,descripcio)')
    .eq('athlete_id', athleteId).eq('estat','actiu')
    .order('created_at',{ascending:false}).limit(1)
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

function pintaPla(cont, a, athleteId){
  E.buida(cont);
  var pla = a.pla || {};
  var setmanes = pla.setmanes || 1;

  var cap = h('div','display:flex;align-items:flex-start;justify-content:space-between;'+
    'gap:14px;margin-bottom:13px;flex-wrap:wrap');
  var t = h('div','min-width:0');
  t.appendChild(h('div','font-size:15px;font-weight:600;color:'+C.os, pla.nom || 'Pla'));
  t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
    setmanes + (setmanes === 1 ? ' setmana' : ' setmanes') +
    ' \u00b7 des del ' + E.data(a.data_inici)));
  cap.appendChild(t);
  if (E.perfil.role === 'coach'){
    var b = E.boto(editant === a.id ? 'Tancar l\'editor' : 'Ajustar els dies', function(){
      editant = editant === a.id ? null : a.id;
      pintaPla(cont, a, athleteId);
    }, editant === a.id ? 'buit' : null);
    b.style.padding = '8px 15px'; b.style.fontSize = '11.5px';
    cap.appendChild(b);
  }
  cont.appendChild(cap);

  if (E.perfil.role === 'coach' && editant === a.id)
    cont.appendChild(h('div','font-size:12px;color:'+C.apagat+';line-height:1.55;'+
      'margin-bottom:14px;max-width:660px',
      'Els canvis afecten NOMÉS aquest Espartà. La plantilla del pla i la resta '+
      'd\'atletes no es toquen.'));

  var zonaCal = h('div');
  cont.appendChild(zonaCal);

  zonaCal.appendChild(E.carregant());
  Promise.all([
    E.sb.from('assignment_days')
      .select('*,rutina:routines!assignment_days_routine_id_fkey(nom,tipus,deleted_at),'+
              'cardio_rutina:routines!assignment_days_cardio_routine_id_fkey'+
              '(nom,tipus,rondes,deleted_at)')
      .eq('assignment_id', a.id),
    E.sb.from('plan_days')
      .select('*,rutina:routines!plan_days_routine_id_fkey(nom,tipus,deleted_at),'+
              'cardio_rutina:routines!plan_days_cardio_routine_id_fkey'+
              '(nom,tipus,rondes,deleted_at)')
      .eq('plan_id', pla.id),
    editant === a.id
      ? E.sb.from('routines').select('id,nom,tipus').eq('mena','forca')
          .is('deleted_at',null).order('nom')
      : Promise.resolve({ data:[] }),
    editant === a.id
      ? E.sb.from('routines').select('id,nom,tipus,rondes').eq('mena','cardio')
          .is('deleted_at',null).order('nom')
      : Promise.resolve({ data:[] }),
    E.sb.from('workout_sessions').select('data,estat,setmana,dia_previst')
      .eq('athlete_id', athleteId).gte('data', a.data_inici)
      .order('data',{ascending:true}).limit(400)
  ]).then(function(r){
    E.buida(zonaCal);
    var propis = r[0].data || [], plantilla = r[1].data || [];

    // Abans, nomes d'obrir aquesta pantalla, la plantilla es copiava a
    // assignment_days. A partir d'aquell moment l'Esparta deixava de seguir el
    // pla i els canvis que l'entrenador feia a la plantilla ja no li arribaven,
    // sense que ningu l'avises. Ara la copia nomes es fa en desar l'editor.

    var dades = propis.length ? propis : plantilla;
    var mapa = {};
    dades.forEach(function(d){ mapa[clau(d.setmana,d.dia_setmana)] = d; });

    if (editant === a.id){
      E.CARDIO_RUTINES = (r[3] && r[3].data) || [];
      editorCal(zonaCal, a, mapa, setmanes, r[2].data || [], cont, athleteId);
    }
    else lecturaCal(zonaCal, mapa, setmanes, !propis.length,
      fetsPerDia(r[4] && r[4].data, a.data_inici, setmanes),
      setmanaDe(new Date(), a.data_inici, setmanes));
  });
}

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

// ── Que ha fet, de tot el que li tocava ───────────────────
// El pla es un cicle: un pla de 4 setmanes que dura 12 torna a comencar tres
// cops. Per tant una casella no es «un dia», es «cada cop que toca aquest
// dia». Hi pintem l'ULTIMA vegada, amb la data, que es l'unica manera que
// no enganyi.
function diaSetmanaDe(d){ var n = d.getDay(); return n === 0 ? 7 : n; }

function setmanaDe(data, inici, setmanes){
  var d = (typeof data === 'string') ? new Date(data + 'T00:00:00') : data;
  // El dilluns de la setmana d'aquesta data
  var dl = new Date(d.getTime());
  dl.setDate(dl.getDate() - (diaSetmanaDe(dl) - 1));
  var passats = Math.floor((dl - new Date(inici + 'T00:00:00')) / 86400000);
  if (passats < 0) passats = 0;
  return (Math.floor(passats / 7) % (setmanes || 1)) + 1;
}

function fetsPerDia(sessions, inici, setmanes){
  var m = {};
  (sessions || []).forEach(function(x){
    // Les sessions noves ja porten a quin dia del pla corresponen; les
    // velles, d'abans de la migracio 08, s'han de deduir de la data.
    var sm = x.setmana || setmanaDe(x.data, inici, setmanes);
    var d = x.dia_previst || diaSetmanaDe(new Date(x.data + 'T00:00:00'));
    if (sm < 1 || sm > (setmanes || 1) || d < 1 || d > 7) return;
    m[clau(sm, d)] = x;   // ordenades per data: hi queda l'ultima
  });
  return m;
}

function dataCurta(s){
  if (!s) return '';
  var t = s.split('-');
  return t[2] + '/' + t[1];
}

// Com es pinta cada estat a la casella del calendari
function segellDe(x){
  if (x.estat === 'completada')
    return { t:'\u2713 ' + dataCurta(x.data), c:C.oliva };
  if (x.estat === 'saltada')
    return { t:'\u2715 ' + dataCurta(x.data), c:C.apagat };
  return { t:'a mitges ' + dataCurta(x.data), c:C.brasa };
}

function lecturaCal(zona, mapa, setmanes, esPlantilla, fets, setmanaAra){
  if (esPlantilla)
    zona.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-bottom:11px;'+
      'line-height:1.5','Segueix el calendari de la plantilla del pla.'));

  fets = fets || {};
  for (var s = 1; s <= setmanes; s++){
    var fila = h('div','margin-bottom:14px');
    var ara = (s === setmanaAra);
    if (setmanes > 1){
      var capS = h('div','display:flex;align-items:baseline;gap:9px;margin-bottom:7px');
      // L'accent de la consola es el blau pissarra: val per a vores i
      // farciments, pero com a text no arriba al 4,5:1. Per destacar la
      // setmana en curs hi va l'os, que es el valor mes fort que tenim.
      capS.appendChild(h('div','font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;'+
        'font-weight:700;color:'+(ara ? C.os : C.or),'Setmana ' + s));
      if (ara) capS.appendChild(h('div','font-size:10px;padding:2px 7px;color:'+C.or+';'+
        'border:1px solid '+C.vora,'la que toca ara'));
      fila.appendChild(capS);
    }
    var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:'+C.vora);
    for (var d = 1; d <= 7; d++){
      var dia = mapa[clau(s,d)];
      var c = h('div','background:'+C.panell+';padding:10px 11px;min-height:70px;'+
        'display:flex;flex-direction:column');
      c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.apagat+';margin-bottom:5px', DIES_C[d-1]));
      var acts = activitatsDe(dia);
      if (!acts.length)
        c.appendChild(h('div','font-size:11px;color:'+C.apagat+';font-style:italic','descans'));
      else acts.forEach(function(x, i){
        c.appendChild(h('div','font-size:12px;font-weight:'+x.gruix+';color:'+x.c+';'+
          'line-height:1.35'+(i ? ';margin-top:4px' : ''), x.t));
        if (x.fant) c.appendChild(h('div','font-size:9.5px;color:'+C.ambre+';'+
          'margin-top:1px','ja no és a la biblioteca'));
      });
      // Nomes els dies amb entreno porten segell: un dia de pesatge no es
      // una sessio i no te sentit dir-ne «mai».
      var teEntreno = !!(dia && (dia.routine_id || dia.cardio_routine_id || dia.cardio));
      var fet = teEntreno ? fets[clau(s,d)] : null;
      if (fet){
        var sg = segellDe(fet);
        c.appendChild(h('div','margin-top:auto;padding-top:6px;font-size:9.5px;'+
          'font-weight:600;color:'+sg.c, sg.t));
      }
      else if (teEntreno)
        c.appendChild(h('div','margin-top:auto;padding-top:6px;font-size:9.5px;'+
          'color:'+C.apagat,'mai'));
      g.appendChild(c);
    }
    fila.appendChild(g);
    zona.appendChild(fila);
  }

  zona.appendChild(h('div','font-size:11px;color:'+C.apagat+';line-height:1.55;'+
    'margin-top:-4px;max-width:660px',
    'A sota de cada dia, l\'última vegada que el va fer: \u2713 completat, '+
    '\u2715 marcat com a no fet, «a mitges» si el va obrir i no el va tancar. '+
    'El pla dona la volta cada ' + setmanes + (setmanes === 1 ? ' setmana' : ' setmanes') +
    ', per això hi va la data.'));
}

function editorCal(zona, a, mapa, setmanes, rutines, cont, athleteId){
  if (!rutines.length && !(E.CARDIO_RUTINES || []).length){
    zona.appendChild(E.buit('No hi ha rutines a la biblioteca.'));
    return;
  }
  var opcions = [{ v:'', t:'Sense rutina' }].concat(rutines.map(function(x){
    return { v:x.id, t:x.nom + (x.tipus ? '  \u00b7  ' + x.tipus : '') };
  }));

  // Una rutina esborrada de la biblioteca no sortia al desplegable: el dia es
  // pintava com a «Sense rutina» pero es desava igual, i no hi havia manera de
  // treure-la ni del pla ni del planning de l'Esparta.
  function opcionsDe(id){
    if (!id) return opcions;
    for (var i = 0; i < opcions.length; i++) if (opcions[i].v === id) return opcions;
    return opcions.concat([E.opcioFantasma(id)]);
  }
  var fantasmes = 0;

  // Un dia pot tenir rutina, cardio i pesatge alhora
  var rut = {}, car = {}, pes = {};
  for (var s = 1; s <= setmanes; s++)
    for (var d = 1; d <= 7; d++){
      var dia = mapa[clau(s,d)];
      var k = clau(s,d);
      rut[k] = (dia && dia.routine_id) || '';
      car[k] = { routine_id:(dia && dia.cardio_routine_id) || '',
                 text:(dia && dia.cardio) || '' };
      pes[k] = !!(dia && dia.pesatge);
    }

  zona.appendChild(h('div','font-size:12px;color:'+C.apagat+';line-height:1.55;'+
    'margin-bottom:12px;max-width:660px',
    'Cada dia pot tenir rutina de pesos, cardio i pesatge a la vegada. '+
    'El cardio pot ser una sessió que tinguis dissenyada (HIIT, intervals) o '+
    'cardio lliure. Deixa-ho tot buit per fer-ne un dia de descans. '+
    'Als dies amb rutina hi surt «Duplicar»: en fa una còpia nova a la biblioteca '+
    'i te la deixa en aquest dia, per pujar-hi les càrregues sense tocar les '+
    'setmanes anteriors ni la resta d\'Espartans.'));

  for (var s2 = 1; s2 <= setmanes; s2++){
    (function(setmana){
      var fila = h('div','margin-bottom:18px');
      var capS = h('div','display:flex;align-items:center;gap:11px;margin-bottom:8px');
      capS.appendChild(h('div','font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.or,'Setmana ' + setmana));
      if (setmana > 1){
        var bc = E.boto('Copiar l\'anterior', function(){
          for (var d = 1; d <= 7; d++){
            rut[clau(setmana,d)] = rut[clau(setmana-1,d)] || '';
            car[clau(setmana,d)] = car[clau(setmana-1,d)] || '';
            pes[clau(setmana,d)] = !!pes[clau(setmana-1,d)];
          }
          refresca();
        }, 'buit');
        bc.style.padding = '4px 10px'; bc.style.fontSize = '10px';
        capS.appendChild(bc);
      }
      fila.appendChild(capS);

      var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:8px');
      for (var d2 = 1; d2 <= 7; d2++){
        (function(dia){
          var k = clau(setmana, dia);
          var teFeina = !!(rut[k] || car[k] || pes[k]);
          var opcionsDia = opcionsDe(rut[k]);
          var fant = opcionsDia !== opcions;
          if (fant) fantasmes++;
          var c = h('div','background:'+C.panell+';border:1px solid '+
            (fant ? C.ambre+'66' : (teFeina ? E.accent()+'44' : C.vora))+';padding:9px 10px');
          c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
            'font-weight:700;color:'+(fant ? C.ambre : (teFeina ? E.accent() : C.apagat))+';'+
            'margin-bottom:6px', DIES[dia-1].slice(0,2)));

          var sel = document.createElement('select');
          opcionsDia.forEach(function(o){
            var op = document.createElement('option');
            op.value = o.v; op.textContent = o.t;
            if (rut[k] === o.v) op.selected = true;
            sel.appendChild(op);
          });
          sel.setAttribute('style','width:100%;padding:7px 8px;background:'+C.fons+';'+
            'border:1px solid '+(fant ? C.ambre+'66' : 'rgba(194,176,106,.24)')+';'+
            'color:'+(fant ? C.ambre : C.os)+';font-size:11.5px;'+
            "font-family:'Barlow',sans-serif");
          sel.onchange = function(){ rut[k] = sel.value; refresca(); };
          c.appendChild(sel);

          // Sobrecarrega: la mateixa sessio amb mes pes, nomes per a aquest
          // Esparta. La copia neix ara a la biblioteca; el calendari encara
          // s'ha de desar amb el boto de sota.
          if (rut[k] && E.perfil.role === 'coach'){
            var acc = h('div','display:flex;margin-top:6px');
            var bd = E.miniAccio('Duplicar', function(){
              var nom = null;
              for (var i2 = 0; i2 < rutines.length; i2++)
                if (rutines[i2].id === rut[k]) nom = rutines[i2].nom;
              bd.disabled = true; bd.textContent = 'Duplicant…';
              E.duplicaRutina(rut[k], E.nomSeguent(nom || E.nomFantasma(rut[k])))
                .then(function(nova){
                  rutines.push(nova);
                  rutines.sort(function(a,b){
                    return String(a.nom||'').localeCompare(String(b.nom||''), 'ca');
                  });
                  rut[k] = nova.id;
                  refresca();
                })
                .catch(function(err){
                  bd.disabled = false; bd.textContent = 'Duplicar';
                  if (miss){ E.buida(miss); miss.appendChild(E.avis(err.message)); }
                });
            });
            acc.appendChild(bd);
            c.appendChild(acc);
          }

          c.appendChild(E.controlCardio(car[k], function(v, rp){
            car[k] = v;
            if (rp) refresca();
          }, 'petit'));

          var wp = h('label','display:flex;align-items:center;gap:5px;margin-top:7px;'+
            'font-size:9px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;'+
            'color:'+(pes[k] ? C.or : C.apagat)+';cursor:pointer');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!pes[k];
          cb.setAttribute('style','width:14px;height:14px;margin:0;accent-color:'+C.or);
          cb.onchange = function(){ pes[k] = cb.checked; refresca(); };
          wp.appendChild(cb);
          wp.appendChild(document.createTextNode('Pesatge'));
          c.appendChild(wp);

          g.appendChild(c);
        })(d2);
      }
      fila.appendChild(g);
      zona.appendChild(fila);
    })(s2);
  }

  if (fantasmes)
    zona.appendChild(E.avis('Hi ha ' + fantasmes +
      (fantasmes === 1 ? ' dia amb una rutina' : ' dies amb una rutina') +
      ' que ja no és a la biblioteca. Surten marcades: tria «Sense rutina» i '+
      'desa per treure-les del planning d\'aquest Espartà.', C.ambre));

  // Els noms de les esborrades, per ensenyar-les pel seu nom i no per un codi
  var idsF = [], idsC = [];
  for (var s3 = 1; s3 <= setmanes; s3++)
    for (var d3 = 1; d3 <= 7; d3++){
      var k3 = clau(s3, d3);
      if (rut[k3]) idsF.push(rut[k3]);
      if (car[k3] && car[k3].routine_id) idsC.push(car[k3].routine_id);
    }
  if (idsF.length || idsC.length)
    Promise.all([E.carregaFantasmes(idsF, rutines),
                 E.carregaFantasmes(idsC, E.CARDIO_RUTINES || [])])
      .then(function(c){ if (c[0] || c[1]) refresca(); });

  function refresca(){
    E.buida(zona);
    var m2 = {};
    for (var s = 1; s <= setmanes; s++)
      for (var d = 1; d <= 7; d++){
        var k = clau(s,d);
        var vc = E.valorCardio(car[k]);
        m2[k] = { setmana:s, dia_setmana:d, routine_id: rut[k] || null,
                  cardio: vc.text || null, cardio_routine_id: vc.routine_id || null,
                  pesatge: !!pes[k], rutina: null,
                  cardio_rutina: vc.routine_id
                    ? { nom: E.nomCardio(vc) } : null };
      }
    editorCal(zona, a, m2, setmanes, rutines, cont, athleteId);
  }

  var miss = h('div','margin-top:6px');
  zona.appendChild(miss);

  var b = E.boto('Desar el calendari', function(){
    E.buida(miss);
    b.disabled = true; b.textContent = 'Desant…';
    E.sb.from('assignment_days').delete().eq('assignment_id', a.id).then(function(r){
      if (r.error) throw new Error(r.error.message);
      var files = [];
      for (var s = 1; s <= setmanes; s++)
        for (var d = 1; d <= 7; d++){
          var k = clau(s,d);
          var v2 = E.valorCardio(car[k]);
          if (!rut[k] && !E.teCardio(v2) && !pes[k]) continue;
          files.push({ assignment_id:a.id, setmana:s, dia_setmana:d,
            routine_id: rut[k] || null,
            cardio: (v2.text || '').trim() || null,
            cardio_routine_id: v2.routine_id || null,
            pesatge: !!pes[k] });
        }
      if (!files.length) return { error:null };
      return E.sb.from('assignment_days').insert(files);
    }).then(function(r){
      if (r && r.error) throw new Error(r.error.message);
      editant = null;
      pintaPla(cont, a, athleteId);
    }).catch(function(err){
      b.disabled = false; b.textContent = 'Desar el calendari';
      miss.appendChild(E.avis(err.message));
    });
  });
  b.style.marginTop = '8px';
  zona.appendChild(b);
}
})();
