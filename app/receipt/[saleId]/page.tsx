import { PublicReceipt } from "@/components/sales/public-receipt"
import { createClient } from "@supabase/supabase-js"

export async function generateStaticParams() {
  // For static export, we need to pre-generate all possible paths
  // If no sales exist at build time, return empty array
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not found, returning empty params")
    return []
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: sales, error } = await supabase
      .from("sales")
      .select("id")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching sales for static params:", error)
      return []
    }

    // Return array of params for each sale
    return (sales || []).map((sale) => ({
      saleId: sale.id,
    }))
  } catch (error) {
    console.error("Error in generateStaticParams:", error)
    return []
  }
}

export default async function PublicReceiptPage({ params }: { params: { saleId: string } }) {
  const { saleId } = await params
  return <PublicReceipt saleId={saleId} />
}

export async function generateMetadata({ params }: { params: { saleId: string } }) {
  const { saleId } = await params
  return {
    title: `Digital Receipt ${saleId}`,
    description: `Digital receipt for sale ${saleId}`,
  }
}
