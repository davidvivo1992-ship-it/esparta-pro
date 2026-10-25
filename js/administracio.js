// Metabolisme Esparta · Administracio
//
// Nomes la veu el propietari. Es tot allo que fins ara calia fer entrant al
// SQL Editor de Supabase: saber qui te compte, qui no ha entrat mai, tornar a
// enviar un acces i donar d'alta un professional.
//
// Les dades venen de l'edge function «administracio», perque «ultim acces» i
// «correu confirmat» viuen a auth.users i el navegador no els pot llegir.
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;
var vista = { mode:'llista' };

var ROLS = { coach:'Entrenador', nutritionist:'Nutricionista', athlete:'Espartà' };

function colorRol(rol){
  if (rol === 'coach') return C.blau;
  if (rol === 'nutritionist') return C.verd;
  if (rol === 'athlete') return C.accio;
  return C.apagat;
}

// ── Com està el sistema ─────────────────────────────────────────────
function salut(cont){
  var caixa = h('div','margin-bottom:28px');
  caixa.appendChild(E.carregant('Comprovant el sistema…'));
  cont.appendChild(caixa);

  E.crida('administracio', { accio:'salut' }).then(function(r){
    E.buida(caixa);
    if (r.error){ caixa.appendChild(E.avis(r.error)); return; }

    var malament = r.punts.filter(function(p){ return !p.be; }).length;
    var cap = h('div','display:flex;align-items:baseline;gap:11px;margin-bottom:12px');
    cap.appendChild(E.titol('Estat del sistema', 15));
    cap.appendChild(E.etiqueta(
      malament ? malament + (malament === 1 ? ' avís' : ' avisos') : 'tot correcte',
      malament ? C.ambre : C.oliva));
    caixa.appendChild(cap);

    // Gap de debò i vora a cada targeta: amb el truc del fons de 1px, les
    // caselles que sobren a l'última fila es veuen com a forats.
    var g = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));'+
      'gap:9px');
    r.punts.forEach(function(p){
      var c = h('div','background:'+C.panell+';padding:13px 15px;'+
        'border:1px solid '+C.vora+';'+
        'border-left:2px solid '+(p.be ? C.oliva : C.ambre));
      var t = h('div','display:flex;align-items:center;gap:7px');
      t.appendChild(h('div','width:6px;height:6px;flex-shrink:0;background:'+
        (p.be ? C.oliva : C.ambre)));
      t.appendChild(h('div','font-size:10px;letter-spacing:.12em;text-transform:uppercase;'+
        'font-weight:700;color:'+C.pedra, p.titol));
      c.appendChild(t);
      c.appendChild(h('div','font-size:12.5px;color:'+(p.be ? C.os : C.ambre)+';'+
        'margin-top:5px;line-height:1.45;word-break:break-word', p.detall));
      g.appendChild(c);
    });
    caixa.appendChild(g);

    caixa.appendChild(provaCorreu());
  });
}

// El correu es l'unica peca que no es pot comprovar mirant la base de dades:
// l'unica manera honesta de saber si surt es intentar-ho.
function provaCorreu(){
  var b = h('div','margin-top:16px;background:'+C.panell+';border:1px solid '+C.vora+';'+
    'padding:15px 17px;max-width:620px');
  b.appendChild(h('div','font-size:10px;letter-spacing:.12em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.pedra,'Enviament de correu'));
  b.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';line-height:1.5;margin-top:5px',
    'Escriu una adreça teva i mira si hi arriba. Si no arriba, és que el projecte '+
    "encara no té servidor de correu propi i cal configurar-lo a Supabase."));

  var fila = h('div','display:flex;gap:8px;margin-top:11px;align-items:stretch');
  var camp = E.camp({ tipus:'email', marca:'la-teva-adreça@exemple.com' });
  camp.style.flex = '1';
  fila.appendChild(camp);
  var miss = h('div','margin-top:10px');

  var b2 = E.boto('Provar', function(){
    E.buida(miss);
    var correu = camp.control.value.trim();
    if (!correu){ miss.appendChild(E.avis('Escriu una adreça primer.')); return; }
    b2.disabled = true; b2.textContent = 'Enviant…';
    E.crida('administracio', { accio:'provar_correu', correu:correu }).then(function(r){
      b2.disabled = false; b2.textContent = 'Provar';
      if (r.error){ miss.appendChild(E.avis(r.error)); return; }
      if (r.enviat)
        miss.appendChild(E.avis('Supabase diu que l\'ha enviat a ' + correu + '. '+
          'Mira la safata i la carpeta de correu brossa: si no hi és en cinc minuts, '+
          'el remitent per defecte només arriba als membres de l\'equip del projecte.',
          C.oliva));
      else
        miss.appendChild(E.avis('No ha sortit: ' + r.motiu, C.ambre));
    });
  }, 'buit');
  fila.appendChild(b2);
  b.appendChild(fila);
  b.appendChild(miss);
  return b;
}

