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

