import { STATUS_LABEL, type OrderStatus } from '@/lib/orderStatus';

const STYLE: Record<OrderStatus, string> = {
  new: 'bg-brand text-white',
  confirmed: 'bg-brand/15 text-brand',
  shipped: 'bg-brand/15 text-brand',
  delivered: 'bg-ink/10 text-ink',
  canceled: 'bg-rose/15 text-rose',
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ' + STYLE[status]}>{STATUS_LABEL[status]}</span>;
}
