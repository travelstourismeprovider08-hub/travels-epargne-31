/* T.E-31 — pont d'intégration de l'interface d'administration.
   Ce fichier ne remplace ni le menu ni les styles de l'application.
   Il monte les deux actions uniquement dans un conteneur marqué
   data-te31-account-actions, quand Supabase et la session admin sont disponibles.

   Dans le HTML existant, placer <div data-te31-account-actions></div>
   à l'endroit souhaité dans l'écran d'administration, puis charger :
   <script src="./admin-account-actions.js"></script>
   <script src="./te31-admin-integration.js"></script>

   Le code existant peut publier le client choisi ainsi :
   window.dispatchEvent(new CustomEvent("te31:selected-client", { detail: client }));
*/
(function () {
  "use strict";

  let selectedClient = null;
  let mounted = false;

  window.addEventListener("te31:selected-client", function (event) {
    selectedClient = event && event.detail ? event.detail : null;
  });

  async function getToken() {
    const client = window.supabase;
    if (!client || !client.auth || typeof client.auth.getSession !== "function") {
      throw new Error("Connexion Supabase indisponible.");
    }
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    return result.data && result.data.session ? result.data.session.access_token : null;
  }

  function getClient() {
    if (typeof window.te31GetSelectedClient === "function") {
      return window.te31GetSelectedClient();
    }
    return selectedClient;
  }

  function mount() {
    if (mounted || typeof window.mountTE31AccountActions !== "function") return;
    const container = document.querySelector("[data-te31-account-actions]");
    if (!container || !window.supabase) return;
    window.mountTE31AccountActions({
      container: container,
      getAccessToken: getToken,
      getSelectedClient: getClient
    }).then(function () {
      mounted = true;
    }).catch(function (error) {
      console.error("T.E-31 : intégration des actions administrateur impossible.", error);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
  window.addEventListener("te31:admin-ready", mount);
})();
