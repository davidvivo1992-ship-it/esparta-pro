// Metabolisme Esparta · Panell
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;

function xifra(valor, etiqueta, color, nota){
  var c = h('div','background:'+C.panell+';border:1px solid '+C.vora+';'+
    'border-top:2px solid '+color+';padding:16px 18px');
  c.appendChild(h('div',"font-family:'Cinzel',serif;font-weight:700;font-size:30px;"+
    'line-height:1;color:'+C.os, String(valor)));
  c.appendChild(h('div','font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;'+
    'font-weight:700;color:'+color+';margin-top:7px', etiqueta));
  if (nota) c.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:4px;'+
    'line-height:1.4', nota));
  return c;
}

// Una sessio que es comenca i no es tanca es queda 'en_curs' per sempre, i
// fins ara no sortia enlloc: l'entrenador no tenia cap manera de saber que algu
// havia deixat un entreno a mitges. Les d'avui no compten, que encara les pot
// estar fent.
function entrenosAMitges(cos){
  var zona = h('div','margin-bottom:26px');
  cos.appendChild(zona);
  var avui = new Date().toISOString().slice(0,10);

  E.sb.from('workout_sessions')
    .select('id,data,dia_previst,atleta:athletes(id,usuari:profiles!athletes_user_id_fkey'+
            '(nom,cognoms))')
    .eq('estat','en_curs').lt('data', avui)
    .order('data',{ascending:false}).limit(25)
    .then(function(r){
      var ses = r.data || [];
      if (r.error || !ses.length) return;
      // Quantes series hi ha apuntades: diu si hi havia feina de debo o no
      return E.sb.from('set_logs').select('session_id')
        .in('session_id', ses.map(function(s){ return s.id; }))
        .then(function(rs){
          var compte = {};
          (rs.data || []).forEach(function(x){
            compte[x.session_id] = (compte[x.session_id] || 0) + 1;
          });
          pintaAMitges(zona, ses, compte);
        });
    });
}

function pintaAMitges(zona, ses, compte){
  E.buida(zona);
  var cap = h('div','display:flex;align-items:baseline;gap:10px;margin-bottom:11px;'+
    'flex-wrap:wrap');
  cap.appendChild(E.titol('Entrenos a mitges', 15));
  cap.appendChild(h('div','font-size:12px;color:'+C.apagat,
    ses.length === 1 ? 'un entreno obert i mai tancat'
                     : ses.length + ' entrenos oberts i mai tancats'));
  zona.appendChild(cap);

  var l = h('div','display:flex;flex-direction:column;gap:1px;background:'+C.vora);
  ses.forEach(function(s){
    var n = compte[s.id] || 0;
    var f = h('div','background:'+C.panell+';padding:12px 15px;display:flex;'+
      'align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap');
    var t = h('div','min-width:0');
    t.appendChild(h('div','font-size:14px;font-weight:600;color:'+C.os,
      E.nomComplet(s.atleta && s.atleta.usuari)));
    t.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:2px',
      E.data(s.data) + ' \u00B7 ' + (n ? n + (n === 1 ? ' s\u00E8rie' : ' s\u00E8ries') + ' apuntades'
                                       : 'cap s\u00E8rie apuntada')));
    f.appendChild(t);

    var dr = h('div','display:flex;gap:8px;align-items:center;flex-shrink:0');
    var miss = h('div','font-size:11.5px;color:'+C.brasa);
    function tanca(estat, text){
      var b = E.boto(text, function(){
        E.buida(miss);
        Array.prototype.forEach.call(dr.querySelectorAll('button'), function(x){
          x.disabled = true; });
        E.sb.from('workout_sessions').update({ estat:estat }).eq('id', s.id)
          .then(function(rr){
            if (rr.error){
              Array.prototype.forEach.call(dr.querySelectorAll('button'), function(x){
                x.disabled = false; });
              miss.appendChild(document.createTextNode(rr.error.message));
              return;
            }
            E.repinta();
          });
      }, 'buit');
      b.style.padding = '6px 12px'; b.style.fontSize = '11px';
      return b;
    }
    // Amb series apuntades, lo normal es que la fes i no la tanques; sense cap,
    // que l'obris i te'n desdiguessis. Pero ho decideix ell, no nosaltres.
    dr.appendChild(tanca('completada', 'La va fer'));
    dr.appendChild(tanca('saltada', 'No la va fer'));
    dr.appendChild(miss);
    f.appendChild(dr);
    l.appendChild(f);
  });
  zona.appendChild(l);
  zona.appendChild(h('div','font-size:11.5px;color:'+C.apagat+';margin-top:9px;line-height:1.5',
    'Es queden aix\u00ED quan alg\u00FA comen\u00E7a l\'entreno i no arriba a pr\u00E9mer \u00ABSessi\u00F3 '+
    'completada\u00BB. Mentre estiguin obertes no compten a l\'adher\u00E8ncia.'));
}

