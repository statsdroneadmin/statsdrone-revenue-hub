export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const pollId = searchParams.get('id');
  if (!pollId) {
    return new Response(JSON.stringify({ error: 'Missing poll id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await context.env.POLLS.get(`poll:${pollId}`, 'json');
  const votes = data || {};

  return new Response(JSON.stringify({ votes }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  const { id, option } = body;

  if (!id || option === undefined) {
    return new Response(JSON.stringify({ error: 'Missing id or option' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get current votes
  const data = await context.env.POLLS.get(`poll:${id}`, 'json');
  const votes = data || {};
  votes[option] = (votes[option] || 0) + 1;

  // Save updated votes
  await context.env.POLLS.put(`poll:${id}`, JSON.stringify(votes));

  return new Response(JSON.stringify({ votes }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
