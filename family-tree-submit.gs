/**
 * Mantripragada Family Tree — Google Apps Script Pipeline
 *
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Open script.google.com → New project → paste this file.
 * 2. Project Settings → Script Properties → add:
 *      ANTHROPIC_API_KEY  = sk-ant-...
 *      GITHUB_TOKEN       = github_pat_...   (needs repo scope)
 *      OWNER_EMAIL        = your-gmail@gmail.com
 *      GITHUB_OWNER       = mantripragada-sai-pavan-aditya
 *      GITHUB_REPO        = mantripragada-sai-pavan-aditya.github.io
 *      GITHUB_BRANCH      = main
 *      GITHUB_FILE_PATH   = family-tree/index.html
 * 3. Deploy → New deployment → Web App:
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the Web App URL → paste it as WEB_APP_URL below.
 * 4. Connect to your Google Form:
 *      Triggers → Add trigger → onFormSubmit → From spreadsheet/form → On form submit
 * 5. In family-tree/index.html, set the FORM_URL constant to your Google Form URL.
 *
 * GOOGLE FORM FIELDS (create in this order — order matters for parseFormResponse)
 * ───────────────────────────────────────────────────────────────────────────────
 *  1. Your Full Name  (short text, required)
 *  2. Your Email      (short text, required) — for confirmation
 *  3. Relation / Branch context  (short text, e.g. "Branch A, child of Radhamma #10")
 *  4. Generation number  (multiple choice: 6, 7, 8)
 *  5. Your birth year  (short text)
 *  6. Your spouse's name  (short text, optional)
 *  7. Your children's names  (paragraph, optional — one per line)
 *  8. Additional notes  (paragraph, optional)
 */

// ─── CONFIG ────────────────────────────────────────────────────────────────
const WEB_APP_URL = ''; // ← paste your deployed Web App URL here

