# CINÉLIEU Studio

Vitrine française de création de vidéos immobilières à partir de photos. HTML, CSS et JavaScript natifs, sans dépendance à installer.

## Lancer et vérifier

- Node.js 20 ou ultérieur.
- `npm run dev` : prévisualisation locale sur le port 4173.
- `npm test` : validation du contact et de ses erreurs, fournisseurs simulés.
- `npm run build` : site et fonction Cloudflare dans `dist/`.

## Cloudflare Pages depuis GitHub

Connecter le dépôt, branche de production `main`, preset **None**, commande `npm run build`, sortie `dist`. Le build inclut la fonction `_worker.js`. Pour un autre nom d’hôte, renseigner `CINELIEU_SITE_URL` au build pour aligner le canonique, la carte sociale et le sitemap.

## Contact

Par défaut, le formulaire prépare un brouillon à destination de Marc Brioche : la personne valide l’envoi dans sa messagerie. Le lien e-mail direct fonctionne sans JavaScript.

Pour activer l’envoi direct, renseigner dans Cloudflare les secrets `RESEND_API_KEY` et `TURNSTILE_SECRET_KEY`, ainsi que les variables `CONTACT_FROM` (expéditeur vérifié) et `TURNSTILE_SITE_KEY` (hôte autorisé). Aucun secret dans GitHub ni dans le navigateur. Le serveur vérifie l’origine, la taille et les champs de la demande, le piège antispam et le jeton Turnstile. La réussite s’affiche seulement si le fournisseur accepte l’envoi.

## Contenus

Le logo et les images optimisées sont dans `public/assets/`. Les quatre MP4 illustratifs sont des mouvements de caméra numériques sur des visuels créés pour le studio. Les remplacer sous les mêmes noms ou modifier le registre `films` dans `public/site.js` en ajustant les formats. Garder l’étiquette « Démonstration » tant que ces clips illustrent le procédé.

Le film d’accueil monte deux plans d’ArtHouse Studio, [séjour sous verrière](https://www.pexels.com/video/beautiful-living-area-interiors-5091093/) et [second angle](https://www.pexels.com/video/an-interior-design-of-a-modern-house-5098244/), sous [licence Pexels](https://www.pexels.com/license/). Le comparateur présente le séjour et un [appartement filmé par Fernanda Neitzel](https://www.pexels.com/video/modern-living-room-with-elegant-interior-design-36030658/). Les images fixes sont extraites des MP4 livrés ; les fichiers `*-apres.webp` montrent une image plus tard dans le même plan. Ces plans illustrent le mouvement et ne sont pas des réalisations client ni des animations générées à partir d’une photo.

Les coordonnées juridiques, les durées de conservation et les modalités commerciales restent à valider avec l’exploitant avant d’utiliser le site pour la prospection.