E.seccions.push({
  id:'panell', etiqueta:'Panell', icona:'\u25C8', rols:['coach','nutritionist'],
  pinta: function(cont){
    cont.appendChild(E.capcalera('Panell',
      E.perfil.role === 'coach' ? 'Estat de la teva tropa' : 'Els teus Espartans'));
    var cos = E.cos();
    cos.appendChild(E.carregant());
    cont.appendChild(cos);

    var fa7 = new Date(Date.now() - 7*86400000).toISOString().slice(0,10);

    Promise.all([
      E.sb.from('athletes').select('id,estat'),
      E.sb.from('workout_sessions').select('id,estat,data').gte('data', fa7),
      E.sb.from('measurements').select('id,data').gte('data', fa7),
      E.sb.from('leads').select('id,estat').neq('estat','convertit').neq('estat','descartat')
    ]).then(function(r){
      E.buida(cos);
      var atl = r[0].data || [], ses = r[1].data || [],
          mes = r[2].data || [], lea = r[3].data || [];
      if (r[0].error){ cos.appendChild(E.avis(r[0].error.message)); return; }

      var actius = atl.filter(function(a){ return a.estat === 'actiu'; }).length;
      var pausa  = atl.filter(function(a){ return a.estat === 'pausa'; }).length;
      var fetes  = ses.filter(function(s){ return s.estat === 'completada'; }).length;
      var saltades = ses.filter(function(s){ return s.estat === 'saltada'; }).length;
      var adher = (fetes + saltades) ? Math.round(fetes / (fetes + saltades) * 100) : null;

      var graella = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));'+
        'gap:14px;margin-bottom:26px');
      graella.appendChild(xifra(actius, 'Espartans actius', C.oliva,
        pausa ? pausa + ' en pausa' : null));
      graella.appendChild(xifra(fetes, 'Sessions · 7 dies', E.accent(),
        saltades ? saltades + ' saltades' : 'cap saltada'));
      graella.appendChild(xifra(adher == null ? '\u2014' : adher + '%', 'Adherència · 7 dies',
        adher == null ? C.apagat : adher >= 80 ? C.oliva : adher >= 60 ? C.ambre : C.accio,
        adher == null ? 'sense sessions programades' : null));
      graella.appendChild(xifra(mes.length, 'Pesatges · 7 dies', C.or));
      if (E.perfil.role === 'coach' && !r[3].error)
        graella.appendChild(xifra(lea.length, 'Candidats oberts', C.bronze,
          lea.length ? 'pendents de convertir' : 'cap pendent'));
      cos.appendChild(graella);

      if (!atl.length){
        cos.appendChild(E.buit(E.perfil.role === 'coach'
          ? "Encara no hi ha cap Espartà. Comença per donar-ne d'alta a «Espartans»."
          : "Encara no t'han assignat cap Espartà."));
        return;
      }

      if (E.perfil.role === 'coach') entrenosAMitges(cos);

      cos.appendChild(E.titol('Accions ràpides', 15));
      var acc = h('div','display:flex;gap:10px;flex-wrap:wrap;margin-top:12px');
      acc.appendChild(E.boto('Veure Espartans', function(){ E.vesA('espartans'); }));
      if (E.perfil.role === 'coach')
        acc.appendChild(E.boto("Alta d'Espartà", function(){
          E.novaAlta = true; location.hash = 'espartans';
        }, 'buit'));
      cos.appendChild(acc);
    });
  }
});
})();
