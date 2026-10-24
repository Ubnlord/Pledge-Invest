-- Prevent a blockchain transaction from being submitted more than once for the same network.
-- Existing duplicate check was clean before this index was added.
create unique index if not exists pledge_deposit_requests_network_tx_hash_uidx
on public.pledge_records (
  (lower(trim(record->>'network'))),
  (lower(trim(record->>'tx_hash')))
)
where table_name='pledge_deposit_requests'
  and nullif(trim(record->>'tx_hash'),'') is not null;
