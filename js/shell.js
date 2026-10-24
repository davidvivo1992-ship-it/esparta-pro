// Metabolisme Esparta · accés, marc i navegació
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var arrel = document.getElementById('root');

function centrat(){
  E.buida(arrel);
  var w = h('div','min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px');
  var col = h('div','width:100%;max-width:470px');
  var cap = h('div','display:flex;align-items:center;gap:14px;margin-bottom:22px');
  cap.appendChild(E.marca(58));
  var t = h('div');
  t.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:13px;"+
    'letter-spacing:.2em;color:'+C.or,'METABOLISME ESPARTÀ'));
  t.appendChild(h('div','font-size:11px;letter-spacing:.12em;text-transform:uppercase;'+
    'color:'+C.apagat+';font-weight:600','Consola professional'));
  cap.appendChild(t);
  col.appendChild(cap);
  var card = h('div','background:'+C.panell+';border:1px solid '+C.vora+';'+
    'border-top:3px solid '+C.accio+';padding:22px 24px');
  col.appendChild(card);
  w.appendChild(col); arrel.appendChild(w);
  return card;
}

function pantallaConfig(msg){
  var c = centrat();
  c.appendChild(E.titol('Connectar amb Supabase', 19));
  c.appendChild(h('div','font-size:13px;color:'+C.apagat+';line-height:1.55;margin:6px 0 16px',
    "Només el primer cop en aquest navegador. Els dos valors són a Supabase › Project Settings › API."));
  if (msg) c.appendChild(E.avis(msg));
  var u = E.camp({ et:'Project URL', marca:'https://xxxxx.supabase.co', valor:(E.cfg&&E.cfg.url)||'' });
  var k = E.camp({ et:'anon public key', marca:'eyJhbGciOi...', valor:(E.cfg&&E.cfg.key)||'' });
  var box = h('div','display:flex;flex-direction:column;gap:11px;margin:14px 0 16px');
  box.appendChild(u); box.appendChild(k);
  c.appendChild(box);
  c.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';line-height:1.5;margin-bottom:14px',
    'Fes servir la clau «anon public», mai la «service_role».'));
  var b = E.boto('Desar i connectar', function(){
    var url = u.control.value.trim(), key = k.control.value.trim();
    if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url))
      return pantallaConfig('La URL ha de tenir la forma https://xxxxx.supabase.co');
    if (key.length < 40) return pantallaConfig('La clau sembla incompleta.');
    E.cfg = { url: url.replace(/\/$/,''), key: key };
    localStorage.setItem(E.LS, JSON.stringify(E.cfg));
    arrenca();
  });
  b.style.background = C.accio; b.style.width = '100%';
  c.appendChild(b);
}

function pantallaError(msg){
  var c = centrat();
  c.appendChild(h('div','color:'+C.accio+';font-weight:700;font-size:15px;margin-bottom:8px',
    'No es pot connectar'));
  c.appendChild(h('div','font-size:13px;color:'+C.apagat+';line-height:1.55;'+
    'margin-bottom:16px;word-break:break-word', msg));
  var b = E.boto('Canviar la configuració', function(){ pantallaConfig(); }, 'buit');
  b.style.width = '100%';
  c.appendChild(b);
}

