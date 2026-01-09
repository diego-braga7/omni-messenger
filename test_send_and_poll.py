import json, time
from urllib import request, parse

BASE = 'http://localhost:3000'

template_id = '7467477c-b9ee-4dea-8dbc-b13d6631d304'
caption = (
  'Com muita alegria, queremos compartilhar esse\n'
  'momento tão especial com você ☕🤍\n'
  'Preparamos nosso *Chá de Panela* com muito\n'
  'carinho, e sua presença é muito importante para\n'
  'nós.\n'
  'Ao clicar na *xícara* do convite, você será\n'
  'direcionado(a) ao nosso *grupo do WhatsApp*.\n'
  'A sua entrada no grupo será considerada como\n'
  '*confirmação de presença* ☕✨\n'
  'Esperamos você para celebrar conosco!\n'
  'Mical & Neto 💚'
)

payload = {
  'phone': '5564996064649',
  'document': 'https://drive.google.com/uc?export=download&id=1qGzF327qx27tgCC_gQ6-RzTXzCAXsel6',
  'fileName': 'Convite_Cha_de_Panela',
  'extension': 'pdf',
  'caption': caption,
  'modelId': template_id,
}

print('Sending document...')
req = request.Request(
  BASE + '/messenger/document',
  data=json.dumps(payload).encode('utf-8'),
  headers={'Content-Type': 'application/json'},
  method='POST'
)

with request.urlopen(req, timeout=30) as resp:
  body = resp.read().decode('utf-8')
  msg = json.loads(body)

msg_id = msg.get('id')
print('queued_message_id=', msg_id)

if not msg_id:
  print('raw_response=', body)
  raise SystemExit(1)

print('Polling status via history...')
final = None
for i in range(1, 41):
  try:
    # Fetch history page 1 limit 50 (should be enough to find recent message)
    with request.urlopen(BASE + '/messenger/history?page=1&limit=50', timeout=30) as resp:
      history_data = json.loads(resp.read().decode('utf-8'))
    
    # history_data should be { data: [...], total: ... }
    messages = history_data.get('data', [])
    
    # Find our message
    target_msg = next((m for m in messages if m['id'] == msg_id), None)
    
    if target_msg:
        status = target_msg.get('status')
        z = target_msg.get('zApiReturn') or {}
        print(f'[{i:02d}] status={status} zApiReturn.zaapId={z.get("zaapId")} zApiReturn.id={z.get("id")}')
        
        if status in ('SENT', 'FAILED'):
            final = target_msg
            break
    else:
        print(f'[{i:02d}] Message not found in recent history yet...')

  except Exception as e:
    print(f'[{i:02d}] error={e}')
  
  time.sleep(2)

print('final_status=', (final or {}).get('status'))
print('z_api_return_present=', bool(final and final.get('zApiReturn')))
