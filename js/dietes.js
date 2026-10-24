// Metabolisme Esparta · Plans de dieta
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null };
var esborrany = null;
var TIPUS = { esmorzar:'Esmorzar', mig_mati:'Mig matí', dinar:'Dinar', berenar:'Berenar', sopar:'Sopar', recuperador:'Recuperador' };
var ORDRE_APAT = ['esmorzar','mig_mati','dinar','berenar','sopar','recuperador'];

// Els macros es calculen dels ingredients: la vista recipe_macros no es pot
// enllacar des de l'API, aixi que el calcul es fa aqui.
function kcalDe(items, mapa){
  var k = 0;
  (items || []).forEach(function(it){
    var a = mapa[it.food_id]; if (!a) return;
    k += (a.kcal_100 || 0) * (Number(it.grams) || 0) / 100;
  });
  return Math.round(k);
}

function llista(cont){
  var accions = [];
  if (E.potNutricio())
    accions.push(E.boto('Nou pla de dieta', function(){
      esborrany = { nom:'', kcal_obj:'', prot_obj:'', carb_obj:'', greix_obj:'', notes:'', opcions:{} };
      vista = { mode:'editor', id:null }; E.repinta();
    }));
  cont.appendChild(E.capcalera('Plans de dieta',
    E.potNutricio() ? 'Objectius i receptes permeses per àpat'
                    : 'Plans de la nutricionista · en lectura', accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('diet_plans').select('id,nom,kcal_obj,prot_obj,carb_obj,greix_obj')
      .is('deleted_at', null).order('created_at',{ascending:false}),
    E.sb.from('diet_assignments').select('diet_plan_id,estat').eq('estat','actiu')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var dades = r[0].data || [], assig = r[1].data || [];
    var compte = {};
    assig.forEach(function(a){ compte[a.diet_plan_id] = (compte[a.diet_plan_id] || 0) + 1; });

    if (!dades.length){
      cos.appendChild(E.buit(E.potNutricio()
        ? 'Cap pla encara. Un pla de dieta té un objectiu de kcal i receptes permeses per àpat.'
        : 'La nutricionista encara no ha creat cap pla.'));
      return;
    }
    var box = h('div','display:flex;flex-direction:column;gap:7px');
    dades.forEach(function(x){
      var n = compte[x.id] || 0;
      var f = h('div','display:flex;align-items:center;gap:15px;padding:14px 17px;'+
        'background:'+C.panell+';border:1px solid '+C.vora+';cursor:pointer');
      f.onmouseenter = function(){ f.style.borderColor = E.accent()+'66'; };
      f.onmouseleave = function(){ f.style.borderColor = C.vora; };
      f.onclick = function(){ vista = { mode:'fitxa', id:x.id }; E.repinta(); };
      var t = h('div','flex:1;min-width:0');
      t.appendChild(h('div','font-size:15px;font-weight:600;color:'+C.os, x.nom));
      t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
        x.kcal_obj + ' kcal objectiu'));
      f.appendChild(t);
      if (n) f.appendChild(E.etiqueta(n + (n === 1 ? ' Espartà' : ' Espartans'), C.oliva));
      box.appendChild(f);
    });
    cos.appendChild(box);
  });
}