function prop(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

// ─── FORM SUBMIT TRIGGER ────────────────────────────────────────────────────
function onFormSubmit(e) {
  try {
    const data = parseFormResponse(e);
    const vet  = vetWithClaude(data);

    if (vet.approved) {
      publishToGitHub(vet.injectMarker, vet.htmlSnippet);
      sendConfirmationEmail(data.email, data.name, vet.memberNumber);
    } else {
      sendApprovalEmail(data, vet);
    }
  } catch (err) {
    MailApp.sendEmail(prop('OWNER_EMAIL'),
      '[Family Tree] Pipeline error',
      'Error processing submission:\n\n' + err.toString() + '\n\nStack:\n' + err.stack
    );
  }
}

// ─── PARSE FORM RESPONSE ────────────────────────────────────────────────────
function parseFormResponse(e) {
  const r = e.response.getItemResponses();
  const get = (i) => (r[i] ? r[i].getResponse() : '').toString().trim();
  return {
    name:       get(0),
    email:      get(1),
    context:    get(2),  // "Branch A, child of Radhamma #10"
    generation: get(3),  // "6", "7", or "8"
    birthYear:  get(4),
    spouse:     get(5),
    children:   get(6),
    notes:      get(7),
    timestamp:  new Date().toISOString(),
  };
}

// ─── VET WITH CLAUDE ────────────────────────────────────────────────────────
function vetWithClaude(data) {
  const currentHtml = fetchFileFromGitHub();

  const systemPrompt = `You are a family tree data validator for the Mantripragada family tree website.
The tree covers 8 generations from ~1816 to present day, with two branches (A and B).
Branch A descends from Venkatrama Rao (1872). Branch B from Venkaiah.
Generation VII members were born roughly 1955–1985. Generation VIII members 2000+.
The site uses glassmorphism HTML cards with specific inject markers.`;

  const userPrompt = `A family member submitted details to be added to the tree.

SUBMISSION:
  Name:        ${data.name}
  Email:       ${data.email}
  Context:     ${data.context}
  Generation:  ${data.generation}
  Birth year:  ${data.birthYear}
  Spouse:      ${data.spouse || '—'}
  Children:    ${data.children || '—'}
  Notes:       ${data.notes || '—'}

CURRENT HTML (truncated to injection markers):
${extractMarkerContext(currentHtml)}

TASK:
1. Check if this person already appears in the HTML (duplicate check).
2. Validate birth year is plausible for the stated generation.
3. Validate the context/parent is recognisable in the HTML.
4. Determine the correct <!-- INJECT:... --> marker to use.
   - Gen VII Branch A daughters: gen7-brA-10 through gen7-brA-18
   - Gen VII Branch B daughters: gen7-brB-23 through gen7-brB-25, gen7-brB-27, gen7-brB-28, gen7-brB-30, gen7-brB-31
   - Gen VIII new arrivals: gen8-new
5. Generate a clean HTML card snippet to insert BEFORE that marker.
   Use this exact format (one line, no extra whitespace):
   <div class="nc [male|female]" onclick="openModal(this)" data-gen="[N]" data-num="[XX]" data-name="[Full Name]" data-years="[YYYY]–" data-spouse="[spouse or —]" data-children="[children or —]" data-notes="[notes or —]"><div class="nc-avatar">[initials]</div><div class="nc-num">#[XX]</div><div class="nc-name">[Full Name]</div><div class="nc-year">[YYYY]–</div>[spouse line if exists]</div>
   For #XX use the next available sequential number based on existing members in that group.
   For gender: use "male" or "female" based on the name/context. If unclear, use "female" for names ending in typical Telugu female suffixes (Devi, Latha, Vathi, Rani, etc.).

Respond ONLY with valid JSON (no markdown), exactly this shape:
{
  "approved": true|false,
  "reason": "one sentence",
  "warnings": ["array of warnings, empty if none"],
  "injectMarker": "gen7-brA-10",
  "htmlSnippet": "<div class=\\"nc ...\\">...</div>",
  "memberNumber": 45
}
If not approved, set htmlSnippet and injectMarker to null.`;

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key':         prop('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    muteHttpExceptions: true,
  });

  const body = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200) {
    throw new Error('Claude API error: ' + JSON.stringify(body));
  }

  const text = body.content[0].text.trim();
  return JSON.parse(text);
}

// Extract just the lines around INJECT markers so the prompt stays compact
function extractMarkerContext(html) {
  const lines  = html.split('\n');
  const result = [];
  lines.forEach((line, i) => {
    if (line.includes('INJECT:')) {
      result.push('line ' + (i+1) + ': ' + line.trim());
      if (lines[i-1]) result.push('  prev: ' + lines[i-1].trim());
    }
  });
  return result.join('\n');
}

// ─── PUBLISH TO GITHUB ──────────────────────────────────────────────────────
function publishToGitHub(injectMarker, htmlSnippet) {
  const { content, sha } = fetchFileFromGitHub(true);
  const marker = '<!-- INJECT:' + injectMarker + ' -->';
  if (!content.includes(marker)) {
    throw new Error('Inject marker not found in HTML: ' + marker);
  }
  const updated = content.replace(marker, htmlSnippet + '\n    ' + marker);
  pushFileToGitHub(updated, sha, 'feat: add family member via form submission [auto]');
}

// ─── GITHUB HELPERS ─────────────────────────────────────────────────────────
function githubApiBase() {
  return 'https://api.github.com/repos/' + prop('GITHUB_OWNER') + '/' + prop('GITHUB_REPO') + '/contents/' + prop('GITHUB_FILE_PATH');
}

function fetchFileFromGitHub(returnBoth) {
  const url = githubApiBase() + '?ref=' + prop('GITHUB_BRANCH');
  const resp = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + prop('GITHUB_TOKEN'),
      Accept: 'application/vnd.github.v3+json',
    },
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200) {
    throw new Error('GitHub fetch error: ' + resp.getContentText());
  }
  const json    = JSON.parse(resp.getContentText());
  const content = Utilities.newBlob(Utilities.base64Decode(json.content.replace(/\n/g,''))).getDataAsString();
  if (returnBoth) return { content, sha: json.sha };
  return content;
}

