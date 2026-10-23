import { db } from '@appdeploy/sdk';

type Subscription = {
  id?: string;
  connection_id: string;
  topic: string;
  created_at: number;
};

export async function addSubscription(connectionId: string, topic: string) {
  await db.add('pledge_realtime_subscriptions', [{
    connection_id: connectionId,
    topic,
    created_at: Date.now(),
  }]);
}

export async function removeSubscriptionsByConnection(connectionId: string) {
  const { items } = await db.list<Subscription>('pledge_realtime_subscriptions', { limit: 100 });
  const matches = items.filter((x) => x.connection_id === connectionId);
  if (matches.length === 0) return;
  await db.delete('pledge_realtime_subscriptions', matches.map((x) => x.id!).filter(Boolean));
}

export async function getSubscribers(topic: string) {
  const { items } = await db.list<Subscription>('pledge_realtime_subscriptions', { limit: 100 });
  return items.filter((x) => x.topic === topic).map((x) => x.connection_id);
}
