# eCommerceProject

## Description
Projet eCommerce React fullstack comprenant :
- **Admin** : interface de gestion
- **Client** : interface utilisateur
- **Server** : backend avec API

Ce projet permet la gestion complète d’un eCommerce : produits, commandes, utilisateurs, etc.

## Structure du projet
```
eCommerceProject/
├─ admin/       # Application Admin
├─ client/      # Application Client
├─ server/      # Backend / API
├─ .gitignore   # Fichiers ignorés par Git
└─ README.md    # Ce fichier
```

## Identité de la boutique

Après connexion à l'administration, l'écran **Paramètres > Identité de la boutique**
permet de configurer le nom affiché, les coordonnées, les liens sociaux et le
bandeau promotionnel. Le bandeau est masqué lorsqu'il est vide. Les logos clair
et sombre se téléversent depuis cet écran et nécessitent une configuration
Cloudinary dans l'environnement du serveur.

Cette identité est utilisée par l'en-tête et le pied de page de la boutique,
le centre d'aide, l'écran de connexion à l'administration et les e-mails envoyés
aux clients. Les coordonnées de la page Contact restent gérées par son écran
de contenu séparé.

## Messagerie du service client

Les clients connectés peuvent écrire à la boutique depuis **Mon compte >
Service client**. Le vendeur consulte et répond aux conversations depuis
l'administration, dans **Service client**. Les échanges sont enregistrés dans
MongoDB et restent séparés des messages envoyés par le formulaire public de la
page Contact.

Les écrans ouverts vérifient automatiquement les nouveaux messages toutes les
quatre secondes ; ce comportement est une actualisation périodique, pas une
connexion temps réel WebSocket. Aucune notification par e-mail n'est envoyée
pour ces conversations ; le client doit consulter son espace de compte. Les
échanges sont réservés au client connecté concerné et aux administrateurs.

## Mode de paiement KkiaPay

KkiaPay reste en mode Sandbox par défaut. Pour tester localement, conservez
`VITE_KKIAPAY_SANDBOX=true` dans `client/.env` et `KKIAPAY_SANDBOX=true` dans
`server/.env`. Le numéro de test n'est transmis au widget qu'en mode Sandbox.