function pushFileToGitHub(content, sha, message) {
  const encoded = Utilities.base64Encode(Utilities.newBlob(content).getBytes());
  const resp = UrlFetchApp.fetch(githubApiBase(), {
    method: 'put',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + prop('GITHUB_TOKEN'),
      Accept: 'application/vnd.github.v3+json',
    },
    payload: JSON.stringify({
      message,
      content:  encoded,
      sha,
      branch:   prop('GITHUB_BRANCH'),
    }),
    muteHttpExceptions: true,
  });
  if (resp.getResponseCode() !== 200 && resp.getResponseCode() !== 201) {
    throw new Error('GitHub push error: ' + resp.getContentText());
  }
  return JSON.parse(resp.getContentText());
}

// ─── EMAIL: CONFIRMATION TO SUBMITTER ───────────────────────────────────────
function sendConfirmationEmail(toEmail, name, memberNumber) {
  if (!toEmail) return;
  MailApp.sendEmail({
    to:      toEmail,
    subject: 'You\'ve been added to the Mantripragada Family Tree!',
    body: `Dear ${name},\n\nThank you for submitting your details.\n\nYour profile (#${memberNumber}) has been reviewed and is now live on the family tree:\nhttps://mantripragada-sai-pavan-aditya.github.io/family-tree/\n\nWarm regards,\nMantripragada Family Tree`,
    htmlBody: `
<p>Dear <strong>${name}</strong>,</p>
<p>Thank you for submitting your details to the Mantripragada Family Tree.</p>
<p>Your profile (<strong>#${memberNumber}</strong>) has been verified and is now live:</p>
<p><a href="https://mantripragada-sai-pavan-aditya.github.io/family-tree/" style="color:#7c6af7;font-weight:bold">View the Family Tree →</a></p>
<p style="color:#888;font-size:13px">Mantripragada Vamsavrukshamu</p>`,
  });
}

// ─── EMAIL: APPROVAL REQUEST TO OWNER ───────────────────────────────────────
function sendApprovalEmail(data, vet) {
  const token   = generateApprovalToken(data);
  const baseUrl = WEB_APP_URL + '?token=' + encodeURIComponent(token);
  const approveUrl = baseUrl + '&action=approve';
  const rejectUrl  = baseUrl + '&action=reject';

  const details = JSON.stringify(data, null, 2);

  MailApp.sendEmail({
    to:      prop('OWNER_EMAIL'),
    subject: '[Family Tree] Review needed: ' + data.name,
    body: `A new family tree submission needs your review.\n\nReason flagged: ${vet.reason}\nWarnings: ${(vet.warnings||[]).join(', ') || 'none'}\n\nSubmission:\n${details}\n\nGenerated HTML:\n${vet.htmlSnippet || '(none — not approved by Claude)'}\nInject marker: ${vet.injectMarker || '(none)'}\n\nAPPROVE: ${approveUrl}\nREJECT:  ${rejectUrl}`,
    htmlBody: `
<h2 style="font-family:sans-serif">Family Tree Submission Review</h2>
<p style="font-family:sans-serif"><strong>Reason flagged:</strong> ${vet.reason}</p>
${vet.warnings && vet.warnings.length ? '<p style="color:#d97706;font-family:sans-serif"><strong>Warnings:</strong> ' + vet.warnings.join(', ') + '</p>' : ''}
<h3 style="font-family:sans-serif">Submission Details</h3>
<table style="font-family:sans-serif;border-collapse:collapse;font-size:14px">
  <tr><td style="padding:4px 12px 4px 0;color:#888">Name</td><td>${data.name}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Email</td><td>${data.email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Context</td><td>${data.context}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Generation</td><td>${data.generation}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Birth Year</td><td>${data.birthYear}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Spouse</td><td>${data.spouse || '—'}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Children</td><td>${(data.children||'—').replace(/\n/g,'<br>')}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888">Notes</td><td>${data.notes || '—'}</td></tr>
</table>
${vet.htmlSnippet ? '<h3 style="font-family:sans-serif">Generated HTML Card</h3><pre style="background:#f4f4f4;padding:12px;font-size:12px;overflow:auto">' + vet.htmlSnippet.replace(/</g,'&lt;') + '</pre><p style="font-family:sans-serif">Inject marker: <code>' + vet.injectMarker + '</code></p>' : '<p style="color:#cc0000;font-family:sans-serif">Claude did not generate a card (not auto-approvable).</p>'}
<div style="margin-top:24px">
  <a href="${approveUrl}" style="background:#7c6af7;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-weight:bold;margin-right:12px">✓ Approve &amp; Publish</a>
  <a href="${rejectUrl}"  style="background:#6b7280;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-weight:bold">✗ Reject</a>
</div>
<p style="font-family:sans-serif;font-size:12px;color:#888;margin-top:16px">Links expire after 7 days. Submitter email: ${data.email}</p>`,
  });
}