// ── Qui té compte ───────────────────────────────────────────────────
function fila(c){
  var w = h('div','background:'+C.panell+';border:1px solid '+C.vora);
  var f = h('div','display:flex;align-items:center;gap:14px;padding:13px 16px;flex-wrap:wrap');

  var t = h('div','flex:1;min-width:190px');
  var nom = h('div','display:flex;align-items:center;gap:8px;flex-wrap:wrap');
  nom.appendChild(h('div','font-size:14.5px;font-weight:600;color:'+C.os,
    c.nom || '(sense nom)'));
  if (c.es_propietari) nom.appendChild(E.etiqueta('Propietari', C.or));
  t.appendChild(nom);
  t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:2px;'+
    'word-break:break-all', c.correu));
  f.appendChild(t);

  var d = h('div','display:flex;align-items:center;gap:16px;flex-shrink:0;flex-wrap:wrap');
  d.appendChild(E.etiqueta(ROLS[c.rol] || 'sense rol', colorRol(c.rol)));
  var ult = h('div','text-align:right;min-width:94px');
  ult.appendChild(h('div','font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;'+
    'font-weight:700;color:'+C.apagat,'Últim accés'));
  ult.appendChild(h('div','font-size:12.5px;margin-top:2px;color:'+
    (c.ultim_acces ? C.pedra : C.ambre), E.quanFa(c.ultim_acces)));
  d.appendChild(ult);

  var panell = h('div','padding:0 16px 15px');
  var b = E.boto("Tornar a enviar l'accés", function(){
    E.buida(panell);
    b.disabled = true; b.textContent = 'Preparant…';
    E.crida('alta-esparta', { accio:'reenviar', correu:c.correu }).then(function(r){
      b.disabled = false; b.textContent = "Tornar a enviar l'accés";
      if (r.error){ panell.appendChild(E.avis(r.error)); return; }
      panell.appendChild(E.targetaAcces(r, c.correu));
    });
  }, 'buit');
  b.style.padding = '7px 13px'; b.style.fontSize = '11px';
  d.appendChild(b);
  f.appendChild(d);
  w.appendChild(f);

  if (c.veredicte && c.veredicte.mena !== 'ok'){
    var color = c.veredicte.mena === 'greu' ? C.accio : C.ambre;
    var v = h('div','padding:0 16px 13px');
    v.appendChild(E.avis(c.veredicte.text, color));
    w.appendChild(v);
  }
  w.appendChild(panell);
  return w;
}

function llista(cont){
  cont.appendChild(E.capcalera('Administració', 'Comptes, accessos i estat del sistema',
    [E.boto('Alta de professional', function(){
      vista = { mode:'alta' }; E.repinta();
    })]));

  var cos = E.cos();
  cont.appendChild(cos);

  salut(cos);

  var caixa = h('div');
  caixa.appendChild(E.carregant('Llegint els comptes…'));
  cos.appendChild(caixa);

  E.crida('administracio', { accio:'llistar' }).then(function(r){
    E.buida(caixa);
    if (r.error){ caixa.appendChild(E.avis(r.error)); return; }

    var tots = r.comptes || [];
    var problemes = tots.filter(function(c){ return c.veredicte.mena !== 'ok'; }).length;

    var cap = h('div','display:flex;align-items:baseline;gap:11px;margin-bottom:12px');
    cap.appendChild(E.titol('Comptes', 15));
    cap.appendChild(h('div','font-size:12px;color:'+C.apagat,
      tots.length + (tots.length === 1 ? ' compte' : ' comptes') +
      (problemes ? ' · ' + problemes + ' amb algun problema' : '')));
    caixa.appendChild(cap);

    if (!tots.length){
      caixa.appendChild(E.buit('Encara no hi ha cap compte.'));
      return;
    }

    var box = h('div','display:flex;flex-direction:column;gap:7px');
    tots.forEach(function(c){ box.appendChild(fila(c)); });
    caixa.appendChild(box);

    if ((r.perfils_orfes || []).length){
      caixa.appendChild(h('div','height:22px'));
      caixa.appendChild(E.titol('Perfils sense compte', 15));
      caixa.appendChild(h('div','font-size:12px;color:'+C.apagat+';margin-top:3px;'+
        'line-height:1.5;max-width:620px',
        'Hi ha fitxa a la base de dades però no hi ha cap compte per entrar-hi. '+
        'No es poden fer servir: cal crear-los de nou.'));
      var lo = h('div','margin-top:11px;display:flex;flex-direction:column;gap:1px;'+
        'background:'+C.vora);
      r.perfils_orfes.forEach(function(p){
        var f = h('div','background:'+C.panell+';padding:11px 15px;display:flex;'+
          'justify-content:space-between;gap:12px;flex-wrap:wrap');
        f.appendChild(h('div','font-size:13px;color:'+C.os,
          (p.nom || '(sense nom)') + ' · ' + p.correu));
        f.appendChild(E.etiqueta(ROLS[p.rol] || p.rol, colorRol(p.rol)));
        lo.appendChild(f);
      });
      caixa.appendChild(lo);
    }
  });

  registreAccessos(cos);
}

