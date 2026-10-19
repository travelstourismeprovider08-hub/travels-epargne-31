/* T.E-31 — actions administrateur : réinitialisation PIN et suppression réversible.
   À charger dans l'interface d'administration existante, sans remplacer son menu ni son thème.
   Usage :
   mountTE31AccountActions({
     container: document.querySelector("#zone-actions-client"),
     getAccessToken: async () => (await supabase.auth.getSession()).data.session?.access_token,
     getSelectedClient: () => clientSelectionne // { id, full_name, phone }
   });
*/
(function () {
  "use strict";

  const FUNCTION_URL = "https://rmrzjnieuefdnqrxpjcn.supabase.co/functions/v1/smart-handler";

  const styles = `
    .te31-account-actions{font:inherit;color:inherit;display:grid;gap:12px}
    .te31-account-actions .te31-actions-row{display:flex;gap:10px;flex-wrap:wrap}
    .te31-account-actions button{border:0;border-radius:9px;padding:11px 15px;font:inherit;font-weight:700;cursor:pointer}
    .te31-account-actions .te31-reset{background:#f28c28;color:#fff}
    .te31-account-actions .te31-delete{background:#10264a;color:#fff;border:1px solid #c9a227}
    .te31-account-actions .te31-panel{border:1px solid #c9a227;border-radius:12px;padding:14px;display:grid;gap:10px}
    .te31-account-actions label{display:grid;gap:5px;font-size:.94em}
    .te31-account-actions input,.te31-account-actions textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #b9bec8;border-radius:8px;font:inherit;background:transparent;color:inherit}
    .te31-account-actions .te31-submit{background:#10264a;color:#fff;border:1px solid #c9a227}
    .te31-account-actions .te31-cancel{background:transparent;color:inherit;border:1px solid #a8a8a8}
    .te31-account-actions .te31-status{margin:0;padding:9px;border-radius:8px;white-space:pre-wrap}
    .te31-account-actions .te31-status[data-kind="error"]{background:#fde8e7;color:#8b1d18}
    .te31-account-actions .te31-status[data-kind="ok"]{background:#e4f5e8;color:#14532d}
    .te31-account-actions [hidden]{display:none!important}
  `;

  async function mountTE31AccountActions({ container, getAccessToken, getSelectedClient }) {
    if (!container || typeof getAccessToken !== "function" || typeof getSelectedClient !== "function") {
      throw new Error("T.E-31 : container, getAccessToken et getSelectedClient sont requis.");
    }
    if (!document.getElementById("te31-account-actions-style")) {
      const style = document.createElement("style");
      style.id = "te31-account-actions-style";
      style.textContent = styles;
      document.head.appendChild(style);
    }

    container.querySelector(".te31-account-actions")?.remove();
    const root = document.createElement("section");
    root.className = "te31-account-actions";
    root.innerHTML = `
      <div class="te31-actions-row">
        <button type="button" class="te31-reset">Réinitialiser le PIN</button>
        <button type="button" class="te31-delete">Supprimer un compte</button>
      </div>
      <form class="te31-panel" data-form="reset" hidden>
        <strong>Réinitialisation sécurisée du PIN</strong>
        <label>Téléphone du client
          <input name="client_phone" autocomplete="tel" placeholder="+22507xxxxxxxx" required>
        </label>
        <label>Nouveau PIN (4 à 8 chiffres)
          <input name="new_pin" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" autocomplete="new-password" required>
        </label>
        <label><span><input name="identity_verified" type="checkbox" required style="width:auto"> Identité du client vérifiée</span></label>
        <label>Motif de vérification (minimum 5 caractères)
          <textarea name="verification_note" minlength="5" rows="2" required></textarea>
        </label>
        <div class="te31-actions-row"><button class="te31-submit" type="submit">Confirmer la réinitialisation</button><button class="te31-cancel" type="button">Annuler</button></div>
      </form>
      <form class="te31-panel" data-form="delete" hidden>
        <strong>Désactivation du compte client</strong>
        <p>Le compte sera désactivé. L'historique financier sera conservé et l'action pourra être annulée par réactivation.</p>
        <label>ID du compte client
          <input name="client_id" placeholder="Identifiant UUID du client" required>
        </label>
        <label><span><input name="confirm_delete" type="checkbox" required style="width:auto"> Je confirme la désactivation du compte sélectionné</span></label>
        <div class="te31-actions-row"><button class="te31-submit" type="submit">Confirmer la suppression</button><button class="te31-cancel" type="button">Annuler</button></div>
      </form>
      <p class="te31-status" role="status" aria-live="polite" hidden></p>
    `;
    container.appendChild(root);

    const resetForm = root.querySelector('[data-form="reset"]');
    const deleteForm = root.querySelector('[data-form="delete"]');
    const status = root.querySelector(".te31-status");

    function showForm(which) {
      resetForm.hidden = which !== "reset";
      deleteForm.hidden = which !== "delete";
      status.hidden = true;
      const client = getSelectedClient();
      if (client && which === "reset") resetForm.elements.client_phone.value = client.phone || "";
      if (client && which === "delete") deleteForm.elements.client_id.value = client.id || "";
    }
    root.querySelector(".te31-reset").addEventListener("click", () => showForm("reset"));
    root.querySelector(".te31-delete").addEventListener("click", () => showForm("delete"));
    root.querySelectorAll(".te31-cancel").forEach(b => b.addEventListener("click", () => {
      resetForm.hidden = true; deleteForm.hidden = true;
    }));

    async function sendAction(payload) {
      const token = await getAccessToken();
      if (!token) throw new Error("Session administrateur expirée. Reconnectez-vous.");
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw new Error(result.error || "Action impossible.");
      return result;
    }

    resetForm.addEventListener("submit", async event => {
      event.preventDefault();
      const f = resetForm.elements;
      const phone = f.client_phone.value.trim();
      const pin = f.new_pin.value.trim();
      const note = f.verification_note.value.trim();
      if (!/^\+?225?0?[157]\d{8}$/.test(phone.replace(/[\s().-]/g, "")) &&
          !/^0[157]\d{8}$/.test(phone.replace(/[\s().-]/g, ""))) {
        status.hidden = false; status.dataset.kind = "error"; status.textContent = "Vérifiez le numéro ivoirien."; return;
      }
      if (!/^\d{4,8}$/.test(pin)) {
        status.hidden = false; status.dataset.kind = "error"; status.textContent = "Le PIN doit contenir 4 à 8 chiffres."; return;
      }
      const submit = resetForm.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const result = await sendAction({
          action: "admin_reset_client_pin",
          client_phone: phone,
          new_pin: pin,
          identity_verified: f.identity_verified.checked,
          verification_note: note
        });
        resetForm.reset(); resetForm.hidden = true;
        status.hidden = false; status.dataset.kind = "ok"; status.textContent = result.message || "PIN réinitialisé.";
      } catch (error) {
        status.hidden = false; status.dataset.kind = "error"; status.textContent = error.message;
      } finally { submit.disabled = false; }
    });

    deleteForm.addEventListener("submit", async event => {
      event.preventDefault();
      const f = deleteForm.elements;
      const selected = getSelectedClient();
      const id = f.client_id.value.trim();
      if (selected?.id && id !== selected.id) {
        status.hidden = false; status.dataset.kind = "error";
        status.textContent = "L'identifiant saisi ne correspond pas au client sélectionné."; return;
      }
      const submit = deleteForm.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const result = await sendAction({ action: "admin_delete_client_account", client_id: id, confirm_delete: f.confirm_delete.checked });
        deleteForm.reset(); deleteForm.hidden = true;
        status.hidden = false; status.dataset.kind = "ok"; status.textContent = result.message || "Compte désactivé.";
      } catch (error) {
        status.hidden = false; status.dataset.kind = "error"; status.textContent = error.message;
      } finally { submit.disabled = false; }
    });

    return { destroy() { root.remove(); } };
  }

  window.mountTE31AccountActions = mountTE31AccountActions;
})();