// ─── WEB APP: APPROVE / REJECT HANDLER ──────────────────────────────────────
function doGet(e) {
  const token  = e.parameter.token;
  const action = e.parameter.action;

  if (!token || !action) {
    return HtmlService.createHtmlOutput('<p>Invalid link.</p>');
  }

  try {
    const data = decodeApprovalToken(token);
    if (!data) return HtmlService.createHtmlOutput('<p>Token invalid or expired.</p>');

    if (action === 'approve') {
      // Re-run Claude to regenerate the HTML snippet, then publish
      const vet = vetWithClaude(data);
      if (!vet.htmlSnippet || !vet.injectMarker) {
        return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;color:#cc0000">Claude could not generate a valid card for this submission. Please add manually.</p>');
      }
      publishToGitHub(vet.injectMarker, vet.htmlSnippet);
      sendConfirmationEmail(data.email, data.name, vet.memberNumber);
      return HtmlService.createHtmlOutput(`
        <div style="font-family:sans-serif;max-width:500px;margin:40px auto;text-align:center">
          <h2 style="color:#7c6af7">✓ Published!</h2>
          <p>${data.name} has been added to the family tree.</p>
          <a href="https://mantripragada-sai-pavan-aditya.github.io/family-tree/" style="color:#7c6af7">View the tree →</a>
        </div>`);

    } else if (action === 'reject') {
      if (data.email) {
        MailApp.sendEmail(data.email, 'Regarding your Family Tree submission',
          `Dear ${data.name},\n\nThank you for your interest in the Mantripragada Family Tree.\nAfter review, your submission could not be added at this time. Please contact us if you have questions.\n\nRegards,\nFamily Tree Admin`);
      }
      return HtmlService.createHtmlOutput(`
        <div style="font-family:sans-serif;max-width:500px;margin:40px auto;text-align:center">
          <h2>Submission Rejected</h2>
          <p>The submitter has been notified.</p>
        </div>`);
    }
  } catch (err) {
    return HtmlService.createHtmlOutput('<p style="color:red">Error: ' + err.toString() + '</p>');
  }

  return HtmlService.createHtmlOutput('<p>Unknown action.</p>');
}

// ─── TOKEN HELPERS ───────────────────────────────────────────────────────────
// Stores submission data in Script Properties keyed by token (valid 7 days)
function generateApprovalToken(data) {
  const token   = Utilities.getUuid();
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  PropertiesService.getScriptProperties().setProperty(
    'token_' + token,
    JSON.stringify({ data, expires })
  );
  return token;
}

function decodeApprovalToken(token) {
  const raw = PropertiesService.getScriptProperties().getProperty('token_' + token);
  if (!raw) return null;
  const { data, expires } = JSON.parse(raw);
  if (Date.now() > expires) return null;
  return data;
}
