"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WholesalersTable } from "@/components/wholesalers/wholesalers-table"
import { WholesalerForm } from "@/components/wholesalers/wholesaler-form"
import {
  getWholesalers,
  createWholesaler,
  updateWholesaler,
  deleteWholesaler,
  getCurrentUser,
} from "@/lib/supabase-operations"
import { useRouter } from "next/navigation"

export function WholesalersPage() {
  const [wholesalers, setWholesalers] = useState<any[]>([])
  const [filteredWholesalers, setFilteredWholesalers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showWholesalerForm, setShowWholesalerForm] = useState(false)
  const [selectedWholesaler, setSelectedWholesaler] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          router.push("/")
          return
        }

        const userIsAdmin = user.role === "admin"
        setIsAdmin(userIsAdmin)

        if (!userIsAdmin) {
          router.push("/dashboard")
          return
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        router.push("/")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const loadWholesalers = async () => {
      if (!isAdmin) return

      try {
        setLoading(true)
        const wholesalersData = await getWholesalers()
        const safeWholesalers = Array.isArray(wholesalersData) ? wholesalersData : []
        setWholesalers(safeWholesalers)
        setFilteredWholesalers(safeWholesalers)
        setError(null)
      } catch (err) {
        console.error("Failed to load wholesalers:", err)
        setError("Failed to load wholesalers")
        setWholesalers([])
        setFilteredWholesalers([])
      } finally {
        setLoading(false)
      }
    }

    loadWholesalers()
  }, [isAdmin])

  // Filter wholesalers based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredWholesalers(wholesalers)
      return
    }

    const query = searchQuery.toLowerCase()
    const safeWholesalers = Array.isArray(wholesalers) ? wholesalers : []
    const filtered = safeWholesalers.filter(
      (wholesaler) =>
        wholesaler.name?.toLowerCase().includes(query) ||
        wholesaler.contact?.toLowerCase().includes(query) ||
        wholesaler.phone?.includes(query) ||
        (Array.isArray(wholesaler.products) &&
          wholesaler.products.some((product: string) => product.toLowerCase().includes(query))),
    )

    setFilteredWholesalers(filtered)
  }, [wholesalers, searchQuery])

  const handleAddWholesaler = async (newWholesaler: any) => {
    try {
      console.log("[v0] Attempting to add wholesaler:", newWholesaler)

      if (!newWholesaler.name || !newWholesaler.contact) {
        throw new Error("Name and contact are required fields")
      }

      const createdWholesaler = await createWholesaler(newWholesaler)

      if (!createdWholesaler) {
        throw new Error("Failed to create wholesaler - no data returned")
      }

      console.log("[v0] Successfully created wholesaler:", createdWholesaler)

      const safeWholesalers = Array.isArray(wholesalers) ? wholesalers : []
      const updatedWholesalers = [...safeWholesalers, createdWholesaler]
      setWholesalers(updatedWholesalers)
      setShowWholesalerForm(false)
      setError(null) // Clear any previous errors
    } catch (err) {
      console.error("[v0] Failed to add wholesaler:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to add wholesaler"
      setError(errorMessage)
    }
  }

  const handleEditWholesaler = async (updatedWholesaler: any) => {
    try {
      await updateWholesaler(updatedWholesaler.id, updatedWholesaler)
      const safeWholesalers = Array.isArray(wholesalers) ? wholesalers : []
      const updatedWholesalers = safeWholesalers.map((wholesaler) =>
        wholesaler.id === updatedWholesaler.id ? updatedWholesaler : wholesaler,
      )
      setWholesalers(updatedWholesalers)
      setSelectedWholesaler(null)
      setShowWholesalerForm(false)
    } catch (err) {
      console.error("Failed to update wholesaler:", err)
      setError("Failed to update wholesaler")
    }
  }

  const handleDeleteWholesaler = async (wholesalerId: number) => {
    try {
      await deleteWholesaler(wholesalerId)
      const safeWholesalers = Array.isArray(wholesalers) ? wholesalers : []
      const updatedWholesalers = safeWholesalers.filter((wholesaler) => wholesaler.id !== wholesalerId)
      setWholesalers(updatedWholesalers)
    } catch (err) {
      console.error("Failed to delete wholesaler:", err)
      setError("Failed to delete wholesaler")
    }
  }

  if (!isAdmin) {
    return null // Redirect handled in useEffect
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading wholesalers...</div>
  }

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Wholesaler Management</h2>
        <Button
          onClick={() => {
            setSelectedWholesaler(null)
            setShowWholesalerForm(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Wholesaler
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search wholesalers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <WholesalersTable
        wholesalers={filteredWholesalers}
        onEdit={(wholesaler) => {
          setSelectedWholesaler(wholesaler)
          setShowWholesalerForm(true)
        }}
        onDelete={handleDeleteWholesaler}
      />

      {showWholesalerForm && (
        <WholesalerForm
          wholesaler={selectedWholesaler}
          onSave={selectedWholesaler ? handleEditWholesaler : handleAddWholesaler}
          onCancel={() => {
            setShowWholesalerForm(false)
            setSelectedWholesaler(null)
          }}
        />
      )}
    </div>
  )
}
