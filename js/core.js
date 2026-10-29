// Metabolisme Esparta · nucli compartit de la consola professional
var E = window.ESPARTA = {
  cfg: null, sb: null, perfil: null, seccions: [], actual: null,
  // Paleta del book visual: negre carbó, bronze envellit, sang fosca.
  C: {
    fons:'#0D0D0F', panell:'#16161A', panell2:'#1F2024',
    vora:'rgba(194,176,106,.16)', voraFort:'rgba(194,176,106,.4)',
    or:'#C2B06A', bronze:'#B08A5A', os:'#EAE7E1', pedra:'#A9A49B', apagat:'#8A8E95',
    carmesi:'#7A0F14', accio:'#A8231B',
    blau:'#2F5D73', verd:'#4F7A3A', oliva:'#8FA04A', ambre:'#C99A2E'
  }
};

E.LS = 'esparta_cfg';

// On viu cada aplicacio. Els enllacos dels correus han de tornar aqui.
E.URL_CONSOLA = 'https://pro.focusarchery.tech/';
E.URL_ATLETA  = 'https://app.focusarchery.tech/';

// Els errors de Supabase arriben en angles i de vegades no diuen res util.
// Aqui es tradueixen al catala i s'explica que s'ha de fer.
E.diuError = function(err){
  var m = String((err && err.message) || err || '').toLowerCase();
  if (m.indexOf('invalid login credentials') !== -1)
    return 'El correu o la contrasenya no són correctes. Si no recordes la contrasenya, '
         + 'demana a l\'administrador que te la torni a posar.';
  if (m.indexOf('email not confirmed') !== -1)
    return 'Aquest compte encara no està confirmat. Avisa l\'administrador del sistema.';
  if (m.indexOf('rate limit') !== -1 || m.indexOf('too many') !== -1)
    return 'Massa intents seguits. Espera un minut i torna-ho a provar.';
  if (m.indexOf('failed to fetch') !== -1 || m.indexOf('networkerror') !== -1
      || m.indexOf('load failed') !== -1)
    return 'No hi ha manera d\'arribar al servidor. Comprova la connexió a internet.';
  if (m.indexOf('user not found') !== -1)
    return 'No hi ha cap compte amb aquest correu.';
  if (m.indexOf('expired') !== -1)
    return 'L\'enllaç del correu ja ha caducat. Demana\'n un de nou.';
  return (err && err.message) || 'Error desconegut.';
};

// Configuració fixa del projecte. La clau "anon public" és pública per disseny:
// va dins l'aplicació i el que protegeix les dades són els permisos (RLS).
E.FIX = {
  url: 'https://qnmlrehtglppvgmegaem.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubWxyZWh0Z2xwcHZnbWVnYWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0ODI5ODgsImV4cCI6MjEwMTA1ODk4OH0.XeZ0KyuJ4W14GmesF5B5Lgzjf69zwFBBactdLqJXJfU'
};

E.h = function(tag, style, text){
  var n = document.createElement(tag);
  if (style) n.setAttribute('style', style);
  if (text != null) n.textContent = text;
  return n;
};
E.buida = function(n){ while (n.firstChild) n.removeChild(n.firstChild); return n; };
E.ajudaEntrada = function(correu, contrasenya){
  correu.setAttribute('autocomplete','username');
  correu.setAttribute('inputmode','email');
  correu.setAttribute('autocapitalize','off');
  correu.setAttribute('autocorrect','off');
  correu.setAttribute('spellcheck','false');
  correu.setAttribute('name','correu');
  contrasenya.setAttribute('autocomplete','current-password');
  contrasenya.setAttribute('name','contrasenya');
};


