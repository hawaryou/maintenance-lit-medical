# Fiche de maintenance lit médicalisé – GitHub Pages

Cette version transforme la fiche Excel `ENR08-V05` en formulaire web :
- saisie des informations d'identification ;
- contrôles avec résultat Non applicable / Conforme / Non conforme ;
- observations et pièces changées ;
- signatures manuscrites sur écran ;
- génération d'un PDF A4 ;
- envoi du PDF par e-mail via EmailJS.

## 1. Publier sur GitHub

Créez un dépôt GitHub, par exemple `fiche-maintenance-lit-medicalise`, puis placez `index.html`, `style.css` et `app.js` à la racine.

Dans **Settings > Pages**, choisissez la branche `main` et le dossier `/ (root)`.

## 2. Configurer l'envoi par e-mail

GitHub Pages héberge uniquement la partie web statique. L'envoi d'e-mails est réalisé par EmailJS.

1. Créez un compte EmailJS.
2. Ajoutez votre service e-mail.
3. Créez un template.
4. Dans le template, configurez l'adresse destinataire de l'entreprise.
5. Dans **Attachments**, ajoutez une **Variable Attachment** :
   - Parameter name : `attachment`
   - Filename : `filename`
   - Content type : `application/pdf`
6. Copiez dans `app.js` :
   - Public Key
   - Service ID
   - Template ID

La documentation EmailJS confirme qu'un fichier peut être transmis programmatiquement en Base64 comme pièce jointe dynamique.

## 3. Important

Ne mettez jamais un mot de passe de messagerie ou une clé privée dans le JavaScript publié sur GitHub. Utilisez uniquement la clé publique prévue par EmailJS.

Le site GitHub Pages est accessible sur Internet. Si la fiche contient des données personnelles ou sensibles, vérifiez vos obligations RGPD et évitez de stocker les données dans le dépôt GitHub.

## 4. Personnalisation

Le formulaire peut ensuite être adapté pour :
- reprendre exactement le logo Euromed ;
- reproduire encore plus fidèlement la mise en page Excel ;
- ajouter une photo du lit ;
- ajouter un numéro de rapport automatique ;
- ajouter un QR code ;
- envoyer à plusieurs adresses ;
- enregistrer une copie dans Google Drive/SharePoint.
