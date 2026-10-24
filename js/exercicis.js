// Metabolisme Esparta · Exercicis (força i cardio)
//
// Una sola biblioteca amb dues portes: els exercicis de força porten
// vídeo i consignes; els de cardio porten imatges (la màquina, el
// recorregut, la posició) perquè sovint no fa falta un vídeo.
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista', id:null, cerca:'', grup:'tots', mena:'forca' };

var GRUPS = {
  forca: ['Pit','Espatlla','Esquena','Bíceps','Tríceps','Quàdriceps','Isquios',
          'Glutis','Bessons','Core','Cos sencer'],
  cardio: ['Córrer','Caminar','Bici','Rem','El·líptica','Corda','Natació',
           'Salt','Pes corporal','Kettlebell','Mixt']
};
var PATRONS = {
  forca: ['Empenyer horitzontal','Empenyer vertical','Estirar horitzontal',
          'Estirar vertical','Genoll dominant','Maluc dominant','Transport',
          'Rotació','Isometria'],
  cardio: ['Continu','Interval curt','Interval llarg','Sprint','Escala',
           'Pliometria','Metabòlic','Recuperació activa']
};
var MATERIALS = {
  forca: ['Barra','Manuelles','Màquina','Politja','Kettlebell','Goma',
          'Pes corporal','Banc','Cap material'],
  cardio: ['Cinta','Bici estàtica','Remer','El·líptica','Corda','Caixa',
           'Kettlebell','Pista','Pes corporal','Cap material']
};
var MENES = [
  { v:'forca',  t:'Força' },
  { v:'cardio', t:'Cardio' }
];

// Treu l'identificador del vídeo de qualsevol forma d'enllaç de YouTube
function idYoutube(url){
  if (!url) return null;
  var m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
E.idYoutube = idYoutube;

function opcions(llista, buit){
  return [{ v:'', t: buit || '\u2014' }].concat(llista.map(function(x){
    return { v:x, t:x };
  }));
}

// ── Les dues portes de la biblioteca ───────────────────────────────
function barraMenes(quan){
  var b = h('div','display:flex;gap:1px;background:'+C.vora+';margin-bottom:18px;'+
    'width:fit-content');
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
      vista.mena = m.v; vista.grup = 'tots';
      if (quan) quan();
    };
    b.appendChild(t);
  });
  return b;
}

function targetaEx(x){
  var vid = idYoutube(x.youtube_url);
  var imgs = x.imatges || [];
  var c = h('div','background:'+C.panell+';border:1px solid '+C.vora+';cursor:pointer;'+
    'display:flex;flex-direction:column');
  c.onmouseenter = function(){ c.style.borderColor = E.accent()+'66'; };
  c.onmouseleave = function(){ c.style.borderColor = C.vora; };
  c.onclick = function(){ vista.mode = 'fitxa'; vista.id = x.id; E.repinta(); };

  var mini = h('div','height:104px;background:'+C.panell2+';position:relative;'+
    'display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0');
  if (imgs.length){
    var im = document.createElement('img');
    im.src = E.urlExercici(imgs[0]);
    im.alt = '';
    im.setAttribute('style','width:100%;height:100%;object-fit:cover');
    mini.appendChild(im);
    if (imgs.length > 1)
      mini.appendChild(h('div','position:absolute;bottom:6px;right:7px;padding:2px 7px;'+
        'background:'+C.fons+'cc;font-size:10px;font-weight:700;color:'+C.or,
        imgs.length + ' fotos'));
  } else if (vid){
    var img = document.createElement('img');
    img.src = 'https://i.ytimg.com/vi/' + vid + '/mqdefault.jpg';
    img.alt = '';
    img.setAttribute('style','width:100%;height:100%;object-fit:cover;opacity:.82');
    mini.appendChild(img);
    mini.appendChild(h('div','position:absolute;width:34px;height:34px;background:'+C.carmesi+'dd;'+
      'display:flex;align-items:center;justify-content:center;color:#F0E4C8;font-size:13px;'+
      'padding-left:2px','\u25B6'));
  } else {
    mini.appendChild(h('div','font-size:11px;letter-spacing:.1em;text-transform:uppercase;'+
      'color:'+C.apagat+';font-weight:700;text-align:center;padding:0 12px;line-height:1.5',
      x.mena === 'cardio' ? 'Sense imatge' : 'Sense vídeo'));
  }
  c.appendChild(mini);

  var t = h('div','padding:13px 15px;flex:1');
  t.appendChild(h('div','font-size:14.5px;font-weight:600;color:'+C.os+';line-height:1.3', x.nom));
  var meta = [x.grup_muscular, x.material].filter(Boolean).join(' \u00b7 ');
  t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:4px', meta || '\u2014'));
  c.appendChild(t);
  return c;
}