function pantallaAcces(msg){
  var c = centrat();
  c.appendChild(E.titol('Accés professional', 19));
  c.appendChild(h('div','font-size:13px;color:'+C.apagat+';line-height:1.5;margin:6px 0 16px',
    "Entrenador o nutricionista. Els Espartans entren per l'aplicació de mòbil."));
  var e = E.camp({ et:'Correu', tipus:'email' });
  var p = E.camp({ et:'Contrasenya', tipus:'password' });
  E.ajudaEntrada(e.control, p.control);
  var box = h('div','display:flex;flex-direction:column;gap:11px;margin-bottom:14px');
  box.appendChild(e); box.appendChild(p);
  c.appendChild(box);
  if (msg){ c.appendChild(E.avis(msg)); c.appendChild(h('div','height:12px')); }

  var b = E.boto('Entrar', function(){
    var correu = e.control.value.trim().toLowerCase();
    if (!correu || !p.control.value)
      return pantallaAcces('Cal escriure el correu i la contrasenya.');
    b.disabled = true; b.textContent = 'Entrant…';
    E.sb.auth.signInWithPassword({ email:correu, password:p.control.value })
      .then(function(r){
        if (r.error) return pantallaAcces(E.diuError(r.error));
        carregaPerfil();
      })
      .catch(function(err){ pantallaAcces(E.diuError(err)); });
  });
  b.style.background = C.accio; b.style.width = '100%';
  c.appendChild(b);
  p.control.onkeydown = function(ev){ if (ev.key === 'Enter') b.click(); };

  var o = h('div','margin-top:14px;text-align:center');
  var a = document.createElement('a');
  a.textContent = 'He oblidat la contrasenya';
  a.href = '#';
  a.setAttribute('style','font-size:12.5px;color:'+C.apagat+';text-decoration:none;'+
    'border-bottom:1px solid '+C.vora);
  a.onclick = function(ev){
    ev.preventDefault();
    var correu = e.control.value.trim();
    if (!correu) return pantallaAcces("Escriu el correu i torna a prémer l'enllaç.");
    E.sb.auth.resetPasswordForEmail(correu.toLowerCase(),
      { redirectTo: E.URL_CONSOLA })
      .then(function(r){
        if (r && r.error) return pantallaAcces(
          "No s'ha pogut enviar el correu: " + E.diuError(r.error));
        pantallaAcces("Correu enviat a " + correu + ". Mira també la carpeta de correu "
          + "brossa. Si al cap de cinc minuts no ha arribat, avisa l'administrador: "
          + "vol dir que el servidor de correu del projecte no està configurat.");
      })
      .catch(function(err){
        pantallaAcces("No s'ha pogut enviar el correu: " + E.diuError(err));
      });
  };
  o.appendChild(a);
  c.appendChild(o);
}

// Quan s'arriba des de l'enllac del correu. Sense aquesta pantalla,
// l'enllac de recuperacio entra una vegada i la contrasenya no es posa mai.
function pantallaNovaContrasenya(msg){
  var c = centrat();
  c.appendChild(E.titol('Nova contrasenya', 19));
  c.appendChild(h('div','font-size:13px;color:'+C.apagat+';line-height:1.55;margin:6px 0 16px',
    'Tria la contrasenya amb què entraràs a partir d\'ara.'));
  var p1 = E.camp({ et:'Contrasenya nova', tipus:'password' });
  var p2 = E.camp({ et:'Repeteix-la', tipus:'password' });
  p1.control.setAttribute('autocomplete','new-password');
  p2.control.setAttribute('autocomplete','new-password');
  var box = h('div','display:flex;flex-direction:column;gap:11px;margin-bottom:14px');
  box.appendChild(p1); box.appendChild(p2);
  c.appendChild(box);
  if (msg){ c.appendChild(E.avis(msg)); c.appendChild(h('div','height:12px')); }
  var b = E.boto('Desar contrasenya', function(){
    if (p1.control.value.length < 8)
      return pantallaNovaContrasenya('Mínim 8 caràcters.');
    if (p1.control.value !== p2.control.value)
      return pantallaNovaContrasenya('Les dues contrasenyes no coincideixen.');
    b.disabled = true; b.textContent = 'Desant\u2026';
    E.sb.auth.updateUser({ password: p1.control.value })
      .then(function(r){
        if (r.error) return pantallaNovaContrasenya(E.diuError(r.error));
        history.replaceState(null, '', location.pathname);
        carregaPerfil();
      })
      .catch(function(err){ pantallaNovaContrasenya(E.diuError(err)); });
  });
  b.style.background = C.accio; b.style.width = '100%';
  c.appendChild(b);
}
E.pantallaNovaContrasenya = pantallaNovaContrasenya;

function visible(s){
  if (s.propietari && !E.perfil.es_propietari) return false;
  if (s.rols && s.rols.indexOf(E.perfil.role) === -1) return false;
  return true;
}

// Hi ha seccions que es poden obrir pero no surten al menu, com «El meu
// compte»: s'hi arriba des del peu de la barra lateral.
function alMenu(s){ return visible(s) && !s.amagat; }