E.camp = function(opts){
  var w = E.h('div','display:flex;flex-direction:column;gap:5px;min-width:0');
  w.appendChild(E.h('div','font-size:10px;letter-spacing:.13em;text-transform:uppercase;'+
    'color:'+E.C.apagat+';font-weight:700', opts.et));
  var i;
  if (opts.tipus === 'select'){
    i = document.createElement('select');
    (opts.opcions||[]).forEach(function(o){
      var op = document.createElement('option');
      op.value = o.v; op.textContent = o.t;
      if (opts.valor === o.v) op.selected = true;
      i.appendChild(op);
    });
  } else if (opts.tipus === 'textarea'){
    i = document.createElement('textarea');
    i.rows = opts.files || 3;
    if (opts.valor) i.value = opts.valor;
  } else {
    i = document.createElement('input');
    i.type = opts.tipus || 'text';
    if (opts.valor != null) i.value = opts.valor;
    if (opts.pas) i.step = opts.pas;
  }
  if (opts.marca) i.placeholder = opts.marca;
  i.setAttribute('style','width:100%;padding:10px 12px;background:'+E.C.fons+';'+
    'border:1px solid rgba(194,176,106,.24);color:'+E.C.os+';font-size:14px;'+
    "font-family:'Barlow',sans-serif;border-radius:0");
  w.appendChild(i);
  w.control = i;
  return w;
};

E.boto = function(text, accio, mena){
  var b = document.createElement('button');
  b.textContent = text;
  var base = 'padding:11px 20px;font-size:13px;font-weight:700;letter-spacing:.07em;'+
    "text-transform:uppercase;cursor:pointer;font-family:'Barlow',sans-serif;border-radius:0;";
  if (mena === 'buit') b.setAttribute('style', base+'background:transparent;'+
    'border:1px solid rgba(194,176,106,.32);color:'+E.C.pedra);
  else if (mena === 'perill') b.setAttribute('style', base+'background:transparent;'+
    'border:1px solid '+E.C.carmesi+';color:'+E.C.accio);
  else b.setAttribute('style', base+'background:'+E.accent()+';'+
    'border:1px solid rgba(194,176,106,.38);color:#F6EFE4;'+
    'box-shadow:inset 0 1px 0 rgba(255,255,255,.08)');
  b.onclick = accio;
  return b;
};


E.ICONES = {
  casc:      ['M5 14v-2a7 7 0 0114 0v2c0 2.1-1.1 3.7-2.8 4.5v2.6h-3.3v-2.9h-1.8v2.9H7.8v-2.6C6.1 17.7 5 16.1 5 14z','M7.6 6.6C9.1 3.9 10.5 2.6 12 2.2c1.5.4 2.9 1.7 4.4 4.4','M8.6 12.4h2.2','M13.2 12.4h2.2','M12 13.4v3'],
  calendari: ['M4 6h16v15H4z','M4 11h16','M8 3v4','M16 3v4'],
  balanca:   ['M12 4v16','M7.5 20h9','M5 8h14','M5 8l-2.5 5h5z','M19 8l-2.5 5h5z'],
  grafic:    ['M3.5 21h17','M6 18v-6','M12 18V5','M18 18v-9'],
  sobre:     ['M3 6h18v13H3z','M3.5 7l8.5 6.5L20.5 7'],
  escut:     ['M12 2.5l8.5 3v6.2c0 5.4-3.6 8.6-8.5 9.8-4.9-1.2-8.5-4.4-8.5-9.8V5.5z','M9.5 12l2.5 2.5 3.5-4'],
  manuelles: ['M3 9.5v5','M6.5 7v10','M17.5 7v10','M21 9.5v5','M6.5 12h11'],
  llista:    ['M5 3.5h14v17H5z','M8.5 9h7','M8.5 13h7','M8.5 17h4'],
  diana:     ['M20.5 12a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z','M15 12a3 3 0 11-6 0 3 3 0 016 0z','M12 3.5v3','M12 17.5v3','M3.5 12h3','M17.5 12h3'],
  espiga:    ['M12 21V8.5','M12 13.5L8.5 11','M12 13.5L15.5 11','M12 17.5L8.5 15','M12 17.5L15.5 15','M12 9.5L9 6','M12 9.5L15 6'],
  morter:    ['M4.5 10.5h15a7.5 7.5 0 01-15 0z','M12 18v3','M9 21h6','M16.5 3.5l-4 4.5'],
  llorer:    ['M12 21V9','M12 21c-4.5-2-6.5-6-6.5-10.5','M12 21c4.5-2 6.5-6 6.5-10.5','M14 3a2 2 0 11-4 0 2 2 0 014 0z'],
  persona:   ['M16 7a4 4 0 11-8 0 4 4 0 018 0z','M4.5 21c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7'],
  tauler:    ['M4 4h6.5v7H4z','M13.5 4h6.5v4h-6.5z','M13.5 10.5h6.5v9.5h-6.5z','M4 13.5h6.5v6.5H4z'],
  columna:   ['M4 21h16','M4.5 18h15','M6.5 18V6.5','M10 18V6.5','M14 18V6.5','M17.5 18V6.5','M4.5 6.5h15','M5.5 3.5h13']
};