// ── Qui ha obert les dades de salut de qui ──────────────────
// Es carrega nomes quan es demana: a la llarga son moltes anotacions i
// no cal fer-les baixar cada cop que s'obre Administracio.
function registreAccessos(cos){
  var ACCIONS = {
    obre_fitxa:   'ha obert la fitxa de',
    obre_pesatge: 'ha obert un pesatge de',
    desa_pesatge: 'ha desat un pesatge de'
  };

  cos.appendChild(h('div','height:26px'));
  var cap = h('div','display:flex;align-items:baseline;gap:11px;margin-bottom:5px');
  cap.appendChild(E.titol('Registre d\'accessos', 15));
  cap.appendChild(h('div','font-size:12px;color:'+C.apagat,'dades de salut'));
  cos.appendChild(cap);
  cos.appendChild(h('div','font-size:12px;color:'+C.apagat+';line-height:1.55;'+
    'max-width:620px;margin-bottom:12px',
    'Cada vegada que alg\u00fa obre les dades de salut d\'un Espart\u00e0 des de la '+
    'consola queda anotat aquí. Només ho veus tu, i no es pot esborrar ni '+
    'modificar: a la base de dades aquest registre només admet afegir-hi.'));

  var zona = h('div');
  cos.appendChild(zona);

  var b = E.boto('Veure el registre', function(){
    E.buida(zona);
    zona.appendChild(E.carregant('Llegint el registre\u2026'));

    Promise.all([
      E.sb.from('audit_log')
        .select('id,created_at,accio,entitat,entitat_id,detall,'+
                'qui:profiles!audit_log_actor_id_fkey(nom,cognoms,role)')
        .order('created_at', { ascending:false }).limit(60),
      E.sb.from('athletes')
        .select('id,usuari:profiles!athletes_user_id_fkey(nom,cognoms)')
    ]).then(function(r){
      E.buida(zona);
      if (r[0].error){ zona.appendChild(E.avis(r[0].error.message)); return; }

      var noms = {};
      (r[1].data || []).forEach(function(a){
        noms[a.id] = E.nomComplet(a.usuari);
      });

      var files = r[0].data || [];
      if (!files.length){
        zona.appendChild(E.buit('Encara no hi ha cap anotaci\u00f3. Obre la fitxa d\'un '+
          'Espart\u00e0 i torna aqu\u00ed.'));
        return;
      }

      var l = h('div','display:flex;flex-direction:column;gap:1px;background:'+C.vora);
      files.forEach(function(x){
        var f = h('div','background:'+C.panell+';padding:11px 15px;display:flex;'+
          'justify-content:space-between;align-items:baseline;gap:14px;flex-wrap:wrap');

        var t = h('div','min-width:0;flex:1');
        var qui = E.nomComplet(x.qui) || '(compte esborrat)';
        var que = ACCIONS[x.accio] || x.accio;
        var dequi = noms[x.entitat_id] || '(fitxa esborrada)';
        t.appendChild(h('div','font-size:13.5px;color:'+C.os+';line-height:1.5',
          qui + ' ' + que + ' ' + dequi));
        if (x.qui && x.qui.role)
          t.appendChild(h('div','font-size:10.5px;letter-spacing:.1em;'+
            'text-transform:uppercase;font-weight:700;margin-top:2px;color:'+
            colorRol(x.qui.role), ROLS[x.qui.role] || x.qui.role));
        f.appendChild(t);

        var q = h('div','text-align:right;flex-shrink:0');
        q.appendChild(h('div','font-size:12px;color:'+C.pedra, E.quanFa(x.created_at)));
        q.appendChild(h('div','font-size:10.5px;color:'+C.apagat+';margin-top:2px',
          E.data(x.created_at)));
        f.appendChild(q);

        l.appendChild(f);
      });
      zona.appendChild(l);

      if (files.length >= 60)
        zona.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:9px',
          'Es mostren les 60 anotacions més recents.'));
    });
  }, 'buit');
  zona.appendChild(b);
}

