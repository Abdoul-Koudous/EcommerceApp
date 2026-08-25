// ⚠️ Mock — remplace par un fetch vers ton API (ex: /api/blog/getAll,
// /api/blog/getOne/:id). La structure est volontairement simple pour
// que le branchement soit rapide : `body` est un tableau de blocs que
// details.jsx sait afficher (paragraph, quote, image, list).

export const ARTICLES = [
  {
    id: "1",
    title: "Comment bien choisir la taille de vos vêtements en ligne",
    excerpt:
      "Fini les retours pour cause de mauvaise taille : notre guide pratique pour commander juste du premier coup.",
    category: "Guides d'achat",
    date: "2026-08-12",
    readTime: 6,
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1200&q=80",
    featured: true,
    author: { name: "Léa Fontaine", role: "Responsable contenu" },
    body: [
      {
        type: "paragraph",
        text: "Commander en ligne, c'est pratique — sauf quand le colis arrive et que la taille ne convient pas. Voici comment limiter ce risque au maximum, sans même sortir un mètre ruban.",
      },
      {
        type: "heading",
        text: "1. Commencez par une pièce que vous possédez déjà",
      },
      {
        type: "paragraph",
        text: "Prenez un vêtement de votre garde-robe qui vous va parfaitement, dans une matière et une coupe proches de celle que vous voulez commander. Mesurez-le à plat : largeur de poitrine, longueur du buste, longueur de manche. Comparez ensuite ces mesures à celles du guide des tailles de la fiche produit, pas seulement à l'étiquette S/M/L.",
      },
      {
        type: "quote",
        text: "Une même taille « M » peut varier de plusieurs centimètres d'une marque à l'autre : fiez-vous toujours aux mesures, jamais à la lettre.",
      },
      {
        type: "heading",
        text: "2. Lisez les avis avec la morphologie en tête",
      },
      {
        type: "paragraph",
        text: "Les avis clients précisent souvent la taille et la morphologie de la personne. Cherchez un profil proche du vôtre : c'est souvent plus fiable qu'un guide générique.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80",
        caption: "Le guide des tailles est disponible sur chaque fiche produit.",
      },
      {
        type: "heading",
        text: "3. En cas de doute entre deux tailles",
      },
      {
        type: "list",
        items: [
          "Pour une pièce ajustée (chemise, robe cintrée) : prenez la taille au-dessus.",
          "Pour une pièce ample ou oversize : gardez votre taille habituelle.",
          "Pour une matière extensible (jersey, maille) : la taille en dessous passe souvent très bien.",
        ],
      },
      {
        type: "paragraph",
        text: "Et si malgré tout ça ne va pas : vous avez 30 jours pour retourner l'article, sans justification. Consultez notre page retours pour la marche à suivre.",
      },
    ],
  },
  {
    id: "2",
    title: "5 tendances mode à surveiller cette saison",
    excerpt:
      "Coupes, matières, couleurs : ce qui va marquer les prochains mois, sélectionné par notre équipe stylisme.",
    category: "Tendances",
    date: "2026-08-05",
    readTime: 4,
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
    author: { name: "Ines Moreau", role: "Styliste" },
    body: [
      {
        type: "paragraph",
        text: "Notre équipe stylisme a passé les défilés et les rues au crible. Voici les cinq tendances qui reviennent le plus souvent, et comment les adopter sans tout renouveler.",
      },
      {
        type: "heading",
        text: "Des matières qui respirent",
      },
      {
        type: "paragraph",
        text: "Lin, coton texturé, mailles ajourées : la saison mise sur des matières naturelles et confortables, loin des synthétiques brillants des années précédentes.",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80",
        caption: "Le lin s'impose comme la matière phare de la saison.",
      },
      {
        type: "heading",
        text: "Des couleurs terreuses",
      },
      {
        type: "paragraph",
        text: "Terracotta, sauge, sable : la palette se réchauffe et s'inspire des paysages plus que des néons. Un accent bordeaux ou rouille suffit à moderniser une tenue neutre.",
      },
    ],
  },
  {
    id: "3",
    title: "Dans les coulisses de notre atelier partenaire",
    excerpt:
      "Rencontre avec les artisans qui fabriquent une partie de notre collection, pièce par pièce.",
    category: "Coulisses",
    date: "2026-07-28",
    readTime: 8,
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
    author: { name: "Marc Dossou", role: "Responsable production" },
    body: [
      {
        type: "paragraph",
        text: "À une heure de Cotonou, notre atelier partenaire fait vivre une trentaine d'artisans. Nous sommes allés à leur rencontre pour comprendre comment naissent certaines pièces de nos collections.",
      },
      {
        type: "quote",
        text: "Chaque pièce passe entre les mains de six personnes avant d'arriver en boutique : c'est ce temps-là qu'on ne voit pas sur l'étiquette.",
      },
      {
        type: "paragraph",
        text: "Coupe, assemblage, finitions, contrôle qualité : rien n'est automatisé. C'est un choix assumé, même si cela limite les volumes que nous pouvons produire chaque mois.",
      },
    ],
  },
  {
    id: "4",
    title: "Entretenir ses pièces pour les garder plus longtemps",
    excerpt:
      "Lavage, séchage, rangement : les bons gestes pour faire durer vos articles préférés.",
    category: "Conseils",
    date: "2026-07-19",
    readTime: 5,
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
    author: { name: "Léa Fontaine", role: "Responsable contenu" },
    body: [
      {
        type: "paragraph",
        text: "Un bon entretien peut doubler la durée de vie d'un vêtement. Voici les réflexes les plus utiles, matière par matière.",
      },
      {
        type: "list",
        items: [
          "Coton : lavage à 30°C, à l'envers, pour préserver les couleurs.",
          "Maille : lavage à la main ou cycle laine, séchage à plat.",
          "Cuir : jamais en machine, un chiffon légèrement humide suffit à l'entretenir.",
        ],
      },
      {
        type: "paragraph",
        text: "Le symbole d'entretien sur l'étiquette reste la référence la plus fiable : en cas de doute, il vaut toujours mieux laver plus doux.",
      },
    ],
  },
  {
    id: "5",
    title: "Notre engagement pour une mode plus responsable",
    excerpt:
      "Matières recyclées, partenaires locaux, emballages réduits : où en est-on vraiment ?",
    category: "Engagement",
    date: "2026-07-10",
    readTime: 7,
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
    author: { name: "Marc Dossou", role: "Responsable production" },
    body: [
      {
        type: "paragraph",
        text: "On nous pose souvent la question : où en est votre démarche responsable ? Plutôt que des promesses, voici un état des lieux honnête de ce qui est fait, et de ce qui reste à améliorer.",
      },
      {
        type: "heading",
        text: "Ce qui est déjà en place",
      },
      {
        type: "list",
        items: [
          "60% des emballages sont désormais recyclés ou recyclables.",
          "Une partie de la collection est produite avec des partenaires locaux.",
          "Les invendus sont reconditionnés plutôt que détruits.",
        ],
      },
      {
        type: "paragraph",
        text: "Ce n'est pas parfait, et on préfère le dire plutôt que de le cacher : notre objectif est d'y arriver progressivement, sans greenwashing.",
      },
    ],
  },
  {
    id: "6",
    title: "Le témoignage de Sarah, cliente depuis 3 ans",
    excerpt:
      "Elle nous raconte comment sa garde-robe a évolué avec nos collections capsule.",
    category: "Communauté",
    date: "2026-06-30",
    readTime: 3,
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80",
    author: { name: "Ines Moreau", role: "Styliste" },
    body: [
      {
        type: "paragraph",
        text: "Sarah commande chez nous depuis notre toute première collection capsule. Elle nous raconte ce qui a changé dans sa façon de s'habiller depuis.",
      },
      {
        type: "quote",
        text: "J'achète moins souvent, mais je porte tout beaucoup plus longtemps : c'est ça qui a vraiment changé.",
      },
      {
        type: "paragraph",
        text: "Un témoignage qui rejoint ce que beaucoup de clients nous disent : mieux choisir, plutôt qu'acheter plus.",
      },
    ],
  },
];

export function getArticleById(id) {
  return ARTICLES.find((a) => a.id === String(id)) || null;
}

export function getRelatedArticles(article, limit = 3) {
  if (!article) return [];
  return ARTICLES.filter(
    (a) => a.id !== article.id && a.category === article.category
  )
    .concat(ARTICLES.filter((a) => a.id !== article.id))
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, limit);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}