function fitxa(cont){
  var accions = [E.boto('Tornar', function(){ vista = { mode:'llista' }; E.repinta(); }, 'buit')];
  if (E.potNutricio()){
    accions.unshift(E.boto('Assignar', function(){ vista.mode = 'assignar'; E.repinta(); }));
    accions.unshift(E.boto('Editar', function(){ carregaEsborrany(vista.id); }));
  }
  cont.appendChild(E.capcalera('Pla de dieta', null, accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('diet_plans')
      .select('*,diet_plan_options(*,recepta:recipes(nom,recipe_items(food_id,grams)))')
      .eq('id', vista.id).single(),
    E.sb.from('diet_assignments')
      .select('id,data_inici,estat,'+
              'atleta:athletes(id,usuari:profiles!athletes_user_id_fkey(nom,cognoms))')
      .eq('diet_plan_id', vista.id).order('created_at',{ascending:false}),
    E.sb.from('foods').select('id,kcal_100')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var x = r[0].data, mapaAl = {};
    (r[2].data || []).forEach(function(a){ mapaAl[a.id] = a; });

    var cap = h('div','margin-bottom:20px');
    cap.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:24px;"+
      'color:'+C.os, x.nom));
    if (x.notes) cap.appendChild(h('div','font-size:13.5px;color:'+C.pedra+';line-height:1.6;'+
      'margin-top:10px;white-space:pre-wrap;max-width:640px', x.notes));
    cos.appendChild(cap);

    var g = h('div','display:grid;grid-template-columns:repeat(4,1fr);gap:1px;'+
      'background:'+C.vora+';margin-bottom:26px');
    [['Kcal',x.kcal_obj,C.verd],['Proteïna',x.prot_obj?x.prot_obj+'g':'\u2014',C.or],
     ['Carbohidrats',x.carb_obj?x.carb_obj+'g':'\u2014',C.pedra],
     ['Greix',x.greix_obj?x.greix_obj+'g':'\u2014',C.pedra]].forEach(function(d){
      var c = h('div','background:'+C.panell+';padding:13px;text-align:center');
      c.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:19px;"+
        'color:'+d[2], String(d[1])));
      c.appendChild(h('div','font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;'+
        'color:'+C.apagat+';margin-top:4px;font-weight:700', d[0]));
      g.appendChild(c);
    });
    cos.appendChild(g);

    var grups = {};
    (x.diet_plan_options || []).forEach(function(o){
      (grups[o.tipus_apat] = grups[o.tipus_apat] || []).push(o);
    });
    ORDRE_APAT.filter(function(t){ return grups[t]; }).forEach(function(t){
      cos.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.or+';margin-bottom:9px', TIPUS[t]));
      var l = h('div','display:flex;flex-direction:column;gap:1px;background:'+C.vora+';'+
        'margin-bottom:20px');
      grups[t].forEach(function(o){
        var kc = o.recepta ? kcalDe(o.recepta.recipe_items, mapaAl) : 0;
        var f = h('div','display:flex;justify-content:space-between;background:'+C.panell+';'+
          'padding:11px 15px');
        f.appendChild(h('div','font-size:13.5px;color:'+C.os,
          (o.recepta && o.recepta.nom) || 'Recepta'));
        f.appendChild(h('div','font-size:12px;color:'+C.apagat, kc ? kc + ' kcal' : ''));
        l.appendChild(f);
      });
      cos.appendChild(l);
    });

    var as = h('div','margin-top:12px');
    as.appendChild(E.titol('Espartans amb aquest pla', 15));
    var la = h('div','margin-top:11px;display:flex;flex-direction:column;gap:1px;background:'+C.vora);
    var da = r[1].data || [];
    if (r[1].error) la.appendChild(E.avis(r[1].error.message));
    else if (!da.length) la.appendChild(E.buit('Aquest pla no està assignat a ningú.'));
    var colorAssig = { actiu:C.oliva, finalitzat:C.apagat, programat:C.ambre, cancellat:C.accio };
    da.forEach(function(a){
      var f = h('div','display:flex;align-items:center;justify-content:space-between;gap:14px;'+
        'background:'+C.panell+';padding:12px 15px');
      f.appendChild(h('div','font-size:14px;font-weight:600;color:'+C.os,
        E.nomComplet(a.atleta && a.atleta.usuari)));
      f.appendChild(E.etiqueta(a.estat, colorAssig[a.estat] || C.apagat));
      la.appendChild(f);
    });
    as.appendChild(la);
    cos.appendChild(as);
  });
}

