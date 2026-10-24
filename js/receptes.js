// Metabolisme Esparta · Receptes
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null };
var esborrany = null;
var TIPUS = { esmorzar:'Esmorzar', mig_mati:'Mig matí', dinar:'Dinar', berenar:'Berenar', sopar:'Sopar', recuperador:'Recuperador' };

function opcionsTipus(){
  return Object.keys(TIPUS).map(function(k){ return { v:k, t:TIPUS[k] }; });
}
function macrosDe(items, mapa){
  var m = { kcal:0, prot:0, carb:0, greix:0 };
  items.forEach(function(it){
    var f = mapa[it.food_id]; if (!f) return;
    var f2 = it.grams / 100;
    m.kcal  += f.kcal_100  * f2;
    m.prot  += f.prot_100  * f2;
    m.carb  += f.carb_100  * f2;
    m.greix += f.greix_100 * f2;
  });
  return { kcal:Math.round(m.kcal), prot:Math.round(m.prot),
           carb:Math.round(m.carb), greix:Math.round(m.greix) };
}

function llista(cont){
  var accions = [];
  if (E.potNutricio())
    accions.push(E.boto('Nova recepta', function(){
      esborrany = { nom:'', tipus_apat:'dinar', racions:1, instruccions:'', items:[] };
      vista = { mode:'editor', id:null }; E.repinta();
    }));
  cont.appendChild(E.capcalera('Receptes', E.potNutricio()
    ? 'Els macros es calculen sols dels ingredients'
    : 'Receptes de la nutricionista · en lectura', accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  Promise.all([
    E.sb.from('recipes').select('id,nom,tipus_apat,racions,recipe_items(food_id,grams)')
      .is('deleted_at', null).order('created_at',{ascending:false}),
    E.sb.from('foods').select('id,kcal_100,prot_100,carb_100,greix_100')
  ]).then(function(rr){
      var r = rr[0], mapa = {};
      (rr[1].data || []).forEach(function(a){ mapa[a.id] = a; });
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var dades = r.data || [];
      if (!dades.length){
        cos.appendChild(E.buit('Cap recepta encara. Es fan servir per construir els plans de dieta.'));
        return;
      }
      var box = h('div','display:flex;flex-direction:column;gap:7px');
      dades.forEach(function(x){
        var mac = macrosDe(x.recipe_items || [], mapa);
        var f = h('div','display:flex;align-items:center;gap:15px;padding:14px 17px;'+
          'background:'+C.panell+';border:1px solid '+C.vora+';cursor:pointer');
        f.onmouseenter = function(){ f.style.borderColor = E.accent()+'66'; };
        f.onmouseleave = function(){ f.style.borderColor = C.vora; };
        f.onclick = function(){ vista = { mode:'fitxa', id:x.id }; E.repinta(); };
        var t = h('div','flex:1;min-width:0');
        t.appendChild(h('div','font-size:15px;font-weight:600;color:'+C.os, x.nom));
        t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:3px',
          x.racions + (x.racions === 1 ? ' ració' : ' racions') +
          (mac ? ' \u00b7 ' + mac.kcal + ' kcal' : '')));
        f.appendChild(t);
        f.appendChild(E.etiqueta(TIPUS[x.tipus_apat] || x.tipus_apat, C.verd));
        box.appendChild(f);
      });
      cos.appendChild(box);
    });
}

