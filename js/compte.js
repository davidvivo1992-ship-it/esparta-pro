// Metabolisme Esparta · El meu compte
//
// No surt al menu: s'hi arriba des del peu de la barra lateral. Fins ara
// l'unica manera de canviar-se la contrasenya era el correu de recuperacio,
// que es precisament la peca que falla quan el projecte no te SMTP propi.
(function(){
var E = window.ESPARTA, h = E.h, C = E.C;

var ROLS = { coach:'Entrenador', nutritionist:'Nutricionista' };

E.seccions.push({
  id:'compte', etiqueta:'El meu compte', rols:['coach','nutritionist'], amagat:true,
  pinta: function(cont){
    cont.appendChild(E.capcalera('El meu compte', E.perfil.email || null,
      [E.boto('Tornar', function(){ location.hash = 'panell'; }, 'buit')]));
    var cos = E.cos();

    var dades = [
      ['Nom', E.nomComplet(E.perfil)],
      ['Correu', E.perfil.email || '—'],
      ['Rol', (ROLS[E.perfil.role] || E.perfil.role) +
              (E.perfil.es_propietari ? ' · propietari' : '')]
    ];
    var g = h('div','display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));'+
      'gap:1px;background:'+C.vora+';margin-bottom:26px;max-width:620px');
    dades.forEach(function(d){
      var c = h('div','background:'+C.panell+';padding:13px 16px');
      c.appendChild(h('div','font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;'+
        'color:'+C.apagat+';font-weight:700;margin-bottom:4px', d[0]));
      c.appendChild(h('div','font-size:14px;color:'+C.os+';font-weight:500;'+
        'word-break:break-word', d[1]));
      g.appendChild(c);
    });
    cos.appendChild(g);

    var f = E.targeta();
    f.style.maxWidth = '620px';
    f.appendChild(E.titol('Canviar la contrasenya', 15));
    f.appendChild(h('div','font-size:12.5px;color:'+C.apagat+';line-height:1.55;'+
      'margin:5px 0 16px', 'Et demanem la d\'ara perquè aquesta sessió es queda '+
      'oberta: qui s\'assegui davant d\'aquest ordinador no ha de poder canviar-la '+
      'només per tenir-lo a mà.'));
    f.appendChild(E.formContrasenya());
    cos.appendChild(f);

    if (E.perfil.es_propietari)
      cos.appendChild(h('div','max-width:620px;margin-top:14px;font-size:12px;'+
        'color:'+C.apagat+';line-height:1.55',
        'Si algú altre no pot entrar, no cal tocar res aquí: ves a Administració '+
        'i torna-li a enviar l\'accés.'));

    cont.appendChild(cos);
  }
});
})();