// Quin emblema li toca a cada categoria
E.EMB = {
  avui:'casc', agenda:'calendari', nutricio:'balanca', progres:'grafic',
  xat:'sobre', perfil:'escut',
  panell:'tauler', espartans:'persona', exercicis:'manuelles', rutines:'llista',
  plans:'calendari', pesatges:'diana', aliments:'espiga', receptes:'morter',
  dietes:'llorer', administracio:'columna', compte:'escut'
};

E.emblema = function(id, mida, color){
  var d = E.ICONES[id] || E.ICONES.escut;
  mida = mida || 22;
  var s = document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('viewBox','0 0 24 24');
  s.setAttribute('width', mida);
  s.setAttribute('height', mida);
  s.setAttribute('fill','none');
  s.setAttribute('stroke', color || E.C.or);
  s.setAttribute('stroke-width','1.5');
  s.setAttribute('stroke-linecap','round');
  s.setAttribute('stroke-linejoin','round');
  s.setAttribute('style','display:block;flex-shrink:0');
  d.forEach(function(p){
    var n = document.createElementNS('http://www.w3.org/2000/svg','path');
    n.setAttribute('d', p);
    s.appendChild(n);
  });
  return s;
};

// El segell dins un cercle de bronze: la marca, sempre igual
E.marca = function(mida){
  mida = mida || 34;
  var w = E.h('div','width:'+mida+'px;height:'+mida+'px;flex-shrink:0;border-radius:50%;'+
    'overflow:hidden;background:#0D0D0F;border:1px solid rgba(194,176,106,.45);'+
    'box-shadow:0 0 0 1px rgba(13,13,15,.9), 0 2px 12px rgba(0,0,0,.5)');
  var i = document.createElement('img');
  i.src = './logo.png';
  i.alt = 'Metabolisme Espartà';
  i.setAttribute('style','width:100%;height:100%;display:block;object-fit:cover');
  w.appendChild(i);
  return w;
};

E.accent = function(){
  if (!E.perfil) return E.C.accio;
  return E.perfil.role === 'nutritionist' ? E.C.verd : E.C.blau;
};

// Qui pot ESCRIURE a nutricio: la nutricionista i el propietari.
// L'entrenador que no es propietari la veu, pero no la toca.
E.potNutricio = function(){
  return !!E.perfil && (E.perfil.role === 'nutritionist' || E.perfil.es_propietari);
};


// Crida una edge function amb la sessio de qui esta mirant la consola.
// Torna sempre un objecte: o be el resultat, o be { error: 'text en catala' }.
// Mai una promesa rebutjada, perque cada lloc que crida no hagi de
// recordar de posar-hi un .catch.
E.crida = function(nom, cos){
  return E.sb.functions.invoke(nom, { body: cos || {} }).then(function(r){
    if (!r.error) return r.data || {};
    var ctx = r.error.context;
    if (ctx && typeof ctx.json === 'function'){
      return ctx.json().then(
        function(j){ return { error: (j && j.error) || E.diuError(r.error) }; },
        function(){ return { error: E.diuError(r.error) }; }
      );
    }
    return { error: E.diuError(r.error) };
  }, function(err){
    return { error: E.diuError(err) };
  });
};

// «fa 3 dies», «fa 2 mesos», «mai». Una data exacta no diu res quan el que
// vols saber es si algu ha entrat ultimament.
E.quanFa = function(iso){
  if (!iso) return 'mai';
  var seg = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seg < 90) return 'ara mateix';
  var min = Math.floor(seg / 60);
  if (min < 60) return 'fa ' + min + ' min';
  var hores = Math.floor(min / 60);
  if (hores < 24) return 'fa ' + hores + (hores === 1 ? ' hora' : ' hores');
  var dies = Math.floor(hores / 24);
  if (dies < 31) return 'fa ' + dies + (dies === 1 ? ' dia' : ' dies');
  var mesos = Math.floor(dies / 30);
  if (mesos < 12) return 'fa ' + mesos + (mesos === 1 ? ' mes' : ' mesos');
  var anys = Math.floor(dies / 365);
  return 'fa ' + anys + (anys === 1 ? ' any' : ' anys');
};

