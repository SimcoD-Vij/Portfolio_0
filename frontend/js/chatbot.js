function initChatbot() {
  const widget = document.createElement('div');
  widget.id = 'chatbot-widget';
  widget.innerHTML = `
    <button id="chat-toggle" class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all hover:scale-105">
      <svg id="chat-icon" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
      <svg id="close-icon" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <div id="chat-panel" class="fixed bottom-24 right-6 z-40 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl hidden flex-col overflow-hidden">
      <div class="bg-gray-800 px-4 py-3 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">AI</div>
        <div>
          <p class="text-sm font-medium text-white">Portfolio Assistant</p>
          <p class="text-xs text-gray-400">Ask about any project</p>
        </div>
      </div>
      <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
        <div class="bot-msg"><p class="text-sm text-gray-300 bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-xs">Hi! Ask me anything about the projects here. 👋</p></div>
      </div>
      <div class="p-3 border-t border-gray-700 flex gap-2">
        <input id="chat-input" type="text" placeholder="Ask a question..." class="flex-1 bg-gray-800 text-sm text-white placeholder-gray-500 rounded-xl px-3 py-2 outline-none border border-gray-700 focus:border-indigo-500"/>
        <button id="chat-send" class="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3 py-2 text-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  const panel = document.getElementById('chat-panel');
  const toggle = document.getElementById('chat-toggle');
  const chatIcon = document.getElementById('chat-icon');
  const closeIcon = document.getElementById('close-icon');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');

  toggle.addEventListener('click', () => {
    const isOpen = !panel.classList.contains('hidden');
    panel.classList.toggle('hidden', isOpen);
    panel.classList.toggle('flex', !isOpen);
    chatIcon.classList.toggle('hidden', !isOpen);
    closeIcon.classList.toggle('hidden', isOpen);
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // User bubble
    messages.innerHTML += `<div class="flex justify-end"><p class="text-sm text-white bg-indigo-600 rounded-2xl rounded-tr-sm px-3 py-2 inline-block max-w-xs">${escHtml(text)}</p></div>`;

    // Loading
    const loadId = 'load-' + Date.now();
    messages.innerHTML += `<div id="${loadId}" class="bot-msg"><p class="text-sm text-gray-400 bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 inline-block">Thinking…</p></div>`;
    messages.scrollTop = messages.scrollHeight;

    try {
      const data = await api('/chatbot', { method: 'POST', body: JSON.stringify({ query: text }) });
      document.getElementById(loadId).outerHTML = `<div class="bot-msg"><div class="text-sm text-gray-300 bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-xs leading-relaxed">${renderMarkdown(data.reply)}</div></div>`;
    } catch {
      document.getElementById(loadId).outerHTML = `<div class="bot-msg"><p class="text-sm text-red-400 bg-gray-800 rounded-2xl px-3 py-2 inline-block">Sorry, something went wrong.</p></div>`;
    }
    messages.scrollTop = messages.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
}
