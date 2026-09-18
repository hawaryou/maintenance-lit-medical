# ENR08-V05 — Fiche de maintenance lit médicalisé

Version web pour GitHub Pages avec génération PDF et envoi automatique via Google Apps Script.

## 1. Publier la fiche sur GitHub Pages

Mettre `index.html`, `style.css`, `app.js`, `euromed-logo.jpeg` dans la racine du dépôt GitHub, puis activer :

**Settings → Pages → Deploy from a branch → main / root**

## 2. Créer le service Google Apps Script

1. Ouvre Google Apps Script : https://script.google.com/
2. Crée un **Nouveau projet**.
3. Supprime le code proposé et colle le contenu de `Code.gs`.
4. Enregistre.
5. Clique sur **Déployer → Nouveau déploiement**.
6. Type : **Application Web**.
7. Exécuter en tant que : **Moi**.
8. Qui a accès : **Tout le monde**.
9. Déploie et autorise l'accès demandé par Google.
10. Copie l'URL de l'application Web qui se termine par `/exec`.

Le compte Google qui déploie le script doit autoriser l'envoi d'e-mails. Les fiches sont envoyées à `valentineuromed@gmail.com`.

## 3. Brancher Google Apps Script à la fiche

Dans `app.js`, remplace :

```js
const APPS_SCRIPT_URL='https://script.google.com/macros/s/AKfycbwXoa9jjmye4AMvUFHiK_2wChRKWF-yA0qqWSLTHQJYY9Vr1h3NddRwkLQe8nwUvkH5/exec';
```

par l'URL `/exec` copiée à l'étape précédente.

Exemple :

```js
const APPS_SCRIPT_URL='https://script.google.com/macros/s/XXXXXXXXXXXX/exec';
```

Puis enregistre et renvoie `app.js` dans GitHub.

## 4. Tester

1. Ouvre l'adresse GitHub Pages.
2. Remplis une fiche test.
3. Signe-la.
4. Clique **Générer le PDF et envoyer par e-mail**.
5. Le PDF est transmis au script, puis envoyé à `valentineuromed@gmail.com` en pièce jointe.

### Important

Le navigateur utilise un envoi `no-cors` pour permettre à une page GitHub Pages de déclencher le service Google Apps Script. L'écran indique donc que la demande a été transmise, mais ne peut pas afficher la réponse détaillée de Google. En cas de problème, le PDF est téléchargé localement pour ne pas le perdre.

## Option de sécurité

Tu peux définir une propriété de script nommée `APP_TOKEN` dans **Paramètres du projet → Propriétés du script**, puis mettre exactement la même valeur dans `const APP_TOKEN` de `app.js`. Cela évite que des appels ne possédant pas le bon token soient traités.

Attention : un token présent dans une page publique reste visible côté navigateur. Il s'agit donc d'une protection simple contre les appels accidentels, pas d'un secret absolu.


### URL Google Apps Script configurée

L'application est configurée pour transmettre les PDF à l'URL Google Apps Script fournie. Destinataire : valentineuromed@gmail.com.
