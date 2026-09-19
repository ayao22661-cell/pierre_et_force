// ============================================================
// BONUSES — calcule les statistiques finales d'un champion
// en additionnant les bonus des objets achetés et des talents
// débloqués dans l'onglet Éveil.
//
// Point d'entrée unique : computeBonuses(save)
// Renvoie un objet plat utilisé par makeChampionUnit dans sim.js.
// ============================================================
import { ITEMS, TALENT_TREES } from '../data/items.js';

/**
 * @param {object} save — sauvegarde chargée depuis localStorage
 * @returns {object} bonus — delta/multiplicateurs à appliquer sur les stats de base
 *
 * Champs renvoyés (tous additifs sauf les *P qui sont des %) :
 *   atk, hp, arm, mana, as, ms, ah, crit, ls, regen, pen, thorns
 *   atkP, hpP, manaP, asP, msP    (multiplicatifs, ex. 0.06 = +6%)
 *   burn          (% dmg/s pendant 3s sur les cibles touchées par capacité)
 *   exec          (% dégâts bonus aux cibles sous 40% PV)
 *   ultDmg        (% dégâts bonus sur l'ultime)
 *   ccRes         (réduction de durée des contrôles subis)
 *   shieldP       (bonus aux boucliers et soins)
 *   healP         (bonus aux soins prodigués)
 *   revive        (boolean — survie une fois à 1 PV)
 *   cdKill        (% réduction des CDs à l'élimination)
 *   goldP         (% bonus cauris — cosmétique ici)
 */
export function computeBonuses(save) {
  const b = {
    atk:0, hp:0, arm:0, mana:0, as:0, ms:0, ah:0, crit:0, ls:0, regen:0, pen:0, thorns:0,
    atkP:0, hpP:0, manaP:0, shieldP:0, healP:0, ccRes:0, msF:0, armF:0, regenF:0,
    burn:0, exec:0, ultDmg:0, revive:false, cdKill:0, goldP:0,
  };

  // ── Objets ────────────────────────────────────────────────────────────────
  const owned = save.items || [];
  for (const id of owned) {
    const item = ITEMS.find(it => it.id === id);
    if (!item) continue;
    const st = item.st;
    if (st.atk)   b.atk   += st.atk;
    if (st.hp)    b.hp    += st.hp;
    if (st.arm)   b.arm   += st.arm;
    if (st.mana)  b.mana  += st.mana;
    if (st.as)    b.as    += st.as;
    if (st.ms)    b.ms    += st.ms;
    if (st.ah)    b.ah    += st.ah;
    if (st.crit)  b.crit  += st.crit;
    if (st.ls)    b.ls    += st.ls;
    if (st.regen) b.regen += st.regen;
    if (st.pen)   b.pen   += st.pen;
    if (st.thorns)b.thorns+= st.thorns;
  }

  // ── Talents ───────────────────────────────────────────────────────────────
  const tal = save.talents || {};

  for (const tree of TALENT_TREES) {
    for (const node of tree.nodes) {
      const rank = tal[node.id] || 0;
      if (!rank) continue;
      const per = node.per;

      // Éveil
      if (per.hpP)     b.hpP     += per.hpP     * rank;
      if (per.manaP)   b.manaP   += per.manaP   * rank;
      if (per.respawn) {} // cosmétique (pas simulé ici)
      if (per.revive && rank > 0) b.revive = true;

      // Feu
      if (per.atkP)    b.atkP    += per.atkP    * rank;
      if (per.crit)    b.crit    += per.crit    * rank;
      if (per.burn)    b.burn    += per.burn    * rank;
      if (per.ultDmg)  b.ultDmg  += per.ultDmg  * rank;

      // Terre
      if (per.armF)    b.armF    += per.armF    * rank;
      if (per.ccRes)   b.ccRes   += per.ccRes   * rank;
      if (per.shieldP) b.shieldP += per.shieldP * rank;
      if (per.thornsF) b.thorns  += per.thornsF * rank;

      // Eau
      if (per.ah)      b.ah      += per.ah      * rank;
      if (per.regenF)  b.regenF  += per.regenF  * rank;
      if (per.healP)   b.healP   += per.healP   * rank;
      if (per.cdKill)  b.cdKill  += per.cdKill  * rank;

      // Air
      if (per.ls)      b.ls      += per.ls      * rank;
      if (per.msF)     b.msF     += per.msF     * rank;
      if (per.exec)    b.exec    += per.exec    * rank;
      if (per.goldP)   b.goldP   += per.goldP   * rank;
    }
  }

  return b;
}
