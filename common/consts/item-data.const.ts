/* eslint-disable @typescript-eslint/no-magic-numbers */
// Magic numbers are used to define the maximum number of items for each map size

import { ItemType } from '@common/interfaces/item-type.enum';
import { MapSize } from '@common/interfaces/map-data';

export const RIGHT_CLICK_ITEM_DESCRIPTION: Map<ItemType, string> = new Map([
    [ItemType.Item1, '<b>Shiny Charm</b><br>+1 ATT / +1 DEF<br>Rend le porteur shiny'],
    [ItemType.Item2, '<b>Evo Gem</b><br>+2 ATT / +2 DEF<br>Fait évoluer le pokemon'],
    [ItemType.Item3, "<b>Bush Boost</b><br>+3 ATT depuis un buisson<br>Bonus d'attaque quand le joueur est caché dans les buissons"],
    [ItemType.Item4, '<b>Healing Berry</b><br>+1 HP/tour si HP ≤ 50%<br>Soigne le joueur quand sa santé est faible.'],
    [ItemType.Item5, '<b>PokeBall</b><br>+30% chances de fuite<br>+1 fuite par combat'],
    [ItemType.Item6, '<b>Invisibility Mantle</b><br>Rend le porteur invisible aux yeux des autres'],
    [ItemType.Random, "<b>Item Aléatoire</b><br>Se transforme aléatoirement en l'un des six objets"],
    [ItemType.Spawn, "<b>Point de départ</b><br>Endroit où les joueurs réaparaissent lorsqu'ils sont éliminés"],
    [ItemType.Flag, '<b>Drapeau</b><br>Rapportez le à votre point de départ pour gagner la partie'],
]);

export const ITEM_DESCRIPTION: Map<ItemType, string> = new Map([
    [ItemType.Item1, "<b>Shiny Charm:</b> +1 ATT / +1 DEF<br>Ajoute un point d'attaque et de défense au joueur qui le ramasse."],
    [ItemType.Item2, "<b>Evo Gem:</b> +2 ATT / +2 DEF<br>Ajoute deux points d'attaque et de défense au joueur."],
    [ItemType.Item3, "<b>Bush Boost:</b> +3 ATT en buisson<br>Donne un bonus d'attaque supplémentaire quand le joueur est caché dans les buissons."],
    [ItemType.Item4, '<b>Healing Berry:</b> +1 HP/tour si PV ≤ 50%<br>Régénère 1 point de vie par tour quand la santé du joueur est faible.'],
    [
        ItemType.Item5,
        "<b>PokeBall:</b> +30% évasion, +1 nb esquive<br>Augmente les chances d'esquiver et permet d'esquiver une attaque supplémentaire.",
    ],
    [
        ItemType.Item6,
        '<b>Invisibility Mantle:</b> Joueur invisible temporairement<br>Rend le joueur invisible aux yeux des autres pendant un court moment.',
    ],
    [ItemType.Random, "<b>Item Aléatoire:</b> Effet surprise<br>Donne aléatoirement l'un des six objets lors de la collecte."],
    [ItemType.Spawn, '<b>Point de départ:</b> Zone de spawn<br>Endroit où les joueurs apparaissent en début de partie ou après avoir été éliminés.'],
    [ItemType.Flag, "<b>Drapeau:</b> Objectif Capture the Flag<br>L'objectif principal à capturer dans le mode de jeu CTF."],
]);

export const ITEM_NAME: Record<ItemType, string> = {
    [ItemType.Item1]: 'Shiny Charm',
    [ItemType.Item2]: 'Evo Gem',
    [ItemType.Item3]: 'Bush Boost',
    [ItemType.Item4]: 'Healing Berry',
    [ItemType.Item5]: 'PokeBall',
    [ItemType.Item6]: 'Invisibility Mantle',
    [ItemType.Random]: 'Item aléatoire',
    [ItemType.Spawn]: 'Point de départ',
    [ItemType.Flag]: 'Drapeau',
};

export const MAX_ITEM_COUNT: Record<MapSize, Record<ItemType, number>> = {
    [MapSize.Small]: {
        [ItemType.Item1]: 1,
        [ItemType.Item2]: 1,
        [ItemType.Item3]: 1,
        [ItemType.Item4]: 1,
        [ItemType.Item5]: 1,
        [ItemType.Item6]: 1,
        [ItemType.Random]: 2,
        [ItemType.Spawn]: 2,
        [ItemType.Flag]: 0,
    },
    [MapSize.Medium]: {
        [ItemType.Item1]: 1,
        [ItemType.Item2]: 1,
        [ItemType.Item3]: 1,
        [ItemType.Item4]: 1,
        [ItemType.Item5]: 1,
        [ItemType.Item6]: 1,
        [ItemType.Random]: 4,
        [ItemType.Spawn]: 4,
        [ItemType.Flag]: 0,
    },
    [MapSize.Large]: {
        [ItemType.Item1]: 1,
        [ItemType.Item2]: 1,
        [ItemType.Item3]: 1,
        [ItemType.Item4]: 1,
        [ItemType.Item5]: 1,
        [ItemType.Item6]: 1,
        [ItemType.Random]: 6,
        [ItemType.Spawn]: 6,
        [ItemType.Flag]: 0,
    },
};
