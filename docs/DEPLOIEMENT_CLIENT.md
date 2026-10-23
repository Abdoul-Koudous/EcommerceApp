# Déployer la boutique pour un nouveau client

Ce guide décrit le déploiement d'une **instance indépendante** pour un client :
un service web, une base de données, un projet Firebase, des comptes de
paiement et des secrets qui lui sont propres. Ne réutilisez pas la base de
données ni les secrets d'un autre magasin.

## Architecture et adresses

Le Blueprint [render.yaml](../render.yaml) construit le client et l'administration
puis les sert avec l'API Express depuis un seul service Render :

| Adresse | Contenu |
| --- | --- |
| `https://<domaine>/` | Boutique client |
| `https://<domaine>/admin/` | Administration |
| `https://<domaine>/api/` | API backend |
| `https://<domaine>/health/ready` | Santé du serveur et connexion MongoDB |
| `https://<domaine>/api/payment/webhook/fedapay` | Notifications FedaPay |
| `https://<domaine>/api/payment/webhook/kkiapay` | Notifications KkiaPay |
| `https://<domaine>/__/auth/` | Proxy des assistants Firebase Auth |

Une origine unique simplifie HTTPS, les cookies et les appels API. Pour une
instance sur un domaine personnalisé, faites pointer le domaine vers Render
depuis **Settings → Custom Domains**, suivez les valeurs DNS affichées par
Render, puis attendez que le certificat HTTPS soit actif. Gardez aussi le
domaine `onrender.com` attribué au service pour le diagnostic et, si nécessaire,
ajoutez les deux domaines aux paramètres qui suivent.

## Avant de commencer

Récupérez auprès du client, par des moyens sécurisés :

- son nom de domaine et les personnes qui contrôleront Render et les services ;
- ses identifiants de base de données, d'envoi d'e-mails et de stockage média ;
- ses comptes marchands KkiaPay et/ou FedaPay et les clés **Sandbox** ;
- la décision de créer un projet Firebase dédié et d'activer Google ;
- les coordonnées et éléments de marque à saisir dans l'administration.

N'envoyez jamais les mots de passe, clés privées, codes de vérification ou
fichiers `.env` dans Git, un ticket ou une conversation. Utilisez les champs
secrets du fournisseur concerné. La clé Firebase Web et les clés publiques des
prestataires sont livrées au navigateur : elles ne sont pas des secrets, mais
doivent tout de même être limitées dans leurs consoles.

## 1. Préparer les ressources du client

### MongoDB Atlas

1. Créez un projet/cluster et un utilisateur de base de données dédiés à cette
   boutique.
2. Ajoutez les adresses IP sortantes du service Render dans **Network Access**.
   Les plages sont visibles depuis Render sous **Connect → Outbound**.
   N'autorisez pas toutes les IP (`0.0.0.0/0`) sans décision explicite et
   analyse du risque.
3. Copiez l'URI de connexion dans le secret Render `MONGODB_URI`. Le serveur
   utilise la base `ecommerceApp` dans ce cluster.
4. Vérifiez que le compte dispose des droits nécessaires et que
   `/health/ready` répond `200` après le déploiement.

### Firebase et connexion Google

Créez ou sélectionnez un projet Firebase **réservé à cette boutique**, puis
créez une application Web Firebase et activez **Authentication → Sign-in
method → Google**. Relevez le `projectId`, `authDomain`, `apiKey`,
`storageBucket`, `messagingSenderId` et `appId` dans la configuration Web.
Activez les domaines autorisés dans **Authentication → Settings → Authorized
domains** : le domaine `onrender.com` du service et le domaine personnalisé
utilisé par les clients.

Le flux Google passe par un proxy sur le domaine public pour éviter les
problèmes de stockage tiers du navigateur :

- `FIREBASE_AUTH_PROXY_HOST` côté serveur = hôte Firebase du projet, par
  exemple `<project-id>.firebaseapp.com` ;
- `VITE_FIREBASE_AUTH_DOMAIN` au build = hôte public de la boutique
  (Render ou son domaine personnalisé), sans `https://` ni chemin ;
- le serveur relaie alors `/__/auth/*` vers
  `https://<project-id>.firebaseapp.com/__/auth/*`.

