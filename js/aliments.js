// Metabolisme Esparta · Aliments (biblioteca de nutricio)
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null };
var CATS = ['Proteïna','Cereals','Verdura','Fruita','Làctics','Greixos','Llegums','Altres'];

function opcions(llista){ return llista.map(function(x){ return { v:x, t:x }; }); }

function llista(cont){
  var accions = [];
  if (E.potNutricio())
    accions.push(E.boto('Nou aliment', function(){
      vista = { mode:'editor', id:null }; E.repinta();
    }));
  cont.appendChild(E.capcalera('Aliments', E.potNutricio()
    ? 'Valors nutricionals per 100 g'
    : 'Biblioteca de la nutricionista · en lectura', accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  E.sb.from('foods').select('*').is('deleted_at', null).order('categoria').order('nom')
    .then(function(r){
      E.buida(cos);
      if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
      var dades = r.data || [];
      if (!dades.length){
        cos.appendChild(E.buit('Cap aliment encara. Comença per afegir-ne uns quants.'));
        return;
      }
      var grups = {};
      dades.forEach(function(x){ (grups[x.categoria] = grups[x.categoria] || []).push(x); });

      Object.keys(grups).forEach(function(cat){
        cos.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
          'font-weight:700;color:'+C.or+';margin:18px 0 9px', cat));
        var box = h('div','display:flex;flex-direction:column;gap:1px;background:'+C.vora);
        grups[cat].forEach(function(x){
          var f = h('div','display:flex;align-items:center;gap:14px;padding:11px 15px;'+
            'background:'+C.panell+(E.potNutricio() ? ';cursor:pointer' : ''));
          if (E.potNutricio())
            f.onclick = function(){ vista = { mode:'editor', id:x.id }; E.repinta(); };
          var t = h('div','flex:1;min-width:0');
          t.appendChild(h('div','font-size:14px;font-weight:600;color:'+C.os, x.nom));
          f.appendChild(t);
          var d = h('div','display:flex;gap:14px;font-size:11.5px;color:'+C.apagat+';flex-shrink:0');
          d.appendChild(h('div',null, x.kcal_100 + ' kcal'));
          d.appendChild(h('div',null, 'P ' + x.prot_100));
          d.appendChild(h('div',null, 'C ' + x.carb_100));
          d.appendChild(h('div',null, 'G ' + x.greix_100));
          f.appendChild(d);
          box.appendChild(f);
        });
        cos.appendChild(box);
      });
    });
}

function editor(cont){
  var nou = !vista.id;
  cont.appendChild(E.capcalera(nou ? 'Nou aliment' : 'Editar aliment', null,
    [E.boto('Cancel\u00b7lar', function(){ vista = { mode:'llista' }; E.repinta(); }, 'buit')]));
  var cos = E.cos();
  cont.appendChild(cos);

  function formulari(x){
    x = x || {};
    var f = E.targeta();
    f.style.maxWidth = '560px';

    var nom = E.camp({ et:'Nom', marca:'Pit de pollastre', valor:x.nom });
    var cat = E.camp({ et:'Categoria', tipus:'select', valor:x.categoria || CATS[0],
      opcions:opcions(CATS) });
    var g = h('div','display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:13px');
    g.appendChild(nom); g.appendChild(cat);
    f.appendChild(g);

    var kcal = E.camp({ et:'Kcal / 100g', tipus:'number', pas:'0.1', valor:x.kcal_100 });
    var prot = E.camp({ et:'Proteïna / 100g', tipus:'number', pas:'0.1', valor:x.prot_100 });
    var carb = E.camp({ et:'Carbohidrats / 100g', tipus:'number', pas:'0.1', valor:x.carb_100 });
    var greix = E.camp({ et:'Greix / 100g', tipus:'number', pas:'0.1', valor:x.greix_100 });
    var fibra = E.camp({ et:'Fibra / 100g', tipus:'number', pas:'0.1', valor:x.fibra_100 });
    var unit = E.camp({ et:'Unitat de referència', marca:'1 ou \u2248 55 g', valor:x.unitat_ref });
    var g2 = h('div','display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:18px');
    [kcal,prot,carb,greix,fibra,unit].forEach(function(c){ g2.appendChild(c); });
    f.appendChild(g2);

    var miss = h('div','margin-bottom:14px');
    f.appendChild(miss);

    var fila = h('div','display:flex;gap:9px;flex-wrap:wrap');
    var b = E.boto(nou ? 'Crear aliment' : 'Desar canvis', function(){
      E.buida(miss);
      if (!nom.control.value.trim() || !kcal.control.value){
        miss.appendChild(E.avis('El nom i les kcal són obligatoris.')); return;
      }
      b.disabled = true; b.textContent = 'Desant…';
      var caps = {
        nom: nom.control.value.trim(), categoria: cat.control.value,
        kcal_100: kcal.control.value, prot_100: prot.control.value || 0,
        carb_100: carb.control.value || 0, greix_100: greix.control.value || 0,
        fibra_100: fibra.control.value || null, unitat_ref: unit.control.value.trim() || null
      };
      var p = nou ? E.sb.from('foods').insert(caps)
                  : E.sb.from('foods').update(caps).eq('id', vista.id);
      p.then(function(r){
        b.disabled = false; b.textContent = nou ? 'Crear aliment' : 'Desar canvis';
        if (r.error){ miss.appendChild(E.avis(r.error.message)); return; }
        vista = { mode:'llista' }; E.repinta();
      });
    });
    fila.appendChild(b);

    if (!nou){
      var esb = E.boto('Esborrar', function(){
        E.sb.from('foods').update({ deleted_at:new Date().toISOString() }).eq('id', vista.id)
          .then(function(r){
            if (r.error){ miss.appendChild(E.avis(r.error.message)); return; }
            vista = { mode:'llista' }; E.repinta();
          });
      }, 'perill');
      fila.appendChild(esb);
    }
    f.appendChild(fila);
    cos.appendChild(f);
  }

  if (nou) return formulari();
  cos.appendChild(E.carregant());
  E.sb.from('foods').select('*').eq('id', vista.id).single().then(function(r){
    E.buida(cos);
    if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
    formulari(r.data);
  });
}

E.seccions.push({
  id:'aliments', etiqueta:'Aliments', icona:'\u2618', rols:['nutritionist','coach'],
  propietari:false,
  pinta: function(cont){
    if (vista.mode === 'editor') return editor(cont);
    return llista(cont);
  }
});
})();