// La targeta que surt despres de donar d'alta algu o de tornar-li a enviar
// l'acces. L'enllac es dona SEMPRE: mentre el correu del projecte no estigui
// configurat, es l'unica manera que la persona pugui entrar.
E.targetaAcces = function(r, correu){
  var b = E.h('div');

  if (r.correu_enviat){
    b.appendChild(E.avis('Li hem enviat un correu a ' + correu + ' per posar-se la '+
      'contrasenya.', E.C.oliva));
  } else {
    b.appendChild(E.avis('El correu NO ha sortit' +
      (r.motiu_correu ? ' (' + r.motiu_correu + ')' : '') +
      '. Passa-li tu mateix l\'enlla\u00e7 de sota, per WhatsApp o com vulguis.',
      E.C.ambre));
  }

  if (r.enllac){
    b.appendChild(E.h('div','margin-top:16px;font-size:10px;letter-spacing:.13em;'+
      'text-transform:uppercase;color:'+E.C.apagat+';font-weight:700',
      'Enlla\u00e7 per posar la contrasenya'));
    var fila = E.h('div','display:flex;gap:8px;margin-top:6px;align-items:stretch');
    var camp = document.createElement('input');
    camp.type = 'text';
    camp.value = r.enllac;
    camp.readOnly = true;
    camp.setAttribute('style','flex:1;min-width:0;padding:10px 12px;background:'+E.C.fons+';'+
      'border:1px solid rgba(194,176,106,.24);color:'+E.C.or+';font-size:12px;'+
      "font-family:'Barlow',sans-serif");
    camp.onclick = function(){ camp.select(); };
    fila.appendChild(camp);
    var bc = E.boto('Copiar', function(){
      camp.select();
      var fet = false;
      try { fet = document.execCommand('copy'); } catch(e){}
      if (navigator.clipboard && !fet)
        navigator.clipboard.writeText(r.enllac).catch(function(){});
      bc.textContent = 'Copiat';
      setTimeout(function(){ bc.textContent = 'Copiar'; }, 1800);
    }, 'buit');
    fila.appendChild(bc);
    b.appendChild(fila);
    b.appendChild(E.h('div','margin-top:7px;font-size:11.5px;color:'+E.C.apagat+';'+
      'line-height:1.5', 'Serveix una sola vegada i caduca. Si es gasta o passa massa '+
      "temps, torna'n a demanar un altre."));
  } else if (r.motiu_enllac){
    b.appendChild(E.avis("Tampoc s'ha pogut preparar l'enlla\u00e7: " + r.motiu_enllac));
  }

  return b;
};

// Canviar-se la contrasenya un mateix. Demana l'actual a proposit: aquesta
// sessio es queda oberta al mobil durant setmanes, i qui agafi el telefon no
// ha de poder canviar la contrasenya nomes per tenir-lo a la ma.
E.formContrasenya = function(){
  var b = E.h('div');
  var actual = E.camp({ et:'Contrasenya actual', tipus:'password' });
  var nova   = E.camp({ et:'Contrasenya nova', tipus:'password' });
  var rep    = E.camp({ et:'Repeteix la nova', tipus:'password' });
  actual.control.setAttribute('autocomplete','current-password');
  nova.control.setAttribute('autocomplete','new-password');
  rep.control.setAttribute('autocomplete','new-password');

  var caixa = E.h('div','display:flex;flex-direction:column;gap:11px;margin-bottom:13px');
  caixa.appendChild(actual); caixa.appendChild(nova); caixa.appendChild(rep);
  b.appendChild(caixa);

  var miss = E.h('div','margin-bottom:12px');
  b.appendChild(miss);

  function atura(text){
    E.buida(miss);
    miss.appendChild(E.avis(text));
    boto.disabled = false; boto.textContent = 'Desar la contrasenya';
  }

  var boto = E.boto('Desar la contrasenya', function(){
    E.buida(miss);
    boto.disabled = true; boto.textContent = 'Desant\u2026';
    if (!actual.control.value) return atura('Escriu la contrasenya d\'ara.');
    if (nova.control.value.length < 8) return atura('La nova ha de tenir 8 car\u00e0cters com a m\u00ednim.');
    if (nova.control.value !== rep.control.value) return atura('Les dues contrasenyes noves no coincideixen.');
    if (nova.control.value === actual.control.value) return atura('La nova ha de ser diferent de l\'actual.');

    E.sb.auth.signInWithPassword({ email: E.perfil.email, password: actual.control.value })
      .then(function(r){
        if (r.error) throw new Error('__ACTUAL__');
        return E.sb.auth.updateUser({ password: nova.control.value });
      })
      .then(function(r){
        boto.disabled = false; boto.textContent = 'Desar la contrasenya';
        if (r.error){ miss.appendChild(E.avis(E.diuError(r.error))); return; }
        actual.control.value = ''; nova.control.value = ''; rep.control.value = '';
        miss.appendChild(E.avis('Contrasenya canviada. La propera vegada entra amb la nova.',
          E.C.oliva));
      })
      .catch(function(err){
        boto.disabled = false; boto.textContent = 'Desar la contrasenya';
        miss.appendChild(E.avis(err && err.message === '__ACTUAL__'
          ? 'La contrasenya d\'ara no \u00e9s correcta.'
          : E.diuError(err)));
      });
  });
  boto.style.width = '100%';
  b.appendChild(boto);
  return b;
};

