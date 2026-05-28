/**
 * Safe client-side markdown → HTML parser for task descriptions.
 * Supports: bold, italic, h1/h2, bullet lists, links, images, videos, task badges.
 *
 * Strategy: collect raw HTML blocks first (images/videos/task badges/links),
 * replace them with stable placeholders, HTML-escape everything else, then
 * restore the raw HTML. This avoids double-escaping URLs/src attributes.
 */
function sanitizeUrl(url) {
  if (!url) return '';
  // Remove control characters and whitespace
  let cleaned = url.replace(/[\x00-\x1F\x7F-\x9F\s]/g, '').trim();

  // Decode basic HTML entities to avoid entity-based bypasses (e.g. &#58; for colon, &#x09; for tab)
  cleaned = cleaned
    .replace(/&col;/gi, ':')
    .replace(/&#[xX]3[aA];/g, ':')
    .replace(/&#58;/g, ':')
    .replace(/&#[xX]0*[9aAdD];/g, '')
    .replace(/&#9;/g, '')
    .replace(/&#10;/g, '')
    .replace(/&#13;/g, '');

  // If it starts with data:, it must only be image or video
  if (/^data:/i.test(cleaned)) {
    if (/^data:(image|video)\//i.test(cleaned)) {
      return cleaned;
    }
    return '#blocked';
  }

  // Strictly block javascript:, vbscript:, etc.
  if (/^(javascript|vbscript|file|about|chrome|mocha|onclick|onload|onerror):/i.test(cleaned)) {
    return '#blocked';
  }

  return cleaned;
}

export function parseMarkdownToHtml(markdown) {
  if (!markdown) return '';

  const blocks = [];   // holds raw HTML strings
  let text = markdown;

  // Helper: stash a raw HTML snippet and return a unique placeholder
  const stash = (rawHtml) => {
    const id = `\x00BLOCK${blocks.length}\x00`;
    blocks.push(rawHtml);
    return id;
  };

  // 1. Detect & stash task references FIRST (before any URL processing)
  //    Syntax: [#task:OBJECTID:Title text]
  text = text.replace(/\[#task:([a-fA-F0-9]{24}):([^\]]+)\]/g, (_, id, title) =>
    stash(
      `<span class="task-link-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400 hover:bg-indigo-900 transition-colors text-[10px] font-black cursor-pointer align-middle select-none" data-task-id="${id}" title="Open: ${title}">` +
      `<svg class="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>` +
      `<span>#${title}</span></span>`
    )
  );

  // 2. Detect & stash images/videos: ![alt](src)
  //    src can be http(s), relative path, or data: URI
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const safeAlt = alt.replace(/"/g, '&quot;');
    const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
    
    if (isYouTube) {
      let videoId = '';
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = src.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
      if (videoId) {
        const safeVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        return stash(
          `<div class="my-3 max-w-full aspect-video" style="height:315px"><iframe src="https://www.youtube.com/embed/${safeVideoId}" title="${safeAlt || 'YouTube Video'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="w-full h-full rounded-xl border border-slate-800 shadow-lg"></iframe></div>`
        );
      }
    }

    const safeSrc = sanitizeUrl(src);
    const isVideo =
      src.match(/\.(mp4|webm|ogg)(\?[^)]*)?$/i) ||
      alt.toLowerCase().includes('video') ||
      src.startsWith('data:video/');
    if (isVideo) {
      return stash(
        `<div class="my-3 max-w-full"><video src="${safeSrc}" controls class="w-full rounded-xl border border-slate-800 shadow-lg bg-black" style="max-height:300px"></video></div>`
      );
    }
    return stash(
      `<div class="my-3 max-w-full"><img src="${safeSrc}" alt="${safeAlt}" class="max-w-full rounded-xl border border-slate-800 shadow-md" style="max-height:300px;object-fit:contain"/></div>`
    );
  });

  // 3. Detect & stash hyperlinks: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = sanitizeUrl(href);
    return stash(
      `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300 underline font-bold transition-colors">${label}</a>`
    );
  });

  // 4. HTML-escape the remaining plain text (no double-escaping stashed blocks)
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Placeholders contain \x00 which is safe — no conflict

  // 5. Apply inline Markdown on the plain-text portion
  //    Bold: **text**
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="text-slate-100">$1</strong>');
  //    Italic: *text*
  text = text.replace(/\*([^*\n]+)\*/g, '<em class="italic text-slate-300">$1</em>');

  // 6. Block-level Markdown (per-line)
  text = text
    .split('\n')
    .map((line) => {
      if (/^##\s+/.test(line))
        return `<h2 class="text-sm font-extrabold text-slate-200 mt-4 mb-1">${line.replace(/^##\s+/, '')}</h2>`;
      if (/^#\s+/.test(line))
        return `<h1 class="text-base font-black text-slate-100 mt-4 mb-2">${line.replace(/^#\s+/, '')}</h1>`;
      if (/^-\s+/.test(line))
        return `<li class="list-disc ml-5 text-slate-300 my-0.5">${line.replace(/^-\s+/, '')}</li>`;
      if (line.trim() === '') return '<br/>';
      return line;
    })
    .join('\n');

  // 7. Restore stashed HTML blocks (un-escape the placeholders first)
  text = text.replace(/\x00BLOCK(\d+)\x00/g, (_, i) => blocks[Number(i)]);

  // 8. Convert remaining newlines to <br>
  text = text.replace(/\n/g, '<br/>');

  return text;
}
