// Metabolisme Esparta · pesatges complets amb perimetres i fotos
// DADES DE SALUT: categoria especial del RGPD. Bucket privat, enllacos temporals.
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;

var PERIMETRES = [
  ['pit_cm','Pit'], ['coll_cm','Coll'], ['espatlles_cm','Espatlles'],
  ['biceps_esq_cm','Bíceps esq.'], ['biceps_dret_cm','Bíceps dret'],
  ['avantbrac_esq_cm','Avantbraç esq.'], ['avantbrac_dret_cm','Avantbraç dret'],
  ['cintura_cm','Cintura'], ['maluc_cm','Maluc'],
  ['cuixa_esq_cm','Cuixa esq.'], ['cuixa_dret_cm','Cuixa dreta'],
  ['bessons_esq_cm','Bessó esq.'], ['bessons_dret_cm','Bessó dret']
];
// Mides d'abans de mesurar per costats: nomes es mostren si n'hi ha
var ANTIGUES = [['brac_cm','Braç'],['avantbrac_cm','Avantbraç'],
                ['cuixa_cm','Cuixa'],['bessons_cm','Bessons']];
E.ANTIGUES = ANTIGUES;
var FOTOS = [
  ['foto_front','Front'], ['foto_esquena','Esquena'], ['foto_perfil','Perfil']
];
E.PERIMETRES = PERIMETRES;
E.FOTOS = FOTOS;