// Anota al registre d'accessos qui ha obert quines dades de salut.
// L'autor no el posem nosaltres: el posa la base de dades a partir de
// la sessio (migracio 19), o sigui que no es pot anotar en nom d'un
// altre. Si l'anotacio falla, la pantalla segueix igual: un registre
// que no es pot escriure no ha de deixar l'entrenador sense feina.
E.registra = function(accio, entitat, id, detall){
  if (!E.sb || !E.perfil) return;
  try {
    E.sb.rpc('registra_acces', {
      p_accio: accio,
      p_entitat: entitat,
      p_entitat_id: id || null,
      p_detall: detall || null
    }).then(function(){}, function(){});
  } catch (e){}
};

E.targeta = function(){
  return E.h('div','background:'+E.C.panell+';border:1px solid '+E.C.vora+';padding:20px 22px');
};

E.titol = function(text, mida){
  return E.h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:"+(mida||17)+'px;'+
    'color:'+E.C.os+';letter-spacing:.02em', text);
};

E.etiqueta = function(text, color){
  return E.h('div','display:inline-block;padding:3px 9px;font-size:10px;font-weight:700;'+
    'letter-spacing:.1em;text-transform:uppercase;color:'+color+';'+
    'border:1px solid '+color+'55', text);
};

E.buit = function(text){
  return E.h('div','padding:34px 22px;text-align:center;color:'+E.C.apagat+';font-size:14px;'+
    'border:1px dashed rgba(194,176,106,.22)', text);
};

E.avis = function(text, color){
  return E.h('div','padding:11px 14px;background:'+(color||E.C.carmesi)+'22;'+
    'border-left:3px solid '+(color||E.C.carmesi)+';color:'+E.C.os+';font-size:13px;'+
    'line-height:1.5;word-break:break-word', text);
};

E.carregant = function(text){
  return E.h('div','padding:30px;color:'+E.C.apagat+';font-size:14px', text || 'Carregant…');
};

E.ESTATS = {
  actiu:        { t:'Actiu',        c:'#9DAE4E' },
  manteniment:  { t:'Manteniment',  c:'#B8860B' },
  pausa:        { t:'En pausa',     c:'#C99A2E' },
  baixa:        { t:'Baixa',        c:'#6E6A63' }
};
E.OBJECTIUS = {
  perdre_greix:   'Perdre greix',
  guanyar_muscul: 'Guanyar múscul',
  rendiment:      'Rendiment',
  salut:          'Salut',
  recomposicio:   'Recomposició'
};
E.NIVELLS = { recluta:'Recluta', intermedi:'Intermedi', avancat:'Avançat' };
E.SEXES  = { home:'Home', dona:'Dona', altre:'Altre' };