function pintaMarc(){
  E.buida(arrel);
  var accent = E.accent();
  var w = h('div','display:flex;min-height:100vh');

  var lat = h('div','width:236px;flex-shrink:0;background:'+C.panell+';'+
    'border-right:1px solid '+C.vora+';display:flex;flex-direction:column;'+
    'position:sticky;top:0;height:100vh');

  var marca = h('div','display:flex;align-items:center;gap:10px;padding:18px 18px 16px;'+
    'border-bottom:1px solid '+C.vora);
  marca.appendChild(E.marca(36));
  var mt = h('div','min-width:0');
  mt.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:10.5px;"+
    'letter-spacing:.16em;color:'+C.or+';white-space:nowrap','METABOLISME'));
  mt.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:10.5px;"+
    'letter-spacing:.16em;color:'+C.or,'ESPARTÀ'));
  marca.appendChild(mt);
  lat.appendChild(marca);

  var nav = h('nav','flex:1;padding:12px 0;overflow-y:auto;display:flex;flex-direction:column;gap:1px');
  E.seccions.filter(alMenu).forEach(function(s){
    var b = document.createElement('button');
    var sel = s.id === E.actual;
    b.setAttribute('style','display:flex;align-items:center;gap:11px;width:100%;'+
      'padding:10px 18px;background:'+(sel ? accent+'1f' : 'transparent')+';border:none;'+
      'border-left:3px solid '+(sel ? accent : 'transparent')+';cursor:pointer;'+
      'color:'+(sel ? C.os : C.pedra)+';font-size:13.5px;font-weight:'+(sel?'700':'500')+';'+
      "font-family:'Barlow',sans-serif;text-align:left");
    b.appendChild(E.emblema(E.EMB[s.id], 17, sel ? accent : C.apagat));
    b.appendChild(h('span',null, s.etiqueta));
    b.onclick = function(){ location.hash = s.id; };
    nav.appendChild(b);
  });
  lat.appendChild(nav);

  var peu = h('div','padding:14px 18px;border-top:1px solid '+C.vora);
  var fila = h('div','display:flex;align-items:center;gap:10px;margin-bottom:10px');
  fila.appendChild(h('div','width:32px;height:32px;flex-shrink:0;background:'+accent+';'+
    'display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12.5px;'+
    'color:#fff', E.inicials(E.perfil)));
  var pt = h('div','min-width:0;flex:1');
  pt.appendChild(h('div','font-size:12.5px;font-weight:600;color:'+C.os+';'+
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis', E.nomComplet(E.perfil)));
  pt.appendChild(h('div','font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;'+
    'font-weight:700;color:'+accent,
    (E.perfil.role === 'coach' ? 'Entrenador' : 'Nutricionista') +
    (E.perfil.es_propietari ? ' · propietari' : '')));
  fila.appendChild(pt);
  peu.appendChild(fila);
  if (E.botoAvisos) peu.appendChild(E.botoAvisos());
  var meu = E.boto('El meu compte', function(){ location.hash = 'compte'; }, 'buit');
  meu.style.width = '100%'; meu.style.padding = '8px 12px';
  meu.style.fontSize = '11.5px'; meu.style.marginBottom = '7px';
  peu.appendChild(meu);
  var sortir = E.boto('Tancar sessió', function(){
    E.sb.auth.signOut().then(function(){ E.perfil = null; arrenca(); });
  }, 'buit');
  sortir.style.width = '100%'; sortir.style.padding = '8px 12px'; sortir.style.fontSize = '11.5px';
  peu.appendChild(sortir);
  lat.appendChild(peu);

  var principal = h('main','flex:1;min-width:0;background:'+C.fons);
  w.appendChild(lat); w.appendChild(principal);
  arrel.appendChild(w);
  return principal;
}

E.capcalera = function(titol, subtitol, accions){
  var cap = h('div','display:flex;align-items:flex-end;justify-content:space-between;gap:20px;'+
    'padding:24px 32px 18px;border-bottom:1px solid '+C.vora+';flex-wrap:wrap');
  var esq = h('div','display:flex;align-items:center;gap:14px;min-width:0');
  var marc2 = h('div','width:44px;height:44px;flex-shrink:0;background:'+C.panell2+';'+
    'border:1px solid '+C.voraFort+';display:flex;align-items:center;justify-content:center');
  marc2.appendChild(E.emblema(E.EMB[E.actual], 23, C.or));
  esq.appendChild(marc2);
  var t = h('div','min-width:0');
  t.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:23px;"+
    'color:'+C.os, titol));
  if (subtitol) t.appendChild(h('div','font-size:13px;color:'+C.apagat+';margin-top:3px', subtitol));
  esq.appendChild(t);
  cap.appendChild(esq);
  if (accions){
    var a = h('div','display:flex;gap:9px;align-items:center');
    accions.forEach(function(x){ a.appendChild(x); });
    cap.appendChild(a);
  }
  return cap;
};