// ── Alta d'entrenador o nutricionista ───────────────────────────────
function altaPro(cont){
  cont.appendChild(E.capcalera('Alta de professional',
    'Entrenador o nutricionista. Els Espartans es donen d\'alta a «Espartans».',
    [E.boto('Cancel·lar', function(){ vista = { mode:'llista' }; E.repinta(); }, 'buit')]));
  var cos = E.cos();
  cont.appendChild(cos);

  var f = E.targeta();
  f.style.maxWidth = '620px';

  var nom = E.camp({ et:'Nom', marca:'Nom' });
  var cog = E.camp({ et:'Cognoms', marca:'Cognoms' });
  var cor = E.camp({ et:'Correu', tipus:'email', marca:'professional@correu.cat' });
  var rol = E.camp({ et:'Rol', tipus:'select', valor:'nutritionist', opcions:[
    { v:'nutritionist', t:'Nutricionista' },
    { v:'coach', t:'Entrenador' }
  ]});

  var g = h('div','display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:8px');
  [nom,cog,cor,rol].forEach(function(c){ g.appendChild(c); });
  f.appendChild(g);

  var nota = h('div','font-size:12px;color:'+C.apagat+';line-height:1.55;margin-bottom:16px');
  f.appendChild(nota);
  function pintaNota(){
    E.buida(nota);
    nota.textContent = rol.control.value === 'coach'
      ? 'Un entrenador veu i edita els seus Espartans, i la nutrició només en lectura. '
        + 'El propietari segueix sent un de sol i no canvia.'
      : 'Una nutricionista només veu els Espartans que li assignis, i l\'entrenament '
        + 'el veu en lectura.';
  }
  pintaNota();
  rol.control.onchange = pintaNota;

  var missatge = h('div','margin-bottom:14px');
  f.appendChild(missatge);

  var b = E.boto("Donar d'alta", function(){
    E.buida(missatge);
    if (!nom.control.value.trim() || !cor.control.value.trim()){
      missatge.appendChild(E.avis('El nom i el correu són obligatoris.'));
      return;
    }
    b.disabled = true; b.textContent = 'Creant…';
    E.crida('administracio', {
      accio:'alta_professional',
      nom: nom.control.value.trim(),
      cognoms: cog.control.value.trim(),
      correu: cor.control.value.trim(),
      rol: rol.control.value
    }).then(function(r){
      b.disabled = false; b.textContent = "Donar d'alta";
      if (r.error){ missatge.appendChild(E.avis(r.error)); return; }
      resultat(cont, r, cor.control.value.trim(),
        (nom.control.value.trim() + ' ' + cog.control.value.trim()).trim());
    });
  });
  f.appendChild(b);
  cos.appendChild(f);
}

function resultat(cont, r, correu, nomSencer){
  E.buida(cont);
  cont.appendChild(E.capcalera(
    (ROLS[r.rol] || 'Professional') + " donat d'alta", nomSencer || correu,
    [E.boto('Tornar a Administració', function(){
      vista = { mode:'llista' }; E.repinta();
    })]));
  var cos = E.cos();
  var f = E.targeta();
  f.style.maxWidth = '620px';
  f.appendChild(E.targetaAcces(r, correu));
  cos.appendChild(f);
  cont.appendChild(cos);
}

E.seccions.push({
  id:'administracio', etiqueta:'Administració', icona:'☰',
  rols:['coach'], propietari:true,
  pinta: function(cont){
    if (vista.mode === 'alta') return altaPro(cont);
    return llista(cont);
  }
});
})();
