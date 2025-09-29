import { PublicReceipt } from "@/components/sales/public-receipt"

interface PublicReceiptPageProps {
  params: {
    saleId: string
  }
}

export default function PublicReceiptPage({ params }: PublicReceiptPageProps) {
  return <PublicReceipt saleId={params.saleId} />
}