E.nomComplet = function(p){
  if (!p) return '—';
  return (p.nom||'') + (p.cognoms ? ' '+p.cognoms : '');
};
E.inicials = function(p){
  if (!p) return '?';
  return ((p.nom||'?')[0] + (p.cognoms ? p.cognoms[0] : '')).toUpperCase();
};
E.data = function(s){
  if (!s) return '—';
  var d = new Date(s);
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+
         '/'+d.getFullYear();
};
E.opcionsDe = function(obj){
  return Object.keys(obj).map(function(k){
    return { v:k, t: typeof obj[k] === 'string' ? obj[k] : obj[k].t };
  });
};
// ── Cardio ─────────────────────────────────────────────────────────
// Dues maneres de programar-lo:
//   · genèric  → un text de la llista («Córrer», «Caminar»)
//   · programat → una rutina de cardio que l'Ernest ha dissenyat
// El control de sota ofereix les dues coses al mateix desplegable.
E.CARDIOS = ['Caminar','Córrer','Bici estàtica','El·líptica','Rem',
             'Natació','Corda','HIIT','Cinta inclinada'];

// L'omple qui pinta el calendari, abans de fer-ho
E.CARDIO_RUTINES = [];

E.urlExercici = function(cami){
  if (!cami) return null;
  var r = E.sb.storage.from('exercicis').getPublicUrl(cami);
  return (r && r.data && r.data.publicUrl) || null;
};

// Normalitza: accepta un text antic o { routine_id, text }
E.valorCardio = function(v){
  if (!v) return { routine_id:'', text:'' };
  if (typeof v === 'string') return { routine_id:'', text:v };
  return { routine_id: v.routine_id || '', text: v.text || '' };
};
E.teCardio = function(v){
  var x = E.valorCardio(v);
  return !!(x.routine_id || (x.text || '').trim());
};
// Com es diu, per ensenyar-ho a una casella
E.nomCardio = function(v, rutines){
  var x = E.valorCardio(v);
  if (x.routine_id){
    var l = rutines || E.CARDIO_RUTINES || [];
    for (var i = 0; i < l.length; i++)
      if (l[i].id === x.routine_id) return l[i].nom;
    if (E.FANTASMES[x.routine_id]) return E.nomFantasma(x.routine_id);
    return 'Cardio programat';
  }
  return (x.text || '').trim();
};

// ── Rutines fantasma ────────────────────────────────────────
// Una rutina esborrada de la biblioteca pot seguir enganxada a un dia d'un pla
// o del calendari d'un Esparta. Els desplegables nomes porten rutines vives:
// aquell dia sortia com a «Sense rutina» pero es tornava a desar igual, i no hi
// havia manera de treure'l. Aqui se'n recorden els noms per ensenyar-les
// marcades i poder-les buidar.
E.FANTASMES = {};

E.nomFantasma = function(id){
  var x = E.FANTASMES[id];
  return (x && x.nom) || 'Rutina que ja no hi és';
};

// ids: els routine_id que fa servir el calendari. vives: les que porta el
// desplegable. Torna una promesa; quan es resol, E.FANTASMES ja esta ple.
E.carregaFantasmes = function(ids, vives){
  var falten = [];
  (ids || []).forEach(function(id){
    if (!id || falten.indexOf(id) !== -1 || E.FANTASMES[id]) return;
    for (var i = 0; i < (vives || []).length; i++)
      if (vives[i].id === id) return;
    falten.push(id);
  });
  if (!falten.length) return Promise.resolve(false);
  return E.sb.from('routines').select('id,nom,tipus,mena,rondes').in('id', falten)
    .then(function(r){
      (r.data || []).forEach(function(x){ E.FANTASMES[x.id] = x; });
      falten.forEach(function(id){
        if (!E.FANTASMES[id]) E.FANTASMES[id] = { id:id, nom:'Rutina que ja no hi és' };
      });
      return true;
    });
};

// L'opcio que la fa visible dins un desplegable de rutines de forca
E.opcioFantasma = function(id){
  return { v:id, t:E.nomFantasma(id) + '  ·  ja no és a la biblioteca' };
};