// ── Formulari ──────────────────────────────────────────────────────
E.formPesatge = function(athleteId, despres, alDesar){
  if (despres.parentNode.querySelector('[data-form-pesatge]')) return;

  var box = h('div','background:'+C.panell+';border:1px solid '+E.accent()+'55;'+
    'padding:16px 18px;margin-top:11px');
  box.setAttribute('data-form-pesatge','1');
  var avui = new Date().toISOString().slice(0,10);

  var data = E.camp({ et:'Data', tipus:'date', valor:avui });
  var pes  = E.camp({ et:'Pes (kg)', tipus:'number', pas:'0.1', marca:'78.4' });
  var greix= E.camp({ et:'Greix (%)', tipus:'number', pas:'0.1', marca:'14.2' });
  var musc = E.camp({ et:'Múscul (kg)', tipus:'number', pas:'0.1', marca:'36.8' });

  var g1 = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));'+
    'gap:10px;margin-bottom:16px');
  [data,pes,greix,musc].forEach(function(c){ g1.appendChild(c); });
  box.appendChild(g1);

  box.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.or+';margin-bottom:9px','Perímetres (cm)'));
  var camps = {};
  var g2 = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));'+
    'gap:10px;margin-bottom:16px');
  PERIMETRES.forEach(function(p){
    var c = E.camp({ et:p[1], tipus:'number', pas:'0.1' });
    camps[p[0]] = c;
    g2.appendChild(c);
  });
  box.appendChild(g2);

  box.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.or+';margin-bottom:4px','Fotos de control'));
  box.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.5;margin-bottom:10px',
    'Opcionals. Es guarden xifrades i només les veuen l\'Espartà, tu i la nutricionista.'));

  var fitxers = {};
  var g3 = h('div','display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px');
  FOTOS.forEach(function(p){
    var w = h('div');
    w.appendChild(h('div','font-size:10px;letter-spacing:.13em;text-transform:uppercase;'+
      'color:'+C.apagat+';font-weight:700;margin-bottom:5px', p[1]));
    var zona = h('div','border:1px dashed rgba(194,176,106,.32);padding:14px 10px;'+
      'text-align:center;cursor:pointer;min-height:74px;display:flex;'+
      'align-items:center;justify-content:center;flex-direction:column;gap:5px');
    var txt = h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.4','Tria una foto');
    zona.appendChild(txt);
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.setAttribute('style','display:none');
    zona.onclick = function(){ inp.click(); };
    inp.onchange = function(){
      var f = inp.files && inp.files[0];
      if (!f) return;
      fitxers[p[0]] = f;
      E.buida(zona);
      var im = document.createElement('img');
      im.src = URL.createObjectURL(f);
      im.setAttribute('style','max-width:100%;max-height:96px;object-fit:cover');
      zona.appendChild(im);
      zona.style.borderStyle = 'solid';
      zona.style.borderColor = E.accent()+'66';
    };
    w.appendChild(zona);
    w.appendChild(inp);
    g3.appendChild(w);
  });
  box.appendChild(g3);

  // Cada professional escriu NOMES al seu camp. La nota de l'altre no es toca.
  var esNutri = E.perfil.role === 'nutritionist';
  var campNota = esNutri ? 'notes_nutricionista' : 'notes_entrenador';
  var colNota = esNutri ? C.verd : C.blau;
  box.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
    'font-weight:700;color:'+colNota+';margin-bottom:4px',
    esNutri ? 'Nota de la nutricionista' : 'Nota de l\'entrenador'));
  box.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.5;margin-bottom:9px',
    'L\'Espartà la llegeix a la seva app. '+
    (esNutri ? 'L\'entrenador té la seva nota a part.'
             : 'La nutricionista té la seva nota a part.')));
  var nota = E.camp({ tipus:'textarea', files:2, marca: esNutri
    ? 'Ajust de kcal, adherència, hidratació…'
    : 'Càrrega, tècnica, recuperació…' });
  nota.style.marginBottom = '16px';
  box.appendChild(nota);

  var miss = h('div','margin-bottom:12px');
  box.appendChild(miss);

  var fila = h('div','display:flex;gap:8px');
  var b = E.boto('Desar pesatge', function(){
    E.buida(miss);
    if (!pes.control.value){ miss.appendChild(E.avis('Escriu com a mínim el pes.')); return; }
    b.disabled = true; b.textContent = 'Desant…';

    var reg = {
      athlete_id: athleteId,
      data: data.control.value || avui,
      pes_kg: pes.control.value,
      greix_pct: greix.control.value || null,
      muscul_kg: musc.control.value || null,
      autor_id: E.perfil.id
    };
    PERIMETRES.forEach(function(p){
      reg[p[0]] = camps[p[0]].control.value || null;
    });
    if (nota.control.value.trim()) reg[campNota] = nota.control.value.trim();

    var claus = Object.keys(fitxers);
    var pujades = claus.map(function(k){
      var f = fitxers[k];
      var ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
      var ruta = athleteId + '/' + reg.data + '-' + k.replace('foto_','') + '.' + ext;
      return E.sb.storage.from('pesatges').upload(ruta, f, { upsert:true })
        .then(function(r){
          if (r.error) throw new Error('Foto ' + k.replace('foto_','') + ': ' + r.error.message);
          reg[k] = ruta;
        });
    });

    Promise.all(pujades)
      .then(function(){
        return E.sb.from('measurements').upsert(reg, { onConflict:'athlete_id,data' });
      })
      .then(function(r){
        if (!r || !r.error) E.registra('desa_pesatge', 'athletes', athleteId);
        return r;
      })
      .then(function(r){
        if (r.error) throw new Error(r.error.message);
        if (alDesar) alDesar(); else E.repinta();
      })
      .catch(function(err){
        b.disabled = false; b.textContent = 'Desar pesatge';
        miss.appendChild(E.avis(err.message));
      });
  });
  b.style.padding = '10px 18px'; b.style.fontSize = '12px';
  var c = E.boto('Cancel\u00b7lar', function(){ box.remove(); }, 'buit');
  c.style.padding = '10px 18px'; c.style.fontSize = '12px';
  fila.appendChild(b); fila.appendChild(c);
  box.appendChild(fila);

  despres.insertAdjacentElement('afterend', box);
};