Pour autoriser la redirection Google, ouvrez
[Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients)
dans le projet Google associé au projet Firebase. Sur le client OAuth Web
utilisé par Firebase, ajoutez dans **Authorized redirect URIs** cette URI
exacte, en conservant les URI déjà présentes :

```text
https://<domaine-public>/__/auth/handler
```

Exemple pour un domaine personnalisé : `https://boutique.exemple.com/__/auth/handler`.
N'ajoutez pas le chemin `/__/auth/handler` dans **Authorized JavaScript
origins** : cette URL complète est une URI de redirection. Le domaine lui-même
doit aussi être autorisé dans Firebase Authentication. Il n'est pas nécessaire
d'activer Google Maps ou de configurer une facturation Maps pour la connexion
Google.

### E-mails, images et paiements

- **SMTP** : configurez un compte d'envoi dédié. Pour Gmail, utilisez un mot de
  passe d'application, jamais le mot de passe normal. Les codes d'inscription,
  réinitialisations, reçus et messages utilisent le même SMTP.
- **Cloudinary** : créez un espace dédié au client si l'administration doit
  téléverser des logos, produits ou médias. Les trois identifiants sont
  nécessaires au serveur.
- **KkiaPay/FedaPay** : créez les clés Sandbox du compte marchand du client.
  Ne passez en Live qu'après la recette Sandbox décrite dans
  [Notifications de paiement](../README.md#notifications-de-paiement).
- **Groq** : facultatif ; ne renseignez `GROQ_API_KEY` que si les fonctions de
  génération de contenu sont utilisées.

## 2. Créer le service Render

1. Dans Render, créez un **Blueprint** à partir du dépôt et de la branche
   contenant le code validé ; sélectionnez `render.yaml`.
2. Le Blueprint actuel contient des valeurs de démonstration pour le nom de
   service, le domaine d'authentification Firebase et l'hôte proxy. Pour chaque
   nouveau client, remplacez ces valeurs par celles de son instance dans
   `render.yaml` **ou** définissez-les dans l'environnement du service Render.
   Ne déployez pas une nouvelle boutique en réutilisant l'URL ou le projet
   Firebase d'un autre client.
3. Renseignez les variables d'environnement ci-dessous. Les variables `VITE_*`
   sont incorporées au JavaScript pendant le build : après leur modification,
   lancez un nouveau déploiement/rebuild, pas seulement un redémarrage.
4. Vérifiez que `VITE_API_URL` reste vide sur l'architecture à origine unique,
   et que `VITE_BASE` vaut `/admin/`.
5. Conservez les trois secrets JWT différents et uniques générés par Render.
   Ne les remplacez pas par des clés de paiement ou Firebase.
6. Si un domaine personnalisé est utilisé, définissez `CLIENT_URL` sur son URL
   HTTPS exacte et ajoutez son origine à `ALLOWED_ORIGINS`. Cette dernière
   accepte une liste séparée par des virgules ; Render ajoute automatiquement
   l'origine `RENDER_EXTERNAL_URL`.

### Variables Render

| Variable | Où la configurer | Utilité |
| --- | --- | --- |
| `NODE_ENV=production` | Render | Mode de journalisation/erreurs de production. |
| `MONGODB_URI` | Secret Render | URI du cluster dédié. Obligatoire. |
| `SECRET_KEY_ACCESS_TOKEN`, `SECRET_KEY_REFRESH_TOKEN`, `JSON_WEB_TOKEN_SECRET_KEY` | Secrets générés par Render | Signatures d'accès, de renouvellement et de session ; toutes distinctes. |
| `CLIENT_URL` | Render, si domaine personnalisé | URL HTTPS utilisée dans les liens envoyés par le serveur ; sinon Render fournit `RENDER_EXTERNAL_URL`. |
| `ALLOWED_ORIGINS` | Render, si origine personnalisée/séparée | Liste des origines web autorisées par CORS, sans chemin. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | Render (mot de passe secret) | Serveur SMTP pour les e-mails transactionnels. |
| `cloudinary_Config_Cloud_Name`, `cloudinary_Config_api_key`, `cloudinary_Config_api_secret` | Render (secret API) | Téléversements d'images depuis l'administration. |
| `FIREBASE_AUTH_PROXY_HOST` | Render (valeur `sync: false` dans le Blueprint) | Hôte Firebase `*.firebaseapp.com` vers lequel relayer `/__/auth/`. |
| `KKIAPAY_SANDBOX=true`, `KKIAPAY_PUBLIC_KEY`, `KKIAPAY_PRIVATE_KEY`, `KKIAPAY_SECRET_KEY`, `KKIAPAY_WEBHOOK_SECRET` | Render | Compte KkiaPay Sandbox ; clés privées et secrets restent côté serveur. |
| `FEDAPAY_ENVIRONMENT=sandbox`, `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_SECRET` | Render | Compte FedaPay Sandbox et signature du webhook. |
| `VITE_API_URL` vide, `VITE_BASE=/admin/` | Render/build | API même origine et chemin de l'administration. |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` | Render/build (`VITE_FIREBASE_AUTH_DOMAIN` est `sync: false`) | Configuration de l'application Firebase Web du client. |
| `VITE_KKIAPAY_PUBLIC_KEY`, `VITE_KKIAPAY_SANDBOX=true` | Render/build | Clé publique et mode Sandbox du widget KkiaPay. |
| `VITE_FEDAPAY_PUBLIC_KEY` | Render/build, si requis par le compte | Clé publique utilisée par l'intégration FedaPay. |
| `GROQ_API_KEY` | Secret Render, facultatif | Fonctions de génération de contenu. |

Le Blueprint définit déjà des variables Sandbox et demande les secrets manquants.
Vérifiez chaque valeur dans le service créé : une valeur `sync: false` doit être
fournie pour cette nouvelle instance. Les clés `VITE_*` ne sont pas des secrets
côté navigateur ; **ne mettez jamais** de clé privée, secret webhook, mot de
passe SMTP ou URI MongoDB dans une variable `VITE_*`.

## 3. Configurer les webhooks de paiement

Dans chaque tableau de bord prestataire, choisissez le **même environnement**
(Sandbox) que les clés posées dans Render et créez un webhook vers :

```text
https://<domaine-public>/api/payment/webhook/fedapay
https://<domaine-public>/api/payment/webhook/kkiapay
```

### KkiaPay Sandbox

Dans le tableau de bord Sandbox, ouvre **API Keys → Webhook → Add a webhook**.
Saisis l'URL KkiaPay ci-dessus, choisis au minimum l'événement
`transaction.success` (et `transaction.failed` si tu veux aussi observer les
échecs), puis définis un hash secret. Reporte exactement ce hash dans
`KKIAPAY_WEBHOOK_SECRET` dans l'environnement serveur Render. KkiaPay envoie ce
secret dans l'en-tête `x-kkiapay-secret`, que l'application compare à cette
valeur. Le test de livraison du tableau de bord doit recevoir une réponse HTTP
2xx. Ce test vérifie la livraison, mais seul un paiement Sandbox complet
permettra de vérifier la création de commande et la décrémentation du stock.

Documentation : [Webhooks KkiaPay](https://docs.kkiapay.me/v1/en-1.0.0/tableau-de-bord/webhook.md).

### FedaPay Sandbox

Dans le compte Sandbox, ouvre **Webhooks**, crée un webhook avec l'URL FedaPay
ci-dessus et sélectionne au minimum `transaction.approved` ; c'est l'événement
qui confirme la commande dans l'application. Lors de la création, récupère le
secret de signature de ce webhook (format `wh_...`) et renseigne-le dans
`FEDAPAY_WEBHOOK_SECRET` dans l'environnement serveur Render. **Ce n'est pas la
clé API secrète FedaPay.** L'application vérifie ce secret à partir de
l'en-tête `x-fedapay-signature`.

Documentation : [Webhooks FedaPay](https://docs.fedapay.com/fr/integration-api/webhooks.md)
et [Webhooks dans le tableau de bord FedaPay](https://docs.fedapay.com/fr/dashboard/api.md).

Après modification de ces variables Render, redéploie/redémarre le service.
Une notification webhook est un appel serveur-à-serveur : elle ne doit pas
pointer vers le navigateur ou `localhost`. Le client et le serveur doivent
utiliser les clés du même compte et le même mode Sandbox/Live. Ne publie pas
les secrets ni une capture où ils seraient visibles.

## 4. Recette avant remise au client

Effectuez les tests dans cet ordre et consignez le résultat pour l'instance :

1. **Hébergement** : `/health/ready` renvoie `200`; le certificat HTTPS est
   valide ; `/`, `/admin/` et une route `/api/` répondent.
2. **Configuration et données** : le catalogue charge ; les paramètres de
   boutique, logo clair/sombre, catégories et images restent après
   redéploiement.
3. **Comptes** : inscription e-mail avec OTP, réception des e-mails, connexion,
   mot de passe oublié, inscription et connexion Google ; vérifiez que le
   nouvel utilisateur apparaît dans l'admin.
4. **Panier et commande** : ajoutez un article en invité, connectez-vous et
   vérifiez que le panier est conservé ; testez une commande en paiement à la
   livraison.
5. **Paiements Sandbox** : effectuez un paiement test KkiaPay puis FedaPay
   séparément. Vérifiez la livraison des webhooks, la commande dans l'admin,
   la mise à jour du stock et l'envoi d'un seul reçu. Une notification répétée
   ne doit pas créer une seconde commande.
6. **Admin et médias** : vérifiez les permissions et les écrans utilisés par
   le client ; téléversez une image avec Cloudinary.
7. **Exploitation** : configurez sauvegardes MongoDB, rétention, accès
   d'administration, alertes et procédure de restauration avant les données
   réelles.

Ne partagez pas les identifiants administrateur initiaux dans un dépôt ou un
message non sécurisé. Faites définir un mot de passe propre au client et
vérifiez que les rôles d'administration sont limités aux personnes autorisées.

## 5. Passage en Live et remise

Après validation écrite des tests Sandbox, activez le compte marchand Live et
créez les webhooks **Live**, distincts des webhooks Sandbox. Remplacez les
secrets serveur par les clés et secrets Live, puis mettez :

- `FEDAPAY_ENVIRONMENT=live` ;
- `KKIAPAY_SANDBOX=false` côté serveur ;
- `VITE_KKIAPAY_SANDBOX=false` et les clés publiques Live au build.

Reconstruisez et redéployez après le changement des variables `VITE_*`. Vérifiez
une dernière fois les URLs de webhook Live et effectuez, avec l'accord du
client, une transaction réelle contrôlée. Ne réutilisez jamais les secrets ou
endpoints Sandbox en Live.

Remettez au client les URL publiques, les propriétaires de chaque compte,
l'emplacement sécurisé des secrets, les résultats de recette, la fréquence des
sauvegardes et la procédure de support. Les quotas/forfaits gratuits Render ne
constituent pas une garantie de disponibilité ou de sauvegarde pour un commerce
en exploitation.

## Fiche de déploiement à compléter pour chaque client

Ne stockez pas les secrets dans cette fiche. Conservez-la dans l'espace privé
de suivi du client.

| Élément | Valeur / statut |
| --- | --- |
| Nom de la boutique et contact responsable | |
| Service Render / branche / URL `onrender.com` | |
| Domaine personnalisé et HTTPS validés | |
| Cluster MongoDB et sauvegarde testée | |
| Projet Firebase / domaine autorisé | |
| URI Google OAuth enregistrée | |
| Cloudinary configuré | |
| SMTP testé (OTP, reçu, contact) | |
| KkiaPay Sandbox + webhook testé | |
| FedaPay Sandbox + webhook testé | |
| Recette client/admin/panier terminée | |
| Clés Live et webhooks Live validés | |
| Date de remise et procédure de support | |



a faire 
On avait prévu d’utiliser l’adresse Render comme domaine HTTPS de démonstration : https://ecommerce-demo-dsvj.onrender.com. Render fournit le HTTPS automatiquement. Tu n’as donc pas besoin d’acheter un nom de domaine pour tester le site.

Les étapes prévues autour de cette adresse sont :

Firebase : ajouter ecommerce-demo-dsvj.onrender.com aux domaines autorisés, puis tester la connexion Google.
Paiements sandbox : configurer les URL de webhook des fournisseurs avec l’adresse HTTPS Render, puis tester une commande sans paiement réel.
E-mails : vérifier l’envoi et que les liens contenus dans les messages renvoient vers la boutique Render.
Parcours complet : vérifier boutique, admin, données, création d’une commande et son suivi dans l’admin.
Exploitation : faire une sauvegarde MongoDB et tester sa restauration; consulter les journaux Render en cas d’erreur.
On a déjà préparé le déploiement et les routes pour servir boutique, admin et API sous cette même adresse. Pour l’instant, la prochaine action liée au domaine est bien l’ajout dans Firebase, puis le test de Google Login.