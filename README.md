# TRAVELS Épargne 31 (T.E-31)

## Actions d'administration : PIN et compte client

Le dépôt contient les deux modules des actions d'administration :

- `admin-account-actions.js` : boutons, formulaires, contrôles et appels à la fonction Supabase `smart-handler`.
- `te31-admin-integration.js` : pont d'intégration dans l'écran existant, sans remplacer son menu ni son thème.

### Intégration dans l'écran d'administration existant

À l'endroit où les deux boutons doivent apparaître, ajouter le conteneur :

```html
<div data-te31-account-actions></div>
```

Après le chargement du client Supabase existant, charger les scripts dans cet ordre :

```html
<script src="./admin-account-actions.js"></script>
<script src="./te31-admin-integration.js"></script>
```

Le client Supabase doit être disponible sous `window.supabase` et représenter la session administrateur connectée.

Quand un client est sélectionné dans l'interface existante, transmettre ses informations au pont :

```js
window.dispatchEvent(new CustomEvent("te31:selected-client", {
  detail: { id: client.id, full_name: client.full_name, phone: client.phone }
}));
```

Ou exposer `window.te31GetSelectedClient = () => clientSelectionne` et appeler `window.dispatchEvent(new Event("te31:admin-ready"))` lorsque l'écran d'administration est prêt.

### Sécurité

Les actions nécessitent une session administrateur autorisée par la fonction Supabase. La réinitialisation exige la vérification d'identité. La suppression désactive le compte et conserve l'historique financier. Ne pas intégrer de clé secrète/service-role dans le navigateur.