// ── Detall d'un pesatge ────────────────────────────────────────────
E.detallPesatge = function(m, despres){
  var obert = despres.parentNode.querySelector('[data-detall="'+m.id+'"]');
  if (obert){ obert.remove(); return; }

  // Aqui dins hi ha perimetres, notes i fotos de progres.
  E.registra('obre_pesatge', 'athletes', m.athlete_id,
    { pesatge: m.id, data: m.data });
  var altres = despres.parentNode.querySelectorAll('[data-detall]');
  for (var i=0;i<altres.length;i++) altres[i].remove();

  var box = h('div','background:'+C.panell2+';padding:15px 17px');
  box.setAttribute('data-detall', m.id);

  // ── Notes: un espai per a cadascun ──────────────────────────────
  var propi = E.perfil.role === 'nutritionist' ? 'notes_nutricionista' : 'notes_entrenador';

  function blocNota(camp, etiqueta, color){
    var w = h('div','background:'+C.panell+';border-left:3px solid '+color+';'+
      'padding:12px 14px;margin-bottom:11px');
    w.appendChild(h('div','font-size:10px;letter-spacing:.13em;text-transform:uppercase;'+
      'font-weight:700;color:'+color+';margin-bottom:8px', etiqueta));
    if (camp !== propi){
      w.appendChild(h('div','font-size:13px;line-height:1.6;white-space:pre-wrap;'+
        'color:'+(m[camp] ? C.pedra : C.apagat), m[camp] || 'Sense nota.'));
      return w;
    }
    var ta = document.createElement('textarea');
    ta.rows = 2;
    ta.value = m[camp] || '';
    ta.placeholder = 'La teva nota sobre aquest pesatge…';
    ta.setAttribute('style','width:100%;padding:10px 12px;background:'+C.fons+';'+
      'border:1px solid rgba(194,176,106,.24);color:'+C.os+";font-size:13.5px;"+
      "font-family:'Barlow',sans-serif");
    w.appendChild(ta);
    var msg = h('div','margin-top:8px');
    var b = E.boto('Desar la nota', function(){
      E.buida(msg);
      b.disabled = true; b.textContent = 'Desant…';
      var canvi = {};
      canvi[camp] = ta.value.trim() || null;
      E.sb.from('measurements').update(canvi).eq('id', m.id).then(function(r){
        b.disabled = false; b.textContent = 'Desar la nota';
        if (r.error){ msg.appendChild(E.avis(r.error.message)); return; }
        if (E.avisa && canvi[camp]) E.avisa(m.athlete_id, 'Nota nova al teu pesatge',
          E.resum(canvi[camp]), 'progres');
        m[camp] = canvi[camp];
        msg.appendChild(h('div','font-size:12px;color:'+C.oliva,'Nota desada.'));
      });
    });
    b.style.padding = '9px 16px'; b.style.fontSize = '11.5px'; b.style.marginTop = '8px';
    w.appendChild(b);
    w.appendChild(msg);
    return w;
  }

  box.appendChild(blocNota('notes_entrenador', 'Nota de l\'entrenador', C.blau));
  box.appendChild(blocNota('notes_nutricionista', 'Nota de la nutricionista', C.verd));
  box.appendChild(h('div','height:6px'));

  var perim = E.PERIMETRES.concat(E.ANTIGUES).filter(function(p){ return m[p[0]] != null; });
  if (perim.length){
    box.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
      'font-weight:700;color:'+C.or+';margin-bottom:9px','Perímetres'));
    var g = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));'+
      'gap:1px;background:'+C.vora+';margin-bottom:15px');
    perim.forEach(function(p){
      var c = h('div','background:'+C.panell+';padding:9px 11px');
      c.appendChild(h('div','font-size:9px;letter-spacing:.1em;text-transform:uppercase;'+
        'color:'+C.apagat+';font-weight:700;margin-bottom:3px', p[1]));
      c.appendChild(h('div','font-size:13.5px;color:'+C.os+';font-weight:600',
        m[p[0]] + ' cm'));
      g.appendChild(c);
    });
    box.appendChild(g);
  }

  var ambFoto = E.FOTOS.filter(function(p){ return m[p[0]]; });
  if (ambFoto.length){
    box.appendChild(h('div','font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
      'font-weight:700;color:'+C.or+';margin-bottom:9px','Fotos de control'));
    var gf = h('div','display:grid;grid-template-columns:repeat(3,1fr);gap:9px');
    ambFoto.forEach(function(p){
      var w = h('div');
      w.appendChild(h('div','font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;'+
        'color:'+C.apagat+';font-weight:700;margin-bottom:5px', p[1]));
      var marc = h('div','background:'+C.fons+';min-height:120px;display:flex;'+
        'align-items:center;justify-content:center');
      marc.appendChild(h('div','font-size:11px;color:'+C.apagat,'carregant…'));
      w.appendChild(marc);
      gf.appendChild(w);
      // Enllac temporal: les fotos no son publiques
      E.sb.storage.from('pesatges').createSignedUrl(m[p[0]], 3600).then(function(r){
        E.buida(marc);
        if (r.error || !r.data){
          marc.appendChild(h('div','font-size:11px;color:'+C.apagat+';padding:10px;'+
            'text-align:center;line-height:1.4','no disponible'));
          return;
        }
        var a = document.createElement('a');
        a.href = r.data.signedUrl; a.target = '_blank';
        a.setAttribute('style','display:block');
        var im = document.createElement('img');
        im.src = r.data.signedUrl;
        im.setAttribute('style','width:100%;display:block;max-height:230px;object-fit:cover');
        a.appendChild(im);
        marc.appendChild(a);
      });
    });
    box.appendChild(gf);
  }

  if (!perim.length && !ambFoto.length)
    box.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';line-height:1.5',
      'Aquest pesatge només té pes i composició.'));

  despres.insertAdjacentElement('afterend', box);
};
})();
