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
      .select('*,rutina:routines!assignment_days_routine_id_fkey(nom,tipus),'+
              'cardio_rutina:routines!assignment_days_cardio_routine_id_fkey(nom,tipus,rondes)')
      .eq('assignment_id', a.id),
    E.sb.from('plan_days')
      .select('*,rutina:routines!plan_days_routine_id_fkey(nom,tipus),'+
              'cardio_rutina:routines!plan_days_cardio_routine_id_fkey(nom,tipus,rondes)')
      .eq('plan_id', pla.id),
    editant === a.id
      ? E.sb.from('routines').select('id,nom,tipus').eq('mena','forca')
          .is('deleted_at',null).order('nom')
      : Promise.resolve({ data:[] }),
    editant === a.id
      ? E.sb.from('routines').select('id,nom,tipus,rondes').eq('mena','cardio')
          .is('deleted_at',null).order('nom')
      : Promise.resolve({ data:[] })
  ]).then(function(r){
    E.buida(zonaCal);
    var propis = r[0].data || [], plantilla = r[1].data || [];

    // Si encara no te calendari propi, es copia de la plantilla al vol
    if (!propis.length && plantilla.length && E.perfil.role === 'coach'){
      var files = plantilla.map(function(d){
        return { assignment_id:a.id, setmana:d.setmana, dia_setmana:d.dia_setmana,
                 routine_id:d.routine_id, cardio:d.cardio,
                 cardio_routine_id:d.cardio_routine_id, pesatge:d.pesatge };
      });
      E.sb.from('assignment_days').insert(files).then(function(rr){
        if (rr.error){ zonaCal.appendChild(E.avis(rr.error.message)); return; }
        pintaPla(cont, a, athleteId);
      });
      zonaCal.appendChild(E.carregant('Preparant el calendari d\'aquest Espartà…'));
      return;
    }

    var dades = propis.length ? propis : plantilla;
    var mapa = {};
    dades.forEach(function(d){ mapa[clau(d.setmana,d.dia_setmana)] = d; });

    if (editant === a.id){
      E.CARDIO_RUTINES = (r[3] && r[3].data) || [];
      editorCal(zonaCal, a, mapa, setmanes, r[2].data || [], cont, athleteId);
    }
    else lecturaCal(zonaCal, mapa, setmanes, !propis.length);
  });
}

function activitatsDe(dia){
  var l = [];
  if (!dia) return l;
  if (dia.rutina) l.push({ t:dia.rutina.nom, c:C.os, gruix:'600' });
  else if (dia.routine_id) l.push({ t:'Rutina', c:C.os, gruix:'600' });
  if (dia.cardio_rutina) l.push({ t:dia.cardio_rutina.nom, c:C.oliva, gruix:'600' });
  else if (dia.cardio_routine_id) l.push({ t:'Cardio programat', c:C.oliva, gruix:'600' });
  else if (dia.cardio) l.push({ t:dia.cardio, c:C.oliva, gruix:'500' });
  if (dia.pesatge) l.push({ t:'Pesatge i mides', c:C.or, gruix:'600' });
  return l;
}

function lecturaCal(zona, mapa, setmanes, esPlantilla){
  if (esPlantilla)
    zona.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-bottom:11px;'+
      'line-height:1.5','Segueix el calendari de la plantilla del pla.'));

  for (var s = 1; s <= setmanes; s++){
    var fila = h('div','margin-bottom:14px');
    if (setmanes > 1)
      fila.appendChild(h('div','font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.or+';margin-bottom:7px','Setmana ' + s));
    var g = h('div','display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:'+C.vora);
    for (var d = 1; d <= 7; d++){
      var dia = mapa[clau(s,d)];
      var c = h('div','background:'+C.panell+';padding:10px 11px;min-height:70px');
      c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.apagat+';margin-bottom:5px', DIES_C[d-1]));
      var acts = activitatsDe(dia);
      if (!acts.length)
        c.appendChild(h('div','font-size:11px;color:'+C.apagat+';font-style:italic','descans'));
      else acts.forEach(function(x, i){
        c.appendChild(h('div','font-size:12px;font-weight:'+x.gruix+';color:'+x.c+';'+
          'line-height:1.35'+(i ? ';margin-top:4px' : ''), x.t));
      });
      g.appendChild(c);
    }
    fila.appendChild(g);
    zona.appendChild(fila);
  }
}

function editorCal(zona, a, mapa, setmanes, rutines, cont, athleteId){
  if (!rutines.length && !(E.CARDIO_RUTINES || []).length){
    zona.appendChild(E.buit('No hi ha rutines a la biblioteca.'));
    return;
  }
  var opcions = [{ v:'', t:'Sense rutina' }].concat(rutines.map(function(x){
    return { v:x.id, t:x.nom + (x.tipus ? '  \u00b7  ' + x.tipus : '') };
  }));

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
    'cardio lliure. Deixa-ho tot buit per fer-ne un dia de descans.'));

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
          var c = h('div','background:'+C.panell+';border:1px solid '+
            (teFeina ? E.accent()+'44' : C.vora)+';padding:9px 10px');
          c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
            'font-weight:700;color:'+(teFeina ? E.accent() : C.apagat)+';margin-bottom:6px',
            DIES[dia-1].slice(0,2)));

          var sel = document.createElement('select');
          opcions.forEach(function(o){
            var op = document.createElement('option');
            op.value = o.v; op.textContent = o.t;
            if (rut[k] === o.v) op.selected = true;
            sel.appendChild(op);
          });
          sel.setAttribute('style','width:100%;padding:7px 8px;background:'+C.fons+';'+
            'border:1px solid rgba(194,176,106,.24);color:'+C.os+';font-size:11.5px;'+
            "font-family:'Barlow',sans-serif");
          sel.onchange = function(){ rut[k] = sel.value; refresca(); };
          c.appendChild(sel);

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
