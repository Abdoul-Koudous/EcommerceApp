# Déployer la boutique pour un nouveau client

Ce guide décrit le déploiement d'une **instance indépendante** pour un client :
un service web, une base de données, un projet Firebase, des comptes de
paiement, un compte d'envoi d'e-mails et des secrets qui lui sont propres. Ne
réutilisez pas la base de données ni les secrets d'un autre magasin.

## Checklist rapide

Suivez cet ordre pour limiter le débogage. Chaque point renvoie à une section
détaillée plus bas.

1. **Ressources du client** : cluster MongoDB, projet Firebase, projet Google
   Cloud pour les e-mails, Cloudinary, comptes KkiaPay/FedaPay Sandbox
   ([section 1](#1-préparer-les-ressources-du-client)).
2. **E-mails** : sur Render gratuit, le SMTP est bloqué. Utilisez l'**API Gmail**
   (gratuit) ou un plan Render payant ([section 1, E-mails](#e-mails)).
3. **Service Render** : Blueprint, bonne branche, toutes les variables, puis
   déploiement ([section 2](#2-créer-le-service-render)).
4. **Webhooks de paiement** : même environnement (Sandbox) que les clés, secret
   identique des deux côtés ([section 3](#3-configurer-les-webhooks-de-paiement)).
5. **Recette complète** avant la remise ([section 4](#4-recette-avant-remise-au-client)).
6. **Exploitation** : sauvegardes, logs, veille Render
   ([section 6](#6-exploitation)).
7. **Passage en Live** seulement après validation écrite de la recette
   ([section 5](#5-passage-en-live-et-remise)).

En cas de problème, commencez par le tableau de
[dépannage](#7-dépannage) : il relie les symptômes déjà rencontrés à leur
cause et à la ligne de log à chercher.

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
- ses identifiants de base de données et de stockage média ;
- le **compte e-mail expéditeur** (adresse Gmail ou, idéalement, adresse de son
  propre domaine) et la personne qui pourra l'autoriser dans Google ;
- ses comptes marchands KkiaPay et/ou FedaPay et les clés **Sandbox** ;
- la décision de créer un projet Firebase dédié et d'activer Google ;
- les coordonnées et éléments de marque à saisir dans l'administration.

N'envoyez jamais les mots de passe, clés privées, codes de vérification ou
fichiers `.env` dans Git, un ticket ou une conversation. Utilisez les champs
secrets du fournisseur concerné. La clé Firebase Web et les clés publiques des
prestataires sont livrées au navigateur : elles ne sont pas des secrets, mais
doivent tout de même être limitées dans leurs consoles.

Lors des commits, ajoutez les fichiers **un par un** (`git add chemin/du/fichier`)
plutôt que `git add .`, afin de ne pas embarquer de fichier parasite, de
sauvegarde ou de configuration locale.

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

Limites du cluster **gratuit** (Free / M0) à connaître :

- les sauvegardes automatiques d'Atlas ne sont pas disponibles : il faut
  utiliser `mongodump` et `mongorestore` (voir [Exploitation](#6-exploitation)) ;
- `mongodump` et `mongorestore` ne s'exécutent pas sur la base `admin` ;
- le volume de données transféré est limité sur une période glissante de sept
  jours ;
- un cluster gratuit inactif peut être mis en pause par Atlas : le site ne
  pourra plus se connecter à la base tant que le cluster n'est pas relancé
  depuis Atlas.

Pour un client qui vend réellement, prévoyez un cluster payant avec
sauvegardes cloud. Vérifiez les offres et limites actuelles dans la
documentation Atlas.

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

### E-mails

La boutique envoie des e-mails transactionnels : codes d'inscription (OTP),
réinitialisation de mot de passe, reçus de commande et réponses aux messages de
contact. Tous passent par le même module (`server/config/emailService.js`).

#### Pourquoi le SMTP ne marche pas sur Render gratuit

Les services web **gratuits** de Render bloquent le trafic sortant vers les
ports SMTP (25, 465 et 587). Le symptôme dans les logs est
`Connection timeout` avec `code: 'ETIMEDOUT'` et `command: 'CONN'`. Ni le code ni
le compte Gmail ne sont en cause. Si ces e-mails fonctionnaient en local, c'est
parce que votre ordinateur n'a pas ce blocage. Vérifiez la politique actuelle
dans le changelog de Render, car elle peut évoluer.

#### Choisir une solution

| Option | Quand l'utiliser | Compromis |
| --- | --- | --- |
| **A. API Gmail (HTTPS)** | Démo ou petite boutique sur Render gratuit | Gratuit, passe sur le port 443. Mise en place unique dans Google Cloud. Quota d'envoi quotidien du compte Gmail (à vérifier chez Google). |
| **B. SMTP sur un plan Render payant** | Boutique en production, aucun changement de code | Les plans payants autorisent les ports 465 et 587 (pas le 25). Coût mensuel de Render. |
| **C. Domaine du client + service dédié ou Workspace** | Vraie boutique avec image de marque | Meilleure délivrabilité (SPF, DKIM, DMARC). Demande un nom de domaine payant. |

Le module d'envoi choisit automatiquement : si les trois variables `GMAIL_*`
sont définies, il envoie par l'**API Gmail** ; sinon il utilise le **SMTP**
configuré par `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER` et `EMAIL_PASS`. Les
variables SMTP peuvent donc rester comme solution de repli (en local ou sur un
plan payant).

#### Option A : configurer l'API Gmail

À faire une seule fois par client, avec le **compte Gmail expéditeur**. Les noms
de menus de la console Google peuvent légèrement varier : cherchez leurs
équivalents.

1. **Créer un projet Google Cloud dédié aux e-mails** (par exemple
   `<boutique>-mailer`), distinct du projet Firebase. L'écran de consentement
   OAuth est partagé par tout le projet : le séparer évite de perturber la
   connexion Google des clients. Vérifiez que le sélecteur de projet affiche le
   bon projet avant chaque étape.
2. **Activer l'API Gmail** : recherchez `Gmail API` et cliquez sur **Activer**.
3. **Ouvrir Google Auth Platform** et lancer l'assistant :
   - informations de l'application : un nom et une adresse e-mail d'assistance
     (le champ ne propose que le compte connecté à la console, c'est normal et
     sans lien avec l'expéditeur) ;
   - audience : **Externe** ;
   - coordonnées : une adresse de contact.
4. **Branding** : renseignez la page d'accueil, la politique de confidentialité
   et les conditions d'utilisation avec l'URL de la boutique. Dans **Domaines
   autorisés**, saisissez l'**hôte complet** du site (par exemple
   `<service>.onrender.com`). Saisir seulement `onrender.com` est refusé, car
   c'est un domaine public partagé. Ajoutez l'e-mail du développeur, puis
   **Enregistrez**.
5. **Accès aux données** : ajoutez le niveau d'accès
   `https://www.googleapis.com/auth/gmail.send` (« Envoyer des e-mails en votre
   nom »). Ne choisissez pas `gmail.send.self`, qui ne permet d'écrire qu'à
   soi-même. Cliquez sur **Mettre à jour**, puis **Enregistrer**.
6. **Audience** : ajoutez le compte expéditeur comme **utilisateur test**, puis
   cliquez sur **Publier l'application** pour passer l'état à **En
   production**. Faites-le **avant** de générer le jeton : en mode Test, le jeton
   de rafraîchissement expire au bout de 7 jours et les e-mails s'arrêtent sans
   erreur visible. Pour un usage avec un seul compte, la validation par Google
   n'est pas nécessaire (limite de 100 utilisateurs tant que l'application n'est
   pas validée). Le bandeau « Votre application doit être validée » peut être
   ignoré dans ce cas.
7. **Clients → Créer un client** : type **Application Web**, nom au choix, et
   **URI de redirection autorisés** :

   ```text
   https://developers.google.com/oauthplayground
   ```

   Copiez l'**ID client** et le **code secret du client** dans un gestionnaire
   de secrets (pas dans Git, un ticket ou une conversation).
8. **Générer le jeton de rafraîchissement** avec l'OAuth 2.0 Playground
   (`https://developers.google.com/oauthplayground`) :
   - cliquez sur l'engrenage, cochez **Use your own OAuth credentials** et
     collez l'ID client et le secret ; laissez **Access type** sur **Offline** ;
   - dans **Input your own scopes**, saisissez
     `https://www.googleapis.com/auth/gmail.send` et cliquez sur **Authorize
     APIs** ;
   - choisissez **le compte expéditeur** (pas un autre compte de la liste). Si
     le compte n'apparaît pas, utilisez **Utiliser un autre compte** ;
   - l'écran « Google n'a pas validé cette application » est normal : cliquez
     sur **Paramètres avancés** puis **Accéder à `<nom de l'application>`
     (non sécurisé)** et autorisez l'envoi ;
   - à l'étape 2, cliquez sur **Exchange authorization code for tokens** et
     copiez le **`refresh_token`** (pas l'`access_token`, qui expire en une
     heure).
9. **Renseigner les variables dans Render** (voir le tableau de la section 2) :
   `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, et
   `EMAIL_USER` = **exactement le compte** qui a donné l'autorisation. L'API
   Gmail envoie toujours depuis ce compte ; l'adresse de la boutique configurée
   dans l'administration sert d'adresse de réponse (`Reply-To`).
10. **Déployer, puis vérifier** les logs au démarrage :
    - `📨 Envoi des e-mails via l'API Gmail (HTTPS)` : le mode API est actif ;
    - après une commande : `📧 Email envoyé à … via API Gmail (ID: …)`.

Le jeton de rafraîchissement peut cesser de fonctionner (révocation dans les
paramètres du compte Google, changement du mot de passe du compte, application
repassée en mode Test, inactivité très longue). Dans ce cas, les logs affichent
`invalid_grant` : générez un nouveau jeton (étape 8) et mettez à jour
`GMAIL_REFRESH_TOKEN`. En cas de fuite d'un secret, supprimez le client OAuth
ou révoquez l'accès depuis le compte Google, puis recréez-les.

#### Option B : SMTP

Sur un plan Render payant, renseignez `EMAIL_HOST`, `EMAIL_PORT` (465 ou 587),
`EMAIL_USER` et `EMAIL_PASS` et laissez les variables `GMAIL_*` **vides ou
absentes**. Pour Gmail, utilisez un mot de passe d'application, jamais le mot
de passe normal du compte.

#### Délivrabilité : éviter le dossier Spam

Avec le domaine gratuit `onrender.com`, les reçus peuvent arriver dans les
**spams** du destinataire, alors que l'envoi a réussi (le message est visible
dans les « Messages envoyés » du compte expéditeur). C'est un problème de
réputation de l'expéditeur et du lien, pas de configuration.

- Pour une démo : indiquez aux testeurs de vérifier leurs spams et de signaler
  le message comme « non spam ».
- Pour un client réel : utilisez **le domaine du client** pour la boutique et
  pour l'expéditeur, avec les enregistrements **SPF, DKIM et DMARC** configurés
  chez son hébergeur DNS. Le lien du reçu pointera alors vers son domaine et non
  vers `onrender.com`.

#### Contenu des e-mails

- Les e-mails à code (inscription et changement d'e-mail d'une part, mot de
  passe oublié d'autre part) utilisent le même modèle avec un texte adapté au
  motif (`type` `"verify"` ou `"reset"`). Le choix se fait d'après le sujet de
  l'e-mail : si vous modifiez ce sujet, vérifiez la fonction
  `sendStoreVerificationEmail`.
- Le reçu de commande contient un bouton vers `/account/orders/<orderId>` sur le
  domaine du client (`CLIENT_URL` ou `RENDER_EXTERNAL_URL`). Cliquez-le lors de
  la recette.
- L'envoi du reçu se fait en arrière-plan : si l'e-mail échoue, la commande et
  le paiement restent valides, et seule une erreur apparaît dans les logs.

### Images et paiements

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
2. Vérifiez dans **Settings → Branch** quelle branche est suivie. Render
   redéploie automatiquement à chaque push de **cette** branche : un push sur
   une autre branche ne déclenche rien. Tenez les correctifs sur la branche
   déployée, et gardez toute branche de secours séparée.
3. Le Blueprint actuel contient des valeurs de démonstration pour le nom de
   service, le domaine d'authentification Firebase et l'hôte proxy. Pour chaque
   nouveau client, remplacez ces valeurs par celles de son instance dans
   `render.yaml` **ou** définissez-les dans l'environnement du service Render.
   Ne déployez pas une nouvelle boutique en réutilisant l'URL ou le projet
   Firebase d'un autre client.
4. Renseignez les variables d'environnement ci-dessous. Les variables `VITE_*`
   sont incorporées au JavaScript pendant le build : après leur modification,
   lancez un nouveau déploiement/rebuild, pas seulement un redémarrage.
5. Vérifiez que `VITE_API_URL` reste vide sur l'architecture à origine unique,
   et que `VITE_BASE` vaut `/admin/`.
6. Conservez les trois secrets JWT différents et uniques générés par Render.
   Ne les remplacez pas par des clés de paiement ou Firebase.
7. Si un domaine personnalisé est utilisé, définissez `CLIENT_URL` sur son URL
   HTTPS exacte et ajoutez son origine à `ALLOWED_ORIGINS`. Cette dernière
   accepte une liste séparée par des virgules ; Render ajoute automatiquement
   l'origine `RENDER_EXTERNAL_URL`.
8. Utilisez une version de Node.js 18 ou plus récente : le module d'envoi par
   l'API Gmail s'appuie sur `fetch`, disponible nativement depuis cette version.

### Variables Render

| Variable | Où la configurer | Utilité |
| --- | --- | --- |
| `NODE_ENV=production` | Render | Mode de journalisation/erreurs de production. |
| `MONGODB_URI` | Secret Render | URI du cluster dédié. Obligatoire. |
| `SECRET_KEY_ACCESS_TOKEN`, `SECRET_KEY_REFRESH_TOKEN`, `JSON_WEB_TOKEN_SECRET_KEY` | Secrets générés par Render | Signatures d'accès, de renouvellement et de session ; toutes distinctes. |
| `CLIENT_URL` | Render, si domaine personnalisé | URL HTTPS utilisée dans les liens envoyés par le serveur ; sinon Render fournit `RENDER_EXTERNAL_URL`. |
| `ALLOWED_ORIGINS` | Render, si origine personnalisée/séparée | Liste des origines web autorisées par CORS, sans chemin. |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Secrets Render (`sync: false`) | Envoi d'e-mails par l'API Gmail (option A). Les trois sont requis ensemble. |
| `EMAIL_USER` | Render | Compte expéditeur. En mode API Gmail, doit être **le compte qui a autorisé** l'application. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_PASS` | Render (mot de passe secret) | SMTP (option B) ou repli si les variables `GMAIL_*` sont absentes. |
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
passe SMTP, secret Gmail ou URI MongoDB dans une variable `VITE_*`.

Ordre conseillé quand vous ajoutez de nouvelles variables : saisissez d'abord
les **valeurs** dans l'onglet **Environment** de Render, puis poussez le code ou
le `render.yaml` qui les déclare. Ainsi, le premier déploiement dispose déjà de
toutes les valeurs.

## 3. Configurer les webhooks de paiement

Dans chaque tableau de bord prestataire, choisissez le **même environnement**
(Sandbox) que les clés posées dans Render et créez un webhook vers :

```text
https://<domaine-public>/api/payment/webhook/fedapay
https://<domaine-public>/api/payment/webhook/kkiapay
```

### Comment fonctionne la confirmation d'un paiement

Après un paiement, **deux chemins** confirment la commande, et l'application
gère leur arrivée simultanée sans créer de doublon :

1. le **navigateur** appelle `/api/payment/verify-kkiapay` (ou `/verify` pour
   FedaPay) quand le widget signale le succès ;
2. le **prestataire** appelle le **webhook** de son côté.

Dans les deux cas, le serveur interroge le prestataire pour confirmer l'état
de la transaction. Pour KkiaPay, il réessaie jusqu'à 6 fois, avec 2 secondes
entre deux essais, tant que la transaction est `PENDING`. **En Sandbox, KkiaPay
renvoie souvent `PENDING` plusieurs fois avant `SUCCESS` : la vérification peut
prendre environ 7 à 8 secondes.** C'est normal. Le bouton de paiement affiche un
indicateur de chargement pendant ce temps, et il faut attendre la redirection
vers la page de confirmation sans recliquer.

### KkiaPay Sandbox

Dans le tableau de bord Sandbox, ouvrez **API Keys → Webhook → Add a webhook**.
Saisissez l'URL KkiaPay ci-dessus, choisissez au minimum l'événement
`transaction.success` (et `transaction.failed` si vous voulez aussi observer les
échecs), puis définissez un hash secret (par exemple une chaîne aléatoire de 64
caractères : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
Reportez **exactement** ce hash, sans espace avant ou après, dans
`KKIAPAY_WEBHOOK_SECRET` dans l'environnement serveur Render. KkiaPay envoie ce
secret dans l'en-tête `x-kkiapay-secret`, que l'application compare à cette
valeur. Le test de livraison du tableau de bord doit recevoir une réponse HTTP
2xx. Ce test vérifie la livraison, mais seul un paiement Sandbox complet
permettra de vérifier la création de commande et la décrémentation du stock.

Dans le widget Sandbox, le numéro de test de succès est `22961000000` (il est
prérempli par l'application quand `VITE_KKIAPAY_SANDBOX` n'est pas `false`).

Documentation : [Webhooks KkiaPay](https://docs.kkiapay.me/v1/en-1.0.0/tableau-de-bord/webhook.md).

### FedaPay Sandbox

Dans le compte Sandbox, ouvrez **Webhooks**, créez un webhook avec l'URL FedaPay
ci-dessus et sélectionnez au minimum `transaction.approved` ; c'est l'événement
qui confirme la commande dans l'application. Lors de la création, récupérez le
secret de signature de ce webhook (format `wh_...`) et renseignez-le dans
`FEDAPAY_WEBHOOK_SECRET` dans l'environnement serveur Render. **Ce n'est pas la
clé API secrète FedaPay.** L'application vérifie ce secret à partir de
l'en-tête `x-fedapay-signature`.

Documentation : [Webhooks FedaPay](https://docs.fedapay.com/fr/integration-api/webhooks.md)
et [Webhooks dans le tableau de bord FedaPay](https://docs.fedapay.com/fr/dashboard/api.md).

Après modification de ces variables Render, redéployez/redémarrez le service.
Une notification webhook est un appel serveur-à-serveur : elle ne doit pas
pointer vers le navigateur ou `localhost`. Le client et le serveur doivent
utiliser les clés du même compte et le même mode Sandbox/Live. Ne publiez pas
les secrets ni une capture où ils seraient visibles.

### Lire les logs d'un paiement

Dans **Render → Logs**, filtrez sur `[KkiaPay` pour suivre un paiement. Un
déroulé sain ressemble à ceci :

```text
[KkiaPay] verify started for transactionId: <id>
[KkiaPay] Attempt 1/6 took …ms with status: PENDING
[KkiaPay] Attempt 4/6 took …ms with status: SUCCESS
[KkiaPay] retrieveKkiapayTransaction succeeded after 4 attempts in …ms
[KkiaPay webhook] received for transactionId: <id>
[KkiaPay webhook] transaction fetched in …ms
```

Dans l'historique HTTP, `POST /api/payment/webhook/kkiapay` et
`POST /api/payment/verify-kkiapay` doivent répondre `200`. Une ligne
`[KkiaPay] verify failed in …ms:` ou `[KkiaPay webhook] failed in …ms:` est
suivie du message, du code et de la pile d'erreur : c'est la première chose à
lire en cas de problème. Ces logs de durée peuvent être conservés ou retirés
une fois l'instance stable.

## 4. Recette avant remise au client

Effectuez les tests dans cet ordre et consignez le résultat pour l'instance :

1. **Hébergement** : `/health/ready` renvoie `200`; le certificat HTTPS est
   valide ; `/`, `/admin/` et une route `/api/` répondent.
2. **Configuration et données** : le catalogue charge ; les paramètres de
   boutique, logo clair/sombre, catégories et images restent après
   redéploiement.
3. **Comptes et e-mails** : inscription e-mail avec OTP, réception des e-mails
   (vérifiez aussi les **spams**), connexion, mot de passe oublié (le texte doit
   parler de réinitialisation, pas d'inscription), inscription et connexion
   Google ; vérifiez que le nouvel utilisateur apparaît dans l'admin.
4. **Panier et commande** : ajoutez un article en invité, connectez-vous et
   vérifiez que le panier est conservé ; testez une commande en paiement à la
   livraison. Après la commande, le panier doit être **vidé** et la page
   `/order/success` s'afficher.
5. **Paiements Sandbox** : effectuez un paiement test KkiaPay puis FedaPay
   séparément. Vérifiez :
   - un **seul** toast de succès (aucun toast d'erreur), le panier vidé et la
     redirection vers la page de confirmation ;
   - l'indicateur de chargement sur le bouton pendant la vérification ;
   - la livraison des webhooks (réponses `200` et lignes de log) ;
   - la commande dans l'admin, la mise à jour du stock et **un seul reçu** ;
   - qu'une notification répétée ne crée pas une seconde commande (le serveur
     compte sur un index unique sur `paymentId` : vérifiez qu'il existe dans la
     collection des commandes et qu'il accepte plusieurs valeurs `null` pour
     les commandes à la livraison).
6. **Reçu par e-mail** : le message arrive (boîte principale ou spam), le bouton
   « Voir mon reçu complet » ouvre la bonne page de **cette** boutique.
7. **Admin et médias** : vérifiez les permissions et les écrans utilisés par
   le client ; changez le statut d'une commande (Reçue, En préparation,
   Expédiée, Livrée) et vérifiez le suivi côté client ; téléversez une image
   avec Cloudinary.
8. **Exploitation** : configurez sauvegardes MongoDB, rétention, accès
   d'administration, alertes et procédure de restauration avant les données
   réelles, puis **testez une restauration** (section 6).

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

Avant l'ouverture au public, vérifiez aussi :

- que l'hébergement est adapté : l'offre gratuite de Render met le service en
  veille après une période d'inactivité (jusqu'à environ 50 secondes de délai à
  la requête suivante) et ne garantit ni disponibilité ni sauvegarde. Prévoyez
  un plan adapté ;
- que la base n'est plus sur un cluster gratuit sans sauvegarde ;
- que l'e-mail part du **domaine du client** avec SPF, DKIM et DMARC (voir
  Délivrabilité) ;
- que le compte e-mail expéditeur et le projet Google Cloud appartiennent bien
  au client ou à une personne désignée, avec une procédure pour regénérer le
  jeton `GMAIL_REFRESH_TOKEN`.

Remettez au client les URL publiques, les propriétaires de chaque compte,
l'emplacement sécurisé des secrets, les résultats de recette, la fréquence des
sauvegardes et la procédure de support. Les quotas/forfaits gratuits Render ne
constituent pas une garantie de disponibilité ou de sauvegarde pour un commerce
en exploitation.

## 6. Exploitation

### Sauvegarde et restauration MongoDB

Une sauvegarde n'a de valeur que si elle a été **restaurée avec succès au moins
une fois**. Chaque client ayant sa propre base, la procédure se fait par base.

Sur un cluster Atlas **payant**, activez les sauvegardes cloud et suivez la
documentation d'Atlas pour les restaurations. Sur un cluster **gratuit**, il
faut utiliser les **MongoDB Database Tools** (`mongodump`, `mongorestore`),
téléchargeables sur le site de MongoDB.

1. **Sauvegarder** (PowerShell, depuis un dossier **hors du dépôt Git**) :

   ```powershell
   $env:MONGODB_URI = "<valeur de MONGODB_URI de Render>"
   mongodump --uri="$env:MONGODB_URI" --out=backup-AAAA-MM-JJ
   ```

   Passer par une variable d'environnement évite d'écrire le mot de passe dans
   la commande. Si l'URI ne contient pas le nom de la base, ajoutez
   `--db <nom de la base>`.

2. **Tester la restauration sans toucher à la production**, en restaurant sous
   un autre nom de base, sans l'option `--drop` :

   ```powershell
   mongorestore --uri="$env:MONGODB_URI" --nsFrom="<base>.*" --nsTo="<base>_restore_test.*" backup-AAAA-MM-JJ
   ```

3. **Vérifier** dans Atlas (Browse Collections) que les collections
   principales (`users`, `products`, `orders`) ont le même nombre de documents
   dans la base d'origine et dans `<base>_restore_test`.
4. **Nettoyer** : supprimez la base `<base>_restore_test`, en vérifiant bien que
   vous ne supprimez pas la base d'origine.

Le fichier de sauvegarde contient des données personnelles (clients, adresses,
mots de passe hachés). Ne le mettez jamais dans Git (ajoutez `backup-*/` au
`.gitignore` si besoin), conservez-le dans un stockage privé et définissez la
durée de conservation avec le client. Précisez par écrit qui est responsable des
sauvegardes et à quelle fréquence.

### Logs, déploiements et veille

- **Logs** : Render → **Logs**. Les lignes utiles sont préfixées `[KkiaPay]`,
  `[KkiaPay webhook]`, `📨`, `📧`, `❌` ou contiennent `Échec`.
- **Déploiements** : Render → **Deploys** indique le commit déployé et le
  statut. Vérifiez qu'il correspond bien au dernier commit poussé sur la
  branche suivie. Après toute modification de variable `VITE_*`, un rebuild est
  nécessaire.
- **Veille** : sur l'offre gratuite, ouvrez le site une minute avant une
  démonstration pour éviter l'attente de la première requête.
- **Mises à jour** : testez d'abord sur l'instance de démonstration (paiement
  Sandbox, e-mail, panier), puis déployez chez les clients.

## 7. Dépannage

Commencez par **Render → Logs** et la **Console du navigateur** (F12). Ne
collez jamais de secret dans un ticket ou une conversation.

### Paiement et panier

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| Toast vert **puis** toast rouge « Erreur serveur lors de la vérification du paiement » ; panier non vidé ; pas de redirection | Le front appelle `setCartItems`, qui n'est pas fourni par `UserContext` (erreur `… is not a function` dans la console) | Vérifier que `setCartItems` figure dans le `value` du `UserContext.Provider`, puis rebuild et rechargement forcé (Ctrl+F5). |
| Le paiement KkiaPay met 7 à 8 secondes à se confirmer | KkiaPay Sandbox renvoie `PENDING` plusieurs fois avant `SUCCESS` ; le serveur réessaie jusqu'à 6 fois | Normal. Attendre la redirection ; ne pas recliquer. |
| Aucune ligne `[KkiaPay webhook]` après un paiement | Secret webhook différent (réponse 401), URL ou événement non configuré, ou instance en veille | Comparer le hash secret de KkiaPay et `KKIAPAY_WEBHOOK_SECRET` (aucun espace), vérifier l'événement `transaction.success`, lancer le test de livraison. |
| `[KkiaPay] verify failed …` ou `[KkiaPay webhook] failed …` | Voir le message, le code et la pile qui suivent la ligne | Corriger la cause indiquée (montant différent, transaction déjà utilisée, erreur base de données, etc.). |
| Une requête `POST /api/cart/add` répond 400 | Une règle de l'API refuse l'ajout (par exemple article déjà présent) | Ouvrir **Network → la requête → Response** : le message indique la condition refusée avant de chercher un bug. |
| Deux commandes pour un même paiement | Index unique absent sur `paymentId` | Créer l'index unique (compatible avec plusieurs valeurs `null`) et traiter les doublons existants. |

### E-mails

| Symptôme dans les logs ou l'écran | Cause probable | Action |
| --- | --- | --- |
| `Connection timeout`, `ETIMEDOUT`, `command: 'CONN'` | SMTP bloqué sur Render gratuit | Utiliser l'API Gmail (option A) ou un plan payant (option B). |
| `Jeton Gmail refusé … invalid_grant` | Jeton de rafraîchissement expiré ou révoqué ; application OAuth encore en mode Test | Passer l'application en **Production**, regénérer le jeton (Playground), mettre à jour `GMAIL_REFRESH_TOKEN`. |
| `Jeton Gmail refusé … invalid_client` | `GMAIL_CLIENT_ID` ou `GMAIL_CLIENT_SECRET` incorrect (espace, valeur tronquée) | Recopier les valeurs depuis la console Google ; attendre quelques minutes si le client vient d'être créé. |
| `API Gmail 403` | API Gmail non activée dans le projet, ou niveau d'accès `gmail.send` non autorisé | Activer l'API dans le bon projet Google Cloud ; refaire l'autorisation avec le bon niveau d'accès. |
| `API Gmail 400` | Adresse destinataire invalide ou message mal formé | Vérifier l'adresse du destinataire. |
| Log `Envoi des e-mails via l'API Gmail` absent au démarrage | Une des trois variables `GMAIL_*` manque : le serveur est retombé sur le SMTP | Vérifier que les trois variables existent dans Render, puis redéployer. |
| Le reçu est envoyé mais n'est pas dans la boîte de réception | Classé dans les **spams** (domaine `onrender.com`) | Vérifier les spams et les « Messages envoyés » du compte expéditeur ; pour un client réel, domaine personnalisé + SPF/DKIM/DMARC. |
| L'e-mail « mot de passe oublié » parle d'inscription | Ancienne version du modèle d'e-mail | Vérifier que `VerificationEmail` reçoit le paramètre `type` depuis `sendStoreVerificationEmail`. |
| Écran « Google n'a pas validé cette application » pendant l'autorisation | Normal pour une application OAuth non validée | **Paramètres avancés → Accéder à `<application>` (non sécurisé)**. |

### Déploiement, connexion et base de données

| Symptôme | Cause probable | Action |
| --- | --- | --- |
| Un `git push` ne déclenche aucun déploiement | La branche poussée n'est pas celle que Render suit | Vérifier **Settings → Branch** ; pousser sur la bonne branche. |
| Une variable `VITE_*` modifiée n'a aucun effet | Le front est construit au build | Lancer un nouveau déploiement/rebuild. |
| La première requête est très lente | Mise en veille de l'instance gratuite | Attendre, ou utiliser un plan qui reste actif. |
| Connexion Google refusée | Domaine non autorisé dans Firebase ou URI de redirection manquante | Vérifier **Authorized domains** et l'URI `https://<domaine>/__/auth/handler`. |
| `/health/ready` ne répond pas `200` | Base injoignable : IP Render non autorisée dans Atlas, cluster en pause, mauvais `MONGODB_URI` | Vérifier **Network Access**, l'état du cluster dans Atlas et l'URI. |

## Correctifs déjà intégrés au code

Ces points ont été corrigés pendant la mise en place de l'instance de
démonstration. Si une instance a été créée à partir d'une version plus ancienne
du dépôt, vérifiez qu'ils sont présents :

- **Paiement et panier** : `UserContext` expose `setCartItems` ; dans le
  checkout, l'appel de vérification KkiaPay est séparé du nettoyage du panier,
  le suivi d'achat (`trackPurchase`) ne peut plus faire échouer le paiement, et
  un verrou évite de traiter deux fois la même transaction.
- **Interface** : le bouton KkiaPay affiche un indicateur de chargement
  (préparation puis vérification) et les autres boutons de paiement sont
  désactivés pendant ce temps.
- **Diagnostic** : des logs de durée et d'erreur préfixés `[KkiaPay]` et
  `[KkiaPay webhook]` détaillent la vérification (tentatives, statuts, erreur
  et pile).
- **E-mails** : `emailService.js` envoie par l'API Gmail quand les variables
  `GMAIL_*` existent et retombe sur le SMTP sinon ; le texte des e-mails à code
  s'adapte à l'inscription ou à la réinitialisation du mot de passe.

## Fiche de déploiement à compléter pour chaque client

Ne stockez pas les secrets dans cette fiche. Conservez-la dans l'espace privé
de suivi du client.

| Élément | Valeur / statut |
| --- | --- |
| Nom de la boutique et contact responsable | |
| Service Render / branche suivie / URL `onrender.com` | |
| Domaine personnalisé et HTTPS validés | |
| Cluster MongoDB (gratuit ou payant) | |
| Sauvegarde MongoDB testée (date, restauration vérifiée) | |
| Projet Firebase / domaine autorisé | |
| URI Google OAuth enregistrée | |
| Cloudinary configuré | |
| Mode d'envoi d'e-mails (API Gmail, SMTP payant, domaine dédié) | |
| Projet Google Cloud des e-mails : API Gmail activée, application **en production** | |
| Compte expéditeur (`EMAIL_USER`) et propriétaire du compte | |
| SMTP / API Gmail testé (OTP, reçu, contact, mot de passe oublié) | |
| SPF / DKIM / DMARC configurés (domaine du client) | |
| KkiaPay Sandbox + webhook testé | |
| FedaPay Sandbox + webhook testé | |
| Index unique sur `paymentId` vérifié | |
| Recette client/admin/panier terminée | |
| Clés Live et webhooks Live validés | |
| Date de remise et procédure de support | |