// canvia(valor, repintar): repintar=true nomes quan es pot refer la
// graella sense robar el focus a qui esta escrivint.
E.controlCardio = function(valor, canvia, mida){
  var v = E.valorCardio(valor);
  var w = E.h('div','margin-top:7px');
  var farcit = mida === 'petit' ? '7px 8px' : '8px 9px';
  var lletra = mida === 'petit' ? '11.5px' : '12px';
  var esPreset = E.CARDIOS.indexOf(v.text) !== -1;
  var rutines = E.CARDIO_RUTINES || [];

  var sel = document.createElement('select');
  function op(valor, text, pare){
    var o = document.createElement('option');
    o.value = valor; o.textContent = text;
    (pare || sel).appendChild(o);
  }
  op('', 'Sense cardio');

  if (rutines.length){
    var gp = document.createElement('optgroup');
    gp.label = 'Sessions programades';
    rutines.forEach(function(r){ op('r:' + r.id, r.nom, gp); });
    sel.appendChild(gp);
  }
  var gg = document.createElement('optgroup');
  gg.label = 'Cardio lliure';
  E.CARDIOS.forEach(function(x){ op(x, x, gg); });
  op('__altre', 'Altre\u2026', gg);
  sel.appendChild(gg);

  sel.value = v.routine_id ? 'r:' + v.routine_id
            : (v.text ? (esPreset ? v.text : '__altre') : '');
  // Si la sessio ja no es a la biblioteca, el desplegable es quedava a «Sense
  // cardio» pero el dia la seguia desant igual. Ara surt marcada i es pot treure.
  var fantasma = !!v.routine_id && sel.value !== 'r:' + v.routine_id;
  if (fantasma){
    var gf = document.createElement('optgroup');
    gf.label = 'Ja no és a la biblioteca';
    op('r:' + v.routine_id, E.nomFantasma(v.routine_id), gf);
    sel.appendChild(gf);
    sel.value = 'r:' + v.routine_id;
  }
  sel.setAttribute('style','width:100%;padding:'+farcit+';background:'+E.C.fons+';'+
    'border:1px solid '+(fantasma ? E.C.ambre+'66' : 'rgba(194,176,106,.24)')+';color:'+
    (fantasma ? E.C.ambre : (v.routine_id ? E.C.or : (v.text ? E.C.oliva : E.C.os)))+';'+
    "font-size:"+lletra+";font-family:'Barlow',sans-serif");
  w.appendChild(sel);

  var inp = document.createElement('input');
  inp.type = 'text';
  inp.value = esPreset ? '' : (v.text || '');
  inp.placeholder = 'Quin cardio?';
  inp.setAttribute('style','width:100%;margin-top:5px;padding:'+farcit+';background:'+
    E.C.fons+';border:1px solid rgba(194,176,106,.24);color:'+E.C.os+';'+
    "font-size:"+lletra+";font-family:'Barlow',sans-serif;"+
    'display:'+(v.text && !esPreset ? 'block' : 'none'));
  inp.oninput = function(){ canvia({ routine_id:'', text:inp.value }, false); };
  w.appendChild(inp);

  sel.onchange = function(){
    var s = sel.value;
    if (s === '__altre'){
      inp.style.display = 'block';
      canvia({ routine_id:'', text:inp.value.trim() }, false);
      inp.focus();
      return;
    }
    inp.style.display = 'none';
    if (s.indexOf('r:') === 0) canvia({ routine_id:s.slice(2), text:'' }, true);
    else canvia({ routine_id:'', text:s }, true);
  };
  return w;
};

// Quant dura una sessió de cardio programada, en minuts
E.duradaCardio = function(rutina, peces){
  var rondes = rutina && rutina.rondes ? rutina.rondes : 1;
  var seg = 0;
  (peces || []).forEach(function(p){
    var feina = p.tipus_mesura === 'temps' ? (p.temps_s || 0) : 45;
    seg += (p.series || 1) * (feina + (p.descans_s || 0));
    seg += p.descans_post_s || 0;
  });
  seg = seg * rondes + (rondes - 1) * ((rutina && rutina.descans_ronda_s) || 0);
  return Math.max(1, Math.round(seg / 60));
};

// Com es llegeix una peça: «40 s», «12 reps», «400 m»
E.mesuraPeca = function(p){
  if (p.tipus_mesura === 'temps') return (p.temps_s || 0) + ' s';
  if (p.tipus_mesura === 'distancia') return (p.distancia_m || 0) + ' m';
  return (p.reps || '\u2014') + ' reps';
};
