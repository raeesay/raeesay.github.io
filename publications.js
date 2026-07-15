function parseBibtex(text) {
  const entries = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text[i] === '@') {
      const braceStart = text.indexOf('{', i);
      if (braceStart === -1) break;
      const type = text.slice(i + 1, braceStart).trim().toLowerCase();
      let depth = 1;
      let j = braceStart + 1;
      while (j < n && depth > 0) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') depth--;
        j++;
      }
      entries.push(parseEntryBody(type, text.slice(braceStart + 1, j - 1)));
      i = j;
    } else {
      i++;
    }
  }
  return entries;
}

function parseEntryBody(type, body) {
  const firstComma = body.indexOf(',');
  const key = body.slice(0, firstComma).trim();
  const fieldsStr = body.slice(firstComma + 1);
  const fields = {};
  let i = 0;
  const n = fieldsStr.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(fieldsStr[i])) i++;
    if (i >= n) break;
    const eq = fieldsStr.indexOf('=', i);
    if (eq === -1) break;
    const name = fieldsStr.slice(i, eq).trim().toLowerCase();
    i = eq + 1;
    while (i < n && /\s/.test(fieldsStr[i])) i++;
    let value = '';
    if (fieldsStr[i] === '{') {
      let depth = 1;
      i++;
      const start = i;
      while (i < n && depth > 0) {
        if (fieldsStr[i] === '{') depth++;
        else if (fieldsStr[i] === '}') depth--;
        if (depth > 0) i++;
      }
      value = fieldsStr.slice(start, i);
      i++;
    } else if (fieldsStr[i] === '"') {
      i++;
      const start = i;
      while (i < n && fieldsStr[i] !== '"') i++;
      value = fieldsStr.slice(start, i);
      i++;
    } else {
      const start = i;
      while (i < n && fieldsStr[i] !== ',') i++;
      value = fieldsStr.slice(start, i).trim();
    }
    fields[name] = value.replace(/[{}]/g, '').trim();
    while (i < n && fieldsStr[i] !== ',') i++;
    i++;
  }
  return { type, key, fields };
}

function formatAuthors(authorField) {
  if (!authorField) return '';
  return authorField
    .split(/\s+and\s+/)
    .map((name) => {
      name = name.trim();
      if (name.includes(',')) {
        const [last, first] = name.split(',').map((s) => s.trim());
        return `${first} ${last}`;
      }
      return name;
    })
    .join(', ');
}

function renderEntry(entry) {
  const f = entry.fields;
  const venue = f.journal || f.booktitle || '';
  const year = f.year || '';
  const link = f.url || (f.doi ? `https://doi.org/${f.doi}` : '');

  const li = document.createElement('li');

  const titleDiv = document.createElement('div');
  titleDiv.className = 'pub-title';
  if (link) {
    const a = document.createElement('a');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = f.title;
    titleDiv.appendChild(a);
  } else {
    titleDiv.textContent = f.title;
  }

  const metaDiv = document.createElement('div');
  metaDiv.className = 'pub-meta';
  metaDiv.textContent = [formatAuthors(f.author), [venue, year].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ');

  li.appendChild(titleDiv);
  li.appendChild(metaDiv);
  return li;
}

document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('pub-list');
  if (!list) return;

  fetch('publications.bib')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load publications.bib');
      return res.text();
    })
    .then((text) => {
      const entries = parseBibtex(text);
      entries.sort((a, b) => (b.fields.year || 0) - (a.fields.year || 0));
      list.innerHTML = '';
      entries.forEach((entry) => list.appendChild(renderEntry(entry)));
    })
    .catch(() => {
      list.innerHTML = '<li><span class="placeholder">Could not load publications.bib</span></li>';
    });
});
