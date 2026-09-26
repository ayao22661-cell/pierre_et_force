// ============================================================
// PORTRAIT — génère un portrait de personnage 100% SVG (aucune image
// chargée) : peau, vêtements, coiffure, yeux, marques, accessoires,
// et des « formes » spéciales pour les entités non humaines (Émissaires
// de Sgrün). Déterministe par seed — un même seed produit toujours le
// même visage, ce qui permet de régénérer un portrait à l'identique.
// ============================================================

function _pHash(str){
  var h=2166136261; str=String(str);
  for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function _pRng(seed){
  var s=(seed>>>0)||1;
  return function(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
}
function _pPick(rnd,arr){return arr[Math.floor(rnd()*arr.length)%arr.length];}

var P_SKINS   =["#8d5524","#a86b3c","#6b4226","#c68642","#7a4a2b","#5c3317","#b07340"];
var P_CLOTHS  =["#1c3a5e","#3a1c4e","#1c4e3a","#4e2a1c","#2a2a4e","#4e1c2c","#123a3a"];
var P_ACCENTS =["#c9a86a","#16c8bd","#e0455c","#23b567","#e6c98a","#9d7bff","#ff9f43"];
var P_HAIRS   =["#141018","#2b1a10","#3d2b1f","#1a1a24","#4a2c17"];

var P_ROLE_BG={
  DUELLISTE:["#1a3d2a","#04120b"], SOUTIEN:["#132f52","#040d1a"],
  TANK     :["#2a1f52","#0a0518"], ASSASSIN:["#4a1a1a","#160404"],
  MAGE     :["#123f45","#04161a"], OMBRE   :["#241238","#080312"],
  ERUDIT   :["#1b3550","#050e18"], EMISSAIRE:["#301028","#0e0410"],
  EMPEREUR :["#4a3410","#150e02"], TEMOIN  :["#3d2036","#100510"],
  DIEU     :["#26323e","#080c12"]
};
var P_GLYPHS={
  DUELLISTE:"\u2694", SOUTIEN:"\u271A", TANK:"\u26E8", ASSASSIN:"\u2620",
  MAGE:"\u2726", OMBRE:"\u25C6", ERUDIT:"\u269B", EMISSAIRE:"\u2668",
  EMPEREUR:"\u265B", TEMOIN:"\u270D", DIEU:"\u2735"
};

// ---------- Briques de dessin ----------
function _hairLayer(cfg){
  var hr=cfg.hair, ac=cfg.accent, cl=cfg.cloth, bg2=cfg.bg[1];
  switch(cfg.hairStyle){
    case 0: return '<path d="M66 90 Q66 52 100 52 Q134 52 134 90 L134 96 L66 96 Z" fill="'+hr+'" opacity=".9"/>'+
                   '<rect x="63" y="85" width="74" height="9" rx="4" fill="'+ac+'"/>';
    case 1: return '<ellipse cx="100" cy="70" rx="52" ry="40" fill="'+hr+'"/>'+
                   '<ellipse cx="100" cy="64" rx="43" ry="29" fill="'+hr+'" opacity=".65"/>';
    case 2: return '<path d="M64 92 Q64 50 100 50 Q136 50 136 92 L136 78 Z" fill="'+hr+'"/>'+
                   '<rect x="59" y="82" width="7" height="66" rx="3.5" fill="'+hr+'"/>'+
                   '<rect x="134" y="82" width="7" height="66" rx="3.5" fill="'+hr+'"/>'+
                   '<rect x="70" y="88" width="6" height="48" rx="3" fill="'+hr+'" opacity=".8"/>'+
                   '<rect x="124" y="88" width="6" height="48" rx="3" fill="'+hr+'" opacity=".8"/>';
    case 3: return '<path d="M54 118 Q50 42 100 42 Q150 42 146 118 L134 108 Q134 64 100 64 Q66 64 66 108 Z" fill="'+cl+'"/>'+
                   '<path d="M54 118 Q50 42 100 42 Q150 42 146 118" fill="none" stroke="'+ac+'" stroke-width="2.5" opacity=".85"/>';
    case 4: return '<path d="M64 90 Q64 54 100 54 Q136 54 136 90 L136 94 L64 94 Z" fill="'+hr+'"/>'+
                   '<path d="M61 88 L100 64 L139 88 L139 96 L61 96 Z" fill="'+ac+'" opacity=".92"/>'+
                   '<circle cx="100" cy="73" r="6" fill="'+bg2+'" stroke="'+ac+'" stroke-width="2"/>';
    case 5: return '<path d="M64 94 Q64 50 100 50 Q136 50 136 94 L128 92 Q128 68 100 68 Q72 68 72 92 Z" fill="'+hr+'"/>'+
                   '<circle cx="100" cy="43" r="13" fill="'+hr+'"/>'+
                   '<circle cx="100" cy="43" r="13" fill="none" stroke="'+ac+'" stroke-width="2"/>';
    case 6: return '<path d="M66 96 Q66 54 100 54 Q134 54 134 96 L126 90 Q120 74 100 74 Q80 74 74 90 Z" fill="'+hr+'"/>'+
                   '<path d="M74 90 Q100 62 128 84" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="4"/>'; // dégarni / tempes
    case 7: return '<path d="M62 100 Q62 48 100 48 Q138 48 138 100 L138 84 Q126 62 100 62 Q74 62 62 84 Z" fill="'+hr+'"/>'+
                   '<path d="M62 96 L52 150 L64 150 L70 104 Z" fill="'+hr+'"/>'+
                   '<path d="M138 96 L148 150 L136 150 L130 104 Z" fill="'+hr+'"/>'; // longs cheveux
    default: return '';
  }
}
function _beardLayer(cfg){
  var hr=cfg.hair;
  switch(cfg.beard){
    case 1: return '<path d="M72 124 Q72 156 100 158 Q128 156 128 124 L128 138 Q128 160 100 162 Q72 160 72 138 Z" fill="'+hr+'" opacity=".9"/>';
    case 2: return '<path d="M92 142 Q100 156 108 142 Q108 152 100 154 Q92 152 92 142 Z" fill="'+hr+'"/>'+
                   '<path d="M88 133 Q100 128 112 133" stroke="'+hr+'" stroke-width="4" fill="none" stroke-linecap="round"/>';
    case 3: return '<path d="M68 118 Q68 168 100 172 Q132 168 132 118 L132 132 Q132 176 100 180 Q68 176 68 132 Z" fill="'+hr+'"/>'+
                   '<path d="M86 132 Q100 126 114 132" stroke="'+hr+'" stroke-width="5" fill="none" stroke-linecap="round"/>';
    case 4: return '<path d="M86 133 Q100 127 114 133" stroke="'+hr+'" stroke-width="5" fill="none" stroke-linecap="round"/>'; // moustache seule
    default: return '';
  }
}
function _eyewearLayer(cfg){
  var ac=cfg.accent;
  switch(cfg.eyewear){
    case 1: return '<g fill="none" stroke="'+ac+'" stroke-width="2.4" opacity=".95">'+
                   '<circle cx="85" cy="110" r="12"/><circle cx="115" cy="110" r="12"/>'+
                   '<path d="M97 110 h6 M73 108 l-8 -3 M127 108 l8 -3"/></g>';
    case 2: return '<g fill="none" stroke="'+ac+'" stroke-width="2.4" opacity=".95">'+
                   '<rect x="72" y="101" width="26" height="17" rx="3"/>'+
                   '<rect x="102" y="101" width="26" height="17" rx="3"/>'+
                   '<path d="M98 109 h4 M72 106 l-8 -3 M128 106 l8 -3"/></g>';
    case 3: return '<path d="M64 98 L136 98 L136 118 Q100 128 64 118 Z" fill="'+ac+'" opacity=".35"/>'+
                   '<path d="M64 98 L136 98" stroke="'+ac+'" stroke-width="3"/>'; // visière
    default: return '';
  }
}
function _propLayer(cfg){
  var ac=cfg.accent, cl=cfg.cloth;
  switch(cfg.prop){
    case "tie":     return '<path d="M100 190 L92 202 L100 232 L108 202 Z" fill="'+ac+'"/>'+
                           '<path d="M92 186 L100 194 L108 186 L104 182 L96 182 Z" fill="'+ac+'" opacity=".8"/>';
    case "scarf":   return '<path d="M62 188 Q100 210 138 188 L142 204 Q100 228 58 204 Z" fill="'+ac+'" opacity=".9"/>'+
                           '<path d="M132 200 L148 246 L132 246 L124 206 Z" fill="'+ac+'" opacity=".75"/>';
    case "cigar":   return '<rect x="112" y="136" width="30" height="6" rx="3" fill="#6b4226" transform="rotate(-12 112 136)"/>'+
                           '<circle cx="142" cy="130" r="3.4" fill="#ff7a35"/>'+
                           '<path d="M144 126 q6 -10 -1 -18" stroke="#fff" stroke-opacity=".22" stroke-width="3" fill="none" stroke-linecap="round"/>';
    case "notebook":return '<rect x="128" y="196" width="40" height="52" rx="4" fill="#7a1c2c" stroke="'+ac+'" stroke-width="2" transform="rotate(9 128 196)"/>'+
                           '<path d="M136 212 h26 M134 224 h26 M132 236 h26" stroke="#fff" stroke-opacity=".35" stroke-width="2" transform="rotate(9 128 196)"/>';
    case "medal":   return '<path d="M84 190 L100 214 L116 190" stroke="'+ac+'" stroke-width="4" fill="none"/>'+
                           '<circle cx="100" cy="222" r="11" fill="'+ac+'"/>'+
                           '<text x="100" y="227" font-size="12" text-anchor="middle" fill="'+cl+'" font-family="serif">\u2605</text>';
    case "epaulet": return '<path d="M22 214 L64 196 L70 212 L28 232 Z" fill="'+ac+'" opacity=".9"/>'+
                           '<path d="M178 214 L136 196 L130 212 L172 232 Z" fill="'+ac+'" opacity=".9"/>';
    case "stone":   return '<path d="M40 214 L54 202 L70 210 L66 230 L46 232 Z" fill="'+ac+'" opacity=".95"/>'+
                           '<path d="M40 214 L54 202 L70 210" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>';
    default: return '';
  }
}
// Formes non humaines : les Émissaires de Sgrün ne portent pas de visage ordinaire.
function _formLayer(cfg){
  var ac=cfg.accent, e=cfg.eye, bg2=cfg.bg[1];
  switch(cfg.form){
    case "liquid": // Murk — l'Émissaire abyssal, sans forme fixe
      return '<path d="M66 96 Q60 54 100 52 Q140 54 134 96 Q140 130 122 148 Q112 160 100 156 Q88 160 78 148 Q60 130 66 96 Z" fill="'+ac+'" opacity=".55"/>'+
             '<path d="M74 104 Q100 88 126 104" stroke="'+e+'" stroke-width="2" fill="none" opacity=".5"/>'+
             '<ellipse cx="86" cy="112" rx="6" ry="4" fill="'+e+'"/>'+
             '<ellipse cx="114" cy="112" rx="6" ry="4" fill="'+e+'"/>'+
             '<path d="M84 160 q2 14 -2 20 M116 160 q-2 14 2 20" stroke="'+ac+'" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>';
    case "stone": // Krag — conçu pour tenir la pression des profondeurs
      return '<path d="M68 96 L82 58 L118 58 L132 96 L128 132 L112 154 L88 154 L72 132 Z" fill="'+cfg.skin+'"/>'+
             '<path d="M82 58 L100 92 L118 58 M72 132 L100 116 L128 132" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="2"/>'+
             '<path d="M76 104 L92 100 L92 114 Z" fill="'+e+'"/>'+
             '<path d="M124 104 L108 100 L108 114 Z" fill="'+e+'"/>'+
             '<path d="M88 138 L112 138" stroke="#000" stroke-opacity=".4" stroke-width="3"/>'+
             '<path d="M100 58 L100 40" stroke="'+ac+'" stroke-width="4" opacity=".7"/>';
    case "wind": // Vael — la Lame Invisible, à moitié dissoute
      return '<path d="M68 92 Q68 58 100 58 Q132 58 132 92 L132 118 Q132 154 100 154 Q68 154 68 118 Z" fill="'+cfg.skin+'" opacity=".38"/>'+
             '<path d="M56 96 h34 M60 108 h26 M52 120 h30" stroke="'+ac+'" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>'+
             '<path d="M110 96 h34 M114 108 h26 M110 120 h34" stroke="'+ac+'" stroke-width="2.5" opacity=".55" stroke-linecap="round"/>'+
             '<path d="M82 108 l10 3 l-10 3 Z" fill="'+e+'"/>'+
             '<path d="M118 108 l-10 3 l10 3 Z" fill="'+e+'"/>';
    case "shadow": // Sgrün, Schissin-Rouge — une silhouette et deux yeux
      return '<path d="M66 96 Q66 52 100 52 Q134 52 134 96 L134 120 Q134 156 100 156 Q66 156 66 120 Z" fill="#05070c"/>'+
             '<path d="M66 96 Q66 52 100 52 Q134 52 134 96" fill="none" stroke="'+ac+'" stroke-width="2" opacity=".5"/>'+
             '<path d="M76 108 l16 -4 l0 9 Z" fill="'+e+'"/>'+
             '<path d="M124 108 l-16 -4 l0 9 Z" fill="'+e+'"/>'+
             '<ellipse cx="100" cy="106" rx="42" ry="30" fill="'+e+'" opacity=".07"/>';
    default: return null;
  }
}

function buildPortraitSVG(cfg){
  var s=cfg.skin, cl=cfg.cloth, ac=cfg.accent, hr=cfg.hair;
  var bg1=cfg.bg[0], bg2=cfg.bg[1], uid=cfg.uid;
  var special=_formLayer(cfg);

  var face;
  if(special){
    face=special;
  }else{
    face=
      '<ellipse cx="66" cy="112" rx="7" ry="11" fill="'+s+'"/>'+
      '<ellipse cx="134" cy="112" rx="7" ry="11" fill="'+s+'"/>'+
      '<path d="M68 92 Q68 58 100 58 Q132 58 132 92 L132 118 Q132 154 100 154 Q68 154 68 118 Z" fill="'+s+'"/>'+
      '<path d="M68 118 Q68 154 100 154 Q132 154 132 118 L132 128 Q132 156 100 156 Q68 156 68 128 Z" fill="#000" opacity=".14"/>'+
      _hairLayer(cfg)+
      '<ellipse cx="85" cy="110" rx="8" ry="5" fill="#0a0d12" opacity=".55"/>'+
      '<ellipse cx="115" cy="110" rx="8" ry="5" fill="#0a0d12" opacity=".55"/>'+
      '<ellipse cx="85" cy="109" rx="5" ry="3.4" fill="'+cfg.eye+'"/>'+
      '<ellipse cx="115" cy="109" rx="5" ry="3.4" fill="'+cfg.eye+'"/>'+
      '<path d="M76 100 Q85 95 94 99 M106 99 Q115 95 124 100" stroke="'+hr+'" stroke-width="3" fill="none" stroke-linecap="round"/>'+
      '<path d="M100 114 L96 128 Q100 131 104 128" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="2.4" stroke-linecap="round"/>'+
      '<path d="M91 139 Q100 '+(cfg.smile?145:135)+' 109 139" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="2.6" stroke-linecap="round"/>'+
      _beardLayer(cfg)+
      _eyewearLayer(cfg);
  }

  var marks="";
  if(cfg.mark===1)marks='<path d="M78 112 l0 14 M122 112 l0 14" stroke="'+ac+'" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>';
  if(cfg.mark===2)marks='<path d="M100 96 l0 -10 M92 100 l-8 -6 M108 100 l8 -6" stroke="'+ac+'" stroke-width="2" stroke-linecap="round" opacity=".65"/>';
  if(cfg.mark===3)marks='<circle cx="100" cy="90" r="4" fill="'+ac+'" opacity=".8"/>';
  if(cfg.mark===4)marks='<path d="M74 96 q26 -14 52 0" fill="none" stroke="'+ac+'" stroke-width="2" opacity=".55"/>';

  var crown=cfg.crown?
    '<path d="M66 56 L78 30 L92 48 L100 22 L108 48 L122 30 L134 56 Z" fill="'+ac+'"/>'+
    '<path d="M66 56 L134 56 L134 64 L66 64 Z" fill="'+ac+'" opacity=".8"/>'+
    '<circle cx="100" cy="60" r="4" fill="'+bg2+'"/>':"";

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260">'+
  '<defs>'+
    '<linearGradient id="b'+uid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+bg1+'"/><stop offset="1" stop-color="'+bg2+'"/></linearGradient>'+
    '<linearGradient id="c'+uid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+cl+'"/><stop offset="1" stop-color="'+bg2+'"/></linearGradient>'+
    '<radialGradient id="g'+uid+'" cx="50%" cy="36%" r="62%"><stop offset="0" stop-color="'+ac+'" stop-opacity=".32"/><stop offset="1" stop-color="'+ac+'" stop-opacity="0"/></radialGradient>'+
  '</defs>'+
  '<rect width="200" height="260" fill="url(#b'+uid+')"/>'+
  '<rect width="200" height="260" fill="url(#g'+uid+')"/>'+
  '<circle cx="100" cy="104" r="76" fill="none" stroke="'+ac+'" stroke-opacity=".18" stroke-width="2"/>'+
  '<path d="M100 34 L152 64 L152 124 L100 154 L48 124 L48 64 Z" fill="none" stroke="'+ac+'" stroke-opacity=".12" stroke-width="1.5"/>'+
  '<path d="M14 260 Q16 200 60 184 L140 184 Q184 200 186 260 Z" fill="url(#c'+uid+')"/>'+
  '<path d="M60 184 L100 214 L140 184" fill="none" stroke="'+ac+'" stroke-width="3" stroke-opacity=".85"/>'+
  '<path d="M14 260 Q16 200 60 184" fill="none" stroke="'+ac+'" stroke-width="2" stroke-opacity=".35"/>'+
  '<path d="M186 260 Q184 200 140 184" fill="none" stroke="'+ac+'" stroke-width="2" stroke-opacity=".35"/>'+
  '<path d="M86 148 L114 148 L114 190 L86 190 Z" fill="'+(cfg.form?cl:s)+'"/>'+
  '<path d="M86 148 L114 148 L114 166 L86 166 Z" fill="#000" opacity=".22"/>'+
  face+marks+crown+_propLayer(cfg)+
  '<circle cx="100" cy="232" r="16" fill="'+bg2+'" stroke="'+ac+'" stroke-width="2"/>'+
  '<text x="100" y="238" font-size="16" text-anchor="middle" fill="'+ac+'" font-family="serif">'+cfg.glyph+'</text>'+
  '</svg>';
}

function svgDataUri(svg){return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);}

function makePortrait(seed,role,overrides){
  var h=_pHash(seed), rnd=_pRng(h);
  role=role||"OMBRE";
  var cfg={
    uid:(h%100000).toString(36),
    skin:_pPick(rnd,P_SKINS), cloth:_pPick(rnd,P_CLOTHS),
    accent:_pPick(rnd,P_ACCENTS), hair:_pPick(rnd,P_HAIRS),
    eye:_pPick(rnd,["#e6c98a","#16c8bd","#9fd8ff","#ffd76b","#ff9f43","#c8f5b0"]),
    hairStyle:Math.floor(rnd()*8), mark:Math.floor(rnd()*5),
    beard:Math.floor(rnd()*5), eyewear:rnd()>0.82?1+Math.floor(rnd()*2):0,
    prop:null, crown:false, form:null, smile:rnd()>0.5,
    bg:P_ROLE_BG[role]||P_ROLE_BG.OMBRE, glyph:P_GLYPHS[role]||"\u25C6"
  };
  if(overrides)for(var k in overrides)cfg[k]=overrides[k];
  if(!cfg.bg)cfg.bg=P_ROLE_BG.OMBRE;
  return svgDataUri(buildPortraitSVG(cfg));
}

// ===========================================================
// ===  LE CASTING — un portrait par personnage du récit  ====
// ===  Chaque fiche reprend ce que la campagne dit de lui.
// ===========================================================

export { makePortrait, svgDataUri, buildPortraitSVG };
