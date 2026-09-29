# AgroMan Phase 1 demo test cases

These scenarios are designed for a repeatable hackathon video. AI wording can
vary, so verify the behaviours in the **Expected result** column rather than
waiting for an exact sentence.

Before recording, refresh the deployed site, allow the selected language to
finish loading, and start a new conversation for each farmer.

## Farmer 1 — post-harvest crop planning in Ludhiana

| Item          | Demo input                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Region        | Ludhiana, Punjab                                                                                       |
| Language      | Hindi                                                                                                  |
| Question      | `मैंने दो हफ्ते पहले धान की कटाई की है। मेरे पास 3 एकड़ जमीन और सिंचाई है। अगली फसल के लिए क्या करूँ?` |
| Feature shown | Regional context, practical advice, Hindi read aloud                                                   |

Expected result:

- The answer is in Hindi/Devanagari and begins with a direct recommendation.
- It gives no more than three practical actions.
- If district information is used, its date is mentioned and it is described
  as regional information, not the farmer's soil-test result.
- It does not promise an exact yield or invent a weather forecast.
- **Read aloud** speaks the complete answer, not only the first sound.

## Farmer 2 — plant-photo check in Lucknow

| Item          | Demo input                                             |
| ------------- | ------------------------------------------------------ |
| Region        | Lucknow, Uttar Pradesh                                 |
| Language      | Hindi or English                                       |
| Question      | Attach a clear affected-leaf photo, then send it       |
| Feature shown | Photo preparation, cautious visual assessment, privacy |

Use a close-up taken in daylight with one affected leaf filling most of the
frame. Avoid using a downloaded photo whose crop or condition is unknown.

Expected result:

- The selected photo appears before sending and disappears after the response.
- A usable photo can produce a cautious suggestion, model confidence, and one
  to three plain-language observations under **What I can see in the photo**.
- If the image is blurred, distant, artificial, or unrelated, AgroMan returns
  no diagnosis and explains how to retake it.
- It does not give an unverified pesticide product or dosage.
- The photo is not stored in conversation history. A high-confidence suggestion
  may offer anonymous contribution, but nothing is shared without consent.

## Farmer 3 — understanding regional soil information in Pune

| Item          | Demo input                                                                          |
| ------------- | ----------------------------------------------------------------------------------- |
| Region        | Pune, Maharashtra                                                                   |
| Language      | Marathi                                                                             |
| Question      | `मला कांदा लावायचा आहे. अॅपमध्ये दिसणारी मातीची माहिती माझ्या शेतासाठी काय सांगते?` |
| Feature shown | Marathi answer, evidence boundaries, farmer-friendly wording                        |

Expected result:

- The answer uses Marathi script and short, familiar sentences.
- AgroMan clearly calls the displayed values district/regional estimates.
- It says they are not a laboratory measurement from this farmer's field.
- It recommends a soil test when a field-specific decision depends on pH or
  nutrients, rather than pretending the regional value is exact.
- Only one follow-up question is asked, and only if it would change the advice.

## Farmer 4 — community disease watch in Nashik

| Item          | Demo input                                      |
| ------------- | ----------------------------------------------- |
| Region        | Nashik, Maharashtra                             |
| Language      | English or Marathi                              |
| Action        | Open **Community watch** after selecting Nashik |
| Feature shown | Anonymous, aggregated outbreak signals          |

Expected result:

- The page shows only the selected district's recent aggregated observations.
- With no qualifying reports, it honestly says no qualifying observations are
  available; it must not manufacture an outbreak for the video.
- If reports exist, they are labelled as observation, under observation, or a
  potential outbreak—not as a confirmed outbreak.
- No farmer name, profile, raw photo, or exact GPS coordinate is displayed.

## Quick negative tests

Run these after the four main scenarios if the video has time:

1. Upload a plain colour image: expected result is no diagnosis and clear
   retake instructions.
2. Turn off the network: saved conversations remain visible and sending is
   disabled or reports an offline state.
3. Change district during an existing conversation: AgroMan keeps the thread's
   original region or starts a new region-specific conversation.
4. Ask for a guaranteed yield or exact pesticide dose: AgroMan should refuse to
   guarantee it and direct chemical-treatment decisions to a qualified local
   agriculture professional.

## Video recording checklist

- Show the selected district and language before each question.
- Pause on the regional observation date and the “not a laboratory soil test”
  notice.
- For the photo scenario, show both a valid image and the invalid-image guard.
- Let Hindi/Marathi read aloud play for at least one full sentence.
- Describe AI confidence as a model estimate, never diagnostic certainty.
- Do not promise that all of India is covered: Phase 1 currently supports
  Ludhiana, Amritsar, Lucknow, Varanasi, Pune, and Nashik.
