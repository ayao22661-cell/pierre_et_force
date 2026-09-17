import io,os,re,sys
SRC="/home/claude/pierre_et_force-main/index.html"
OUT="/mnt/user-data/outputs/pierre_et_force/index.html"
B="/home/claude/build/"
h=open(SRC,encoding="utf-8").read()

def cut(start,end,label):
    global h
    a=h.index(start); b=h.index(end,a)
    h=h[:a]+"// [v3] ancien moteur retiré : %s\n"%label+h[b:]

# 1. ancien état de combat + effets d'arène DOM
cut("var combat={","// ===== UTILS =====","état et effets de l'arène DOM")
# 2. ancien déploiement (remplacé par le module hub v3)
cut("// ===== DÉPLOIEMENT =====","// ===== COMBAT =====","écran de déploiement v2")
# 3. ancienne boucle de combat, IA, contrôles, fin de mission
cut("// ===== COMBAT =====","// Une fois l'animation d'entrée jouée","boucle de combat, IA et écran de fin v2")
# 4. anciennes formules de niveau (remplacées par la méta-progression)
cut("function xpForLevel(lvl){return lvl*100;}","function showLevelUp(","progression v2")
cut("function checkLevelUp(){\n  while(save.xp>=xpForLevel(save.level)){","// ===== NARR COMBAT =====","montée de niveau v2")

# 5. modules
mods=["10_data.js","20_meta.js","30_core.js","40_sim.js","50_render.js","60_ui.js","70_hub.js"]
js="\n".join(open(B+m,encoding="utf-8").read() for m in mods)
anchor="// ===== INIT ====="
h=h.replace(anchor,"\n// =====================================================================\n"
            "// ===  MOTEUR « FAILLE » v3 — modules injectés                       ===\n"
            "// =====================================================================\n"+js+"\n\n"+anchor,1)

# 6. init v3
h=h.replace("syncLives();\ninitTitle();","migrateSave();refreshQuests();writeSave(save);\ninstallHubV3();\nsyncLives();\ninitTitle();",1)

# 7. style
css=open(B+"80_style.css",encoding="utf-8").read()
h=h.replace("</style>",css+"\n</style>",1)

os.makedirs(os.path.dirname(OUT),exist_ok=True)
open(OUT,"w",encoding="utf-8").write(h)
print("écrit",OUT,len(h),"octets")