function llista(cont){
  var esCardio = vista.mena === 'cardio';
  var accions = [];
  if (E.perfil.role === 'coach')
    accions.push(E.boto(esCardio ? 'Nou exercici de cardio' : 'Nou exercici', function(){
      vista.mode = 'nou'; vista.id = null; E.repinta();
    }));
  cont.appendChild(E.capcalera('Exercicis',
    E.perfil.role === 'coach'
      ? (esCardio ? 'Moviments i màquines de cardio, amb imatges'
                  : 'Biblioteca de moviments amb vídeo')
      : 'Biblioteca en mode lectura', accions));

  var cos = E.cos();
  cont.appendChild(cos);
  cos.appendChild(barraMenes(function(){ E.repinta(); }));

  var zona = h('div');
  zona.appendChild(E.carregant());
  cos.appendChild(zona);

  E.sb.from('exercises')
    .select('id,nom,mena,patro,grup_muscular,material,youtube_url,imatges')
    .eq('mena', vista.mena)
    .is('deleted_at', null)
    .order('nom')
    .then(function(r){
      E.buida(zona);
      if (r.error){ zona.appendChild(E.avis(r.error.message)); return; }
      var dades = r.data || [];

      if (!dades.length){
        zona.appendChild(E.buit(E.perfil.role === 'coach'
          ? (esCardio
              ? 'Cap exercici de cardio encara. Crea\'n un i podràs muntar sessions '+
                'de HIIT i intervals a «Rutines».'
              : 'Cap exercici de força encara. Prem «Nou exercici» per començar la biblioteca.')
          : "L'entrenador encara no ha carregat cap exercici d'aquesta mena."));
        return;
      }

      var barra = h('div','display:flex;gap:10px;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap');
      var cerca = E.camp({ et:'Cercar', marca:'nom de l\'exercici', valor:vista.cerca });
      cerca.style.flex = '1'; cerca.style.minWidth = '220px';
      var grups = {};
      dades.forEach(function(x){ if (x.grup_muscular) grups[x.grup_muscular] = 1; });
      var selG = E.camp({ et:esCardio ? 'Modalitat' : 'Grup muscular', tipus:'select',
        valor:vista.grup,
        opcions:[{v:'tots',t:'Tots'}].concat(Object.keys(grups).sort().map(function(g){
          return { v:g, t:g };
        })) });
      selG.style.minWidth = '180px';
      barra.appendChild(cerca); barra.appendChild(selG);
      zona.appendChild(barra);

      var graella = h('div','display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:13px');
      var recompte = h('div','font-size:12px;color:'+C.apagat+';margin-bottom:12px');
      zona.appendChild(recompte);
      zona.appendChild(graella);

      function refresca(){
        vista.cerca = cerca.control.value;
        vista.grup = selG.control.value;
        var q = vista.cerca.trim().toLowerCase();
        var vis = dades.filter(function(x){
          if (vista.grup !== 'tots' && x.grup_muscular !== vista.grup) return false;
          if (q && x.nom.toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        recompte.textContent = vis.length + ' de ' + dades.length + ' exercicis';
        E.buida(graella);
        if (!vis.length) graella.appendChild(E.buit('Cap exercici amb aquests criteris.'));
        vis.forEach(function(x){ graella.appendChild(targetaEx(x)); });
      }
      cerca.control.oninput = refresca;
      selG.control.onchange = refresca;
      refresca();
    });
}

function fitxa(cont){
  var accions = [E.boto('Tornar', function(){ vista.mode = 'llista'; E.repinta(); }, 'buit')];
  if (E.perfil.role === 'coach')
    accions.unshift(E.boto('Editar', function(){ vista.mode = 'nou'; E.repinta(); }));
  cont.appendChild(E.capcalera('Exercici', null, accions));

  var cos = E.cos();
  cos.appendChild(E.carregant());
  cont.appendChild(cos);

  E.sb.from('exercises').select('*').eq('id', vista.id).single().then(function(r){
    E.buida(cos);
    if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
    var x = r.data, vid = idYoutube(x.youtube_url);
    var imgs = x.imatges || [];
    var esCardio = x.mena === 'cardio';

    var cols = h('div','display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);'+
      'gap:26px;align-items:start');

    var esq = h('div');
    if (imgs.length){
      var gran = h('div','background:'+C.panell2+';border:1px solid '+C.vora+';'+
        'height:340px;display:flex;align-items:center;justify-content:center;overflow:hidden');
      var im = document.createElement('img');
      im.src = E.urlExercici(imgs[0]);
      im.alt = x.nom;
      im.setAttribute('style','max-width:100%;max-height:100%;object-fit:contain;display:block');
      gran.appendChild(im);
      esq.appendChild(gran);
      if (imgs.length > 1){
        var tira = h('div','display:flex;gap:7px;margin-top:8px');
        imgs.forEach(function(cami){
          var m = document.createElement('img');
          m.src = E.urlExercici(cami);
          m.alt = '';
          m.setAttribute('style','width:72px;height:56px;object-fit:cover;cursor:pointer;'+
            'border:1px solid '+C.vora);
          m.onclick = function(){ im.src = E.urlExercici(cami); };
          tira.appendChild(m);
        });
        esq.appendChild(tira);
      }
      if (vid){
        var e2 = document.createElement('a');
        e2.href = x.youtube_url; e2.target = '_blank'; e2.rel = 'noopener';
        e2.textContent = 'Veure el vídeo a YouTube';
        e2.setAttribute('style','display:inline-block;margin-top:11px;font-size:12px;'+
          'color:'+C.apagat+';text-decoration:none;border-bottom:1px solid '+C.vora);
        esq.appendChild(e2);
      }
    } else if (vid){
      var marc = h('div','position:relative;padding-top:56.25%;background:#000;'+
        'border:1px solid '+C.vora);
      var ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + vid;
      ifr.title = x.nom;
      ifr.allow = 'accelerometer; clipboard-write; encrypted-media; picture-in-picture';
      ifr.allowFullscreen = true;
      ifr.setAttribute('style','position:absolute;top:0;left:0;width:100%;height:100%;border:0');
      marc.appendChild(ifr);
      esq.appendChild(marc);
      var enll = document.createElement('a');
      enll.href = x.youtube_url; enll.target = '_blank'; enll.rel = 'noopener';
      enll.textContent = 'Obrir a YouTube';
      enll.setAttribute('style','display:inline-block;margin-top:9px;font-size:12px;'+
        'color:'+C.apagat+';text-decoration:none;border-bottom:1px solid '+C.vora);
      esq.appendChild(enll);
    } else {
      esq.appendChild(E.buit(esCardio
        ? 'Aquest exercici encara no té imatges.'
        : 'Aquest exercici encara no té vídeo.'));
    }
    cols.appendChild(esq);

    var dre = h('div');
    var capN = h('div','display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap');
    capN.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:24px;"+
      'color:'+C.os+';line-height:1.2', x.nom));
    if (esCardio) capN.appendChild(E.etiqueta('Cardio', C.oliva));
    dre.appendChild(capN);

    var camps = [
      [esCardio ? 'Modalitat' : 'Grup muscular', x.grup_muscular],
      [esCardio ? 'Mena d\'esforç' : 'Patró de moviment', x.patro],
      ['Material', x.material]
    ].filter(function(c){ return c[1]; });
    var g = h('div','display:flex;flex-direction:column;gap:1px;background:'+C.vora+';margin-bottom:18px');
    if (!camps.length) g.appendChild(h('div','background:'+C.panell+';padding:12px 15px;'+
      'font-size:13px;color:'+C.apagat,'Sense classificar.'));
    camps.forEach(function(c){
      var f = h('div','background:'+C.panell+';padding:11px 15px;display:flex;'+
        'justify-content:space-between;gap:14px;align-items:baseline');
      f.appendChild(h('div','font-size:10px;letter-spacing:.12em;text-transform:uppercase;'+
        'color:'+C.apagat+';font-weight:700', c[0]));
      f.appendChild(h('div','font-size:13.5px;color:'+C.os+';font-weight:500;text-align:right', c[1]));
      g.appendChild(f);
    });
    dre.appendChild(g);

    if (x.consignes){
      dre.appendChild(E.titol('Consignes', 15));
      dre.appendChild(h('div','font-size:13.5px;color:'+C.pedra+';line-height:1.6;margin-top:8px;'+
        'white-space:pre-wrap', x.consignes));
    }
    cols.appendChild(dre);
    cos.appendChild(cols);
  });
}

// ── Imatges: pujada immediata al bucket ────────────────────────────
function zonaImatges(x, esborrany){
  var w = h('div','margin-top:13px');
  w.appendChild(h('div','font-size:10px;letter-spacing:.13em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.apagat+';margin-bottom:5px','Imatges  ·  fins a tres'));
  w.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.5;margin-bottom:9px',
    'La màquina, la posició o el recorregut. L\'Espartà les veurà al mòbil '+
    'quan obri la sessió.'));

  var tira = h('div','display:flex;gap:8px;flex-wrap:wrap;align-items:flex-start');
  w.appendChild(tira);
  var miss = h('div','margin-top:9px');
  w.appendChild(miss);

  var entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'image/*';
  entrada.multiple = true;
  entrada.setAttribute('style','display:none');
  w.appendChild(entrada);

  function pinta(){
    E.buida(tira);
    esborrany.imatges.forEach(function(cami, i){
      var m = h('div','position:relative;width:104px;height:80px;border:1px solid '+C.vora+';'+
        'overflow:hidden;background:'+C.panell2);
      var im = document.createElement('img');
      im.src = E.urlExercici(cami);
      im.alt = '';
      im.setAttribute('style','width:100%;height:100%;object-fit:cover;display:block');
      m.appendChild(im);
      var x2 = document.createElement('button');
      x2.textContent = '\u00d7';
      x2.title = 'Treure aquesta imatge';
      x2.setAttribute('style','position:absolute;top:0;right:0;width:24px;height:24px;'+
        'background:'+C.fons+'dd;border:none;border-left:1px solid '+C.vora+';'+
        'border-bottom:1px solid '+C.vora+';color:'+C.accio+';cursor:pointer;font-size:14px;'+
        'line-height:1');
      x2.onclick = function(){
        esborrany.imatges.splice(i, 1);
        pinta();
      };
      m.appendChild(x2);
      tira.appendChild(m);
    });

    if (esborrany.imatges.length < 3){
      var b = document.createElement('button');
      b.textContent = esborrany.imatges.length ? '+  Una més' : '+  Afegir imatge';
      b.setAttribute('style','width:104px;height:80px;background:transparent;'+
        'border:1px dashed rgba(194,176,106,.4);color:'+C.pedra+';cursor:pointer;'+
        "font-size:11.5px;font-family:'Barlow',sans-serif;padding:0 8px;line-height:1.4");
      b.onclick = function(){ entrada.click(); };
      tira.appendChild(b);
    }
  }

  entrada.onchange = function(){
    var fitxers = Array.prototype.slice.call(entrada.files || []);
    entrada.value = '';
    if (!fitxers.length) return;
    var lloc = 3 - esborrany.imatges.length;
    if (fitxers.length > lloc){
      fitxers = fitxers.slice(0, lloc);
      E.buida(miss);
      miss.appendChild(E.avis('Només caben tres imatges: he agafat les primeres.', C.ambre));
    } else {
      E.buida(miss);
    }

    var carregant = E.carregant('Pujant…');
    tira.appendChild(carregant);

    var prefix = (x.id || 'nou-' + Date.now()) + '-';
    Promise.all(fitxers.map(function(f, i){
      var ext = ((f.name || '').split('.').pop() || 'jpg').toLowerCase();
      var cami = prefix + Date.now() + '-' + i + '.' + ext;
      return E.sb.storage.from('exercicis').upload(cami, f, { upsert:true })
        .then(function(r){
          if (r.error) throw new Error(r.error.message);
          esborrany.imatges.push(cami);
        });
    })).then(function(){
      carregant.remove();
      pinta();
    }).catch(function(err){
      carregant.remove();
      E.buida(miss);
      miss.appendChild(E.avis('No s\'han pogut pujar: ' + err.message));
      pinta();
    });
  };

  pinta();
  return w;
}

function editor(cont){
  var nou = !vista.id;
  cont.appendChild(E.capcalera(nou ? 'Nou exercici' : 'Editar exercici',
    vista.mena === 'cardio'
      ? 'Pots posar-hi imatges, vídeo, o les dues coses'
      : "L'enllaç de YouTube pot ser públic o ocult; només cal que no sigui privat",
    [E.boto('Cancel\u00b7lar', function(){
      vista.mode = nou ? 'llista' : 'fitxa'; E.repinta();
    }, 'buit')]));
  var cos = E.cos();
  cont.appendChild(cos);

  function formulari(x){
    var mena = x.mena || vista.mena;
    var esborrany = { imatges: (x.imatges || []).slice() };

    var f = E.targeta();
    f.style.maxWidth = '660px';

    var nom = E.camp({ et:'Nom', valor:x.nom || '',
      marca: mena === 'cardio' ? 'Intervals a la cinta' : 'Press de banca amb barra' });
    var selM = E.camp({ et:'Mena', tipus:'select', valor:mena,
      opcions:MENES.map(function(m){ return { v:m.v, t:m.t }; }) });
    var grup = E.camp({ et:mena === 'cardio' ? 'Modalitat' : 'Grup muscular', tipus:'select',
      valor:x.grup_muscular || '', opcions:opcions(GRUPS[mena]) });
    var patro = E.camp({ et:mena === 'cardio' ? 'Mena d\'esforç' : 'Patró de moviment',
      tipus:'select', valor:x.patro || '', opcions:opcions(PATRONS[mena]) });
    var mat = E.camp({ et:'Material', tipus:'select', valor:x.material || '',
      opcions:opcions(MATERIALS[mena]) });
    var yt = E.camp({ et:'Enllaç de YouTube  ·  opcional',
      marca:'https://youtu.be/xxxxxxxxxxx', valor:x.youtube_url || '' });
    var cons = E.camp({ et:'Consignes tècniques', tipus:'textarea', files:4,
      marca: mena === 'cardio'
        ? 'Ritme còmode però constant, no baixar de 8 km/h…'
        : 'Escàpules enrere, colzes a 45°, baixar controlat…',
      valor:x.consignes || '' });

    var g0 = h('div','display:grid;grid-template-columns:2fr 1fr;gap:12px');
    g0.appendChild(nom); g0.appendChild(selM);
    f.appendChild(g0);

    // Canviar de mena refà el formulari: les llistes són diferents
    selM.control.onchange = function(){
      var v = selM.control.value;
      if (v === mena) return;
      vista.mena = v;
      E.buida(cos);
      formulari({ id:x.id, mena:v, nom:nom.control.value,
                  youtube_url:yt.control.value, consignes:cons.control.value,
                  imatges:esborrany.imatges });
    };

    var g = h('div','display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:13px');
    [grup,patro,mat].forEach(function(c){ g.appendChild(c); });
    f.appendChild(g);

    // Cardio: primer les imatges, que és el que farà servir més
    if (mena === 'cardio') f.appendChild(zonaImatges(x, esborrany));

    var boxYt = h('div','margin-top:13px');
    boxYt.appendChild(yt);
    var prev = h('div','margin-top:10px');
    boxYt.appendChild(prev);
    f.appendChild(boxYt);

    function comprova(){
      E.buida(prev);
      var v = yt.control.value.trim();
      if (!v) return;
      var id = idYoutube(v);
      if (!id){
        prev.appendChild(E.avis("Aquest enllaç no sembla de YouTube. Ha de contenir "+
          "l'identificador del vídeo, com https://youtu.be/dQw4w9WgXcQ", C.ambre));
        return;
      }
      var fila = h('div','display:flex;gap:11px;align-items:center;padding:9px 11px;'+
        'background:'+C.fons+';border:1px solid '+C.oliva+'55');
      var img = document.createElement('img');
      img.src = 'https://i.ytimg.com/vi/' + id + '/default.jpg';
      img.setAttribute('style','width:64px;height:48px;object-fit:cover;flex-shrink:0');
      fila.appendChild(img);
      fila.appendChild(h('div','font-size:12.5px;color:'+C.oliva+';font-weight:600',
        'Vídeo reconegut'));
      prev.appendChild(fila);
    }
    yt.control.oninput = comprova;
    comprova();

    if (mena === 'forca') f.appendChild(zonaImatges(x, esborrany));

    var boxC = h('div','margin-top:13px;margin-bottom:18px');
    boxC.appendChild(cons);
    f.appendChild(boxC);

    var miss = h('div','margin-bottom:14px');
    f.appendChild(miss);

    var fila = h('div','display:flex;gap:9px;flex-wrap:wrap');
    var b = E.boto(nou ? 'Crear exercici' : 'Desar canvis', function(){
      E.buida(miss);
      if (!nom.control.value.trim()){
        miss.appendChild(E.avis("El nom és obligatori.")); return;
      }
      var v = yt.control.value.trim();
      if (v && !idYoutube(v)){
        miss.appendChild(E.avis("Revisa l'enllaç de YouTube abans de desar.")); return;
      }
      b.disabled = true; b.textContent = 'Desant…';
      var dades = {
        nom: nom.control.value.trim(),
        mena: mena,
        grup_muscular: grup.control.value || null,
        patro: patro.control.value || null,
        material: mat.control.value || null,
        youtube_url: v || null,
        youtube_id: idYoutube(v) || null,
        imatges: esborrany.imatges.length ? esborrany.imatges : null,
        consignes: cons.control.value.trim() || null
      };
      var p;
      if (nou){
        dades.autor_id = E.perfil.id;
        p = E.sb.from('exercises').insert(dades).select('id').single();
      } else {
        dades.updated_at = new Date().toISOString();
        p = E.sb.from('exercises').update(dades).eq('id', vista.id).select('id').single();
      }
      p.then(function(r){
        b.disabled = false; b.textContent = nou ? 'Crear exercici' : 'Desar canvis';
        if (r.error){ miss.appendChild(E.avis(r.error.message)); return; }
        vista.mode = 'fitxa'; vista.id = r.data.id; E.repinta();
      });
    });
    fila.appendChild(b);

    if (!nou){
      var esb = E.boto('Esborrar', function(){
        E.buida(miss);
        var conf = h('div','padding:12px 14px;background:'+C.carmesi+'22;'+
          'border-left:3px solid '+C.carmesi);
        conf.appendChild(h('div','font-size:13px;color:'+C.os+';line-height:1.5;margin-bottom:10px',
          "S'amagarà de la biblioteca. Les rutines que ja el fan servir el conserven."));
        var bs = E.boto('Sí, esborrar', function(){
          E.sb.from('exercises').update({ deleted_at: new Date().toISOString() })
            .eq('id', vista.id).then(function(r){
              if (r.error){ E.buida(miss); miss.appendChild(E.avis(r.error.message)); return; }
              vista.mode = 'llista'; vista.id = null; E.repinta();
            });
        }, 'perill');
        bs.style.padding = '8px 15px'; bs.style.fontSize = '12px';
        conf.appendChild(bs);
        miss.appendChild(conf);
      }, 'perill');
      fila.appendChild(esb);
    }
    f.appendChild(fila);
    cos.appendChild(f);
  }

  if (nou) return formulari({ mena: vista.mena });
  cos.appendChild(E.carregant());
  E.sb.from('exercises').select('*').eq('id', vista.id).single().then(function(r){
    E.buida(cos);
    if (r.error){ cos.appendChild(E.avis(r.error.message)); return; }
    formulari(r.data);
  });
}

E.seccions.push({
  id:'exercicis', etiqueta:'Exercicis', icona:'\u2261', rols:['coach','nutritionist'],
  pinta: function(cont){
    if (vista.mode === 'nou' && E.perfil.role === 'coach') return editor(cont);
    if (vista.mode === 'fitxa' && vista.id) return fitxa(cont);
    return llista(cont);
  }
});
})();