Pour une mise en production, configurez les identifiants KkiaPay de production
privés et secrets dans le gestionnaire de secrets de l'hébergement (ou dans
`server/.env`, qui ne doit jamais être versionné). La clé publique de production
doit être fournie au build du client sous `VITE_KKIAPAY_PUBLIC_KEY` (elle est
visible dans le navigateur et n'est pas un secret). Définissez aussi :

- `KKIAPAY_SANDBOX=false` côté serveur ;
- `VITE_KKIAPAY_SANDBOX=false` au moment de construire le client. Avec
  `docker-compose.prod.yml`, définissez cette variable dans l'environnement qui
  lance `docker compose build` ou `docker compose up --build`.

Les deux réglages doivent correspondre au même environnement KkiaPay : ne
laissez pas le widget en Sandbox avec les clés de production, ni l'inverse.
Si la variable du client n'est pas fournie, le build reste en Sandbox par
sécurité. Ne placez jamais les clés privées ou secrètes KkiaPay dans les
variables `VITE_*` : elles sont intégrées au code client.

## Notifications de paiement

Les paiements en ligne créent d'abord une tentative serveur contenant le montant,
le panier et l'adresse de livraison calculés côté serveur. Le webhook permet au
serveur de confirmer la commande même si le client ferme la page de paiement.

### Test Sandbox, étape par étape

1. Déployez l'application sur une adresse publique en HTTPS. Une adresse
   `localhost` ne peut pas recevoir les notifications des prestataires.
2. Copiez les fichiers d'exemple si ce n'est pas déjà fait, puis configurez les
   clés **Sandbox** dans les environnements serveur et client. Gardez
   `FEDAPAY_ENVIRONMENT=sandbox`, `KKIAPAY_SANDBOX=true` dans `server/.env` et
   `VITE_KKIAPAY_SANDBOX=true` dans le `.env` racine. Le client doit être
   reconstruit après une modification de ses variables `VITE_*`.
3. Dans le tableau de bord Sandbox de chaque prestataire, créez un webhook vers
   l'URL correspondante :
   - FedaPay : `https://votre-domaine.example/api/payment/webhook/fedapay`
   - KkiaPay : `https://votre-domaine.example/api/payment/webhook/kkiapay`

4. Copiez le secret indiqué pour chaque webhook dans `server/.env` :
   `FEDAPAY_WEBHOOK_SECRET` pour le secret de cet endpoint FedaPay et
   `KKIAPAY_WEBHOOK_SECRET` pour le secret webhook configuré chez KkiaPay.
   Redémarrez le serveur après modification. Ces secrets ne vont jamais dans le
   `.env` racine ni dans une variable `VITE_*`.
5. Effectuez une commande de test avec chaque prestataire. Vérifiez que la
   commande apparaît dans l'administration, que le stock ne baisse qu'une fois
   et qu'un seul reçu est envoyé. Répétez la notification depuis le tableau de
   bord si cette fonction est disponible : une répétition ne doit pas créer de
   commande supplémentaire.
6. Vérifiez aussi la livraison des événements dans le tableau de bord du
   prestataire. Pour KkiaPay, contrôlez que le webhook fournit la référence de
   tentative envoyée lors de l'ouverture du widget. Sans cette référence, le
   serveur ne peut pas rattacher automatiquement la transaction à la commande.

Si une commande n'est pas créée, ne relancez pas immédiatement un paiement
réel : vérifiez d'abord les journaux du serveur, la livraison/réponse du webhook
dans le tableau de bord et les paramètres Sandbox. N'activez pas Live tant que
les deux tests Sandbox ne sont pas concluants.

### Passage en production

Configurez séparément les clés et les webhooks **Live** dans les tableaux de
bord des prestataires. Remplacez les secrets Sandbox par les secrets Live dans
`server/.env`, puis basculez les modes correspondants :

- FedaPay : `FEDAPAY_ENVIRONMENT=live` ;
- KkiaPay : `KKIAPAY_SANDBOX=false` côté serveur et
  `VITE_KKIAPAY_SANDBOX=false` au build du client.

Reconstruisez et redéployez le client après le changement de variable `VITE_*`.
Effectuez d'abord un dernier contrôle de configuration et un paiement réel
contrôlé avant d'annoncer l'ouverture de la boutique. Ne copiez jamais de secret
Sandbox dans la configuration Live, ni l'inverse.

## Déploiement Docker en production

La configuration de production utilise une seule origine HTTPS :

- la boutique est servie sur `/` ;
- l'administration est servie sur `/admin/` ;
- l'API et les liens de campagne `/go/` sont relayés vers le serveur par Nginx.

Avant le premier démarrage, copiez les exemples puis remplacez les valeurs
fictives par la configuration propre à cette boutique :

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Le `.env` à la racine fournit les arguments de build publics des interfaces
(URL relative `/api`, clés publiques de paiement et configuration Firebase).
`server/.env` contient les secrets MongoDB, JWT, paiement, SMTP et Cloudinary.
Ne partagez et ne versionnez jamais les fichiers `.env`.

Après avoir renseigné les variables, construisez et démarrez les services :

```powershell
docker compose -f docker-compose.prod.yml up --build -d
```

Par défaut, KkiaPay reste en Sandbox. Vérifiez l'URL et le certificat HTTPS
publics, l'accès à `/api/`, `/admin/` et à un lien `/go/` avant d'ouvrir la
boutique. N'activez le mode réel qu'après avoir installé les clés de production
du même compte marchand dans les configurations serveur et client décrites
ci-dessus.

## Prérequis
- Node.js
- npm 
- MongoDB pour la base de données

## Installation

1. **Cloner le projet :**
```bash
git clone git@github.com:Abdoul-Koudous/EcommerceApp.git
cd eCommerceProject
```

2. **Installer les dépendances pour chaque application :**
```bash
# Admin
cd admin
npm install

# Client
cd ../client
npm install

# Server
cd ../server
npm install
```

3. **Lancer le projet :**
```bash
# Admin et Client
npm run dev

# Server
nodemon
```
> **NB :** Le backend utilise une base de données MongoDB (Mongoose). Assurez-vous que MongoDB est lancé.

## Branches Git
1. `main` : branche stable / production  
2. `developp` : branche de développement  

## Contribuer
1. Créez une branche depuis `developp` pour vos modifications :
```bash
git checkout -b feature/ma-fonctionnalité
```

2. Commitez vos changements :
```bash
git add .
git commit -m "Description de la modification"
```

3. Poussez votre branche :
```bash
git push origin feature/ma-fonctionnalité
```

4. Faites une Pull Request vers `developp`

## Licence
Ce projet est sous licence MIT.

**Traduction simplifiée en français :**
- Vous pouvez utiliser, copier, modifier et distribuer ce projet librement.
- Vous devez conserver le copyright et la licence.
- Le projet est fourni “tel quel” sans aucune garantie.