function fitxa(cont){
  var accions = [E.boto('Tornar', function(){ vista = { mode:'llista' }; E.repinta(); }, 'buit')];
  if (E.potNutricio())
    accions.unshift(E.boto('Editar', function(){ carregaEsborrany(vista.id); }));
  cont.appendChild(E.capcalera('Recepta', null, accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  E.sb.from('recipes')
    .select('*,recipe_items(*,aliment:foods(nom,categoria,kcal_100,prot_100,carb_100,greix_100))')
    .eq('id', vista.id).single()
    .then(function(r){
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var x = r.data;
      var items = x.recipe_items || [];
      var mapaIt = {};
      items.forEach(function(it){ if (it.aliment) mapaIt[it.food_id] = it.aliment; });
      var m0 = macrosDe(items, mapaIt);
      var mac = { kcal:m0.kcal, prot_g:m0.prot, carb_g:m0.carb, greix_g:m0.greix };

      var cap = h('div','margin-bottom:20px');
      cap.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:24px;"+
        'color:'+C.os, x.nom));
      var meta = h('div','display:flex;gap:9px;align-items:center;margin-top:8px;flex-wrap:wrap');
      meta.appendChild(E.etiqueta(TIPUS[x.tipus_apat] || x.tipus_apat, C.verd));
      meta.appendChild(h('div','font-size:12px;color:'+C.apagat,
        x.racions + (x.racions === 1 ? ' ració' : ' racions')));
      cap.appendChild(meta);
      cos.appendChild(cap);

      var g = h('div','display:grid;grid-template-columns:repeat(4,1fr);gap:1px;'+
        'background:'+C.vora+';margin-bottom:24px');
      [['Kcal',mac.kcal,C.verd],['Proteïna',mac.prot_g+'g',C.or],
       ['Carbohidrats',mac.carb_g+'g',C.pedra],['Greix',mac.greix_g+'g',C.pedra]].forEach(function(d){
        var c = h('div','background:'+C.panell+';padding:13px 14px;text-align:center');
        c.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:19px;"+
          'color:'+d[2], String(d[1] == null ? '\u2014' : d[1])));
        c.appendChild(h('div','font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;'+
          'color:'+C.apagat+';margin-top:4px;font-weight:700', d[0]));
        g.appendChild(c);
      });
      cos.appendChild(g);

      if (x.instruccions){
        cos.appendChild(E.titol('Elaboració', 15));
        cos.appendChild(h('div','font-size:13.5px;color:'+C.pedra+';line-height:1.65;'+
          'white-space:pre-wrap;margin:9px 0 22px', x.instruccions));
      }

      cos.appendChild(E.titol('Ingredients', 15));
      var li = h('div','margin-top:11px;display:flex;flex-direction:column;gap:1px;'+
        'background:'+C.vora);
      items.forEach(function(it){
        var f = h('div','display:flex;justify-content:space-between;background:'+C.panell+';'+
          'padding:11px 15px');
        f.appendChild(h('div','font-size:13.5px;color:'+C.os,
          (it.aliment && it.aliment.nom) || 'Ingredient'));
        f.appendChild(h('div','font-size:13px;color:'+C.apagat, it.grams + ' g'));
        li.appendChild(f);
      });
      cos.appendChild(li);
    });
}

function carregaEsborrany(id){
  E.sb.from('recipes').select('*,recipe_items(*)').eq('id', id).single().then(function(r){
    if (r.error) return;
    var x = r.data;
    esborrany = {
      nom:x.nom, tipus_apat:x.tipus_apat, racions:x.racions, instruccions:x.instruccions || '',
      items:(x.recipe_items || []).map(function(it){
        return { food_id:it.food_id, grams:it.grams };
      })
    };
    vista = { mode:'editor', id:id };
    E.repinta();
  });
}

