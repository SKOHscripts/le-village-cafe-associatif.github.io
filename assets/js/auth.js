/* =============================================
   LE VILLAGE — auth.js
   Système d'authentification 3 niveaux
   =============================================

   NIVEAUX :
   1 = Bénévoles
   2 = CA (inclut niveau 1)

   CHANGER UN CODE :
   1. Générer le hash SHA-256 du nouveau code sur https://emn178.github.io/online-tools/sha256.html
   2. Remplacer la valeur correspondante ci-dessous
   3. Committer le fichier sur GitHub

   ============================================= */

const AUTH_HASHES = {
  1: '5cd24c2cb86ddc9169b6be3c8453ed5719d56f483e402521da135519a58fd583',
  2: '23ac212e4dc1b89813894753aa9d6951b0ecd02d3df52ef1504860e0845849ee',
};

// ── Hasher une chaîne en SHA-256 ──────────────────────────────
const SALT = 'levillage-lyon8-2026';

// Double SHA-256 avec sel, comme Bitcoin
async function sha256double(str) {
  const encode = s => new TextEncoder().encode(s);
  const toHex  = buf => Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Premier passage : SHA256(code + sel)
  const first  = await crypto.subtle.digest('SHA-256', encode(str + SALT));
  // Deuxième passage : SHA256(résultat)
  const second = await crypto.subtle.digest('SHA-256', encode(toHex(first)));

  return toHex(second);
}

// ── Vérifier si l'utilisateur est authentifié ────────────────
// Retourne true si le niveau stocké en session >= levelRequired
function isAuthenticated(levelRequired) {
  const stored = parseInt(sessionStorage.getItem('auth_level') || '0');
  return stored >= levelRequired;
}

// ── Récupérer le niveau actuel ────────────────────────────────
function getAuthLevel() {
  return parseInt(sessionStorage.getItem('auth_level') || '0');
}

