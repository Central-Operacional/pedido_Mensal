import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      filiais: {
        Row: {
          id: string
          nome: string
          codigo: string
          empresa: string
          departamento: string
          posto: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          empresa: string
          departamento: string
          posto: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          empresa?: string
          departamento?: string
          posto?: string
          created_at?: string
        }
      }
      produtos: {
        Row: {
          id: string
          codigo: string
          item: string
          descricao: string
          created_at: string
        }
        Insert: {
          id?: string
          codigo: string
          item: string
          descricao: string
          created_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          item?: string
          descricao?: string
          created_at?: string
        }
      }
      pedidos: {
        Row: {
          id: string
          filial_id: string
          produto_id: string
          periodo: string
          quantidade: number
          valor_unitario: number
          valor_total: number
          n_serventes: number
          ordem_compra: string
          realizado_per_capita: number
          acumulado_total: number
          status: "rascunho" | "enviado"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          filial_id: string
          produto_id: string
          periodo: string
          quantidade?: number
          valor_unitario?: number
          valor_total?: number
          n_serventes?: number
          ordem_compra?: string
          realizado_per_capita?: number
          acumulado_total?: number
          status?: "rascunho" | "enviado"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          filial_id?: string
          produto_id?: string
          periodo?: string
          quantidade?: number
          valor_unitario?: number
          valor_total?: number
          n_serventes?: number
          ordem_compra?: string
          realizado_per_capita?: number
          acumulado_total?: number
          status?: "rascunho" | "enviado"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
