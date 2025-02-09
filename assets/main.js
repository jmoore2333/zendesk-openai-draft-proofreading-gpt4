async function updateSummary(client, btn) {
  const convo = await getTicketConvo(client, btn.getAttribute('data-btn-id'));
  const prompt = await getPrompt(btn.getAttribute('data-btn-id'), convo);
  const summary = await getSummary(client, prompt);
  if(summary.length > 20) {
    client.set('comment.text', ''); // Delete comment
    client.invoke('ticket.editor.insert', summary);
  } else {
    // OpenAI response is too short
    client.invoke('ticket.editor.insert', "// Returned message is too short or something wrong. Please retry it.");
  }
  btn.classList.remove("button--loading");
  client.invoke('app.close')
}

async function getTicketConvo(client, id) {
  if (id == 'draft-ja' || id == 'draft-en') {
    const ticketConvo = await client.get("ticket.conversation");
    return JSON.stringify(ticketConvo["ticket.conversation"]);
  }
  if (id == 'proofread-ja' || id == 'proofread-en') {
    const ticketResponse = await client.get('ticket.comment.text');
    return JSON.stringify(ticketResponse["ticket.comment.text"]);
  }
}

async function getPrompt(id, convo) {
  prompt = '';
  switch (id) {
    case 'draft-ja':
      prompt = `
      I want you to act as an AI technical support engineer. 
      The following is a conversation between a support engineer and a customer.
      Your task is to use artificial intelligence tools, such as natural language processing, with your rhetorical knowledge and experience about effective writing techniques to write a HTML email response on behalf of the support engineer.
      As a requirement, use '</br>' tag instead of '\n' in the message, and write the draft in Japanese.
    
      ${convo}`;
      break;
    case 'proofread-ja':
      prompt = `
      I want you to act as an AI technical support engineer. 
      The following message with html tags is a draft to a customer by a support engineer.
      Your task is to use artificial intelligence tools, such as natural language processing, with your rhetorical knowledge and experience about effective writing techniques to proofread a HTML email response on behalf of the support engineer.
      As a requirement, use '</br>' tag instead of '\n' in the message, and write the draft in Japanese.
    
      ${convo}`;
      break;
    case 'draft-en':
      prompt = `
      I want you to act as an AI technical support engineer. 
      The following is a conversation between a support engineer and a customer.
      Your task is to use artificial intelligence tools, such as natural language processing, with your rhetorical knowledge and experience about effective writing techniques to write a HTML email response on behalf of the support engineer.
      As a requirement, use '</br>' tag instead of '\n' in the message, and write the draft in English.
    
      ${convo}`;
      break;
    case 'proofread-en':
      prompt = `
      I want you to act as an AI technical support engineer. 
      The following message with html tags is a draft to a customer by a support engineer.
      Your task is to use artificial intelligence tools, such as natural language processing, with your rhetorical knowledge and experience about effective writing techniques to proofread a HTML email response on behalf of the support engineer.
      As a requirement, use '</br>' tag instead of '\n' in the message, and write the draft in English.
    
      ${convo}`;
      break;
  }
  return prompt;
}

async function getSummary(client, prompt) {
  const options = {
    url: "https://api.openai.com/v1/chat/completions",
    type: "POST",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer {{setting.openAiApiToken}}",
    },
    data: JSON.stringify({
      model: "gpt-4-1106-preview",
      messages: [{ role: "user", content: prompt }],
    }),
    secure: true,
  };
  try {
    const response = await client.request(options);
    return response.choices[0].message.content.trim().replace(/(?:\r\n|\r|\n)/g, '<br>');
  } catch (e) {
     client.invoke('ticket.editor.insert', e.message);
     client.invoke('app.close');
     return;
  }
}

function displayLoadingMsg(btn) {
  btn.classList.add("button--loading");
}

async function load(btn) {
  client = ZAFClient.init();
  displayLoadingMsg(btn)
  updateSummary(client, btn)
}