function assignar(cont){
  cont.appendChild(E.capcalera('Assignar el pla', 'Tria un Espartà i la data d\'inici',
    [E.boto('Cancel\u00b7lar', function(){ vista.mode = 'fitxa'; E.repinta(); }, 'buit')]));
  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('diet_plans').select('nom').eq('id', vista.id).single(),
    E.sb.from('athletes').select('id,estat,usuari:profiles!athletes_user_id_fkey(nom,cognoms)')
      .neq('estat','baixa')
  ]).then(function(r){
    E.buida(cos);
    if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }
    var pla = r[0].data, atl = r[1].data || [];
    if (!atl.length){ cos.appendChild(E.buit('No hi ha cap Espartà actiu per assignar.')); return; }

    var f = E.targeta();
    f.style.maxWidth = '580px';
    f.appendChild(E.titol(pla.nom, 18));

    var avui = new Date().toISOString().slice(0,10);
    var at = E.camp({ et:'Espartà', tipus:'select',
      opcions:[{v:'',t:'Tria un Espartà\u2026'}].concat(atl.map(function(a){
        return { v:a.id, t:E.nomComplet(a.usuari) };
      })) });
    var di = E.camp({ et:'Data d\'inici', tipus:'date', valor:avui });
    var g = h('div','display:grid;grid-template-columns:2fr 1fr;gap:13px;margin:16px 0');
    g.appendChild(at); g.appendChild(di);
    f.appendChild(g);

    var miss = h('div','margin-bottom:14px');
    f.appendChild(miss);
    var b = E.boto('Assignar', function(){
      E.buida(miss);
      if (!at.control.value){ miss.appendChild(E.avis('Tria un Espartà.')); return; }
      b.disabled = true; b.textContent = 'Assignant…';
      E.sb.from('diet_assignments').update({ estat:'finalitzat', data_fi:di.control.value || avui })
        .eq('athlete_id', at.control.value).eq('estat','actiu')
        .then(function(){
          return E.sb.from('diet_assignments').insert({
            athlete_id: at.control.value, diet_plan_id: vista.id, nutritionist_id: E.perfil.id,
            data_inici: di.control.value || avui, estat: 'actiu'
          });
        }).then(function(rr){
          b.disabled = false; b.textContent = 'Assignar';
          if (rr.error){ miss.appendChild(E.avis(rr.error.message)); return; }
          if (E.avisa) E.avisa(at.control.value, 'Tens dieta nova',
            'La nutricionista t\'ha assignat un pla de dieta.', 'nutricio');
          vista.mode = 'fitxa'; E.repinta();
        });
    });
    f.appendChild(b);
    cos.appendChild(f);
  });
}

function carregaEsborrany(id){
  E.sb.from('diet_plans').select('*,diet_plan_options(*)').eq('id', id).single().then(function(r){
    if (r.error) return;
    var x = r.data, opcions = {};
    (x.diet_plan_options || []).forEach(function(o){
      (opcions[o.tipus_apat] = opcions[o.tipus_apat] || []).push(o.recipe_id);
    });
    esborrany = { nom:x.nom, kcal_obj:x.kcal_obj, prot_obj:x.prot_obj || '',
      carb_obj:x.carb_obj || '', greix_obj:x.greix_obj || '', notes:x.notes || '', opcions:opcions };
    vista = { mode:'editor', id:id };
    E.repinta();
  });
}

