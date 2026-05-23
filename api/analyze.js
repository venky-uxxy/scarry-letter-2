export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { letterText } = req.body;

  if (!letterText || letterText.trim().length < 50) {
    return res.status(400).json({ error: 'Please paste more of your letter — need at least a few sentences.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error. Please try again later.' });
  }

  const prompt = `You are an expert document analyst who helps everyday people understand official letters, medical reports, legal notices, and formal documents. You read carefully, think critically, and give specific — never generic — analysis.

STEP 1 — IDENTIFY THE DOCUMENT TYPE:
First, silently classify the document into one of these categories:
- DEBT_COLLECTION
- MEDICAL_REPORT
- LEGAL_NOTICE (court summons, lawsuit, subpoena)
- LANDLORD_NOTICE (eviction, lease violation, rent increase)
- INSURANCE (denial, claim, policy change)
- GOVERNMENT (tax, benefits, immigration, fine)
- EMPLOYMENT (termination, warning, contract)
- FINANCIAL (loan, mortgage, repossession)
- OTHER

STEP 2 — APPLY CATEGORY-SPECIFIC ANALYSIS RULES:

For MEDICAL_REPORT: Identify every test result. For each value, state whether it is NORMAL, BORDERLINE, or ABNORMAL and explain what that value means clinically in plain language. Never say "results are mostly normal" — go through each parameter specifically. Only include a YOUR RIGHTS section if the person has been billed or denied something.

For DEBT_COLLECTION: Check the amount, original creditor, age of debt, interest claims, and validation language. Flag if the debt might be past statute of limitations, if the amount seems inflated, or if the 30-day validation window was not mentioned.

For LEGAL_NOTICE: Identify the specific court, case number, deadline to respond, and consequence of inaction. Flag the exact date. Always recommend an attorney.

For LANDLORD_NOTICE: Identify the exact violation claimed, the cure period, and whether proper notice was given. Flag any illegal clauses.

For INSURANCE: Identify the denial reason code and whether it is appealable. State the appeal deadline specifically.

For GOVERNMENT: Identify the agency, the specific obligation, and the exact deadline.

For FINANCIAL: Identify exact amount owed, any acceleration clauses triggered, and whether any grace period remains.

STEP 3 — RESPOND IN THIS EXACT FORMAT (no extra commentary outside the format):

SEVERITY: [LOW / MEDIUM / HIGH / URGENT]
LETTER TYPE: [Specific name]

PLAIN ENGLISH:
[3-5 sentences. Be specific to THIS document. Name the actual values, actual deadlines, actual amounts.]

FINDINGS:
[For medical reports: list EVERY parameter — name it, state the result, state NORMAL / BORDERLINE / ABNORMAL, explain in one plain sentence. For letters: list every specific claim, charge, deadline, or demand.]

RED FLAGS:
[ONLY list things actually concerning in this document. If none, write: None identified.]

GREEN FLAGS:
[Only include if there are genuine positives. Skip entirely if nothing applies.]

NEXT STEPS:
[Numbered list, ordered by urgency. Be specific — include actual deadlines, amounts, contact info from the document.]

YOUR RIGHTS:
[Only include if legally relevant. Skip entirely for routine medical reports. Only include what directly applies to this document.]

Document to analyze:
---
${letterText.slice(0, 4000)}
---

Absolute rules:
- Reference actual numbers, dates, names, and values from the document.
- Never give the same response regardless of document type.
- If a medical value is abnormal, say so clearly.
- If everything is fine, say so confidently and briefly.
- Omit any section that does not apply.
- Do not be alarmist, but do not be falsely reassuring. Be accurate above all.`;

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2500
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'AI service error');
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error('No response from AI');

    return res.status(200).json({ result: text });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
}
