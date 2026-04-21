/**
 * Utitaire pour récupérer le jeton CSRF de Django
 */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * Affiche le message et les suggestions interactives
 */
function appendChatMessage(role, text, suggestions = []) {
    const history = document.getElementById('ai-chat-history');
    if (!history) {
        console.error("L'élément #ai-chat-history est introuvable.");
        return;
    }

    const isUser = role === 'user';
    const msgDiv = document.createElement('div');
    
    // Classes Tailwind (Ajout de mb-4 pour l'espacement)
    const baseClasses = "p-3 rounded-2xl border transition-all duration-300 mb-4 animate-in fade-in slide-in-from-bottom-2 ";
    const roleClasses = isUser 
        ? "bg-indigo-600/10 border-indigo-500/20 ml-4" 
        : "bg-white/5 border-white/5 mr-4";
    
    msgDiv.className = baseClasses + roleClasses;

    let content = `
        <p class="text-[10px] ${isUser ? 'text-indigo-400' : 'text-gray-500'} font-bold mb-1 uppercase">
            ${isUser ? 'Vous' : 'Assistant'}
        </p>
        <p class="text-gray-300 leading-relaxed text-sm">${text}</p>
    `;

    // Gestion des suggestions
    if (!isUser && suggestions && suggestions.length > 0) {
        content += `<div class="mt-3 flex flex-wrap gap-2">`;
        suggestions.forEach(suggestion => {
            content += `
                <button onclick="handleSuggestionClick('${suggestion.replace(/'/g, "\\'")}')" 
                        class="text-[10px] bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg transition-all transform hover:scale-105">
                    ${suggestion}
                </button>`;
        });
        content += `</div>`;
    }

    msgDiv.innerHTML = content;
    history.appendChild(msgDiv);
    
    // Scroll automatique vers le bas
    setTimeout(() => {
        history.scrollTop = history.scrollHeight;
    }, 50);
}

/**
 * Clic sur une suggestion
 */
window.handleSuggestionClick = function(text) {
    const input = document.getElementById('aiSidebarInput');
    if (input) {
        input.value = text;
        processSidebarAi();
    }
};

/**
 * Traitement principal
 */
async function processSidebarAi() {
    const input = document.getElementById('aiSidebarInput');
    if (!input) return;

    const command = input.value.trim();
    // On s'assure que les données existent dans le localStorage
    const rawData = localStorage.getItem('lastAnalysisData');
    
    if (!command) return;
    if (!rawData) {
        appendChatMessage('assistant', "❌ Aucune donnée n'est chargée. Veuillez d'abord importer un fichier.");
        return;
    }

    const currentData = JSON.parse(rawData);

    // 1. UI : Afficher le message utilisateur
    appendChatMessage('user', command);
    input.value = '';
    
    // 2. UI : Désactiver le bouton pendant le chargement
    const sendBtn = document.getElementById('sendSidebarAi');
    if (sendBtn) sendBtn.disabled = true;

    try {
        const response = await fetch('/ai-process/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ query: command, data: currentData })
        });

        const result = await response.json();

        if (response.ok && !result.error) {
            // Mise à jour locale et rendu du tableau (si la fonction existe)
            localStorage.setItem('lastAnalysisData', JSON.stringify(result.data));
            if (window.renderTable) {
                window.renderTable(result.data);
            }
            appendChatMessage('assistant', result.message, result.suggestions);
        } else {
            const errorMsg = result.error || "L'assistant n'a pas pu traiter cette demande.";
            appendChatMessage('assistant', "⚠️ " + errorMsg, result.suggestions);
        }
    } catch (error) {
        console.error("Erreur Fetch:", error);
        appendChatMessage('assistant', "❌ Erreur de connexion avec le serveur.");
    } finally {
        if (sendBtn) sendBtn.disabled = false;
    }
}

// --- INITIALISATION DES ÉVÉNEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendSidebarAi');
    const textarea = document.getElementById('aiSidebarInput');

    if (sendBtn) {
        sendBtn.addEventListener('click', processSidebarAi);
    }
    
    if (textarea) {
        textarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                processSidebarAi();
            }
        });
    }
});