function editor(cont){
  var nou = !vista.id;
  if (!esborrany) esborrany = { nom:'', kcal_obj:'', prot_obj:'', carb_obj:'', greix_obj:'',
    notes:'', opcions:{} };

  cont.appendChild(E.capcalera(nou ? 'Nou pla de dieta' : 'Editar pla de dieta',
    'Tria quines receptes es poden triar a cada àpat',
    [E.boto('Cancel\u00b7lar', function(){
      esborrany = null;
      vista = nou ? { mode:'llista' } : { mode:'fitxa', id:vista.id };
      E.repinta();
    }, 'buit')]));

  var cos = E.cos();
  cos.appendChild(E.carregant('Carregant receptes…'));
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('recipes').select('id,nom,tipus_apat,recipe_items(food_id,grams)')
      .is('deleted_at', null).order('nom'),
    E.sb.from('foods').select('id,kcal_100')
  ]).then(function(rr){
      var r = rr[0], mapaAl = {};
      (rr[1].data || []).forEach(function(a){ mapaAl[a.id] = a; });
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var receptes = r.data || [];
      if (!receptes.length){
        cos.appendChild(E.buit('Primer calen receptes. Ve a «Receptes» i crea\'n alguna.'));
        return;
      }
      var perApat = {};
      receptes.forEach(function(x){ (perApat[x.tipus_apat] = perApat[x.tipus_apat] || []).push(x); });

      var dalt = E.targeta();
      dalt.style.marginBottom = '20px';
      var nom = E.camp({ et:'Nom del pla', marca:'Dèficit moderat \u00b7 1900 kcal',
        valor:esborrany.nom });
      var kc = E.camp({ et:'Kcal objectiu', tipus:'number', valor:esborrany.kcal_obj });
      var g = h('div','display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:13px');
      g.appendChild(nom); g.appendChild(kc);
      dalt.appendChild(g);
      var pr = E.camp({ et:'Proteïna objectiu (g)', tipus:'number', valor:esborrany.prot_obj });
      var ca = E.camp({ et:'Carbohidrats objectiu (g)', tipus:'number', valor:esborrany.carb_obj });
      var gr = E.camp({ et:'Greix objectiu (g)', tipus:'number', valor:esborrany.greix_obj });
      var g2 = h('div','display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:13px');
      [pr,ca,gr].forEach(function(c){ g2.appendChild(c); });
      dalt.appendChild(g2);
      var nt = E.camp({ et:'Notes', tipus:'textarea', files:2,
        marca:'Beure 2,5L d\'aigua al dia, evitar ultraprocessats…', valor:esborrany.notes });
      dalt.appendChild(nt);
      cos.appendChild(dalt);
      nom.control.oninput = function(){ esborrany.nom = nom.control.value; };
      kc.control.oninput = function(){ esborrany.kcal_obj = kc.control.value; };
      pr.control.oninput = function(){ esborrany.prot_obj = pr.control.value; };
      ca.control.oninput = function(){ esborrany.carb_obj = ca.control.value; };
      gr.control.oninput = function(){ esborrany.greix_obj = gr.control.value; };
      nt.control.oninput = function(){ esborrany.notes = nt.control.value; };

      ORDRE_APAT.forEach(function(tipus){
        var opts = perApat[tipus];
        if (!opts) return;
        cos.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
          'font-weight:700;color:'+C.or+';margin:18px 0 9px', TIPUS[tipus]));
        var box = h('div','display:flex;flex-direction:column;gap:6px');
        opts.forEach(function(x){
          var sel = (esborrany.opcions[tipus] || []).indexOf(x.id) !== -1;
          var f = h('label','display:flex;align-items:center;gap:11px;background:'+C.panell+';'+
            'border:1px solid '+(sel ? E.accent()+'66' : C.vora)+';padding:11px 14px;cursor:pointer');
          var chk = document.createElement('input');
          chk.type = 'checkbox'; chk.checked = sel;
          chk.style.cssText = 'width:18px;height:18px;flex-shrink:0;accent-color:'+E.accent();
          chk.onchange = function(){
            var arr = esborrany.opcions[tipus] = esborrany.opcions[tipus] || [];
            var i = arr.indexOf(x.id);
            if (chk.checked && i === -1) arr.push(x.id);
            if (!chk.checked && i !== -1) arr.splice(i,1);
            f.style.borderColor = chk.checked ? E.accent()+'66' : C.vora;
          };
          f.appendChild(chk);
          var kc = kcalDe(x.recipe_items, mapaAl);
          var t = h('div','flex:1;min-width:0');
          t.appendChild(h('div','font-size:13.5px;font-weight:600;color:'+C.os, x.nom));
          f.appendChild(t);
          if (kc) f.appendChild(h('div','font-size:11.5px;color:'+C.apagat, kc + ' kcal'));
          box.appendChild(f);
        });
        cos.appendChild(box);
      });

      var miss = h('div','margin-top:18px');
      cos.appendChild(miss);
      var fila = h('div','display:flex;gap:9px;margin-top:14px;flex-wrap:wrap');
      var b = E.boto(nou ? 'Crear pla' : 'Desar canvis', function(){
        E.buida(miss);
        if (!esborrany.nom.trim() || !esborrany.kcal_obj){
          miss.appendChild(E.avis('El nom i les kcal objectiu són obligatoris.')); return;
        }
        var totalOp = Object.keys(esborrany.opcions).reduce(function(n,k){
          return n + esborrany.opcions[k].length; }, 0);
        if (!totalOp){ miss.appendChild(E.avis('Marca com a mínim una recepta.')); return; }
        b.disabled = true; b.textContent = 'Desant…';
        var caps = { nom:esborrany.nom.trim(), kcal_obj:parseInt(esborrany.kcal_obj,10),
          prot_obj:esborrany.prot_obj || null, carb_obj:esborrany.carb_obj || null,
          greix_obj:esborrany.greix_obj || null, notes:esborrany.notes.trim() || null };
        var p;
        if (nou){
          caps.nutritionist_id = E.perfil.id;
          p = E.sb.from('diet_plans').insert(caps).select('id').single();
        } else {
          caps.updated_at = new Date().toISOString();
          p = E.sb.from('diet_plans').update(caps).eq('id', vista.id).select('id').single()
            .then(function(r){
              if (r.error) return r;
              return E.sb.from('diet_plan_options').delete().eq('diet_plan_id', vista.id)
                .then(function(d){ return d.error ? d : r; });
            });
        }
        p.then(function(r){
          if (r.error) throw new Error(r.error.message);
          var pid = r.data.id, files = [];
          Object.keys(esborrany.opcions).forEach(function(tipus){
            esborrany.opcions[tipus].forEach(function(rid){
              files.push({ diet_plan_id:pid, tipus_apat:tipus, recipe_id:rid });
            });
          });
          return E.sb.from('diet_plan_options').insert(files).then(function(d){
            if (d.error) throw new Error(d.error.message);
            return pid;
          });
        }).then(function(pid){
          esborrany = null; vista = { mode:'fitxa', id:pid }; E.repinta();
        }).catch(function(err){
          b.disabled = false; b.textContent = nou ? 'Crear pla' : 'Desar canvis';
          miss.appendChild(E.avis(err.message));
        });
      });
      fila.appendChild(b);
      if (!nou){
        var esb = E.boto('Esborrar pla', function(){
          E.sb.from('diet_plans').update({ deleted_at:new Date().toISOString() }).eq('id', vista.id)
            .then(function(r){
              if (r.error){ miss.appendChild(E.avis(r.error.message)); return; }
              esborrany = null; vista = { mode:'llista' }; E.repinta();
            });
        }, 'perill');
        fila.appendChild(esb);
      }
      cos.appendChild(fila);
    });
}

E.seccions.push({
  id:'dietes', etiqueta:'Dietes', icona:'\u269C', rols:['nutritionist','coach'],
  pinta: function(cont){
    if (vista.mode === 'editor') return editor(cont);
    if (vista.mode === 'assignar' && vista.id) return assignar(cont);
    if (vista.mode === 'fitxa' && vista.id) return fitxa(cont);
    return llista(cont);
  }
});
})();