// ── Afficher la modale de connexion ──────────────────────────
function showAuthModal(levelRequired, onSuccess) {
  // Supprimer une modale existante
  const existing = document.getElementById('auth-modal');
  if (existing) existing.remove();

  const labels = {
    1: { titre: 'Espace bénévoles', icon: '🤝', desc: 'Entrez le code bénévoles' },
    2: { titre: 'Espace CA',        icon: '⚙️', desc: 'Entrez le code CA' },
  };
  const info = labels[levelRequired] || labels[1];

  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'auth-modal-title');
  modal.innerHTML = `
    <div class="auth-overlay" id="auth-overlay"></div>
    <div class="auth-box">
      <div class="auth-icon">${info.icon}</div>
      <h2 class="auth-title" id="auth-modal-title">${info.titre}</h2>
      <p class="auth-desc">${info.desc}</p>
      <input
        class="auth-input"
        type="password"
        id="auth-input"
        placeholder="••••••••"
        autocomplete="off"
        autofocus
      >
      <p class="auth-error" id="auth-error" role="alert" aria-live="assertive"></p>
      <div class="auth-actions">
        <button class="auth-btn-cancel" id="auth-cancel">Annuler</button>
        <button class="auth-btn-submit" id="auth-submit">Accéder →</button>
      </div>
    </div>
  `;

  // Styles injectés inline pour être indépendants
  if (!document.getElementById('auth-styles')) {
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
      #auth-modal {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
      }
      .auth-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(4px);
      }
      .auth-box {
        position: relative;
        background: white;
        border-radius: 24px;
        padding: 2.5rem 2rem;
        width: 100%;
        max-width: 360px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        text-align: center;
        animation: authSlideUp 0.25s ease;
      }
      @keyframes authSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .auth-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
      .auth-title {
        font-family: 'Fredoka', sans-serif;
        font-size: 1.4rem;
        font-weight: 600;
        color: #1a8a7a;
        margin-bottom: 0.4rem;
      }
      .auth-desc {
        font-size: 0.9rem;
        color: #6b7c75;
        margin-bottom: 1.5rem;
      }
      .auth-input {
        width: 100%;
        padding: 0.85rem 1rem;
        border: 2px solid #c8e0d8;
        border-radius: 12px;
        font-family: 'Fredoka', sans-serif;
        font-size: 1.1rem;
        text-align: center;
        letter-spacing: 0.2em;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        color: #2d2d2d;
        background: #e8f5f0;
      }
      .auth-input:focus {
        border-color: #1a8a7a;
        box-shadow: 0 0 0 3px rgba(26,138,122,0.15);
        background: white;
      }
      .auth-input.error {
        border-color: #f87171;
        box-shadow: 0 0 0 3px rgba(248,113,113,0.15);
        animation: authShake 0.3s ease;
      }
      @keyframes authShake {
        0%,100% { transform: translateX(0); }
        25%      { transform: translateX(-6px); }
        75%      { transform: translateX(6px); }
      }
      .auth-error {
        min-height: 1.2em;
        font-size: 0.85rem;
        color: #dc2626;
        margin-top: 0.6rem;
        margin-bottom: 0;
      }
      .auth-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      .auth-btn-cancel {
        flex: 1;
        padding: 0.75rem;
        border: 2px solid #c8e0d8;
        border-radius: 50px;
        background: white;
        color: #6b7c75;
        font-family: 'Fredoka', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .auth-btn-cancel:hover { background: #e8f5f0; }
      .auth-btn-submit {
        flex: 2;
        padding: 0.75rem;
        border: none;
        border-radius: 50px;
        background: #1a8a7a;
        color: white;
        font-family: 'Fredoka', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .auth-btn-submit:hover { background: #156e62; transform: translateY(-1px); }
      .auth-btn-submit:disabled { opacity: 0.6; cursor: default; transform: none; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(modal);

  const input   = document.getElementById('auth-input');
  const errorEl = document.getElementById('auth-error');
  const submitBtn = document.getElementById('auth-submit');
  const cancelBtn = document.getElementById('auth-cancel');
  const overlay = document.getElementById('auth-overlay');

  input.focus();

  async function tryLogin() {
    const code = input.value.trim();
    if (!code) return;

    submitBtn.disabled = true;
    submitBtn.textContent = '…';
    errorEl.textContent = '';
    input.classList.remove('error');

    const hash = await sha256double(code);

    // Vérifier du niveau le plus élevé au plus bas
    for (const level of [2, 1]) {
      if (hash === AUTH_HASHES[level] && level >= levelRequired) {
        sessionStorage.setItem('auth_level', level.toString());
        modal.remove();
        if (onSuccess) onSuccess(level);
        return;
      }
    }

    // Échec
    input.classList.add('error');
    errorEl.textContent = 'Code incorrect. Réessayez.';
    input.value = '';
    input.focus();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Accéder →';
  }

  submitBtn.addEventListener('click', tryLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
  cancelBtn.addEventListener('click', () => { modal.remove(); });
  overlay.addEventListener('click', () => { modal.remove(); });
}

// ── Protéger une page (à appeler en haut de chaque page protégée) ──
// levelRequired : niveau minimum requis
// redirectOnFail : true = redirige, false = affiche la modale
function requireAuth(levelRequired, redirectOnFail = false) {
  if (isAuthenticated(levelRequired)) return; // Déjà authentifié

  if (redirectOnFail) {
    // Stocker la page cible pour rediriger après login
    sessionStorage.setItem('auth_redirect', window.location.href);
    window.location.href = 'index.html';
    return;
  }

  // Masquer le contenu protégé et afficher la modale
  const main = document.getElementById('main-content');
  if (main) main.style.visibility = 'hidden';

  showAuthModal(levelRequired, (level) => {
    if (level >= levelRequired) {
      if (main) main.style.visibility = 'visible';
      // Recharger pour initialiser les éléments qui dépendent du niveau
      window.location.reload();
    } else {
      window.location.href = 'index.html';
    }
  });
}

// ── Déconnexion ──
function logout() {
  sessionStorage.removeItem('auth_level');
  window.location.href = 'index.html';
}