function editor(cont){
  var nou = !vista.id;
  if (!esborrany) esborrany = { nom:'', tipus_apat:'dinar', racions:1, instruccions:'', items:[] };

  cont.appendChild(E.capcalera(nou ? 'Nova recepta' : 'Editar recepta',
    'Els macros es calculen automàticament dels ingredients',
    [E.boto('Cancel\u00b7lar', function(){
      esborrany = null;
      vista = nou ? { mode:'llista' } : { mode:'fitxa', id:vista.id };
      E.repinta();
    }, 'buit')]));

  var cos = E.cos();
  cos.appendChild(E.carregant('Carregant aliments…'));
  cont.appendChild(cos);

  E.sb.from('foods').select('id,nom,categoria,kcal_100,prot_100,carb_100,greix_100')
    .is('deleted_at', null).order('nom')
    .then(function(r){
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var aliments = r.data || [];
      if (!aliments.length){
        cos.appendChild(E.buit('Primer calen aliments a la biblioteca. Ve a «Aliments».'));
        return;
      }
      var mapa = {};
      aliments.forEach(function(a){ mapa[a.id] = a; });

      var dalt = E.targeta();
      dalt.style.marginBottom = '20px';
      var nom = E.camp({ et:'Nom de la recepta', marca:'Bol d\'arròs amb pollastre',
        valor:esborrany.nom });
      var tip = E.camp({ et:'Àpat', tipus:'select', valor:esborrany.tipus_apat,
        opcions:opcionsTipus() });
      var rac = E.camp({ et:'Racions', tipus:'number', valor:esborrany.racions });
      var g = h('div','display:grid;grid-template-columns:2fr 1fr 1fr;gap:12px;margin-bottom:13px');
      g.appendChild(nom); g.appendChild(tip); g.appendChild(rac);
      dalt.appendChild(g);
      var ins = E.camp({ et:'Elaboració', tipus:'textarea', files:3,
        marca:'Passos per preparar-ho…', valor:esborrany.instruccions });
      dalt.appendChild(ins);
      cos.appendChild(dalt);
      nom.control.oninput = function(){ esborrany.nom = nom.control.value; };
      tip.control.onchange = function(){ esborrany.tipus_apat = tip.control.value; };
      rac.control.oninput = function(){ esborrany.racions = rac.control.value; };
      ins.control.oninput = function(){ esborrany.instruccions = ins.control.value; };

      var capI = h('div','display:flex;align-items:center;justify-content:space-between;'+
        'gap:12px;margin-bottom:13px;flex-wrap:wrap');
      capI.appendChild(E.titol('Ingredients', 16));
      var selNou = E.camp({ et:'Afegir de la biblioteca', tipus:'select',
        opcions:[{v:'',t:'Tria un aliment\u2026'}].concat(aliments.map(function(a){
          return { v:a.id, t:a.nom + '  \u00b7  ' + a.categoria };
        })) });
      selNou.style.minWidth = '300px';
      capI.appendChild(selNou);
      cos.appendChild(capI);

      var resum = h('div');
      cos.appendChild(resum);
      var contenidor = h('div','display:flex;flex-direction:column;gap:8px;margin-top:12px');
      cos.appendChild(contenidor);

      selNou.control.onchange = function(){
        var id = selNou.control.value;
        if (!id) return;
        var ja = esborrany.items.filter(function(it){ return it.food_id === id; })[0];
        if (ja) ja.grams = Number(ja.grams) + 100;
        else esborrany.items.push({ food_id:id, grams:100 });
        selNou.control.value = '';
        pinta();
      };

      // El resum es repinta a cada tecla; la llista NOMES quan canvien els
      // ingredients. Si es repintava sencera, l'input perdia el focus i nomes
      // s'hi quedava la primera xifra.
      function pintaResum(){
        E.buida(resum);
        var m = macrosDe(esborrany.items, mapa);
        var g4 = h('div','display:grid;grid-template-columns:repeat(4,1fr);gap:1px;'+
          'background:'+C.vora+';margin-bottom:16px');
        [['Kcal',m.kcal],['Proteïna',m.prot+'g'],['Carbohidrats',m.carb+'g'],
         ['Greix',m.greix+'g']].forEach(function(d){
          var c = h('div','background:'+C.panell+';padding:11px;text-align:center');
          c.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:16px;"+
            'color:'+C.verd, String(d[1])));
          c.appendChild(h('div','font-size:9px;letter-spacing:.08em;text-transform:uppercase;'+
            'color:'+C.apagat+';margin-top:3px', d[0]));
          g4.appendChild(c);
        });
        resum.appendChild(g4);
      }

      function pintaItems(){
        E.buida(contenidor);
        if (!esborrany.items.length){
          contenidor.appendChild(E.buit('Afegeix ingredients amb el selector de dalt.'));
          return;
        }
        esborrany.items.forEach(function(it, i){
          var a = mapa[it.food_id] || { nom:'Ingredient' };
          var f = h('div','display:flex;align-items:center;gap:12px;background:'+C.panell+';'+
            'border:1px solid '+C.vora+';padding:11px 14px');
          var t = h('div','flex:1;min-width:0');
          t.appendChild(h('div','font-size:13.5px;font-weight:600;color:'+C.os, a.nom));
          f.appendChild(t);
          var ig = document.createElement('input');
          ig.type = 'number'; ig.value = it.grams;
          ig.setAttribute('style','width:80px;padding:8px 9px;background:'+C.fons+';'+
            'border:1px solid rgba(194,176,106,.24);color:'+C.os+";font-size:13px;"+
            "font-family:'Barlow',sans-serif;text-align:right");
          ig.oninput = function(){ it.grams = ig.value; pintaResum(); };
          ig.onfocus = function(){ ig.select(); };
          f.appendChild(ig);
          f.appendChild(h('div','font-size:12px;color:'+C.apagat+';width:14px','g'));
          var esb = document.createElement('button');
          esb.textContent = '\u00d7';
          esb.setAttribute('style','width:29px;height:29px;flex-shrink:0;background:transparent;'+
            'border:1px solid '+C.carmesi+'66;color:'+C.accio+';cursor:pointer;font-size:14px');
          esb.onclick = function(){ esborrany.items.splice(i,1); pinta(); };
          f.appendChild(esb);
          contenidor.appendChild(f);
        });
      }

      function pinta(){ pintaResum(); pintaItems(); }
      pinta();

      var miss = h('div','margin-top:18px');
      cos.appendChild(miss);
      var fila = h('div','display:flex;gap:9px;margin-top:14px;flex-wrap:wrap');
      var b = E.boto(nou ? 'Crear recepta' : 'Desar canvis', function(){
        E.buida(miss);
        if (!esborrany.nom.trim()){ miss.appendChild(E.avis('La recepta necessita un nom.')); return; }
        if (!esborrany.items.length){
          miss.appendChild(E.avis('Afegeix com a mínim un ingredient.')); return;
        }
        b.disabled = true; b.textContent = 'Desant…';
        var caps = { nom:esborrany.nom.trim(), tipus_apat:esborrany.tipus_apat,
          racions:parseInt(esborrany.racions,10) || 1,
          instruccions:esborrany.instruccions.trim() || null };
        var p;
        if (nou){
          caps.nutritionist_id = E.perfil.id;
          p = E.sb.from('recipes').insert(caps).select('id').single();
        } else {
          caps.updated_at = new Date().toISOString();
          p = E.sb.from('recipes').update(caps).eq('id', vista.id).select('id').single()
            .then(function(r){
              if (r.error) return r;
              return E.sb.from('recipe_items').delete().eq('recipe_id', vista.id)
                .then(function(d){ return d.error ? d : r; });
            });
        }
        p.then(function(r){
          if (r.error) throw new Error(r.error.message);
          var rid = r.data.id;
          var files = esborrany.items.filter(function(it){
            return Number(it.grams) > 0;
          }).map(function(it){
            return { recipe_id:rid, food_id:it.food_id, grams:Number(it.grams) };
          });
          return E.sb.from('recipe_items').insert(files).then(function(d){
            if (d.error) throw new Error(d.error.message);
            return rid;
          });
        }).then(function(rid){
          esborrany = null; vista = { mode:'fitxa', id:rid }; E.repinta();
        }).catch(function(err){
          b.disabled = false; b.textContent = nou ? 'Crear recepta' : 'Desar canvis';
          miss.appendChild(E.avis(err.message));
        });
      });
      fila.appendChild(b);
      if (!nou){
        var esb2 = E.boto('Esborrar recepta', function(){
          E.sb.from('recipes').update({ deleted_at:new Date().toISOString() }).eq('id', vista.id)
            .then(function(r){
              if (r.error){ miss.appendChild(E.avis(r.error.message)); return; }
              esborrany = null; vista = { mode:'llista' }; E.repinta();
            });
        }, 'perill');
        fila.appendChild(esb2);
      }
      cos.appendChild(fila);
    });
}

E.seccions.push({
  id:'receptes', etiqueta:'Receptes', icona:'\u2604', rols:['nutritionist','coach'],
  pinta: function(cont){
    if (vista.mode === 'editor') return editor(cont);
    if (vista.mode === 'fitxa' && vista.id) return fitxa(cont);
    return llista(cont);
  }
});
})();