E.cos = function(){ return h('div','padding:24px 32px 40px'); };
E.vesA = function(id){ location.hash = id; };

function pinta(){
  if (!E.perfil) return;
  var obribles = E.seccions.filter(visible);
  var menu = E.seccions.filter(alMenu);
  var id = (location.hash || '').replace('#','') || menu[0].id;
  var sec = obribles.filter(function(s){ return s.id === id; })[0] || menu[0];
  E.actual = sec.id;
  var principal = pintaMarc();
  try { sec.pinta(principal); }
  catch (err){
    principal.appendChild(E.capcalera(sec.etiqueta));
    var c = E.cos();
    c.appendChild(E.avis('Error en aquesta secció: ' + err.message));
    principal.appendChild(c);
  }
}
E.repinta = pinta;
window.addEventListener('hashchange', pinta);

function carregaPerfil(){
  E.sb.auth.getUser().then(function(u){
    if (!u.data || !u.data.user) return pantallaAcces();
    E.sb.from('profiles').select('id,email,nom,cognoms,role,es_propietari')
      .eq('id', u.data.user.id).single()
      .then(function(r){
        if (r.error){
          // El compte existeix pero no te fila a «profiles»: si no es tanca
          // la sessio, aixo es un bucle del qual no se'n surt mai.
          E.sb.auth.signOut();
          return pantallaAcces('Has entrat correctament, però aquest compte no té cap '
            + 'perfil assignat a la base de dades i per això no s\'obre la consola. '
            + 'Cal executar 16-restaurar-acces.sql. Detall: ' + r.error.message);
        }
        if (r.data.role === 'athlete'){
          E.sb.auth.signOut();
          return pantallaAcces("Aquest compte és d'Espartà, no d'entrenador. Entra des "
            + "de l'aplicació de mòbil: " + E.URL_ATLETA);
        }
        E.perfil = r.data;
        pinta();
      })
      .catch(function(err){ pantallaError(E.diuError(err)); });
  }).catch(function(err){ pantallaError(E.diuError(err)); });
}

function arrenca(){
  E.cfg = E.FIX;
  if (!E.cfg || !E.cfg.url || !E.cfg.key) return pantallaConfig();
  if (typeof supabase === 'undefined')
    return pantallaError("No s'ha pogut carregar la llibreria de Supabase. Comprova la connexió.");
  try {
    E.sb = supabase.createClient(E.cfg.url, E.cfg.key,
      { auth:{ persistSession:true, autoRefreshToken:true } });
  } catch(err){ return pantallaConfig('Configuració no vàlida: '+err.message); }

  E.buida(arrel);
  arrel.appendChild(E.carregant('Comprovant la connexió…'));

  // Enllac del correu de recuperacio: cal posar contrasenya, no entrar.
  var hash = location.hash || '';
  if (hash.indexOf('error') !== -1){
    history.replaceState(null, '', location.pathname);
    return pantallaAcces("L'enllaç del correu ja no serveix: ha caducat o ja s'ha fet "
      + "servir. Demana'n un de nou amb «He oblidat la contrasenya».");
  }
  E.sb.auth.onAuthStateChange(function(event){
    if (event === 'PASSWORD_RECOVERY') pantallaNovaContrasenya();
  });
  if (hash.indexOf('type=recovery') !== -1){
    // Xarxa de seguretat: si l'esdeveniment no arriba, no deixem la
    // pantalla morta a «Carregant...».
    setTimeout(function(){
      if (!E.perfil && !document.querySelector('input[type=password]'))
        pantallaAcces("No s'ha pogut obrir l'enllaç del correu. Prova a demanar-ne un de nou.");
    }, 6000);
    return;
  }

  var penjat = setTimeout(function(){
    pantallaError('El servidor no respon. Pot ser la connexió, o que el projecte de '
      + 'Supabase estigui en pausa. Torna-ho a provar en un minut.');
  }, 15000);
  E.sb.from('rank_levels').select('id',{count:'exact',head:true}).then(function(r){
    clearTimeout(penjat);
    if (r.error) return pantallaError(E.diuError(r.error));
    E.sb.auth.getSession().then(function(s){
      if (s.data.session) carregaPerfil(); else pantallaAcces();
    }).catch(function(){ pantallaAcces(); });
  }).catch(function(err){ clearTimeout(penjat); pantallaError(E.diuError(err)); });
}

E.arrenca = arrenca;
})();
